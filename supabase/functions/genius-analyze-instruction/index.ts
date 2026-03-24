import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");

  try {
    const { instruction_text, client_id } = await req.json();

    if (!instruction_text) {
      return new Response(
        JSON.stringify({ error: "instruction_text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If no API key, return mock analysis
    if (!anthropicKey) {
      return new Response(
        JSON.stringify({
          service_type: "trademark_registration",
          mark_name: null,
          invention_title: null,
          jurisdictions: ["EU", "US"],
          nice_classes: [9, 42],
          urgency: "normal",
          potential_conflicts: [],
          _mock: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call Claude to analyze
    const systemPrompt = `Eres un experto en Propiedad Intelectual. Analiza la siguiente instrucción de cliente y extrae información estructurada.

Responde SOLO en JSON válido con esta estructura exacta:
{
  "service_type": "trademark_registration" | "patent_application" | "renewal" | "opposition" | "surveillance" | "assignment" | "design" | "other",
  "mark_name": string | null,
  "invention_title": string | null,
  "jurisdictions": string[],
  "nice_classes": number[],
  "urgency": "critical" | "urgent" | "normal",
  "potential_conflicts": []
}

Códigos de jurisdicción: EU, US, GB, ES, FR, DE, IT, PT, CN, JP, KR, AU, IN, BR, MX, CA, PCT, WIPO, etc.
Para "European Union" o "Europe" usa "EU".
Para "United States" usa "US".
Para "United Kingdom" usa "GB".`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: `Analiza esta instrucción de cliente:\n\n"${instruction_text}"`,
          },
        ],
        system: systemPrompt,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", errText);
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const aiResult = await response.json();
    const content = aiResult.content?.[0]?.text || "{}";

    // Extract JSON from response
    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch {
      parsed = {
        service_type: "other",
        mark_name: null,
        invention_title: null,
        jurisdictions: [],
        nice_classes: [],
        urgency: "normal",
        potential_conflicts: [],
      };
    }

    // If client_id provided, check for conflicts in existing matters
    if (client_id && parsed.mark_name) {
      try {
        const supabase = createClient(supabaseUrl, serviceKey);
        const { data: matters } = await supabase
          .from("matters")
          .select("id, reference, title")
          .or(`client_id.eq.${client_id},crm_account_id.eq.${client_id}`)
          .ilike("title", `%${parsed.mark_name}%`)
          .limit(5);

        if (matters && matters.length > 0) {
          parsed.potential_conflicts = matters.map((m: any) => ({
            matter_id: m.id,
            reference: m.reference || "",
            similarity: "name_match",
          }));
        }
      } catch (e) {
        console.error("Conflict check error:", e);
      }
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
