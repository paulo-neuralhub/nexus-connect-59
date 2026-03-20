import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { office_code, ipo_office_id, region } = await req.json();

    // Resolve offices to enrich
    let offices: any[] = [];

    if (ipo_office_id) {
      const { data } = await supabase
        .from("ipo_offices")
        .select("id, code, name_official, country_name, currency")
        .eq("id", ipo_office_id)
        .single();
      if (data) offices = [data];
    } else if (office_code) {
      const { data } = await supabase
        .from("ipo_offices")
        .select("id, code, name_official, country_name, currency")
        .eq("code", office_code)
        .single();
      if (data) offices = [data];
    } else if (region) {
      const { data } = await supabase
        .from("ipo_offices")
        .select("id, code, name_official, country_name, currency")
        .eq("region", region)
        .eq("is_active", true);
      offices = data || [];
    } else {
      return new Response(
        JSON.stringify({ error: "Provide office_code, ipo_office_id, or region" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const results: any[] = [];

    for (const office of offices) {
      try {
        const prompt = `You are a fee intelligence researcher for intellectual property offices worldwide.

Research the fee change patterns for: ${office.name_official || office.code} (${office.country_name || ""})
Office code: ${office.code}
Currency: ${office.currency || "unknown"}

I need a JSON object with these exact fields:
{
  "change_type": "trademark_fee",
  "avg_change_interval_days": <number or null — average days between fee changes>,
  "typical_change_months": <array of month numbers 1-12 when changes typically happen>,
  "typical_change_magnitude_pct": <number — typical % increase>,
  "gives_advance_notice": <boolean>,
  "advance_notice_days": <number or null>,
  "announcement_url": <string URL where changes are announced, or null>,
  "signal_search_terms": <array of search terms to monitor for fee changes>,
  "legal_framework": <string — brief description of the legal basis for fee changes>,
  "requires_legislative_change": <boolean — whether fee changes need a law change>,
  "confidence_in_pattern": <number 0-1>,
  "known_change_dates": <array of ISO date strings of known past fee changes>,
  "notes": <string — researcher notes, warnings, observations>
}

Return ONLY valid JSON, no markdown or explanation.`;

        const aiResp = await fetch(
          "https://ai.gateway.lovable.dev/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              messages: [
                {
                  role: "system",
                  content:
                    "You are a specialist in IP office fee research. Return only valid JSON.",
                },
                { role: "user", content: prompt },
              ],
            }),
          }
        );

        if (!aiResp.ok) {
          const errText = await aiResp.text();
          console.error(`AI error for ${office.code}:`, aiResp.status, errText);
          results.push({ code: office.code, status: "error", error: errText });
          continue;
        }

        const aiData = await aiResp.json();
        const textContent =
          aiData.choices?.[0]?.message?.content || "";

        // Extract JSON
        const jsonMatch = textContent.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          results.push({
            code: office.code,
            status: "error",
            error: "No JSON in response",
          });
          continue;
        }

        const parsed = JSON.parse(jsonMatch[0]);

        // Upsert into jurisdiction_change_patterns
        const { error: upsertError } = await supabase
          .from("jurisdiction_change_patterns")
          .upsert(
            {
              ipo_office_id: office.id,
              change_type: parsed.change_type || "trademark_fee",
              avg_change_interval_days: parsed.avg_change_interval_days,
              typical_change_months: parsed.typical_change_months,
              typical_change_magnitude_pct: parsed.typical_change_magnitude_pct,
              gives_advance_notice: parsed.gives_advance_notice,
              advance_notice_days: parsed.advance_notice_days,
              announcement_url: parsed.announcement_url,
              signal_search_terms: parsed.signal_search_terms,
              legal_framework: parsed.legal_framework,
              requires_legislative_change: parsed.requires_legislative_change,
              confidence_in_pattern: parsed.confidence_in_pattern,
              known_change_dates: parsed.known_change_dates,
              notes: parsed.notes,
              source: "gemini_research",
              researched_at: new Date().toISOString(),
              last_pattern_review: new Date().toISOString(),
            },
            { onConflict: "ipo_office_id,change_type" }
          );

        if (upsertError) {
          console.error(`Upsert error for ${office.code}:`, upsertError);
          results.push({
            code: office.code,
            status: "error",
            error: upsertError.message,
          });
        } else {
          results.push({ code: office.code, status: "ok" });
        }
      } catch (officeErr) {
        console.error(`Error processing ${office.code}:`, officeErr);
        results.push({
          code: office.code,
          status: "error",
          error: String(officeErr),
        });
      }
    }

    return new Response(
      JSON.stringify({
        processed: results.length,
        success: results.filter((r) => r.status === "ok").length,
        errors: results.filter((r) => r.status === "error").length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("enrich-ipo-intelligence error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
