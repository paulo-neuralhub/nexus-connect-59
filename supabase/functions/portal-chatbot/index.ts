import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const HANDOFF_TRIGGERS = [
  "hablar con", "persona real", "humano", "urgente",
  "speak to", "human", "urgent", "no entiendo",
  "agente", "representante", "ayuda real",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    const supabase = createClient(supabaseUrl, serviceKey);

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const jwt = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(jwt);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const portalUserId = claimsData.claims.sub as string;

    // STEP 0: Verify portal access
    const { data: access } = await supabase
      .from("portal_access")
      .select("id, organization_id, crm_account_id, status")
      .eq("portal_user_id", portalUserId)
      .eq("status", "active")
      .single();

    if (!access) {
      return new Response(JSON.stringify({ error: "no_portal_access" }), { status: 403, headers: corsHeaders });
    }

    const orgId = access.organization_id;
    const accountId = access.crm_account_id;

    const { message, session_id } = await req.json();
    if (!message) {
      return new Response(JSON.stringify({ error: "missing_message" }), { status: 400, headers: corsHeaders });
    }

    // STEP 1: Detect handoff
    const msgLower = message.toLowerCase();
    const handoffDetected = HANDOFF_TRIGGERS.some((t) => msgLower.includes(t));
    if (handoffDetected) {
      return new Response(
        JSON.stringify({ handoff_required: true, response: null, session_id: session_id || null }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get org + account info
    const [orgRes, accountRes] = await Promise.all([
      supabase.from("organizations").select("name, portal_chatbot_name").eq("id", orgId).single(),
      supabase.from("crm_accounts").select("name").eq("id", accountId).single(),
    ]);
    const despachoName = orgRes.data?.name || "Despacho";
    const chatbotName = orgRes.data?.portal_chatbot_name || "Asistente PI";
    const clientName = accountRes.data?.name || "Cliente";

    // STEP 2: Upsert session
    let currentSessionId = session_id;
    if (!currentSessionId) {
      const { data: newSession } = await supabase
        .from("portal_chat_sessions")
        .insert({
          organization_id: orgId,
          crm_account_id: accountId,
          portal_user_id: portalUserId,
          mode: "ai",
        })
        .select("id")
        .single();
      currentSessionId = newSession?.id;
    }

    // Insert user message
    await supabase.from("portal_chat_messages").insert({
      organization_id: orgId,
      crm_account_id: accountId,
      sender_type: "client",
      sender_user_id: portalUserId,
      sender_name: clientName,
      content: message,
    });

    // STEP 3: Isolated client context
    const [mattersRes, invoicesRes, signaturesRes] = await Promise.all([
      supabase
        .from("matters")
        .select("id, title, reference_number, status, type, jurisdiction")
        .eq("client_id", accountId)
        .eq("portal_visible", true)
        .limit(10),
      supabase
        .from("invoices")
        .select("id, full_number, total, currency, status, due_date")
        .eq("crm_account_id", accountId)
        .in("status", ["sent", "overdue", "partial"])
        .limit(5),
      supabase
        .from("matter_documents")
        .select("id, filename, matter_id")
        .eq("portal_requires_signature", true)
        .eq("portal_signature_status", "pending")
        .eq("portal_visible", true)
        .limit(5),
    ]);

    const matters = mattersRes.data || [];
    const invoices = invoicesRes.data || [];
    const pendingSignatures = signaturesRes.data || [];

    const disclaimer = `\n\n_ℹ️ Asistente de ${despachoName}. Para asesoramiento legal, contacta con tu despacho._`;

    // STEP 4: Generate response
    let aiResponse: string;

    if (anthropicKey) {
      const systemPrompt = `Eres ${chatbotName}, asistente virtual de ${despachoName}. Solo hablas sobre ${clientName} y SUS datos. Usa lenguaje simple, sin jerga legal compleja. Sé conciso y útil.

CONTEXTO DEL CLIENTE:
Expedientes (${matters.length}): ${JSON.stringify(matters.map((m) => ({ ref: m.reference_number, titulo: m.title, estado: m.status, tipo: m.type })))}
Facturas pendientes (${invoices.length}): ${JSON.stringify(invoices.map((i) => ({ num: i.full_number, total: i.total, moneda: i.currency, estado: i.status })))}
Documentos pendientes de firma (${pendingSignatures.length}): ${pendingSignatures.length > 0 ? "Hay documentos esperando tu firma" : "Sin documentos pendientes"}

Si te preguntan algo que no puedes responder con estos datos, sugiere contactar al despacho directamente.`;

      const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 600,
          temperature: 0.3,
          system: systemPrompt,
          messages: [{ role: "user", content: message }],
        }),
      });

      const anthropicData = await anthropicRes.json();
      aiResponse = (anthropicData.content?.[0]?.text || "No pude procesar tu consulta.") + disclaimer;
    } else {
      // MOCK MODE
      aiResponse =
        `Hola ${clientName}, [MODO SANDBOX] Tienes ${matters.length} expediente(s) visibles` +
        (invoices.length > 0 ? ` y ${invoices.length} factura(s) pendiente(s)` : "") +
        `. ¿En qué puedo ayudarte?` +
        disclaimer;
    }

    // STEP 5: Save AI response
    await supabase.from("portal_chat_messages").insert({
      organization_id: orgId,
      crm_account_id: accountId,
      sender_type: "ai",
      sender_name: chatbotName,
      content: aiResponse,
      ai_model_used: anthropicKey ? "claude-haiku-4-5-20251001" : "mock",
      ai_disclaimer_shown: true,
    });

    return new Response(
      JSON.stringify({ response: aiResponse, session_id: currentSessionId, handoff_required: false }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: "internal_error", detail: String(err) }), { status: 500, headers: corsHeaders });
  }
});
