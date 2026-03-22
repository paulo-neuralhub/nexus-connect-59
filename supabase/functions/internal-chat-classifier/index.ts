import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const db = createClient(supabaseUrl, supabaseServiceKey);

    const { message_id } = await req.json();
    if (!message_id) {
      return new Response(JSON.stringify({ error: "message_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // PASO 1: Get message + channel context
    const { data: msg, error: msgErr } = await db
      .from("internal_messages")
      .select("*, internal_channels!inner(id, name, channel_type, organization_id, matter_id)")
      .eq("id", message_id)
      .single();

    if (msgErr || !msg) {
      return new Response(JSON.stringify({ error: "Message not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const orgId = msg.organization_id;
    const channel = (msg as any).internal_channels;
    const appContext = msg.app_context || {};

    // Get org matters for context
    const { data: orgMatters } = await db
      .from("matters")
      .select("id, reference, title")
      .eq("organization_id", orgId)
      .eq("is_archived", false)
      .order("updated_at", { ascending: false })
      .limit(50);

    const mattersContext = (orgMatters || [])
      .map((m: any) => `${m.reference}: ${m.title}`)
      .join("\n");

    // PASO 2: Check for API key — MOCK MODE if missing
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    let classification = "operational";
    let suggestedMatterId: string | null = null;
    let confidence = 0.5;
    let reason = "Mock mode — sin clasificación IA";
    let suggestedAction: string | null = null;

    if (lovableApiKey) {
      try {
        const systemPrompt = `Eres un clasificador de mensajes internos de un despacho de propiedad intelectual. Analiza el mensaje y determina:
1. classification: 'matter_relevant'|'operational'|'social'|'action_required'
2. suggested_matter_id: UUID del expediente si es relevante (busca en el mensaje números de expediente, nombres de marca, referencias a casos)
3. confidence: 0.0-1.0
4. reason: explicación breve (1 frase)
5. suggested_action: null|'index_to_matter'|'create_task'
Responde SOLO en JSON puro sin markdown.`;

        const userPrompt = `MENSAJE: ${msg.content}
CONTEXTO: Canal '${channel?.name || "desconocido"}', tipo '${channel?.channel_type || "general"}'
PÁGINA ACTIVA cuando se envió: ${(appContext as any)?.page || "desconocida"}
EXPEDIENTE ACTIVO cuando se envió: ${(appContext as any)?.matter_id || "ninguno"}
EXPEDIENTE REFERENCIADO: ${msg.referenced_matter_id || "ninguno"}
EXPEDIENTES ACTIVOS DE LA ORG:
${mattersContext || "Sin expedientes"}`;

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const rawContent = aiData.choices?.[0]?.message?.content || "";
          // Strip markdown fences if present
          const jsonStr = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          try {
            const parsed = JSON.parse(jsonStr);
            classification = parsed.classification || "operational";
            suggestedMatterId = parsed.suggested_matter_id || null;
            confidence = typeof parsed.confidence === "number" ? parsed.confidence : 0.5;
            reason = parsed.reason || "Sin razón proporcionada";
            suggestedAction = parsed.suggested_action || null;

            // Validate suggested_matter_id exists in org
            if (suggestedMatterId) {
              const exists = (orgMatters || []).find((m: any) => m.id === suggestedMatterId);
              if (!exists) suggestedMatterId = null;
            }
          } catch (parseErr) {
            console.error("AI response parse error:", parseErr, "Raw:", rawContent);
            // Fall through with defaults
          }
        } else {
          const errText = await aiResponse.text();
          console.error("AI gateway error:", aiResponse.status, errText);
        }
      } catch (aiErr) {
        console.error("AI call error:", aiErr);
        // Fall through with mock defaults
      }
    } else {
      console.log("MOCK MODE: No LOVABLE_API_KEY — using default classification");
    }

    // PASO 3: Update message with classification
    await db
      .from("internal_messages")
      .update({
        ai_classification: classification,
        ai_confidence: confidence,
        ai_suggested_matter_id: suggestedMatterId,
        ai_reason: reason,
        ai_suggested_action: suggestedAction,
      })
      .eq("id", message_id);

    // PASO 4: If matter_relevant or high confidence → suggest indexing
    if (
      (classification === "matter_relevant" || confidence > 0.75) &&
      suggestedMatterId &&
      lovableApiKey // Only suggest if AI actually classified
    ) {
      const suggestedMatter = (orgMatters || []).find((m: any) => m.id === suggestedMatterId);
      const matterTitle = suggestedMatter
        ? `${(suggestedMatter as any).reference}: ${(suggestedMatter as any).title}`
        : "expediente";

      await db.from("staff_notifications").insert({
        organization_id: orgId,
        user_id: msg.sender_id,
        type: "system",
        title: `¿Indexar al expediente ${matterTitle}?`,
        body: `El mensaje puede ser relevante para ${matterTitle}. ¿Añadirlo al timeline?`,
        icon: "FileText",
        link: `/app/matters/${suggestedMatterId}?index_message=${message_id}`,
        action_url: `/app/matters/${suggestedMatterId}?index_message=${message_id}`,
        priority: "normal",
        source_type: "internal_messages",
        source_id: message_id,
      });
    }

    // PASO 5: If action_required → notify all channel members
    if (classification === "action_required") {
      const { data: members } = await db
        .from("internal_channel_members")
        .select("user_id")
        .eq("channel_id", msg.channel_id);

      for (const member of members || []) {
        if (member.user_id === msg.sender_id) continue;
        await db.from("staff_notifications").insert({
          organization_id: orgId,
          user_id: member.user_id,
          type: "system",
          title: "Acción requerida en chat",
          body: msg.content.length > 100 ? msg.content.slice(0, 100) + "…" : msg.content,
          icon: "AlertTriangle",
          link: `/app/communications/internal?channel=${msg.channel_id}`,
          priority: "high",
          source_type: "internal_messages",
          source_id: message_id,
        });
      }
    }

    return new Response(
      JSON.stringify({ classification, suggested_matter_id: suggestedMatterId, confidence }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("internal-chat-classifier error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
