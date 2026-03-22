import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ParsedData {
  application_number: string | null;
  registration_number: string | null;
  mark_name: string | null;
  jurisdiction_code: string | null;
  action_type: string | null;
  deadline_date: string | null;
  is_deadline_fatal: boolean;
  response_required: boolean;
  summary_text: string | null;
  raw_format: string;
}

function parseXmlField(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "i");
  const match = xml.match(regex);
  return match?.[1]?.trim() || null;
}

function parseXmlContent(raw: string): ParsedData {
  return {
    application_number: parseXmlField(raw, "ApplicationNumber"),
    registration_number: parseXmlField(raw, "RegistrationNumber"),
    mark_name: parseXmlField(raw, "TradeMarkText") || parseXmlField(raw, "MarkVerbalElementText"),
    jurisdiction_code: parseXmlField(raw, "JurisdictionCode") || parseXmlField(raw, "ReceivingOfficeCode"),
    action_type: parseXmlField(raw, "ActionCode") || "other",
    deadline_date: parseXmlField(raw, "ReplyDeadlineDate") || parseXmlField(raw, "ResponseDeadlineDate"),
    is_deadline_fatal: raw.toLowerCase().includes("fatal") || raw.toLowerCase().includes("absolute"),
    response_required: raw.toLowerCase().includes("response") || raw.toLowerCase().includes("reply"),
    summary_text: parseXmlField(raw, "ActionDescription") || parseXmlField(raw, "NotificationText"),
    raw_format: "st96_xml",
  };
}

function getMockParsedData(): ParsedData {
  return {
    application_number: "MOCK-2026-001234",
    registration_number: null,
    mark_name: "MOCK BRAND",
    jurisdiction_code: "ES",
    action_type: "office_action",
    deadline_date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
    is_deadline_fatal: false,
    response_required: true,
    summary_text: "Mock: Office action requiring response within 30 days.",
    raw_format: "mock",
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claimsData, error: claimsErr } = await supabaseUser.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsErr || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claimsData.claims.sub as string;

    // Get org_id from profile
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("organization_id")
      .eq("id", userId)
      .single();

    if (!profile?.organization_id) {
      return new Response(JSON.stringify({ error: "No organization" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const orgId = profile.organization_id;

    // STEP 1: Check feature flag
    const { data: orgData } = await supabaseAdmin
      .from("organizations")
      .select("feature_smart_inbox_enabled")
      .eq("id", orgId)
      .single();

    if (!orgData?.feature_smart_inbox_enabled) {
      return new Response(JSON.stringify({ error: "feature_not_enabled" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const { source_type, raw_content, source_email_from, ipo_code, file_storage_path } = body;

    if (!raw_content) {
      return new Response(JSON.stringify({ error: "raw_content is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    const isMock = !anthropicKey;

    let parsed: ParsedData;
    let parsingConfidence = 0;

    if (isMock) {
      // MOCK MODE
      parsed = getMockParsedData();
      parsingConfidence = 85;
    } else {
      // STEP 2: Detect format
      const isXml = raw_content.includes("<?xml") || raw_content.includes("<TradeMarkTransaction");
      const isJson = raw_content.includes('"st97"') || raw_content.includes('"ST97"');

      if (isXml) {
        // STEP 3a: Parse ST.96 XML
        parsed = parseXmlContent(raw_content);
        parsingConfidence = parsed.application_number ? 90 : 60;
      } else if (isJson) {
        try {
          const jsonData = JSON.parse(raw_content);
          parsed = {
            application_number: jsonData.application_number || null,
            registration_number: jsonData.registration_number || null,
            mark_name: jsonData.mark_name || null,
            jurisdiction_code: jsonData.jurisdiction_code || null,
            action_type: jsonData.action_type || "other",
            deadline_date: jsonData.deadline_date || null,
            is_deadline_fatal: jsonData.is_deadline_fatal || false,
            response_required: jsonData.response_required || false,
            summary_text: jsonData.summary_text || null,
            raw_format: "st97_json",
          };
          parsingConfidence = parsed.application_number ? 90 : 60;
        } catch {
          parsed = { application_number: null, registration_number: null, mark_name: null, jurisdiction_code: null, action_type: "other", deadline_date: null, is_deadline_fatal: false, response_required: false, summary_text: null, raw_format: "st97_json" };
          parsingConfidence = 20;
        }
      } else {
        // STEP 3b: Use Claude to parse plain text
        const aiResponse = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": anthropicKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-3-haiku-20240307",
            max_tokens: 500,
            temperature: 0,
            system: `Eres un extractor de datos de documentos de oficinas de PI. Extrae en JSON puro sin markdown: application_number, registration_number, mark_name, jurisdiction_code, action_type, deadline_date, is_deadline_fatal, response_required, summary_text. action_type solo puede ser uno de: office_action, registration, renewal_due, opposition_filed, decision, other.`,
            messages: [{ role: "user", content: raw_content.slice(0, 3000) }],
          }),
        });

        if (aiResponse.ok) {
          const aiResult = await aiResponse.json();
          const text = aiResult.content?.[0]?.text || "{}";
          try {
            const extracted = JSON.parse(text);
            parsed = {
              application_number: extracted.application_number || null,
              registration_number: extracted.registration_number || null,
              mark_name: extracted.mark_name || null,
              jurisdiction_code: extracted.jurisdiction_code || null,
              action_type: extracted.action_type || "other",
              deadline_date: extracted.deadline_date || null,
              is_deadline_fatal: extracted.is_deadline_fatal || false,
              response_required: extracted.response_required || false,
              summary_text: extracted.summary_text || null,
              raw_format: "plain_text",
            };
            parsingConfidence = parsed.application_number ? 80 : 50;
          } catch {
            parsed = { application_number: null, registration_number: null, mark_name: null, jurisdiction_code: null, action_type: "other", deadline_date: null, is_deadline_fatal: false, response_required: false, summary_text: text, raw_format: "plain_text" };
            parsingConfidence = 30;
          }
        } else {
          parsed = { application_number: null, registration_number: null, mark_name: null, jurisdiction_code: null, action_type: "other", deadline_date: null, is_deadline_fatal: false, response_required: false, summary_text: null, raw_format: "plain_text" };
          parsingConfidence = 10;
        }
      }
    }

    // STEP 4: Match with existing matter
    let matchedMatter: { id: string; title: string; confidence: number } | null = null;
    const actionsTaken: string[] = [];

    if (!isMock) {
      // Try application_number match
      if (parsed.application_number) {
        const { data: matchByApp } = await supabaseAdmin
          .from("matters")
          .select("id, title, application_number")
          .eq("organization_id", orgId)
          .eq("application_number", parsed.application_number)
          .limit(1);
        if (matchByApp?.length) {
          matchedMatter = { id: matchByApp[0].id, title: matchByApp[0].title, confidence: 0.95 };
        }
      }

      // Try registration_number match
      if (!matchedMatter && parsed.registration_number) {
        const { data: matchByReg } = await supabaseAdmin
          .from("matters")
          .select("id, title, registration_number")
          .eq("organization_id", orgId)
          .eq("registration_number", parsed.registration_number)
          .limit(1);
        if (matchByReg?.length) {
          matchedMatter = { id: matchByReg[0].id, title: matchByReg[0].title, confidence: 0.95 };
        }
      }

      // Try fuzzy match by mark_name + jurisdiction
      if (!matchedMatter && parsed.mark_name && parsed.jurisdiction_code) {
        const { data: fuzzy } = await supabaseAdmin
          .from("matters")
          .select("id, title")
          .eq("organization_id", orgId)
          .eq("jurisdiction", parsed.jurisdiction_code)
          .ilike("title", `%${parsed.mark_name}%`)
          .limit(1);
        if (fuzzy?.length) {
          matchedMatter = { id: fuzzy[0].id, title: fuzzy[0].title, confidence: 0.70 };
        }
      }
    } else {
      // Mock: simulate a match
      matchedMatter = { id: "00000000-0000-0000-0000-mock00000001", title: "MOCK BRAND — Spain", confidence: 0.85 };
      actionsTaken.push("MOCK: Simulated matter match");
    }

    // STEP 5: Auto-actions if high confidence match
    const deadlinesCreated: string[] = [];
    if (matchedMatter && matchedMatter.confidence > 0.80 && !isMock) {
      actionsTaken.push("auto_matched");

      if (parsed.deadline_date) {
        const { data: newDeadline } = await supabaseAdmin
          .from("matter_deadlines")
          .insert({
            organization_id: orgId,
            matter_id: matchedMatter.id,
            title: `IPO: ${parsed.action_type || "Response required"}`,
            deadline_date: parsed.deadline_date,
            type: "ipo_response",
            is_critical: parsed.is_deadline_fatal,
            status: "pending",
          })
          .select("id")
          .single();

        if (newDeadline) {
          deadlinesCreated.push(newDeadline.id);
          actionsTaken.push("deadline_created");
        }
      }

      // Notify assigned user
      const { data: matter } = await supabaseAdmin
        .from("matters")
        .select("assigned_to, title")
        .eq("id", matchedMatter.id)
        .single();

      if (matter?.assigned_to) {
        await supabaseAdmin.from("portal_notifications").insert({
          organization_id: orgId,
          portal_user_id: matter.assigned_to,
          notification_type: "ipo_document_received",
          priority: parsed.is_deadline_fatal ? "urgent" : "high",
          title: `Documento IPO recibido: ${matter.title}`,
          message: parsed.summary_text || `Nuevo documento de ${parsed.jurisdiction_code || "oficina PI"}`,
          metadata: { matter_id: matchedMatter.id, action_type: parsed.action_type },
        });
        actionsTaken.push("notification_sent");
      }
    }

    // STEP 6: Insert ipo_incoming_documents
    const parsingStatus = parsingConfidence > 80 ? "parsed" : parsingConfidence > 50 ? "low_confidence" : "manual_review";
    const processingStatus = matchedMatter && matchedMatter.confidence > 0.80 ? "processed" : "unprocessed";

    const { data: doc } = await supabaseAdmin
      .from("ipo_incoming_documents")
      .insert({
        organization_id: orgId,
        source_type: source_type || "manual_upload",
        source_email_from: source_email_from || null,
        source_ipo_code: ipo_code || parsed.jurisdiction_code || null,
        raw_email_content: source_type === "email" ? raw_content : null,
        raw_xml_content: parsed.raw_format === "st96_xml" ? raw_content : null,
        raw_json_content: parsed.raw_format === "st97_json" ? raw_content : null,
        file_storage_path: file_storage_path || null,
        parsed_data: parsed as any,
        parsing_confidence: parsingConfidence,
        parsing_status: parsingStatus,
        matched_matter_id: matchedMatter && !isMock ? matchedMatter.id : null,
        match_confidence: matchedMatter ? matchedMatter.confidence * 100 : null,
        auto_matched: matchedMatter ? matchedMatter.confidence > 0.80 : false,
        matched_at: matchedMatter ? new Date().toISOString() : null,
        action_taken: actionsTaken.join(", ") || null,
        deadlines_created: deadlinesCreated,
        processing_status: processingStatus,
        processed_at: processingStatus === "processed" ? new Date().toISOString() : null,
        processed_by: processingStatus === "processed" ? userId : null,
      })
      .select("id")
      .single();

    const response: any = {
      document_id: doc?.id || null,
      parsing_status: parsingStatus,
      parsed_data: parsed,
      matched_matter: matchedMatter,
      actions_taken: actionsTaken,
      requires_manual_review: parsingStatus !== "parsed" || !matchedMatter || matchedMatter.confidence <= 0.80,
    };

    if (isMock) response.mock = true;

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("smart-inbox-processor error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
