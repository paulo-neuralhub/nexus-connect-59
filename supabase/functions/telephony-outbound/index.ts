// ============================================================
// IP-NEXUS — telephony-outbound
// Initiates an outbound call via CPaaS with timeLimit protection
// Supports provider fallback: Telnyx → Twilio → Plivo
// ============================================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// E.164 validation
function isValidE164(number: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(number);
}

// Extract prefix from E.164 number (longest match first)
function extractPrefix(number: string): { prefix: string; countryDigits: string } {
  // Try 4, 3, 2, 1 digit prefixes after '+'
  for (const len of [4, 3, 2, 1]) {
    const prefix = number.substring(0, 1 + len); // '+' + digits
    if (prefix.length >= 2) {
      return { prefix, countryDigits: prefix.substring(1) };
    }
  }
  return { prefix: "+", countryDigits: "" };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── Auth ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "unauthorized", message: "Token de autenticación requerido" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) {
      return jsonResponse({ error: "unauthorized", message: "Sesión inválida" }, 401);
    }
    const userId = claims.claims.sub as string;

    // ── Parse body ──
    const body = await req.json().catch(() => ({}));
    const { organization_id, to_number, crm_account_id, matter_id, crm_deal_id, crm_contact_id } = body;

    if (!organization_id) {
      return jsonResponse({ error: "bad_request", message: "organization_id requerido" }, 400);
    }
    if (!to_number || !isValidE164(to_number)) {
      return jsonResponse({
        error: "invalid_number",
        message: "Número destino inválido. Usa formato E.164: +34912345678",
      }, 400);
    }

    // ── Service client ──
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    // ── Verify tenant ──
    const { data: tenant } = await adminClient
      .from("telephony_tenants")
      .select("*")
      .eq("organization_id", organization_id)
      .eq("is_active", true)
      .maybeSingle();

    if (!tenant) {
      return jsonResponse({
        error: "telephony_not_active",
        message: "Telefonía no activada para esta organización.",
      }, 403);
    }

    // ── Extract prefix and find rate ──
    const { prefix } = extractPrefix(to_number);

    // Try longest prefix match first
    let rate = null;
    for (const len of [4, 3, 2, 1]) {
      const tryPrefix = to_number.substring(0, 1 + len);
      const { data } = await adminClient
        .from("telephony_pricing_rates")
        .select("*")
        .eq("destination_prefix", tryPrefix)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();
      if (data) {
        rate = data;
        break;
      }
    }

    // Fallback to generic international rate
    if (!rate) {
      const { data } = await adminClient
        .from("telephony_pricing_rates")
        .select("*")
        .eq("destination_prefix", "+")
        .eq("is_active", true)
        .maybeSingle();
      rate = data;
    }

    if (!rate) {
      return jsonResponse({
        error: "no_rate",
        message: `No hay tarifa configurada para el destino ${prefix}`,
      }, 400);
    }

    // ── Calculate max duration (timeLimit) ──
    const { data: maxDurationResult } = await adminClient.rpc("get_max_call_duration", {
      p_org_id: organization_id,
      p_destination_prefix: rate.destination_prefix,
      p_number_type: rate.number_type || "landline",
    });

    const maxDurationSeconds = maxDurationResult ?? 0;

    if (maxDurationSeconds <= 0) {
      return jsonResponse({
        error: "insufficient_balance",
        message: "Saldo insuficiente para realizar la llamada. Recarga tu wallet.",
      }, 402);
    }

    // ── Get caller ID (primary number) ──
    const { data: callerNumber } = await adminClient
      .from("telephony_numbers")
      .select("phone_number")
      .eq("organization_id", organization_id)
      .eq("is_primary", true)
      .eq("is_active", true)
      .maybeSingle();

    const fromNumber = callerNumber?.phone_number || tenant.default_caller_id;
    if (!fromNumber) {
      return jsonResponse({
        error: "no_caller_id",
        message: "No hay número de origen configurado. Compra un número en Backoffice → Telefonía.",
      }, 400);
    }

    // ── Get ordered providers for fallback ──
    const { data: providers } = await adminClient
      .from("telephony_providers")
      .select("*")
      .eq("is_active", true)
      .order("priority", { ascending: true });

    if (!providers || providers.length === 0) {
      return jsonResponse({
        error: "no_providers",
        message: "No hay proveedores de telefonía activos.",
      }, 500);
    }

    // ── Attempt call with fallback ──
    let callResult: { callSid: string; providerCode: string; isMock: boolean } | null = null;
    const errors: string[] = [];

    for (const prov of providers) {
      try {
        const result = await initiateCall(prov, {
          fromNumber,
          toNumber: to_number,
          maxDurationSeconds,
          webhookBaseUrl: prov.webhook_base_url || `${supabaseUrl}/functions/v1/telephony-webhook`,
          organizationId: organization_id,
          tenant,
        });
        callResult = { callSid: result.callSid, providerCode: prov.code, isMock: result.isMock };
        break; // Success — stop trying fallbacks
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${prov.code}: ${msg}`);
        console.warn(`[telephony-outbound] Provider ${prov.code} failed:`, msg);
        continue; // Try next provider
      }
    }

    if (!callResult) {
      return jsonResponse({
        error: "all_providers_failed",
        message: "Todos los proveedores de telefonía fallaron.",
        provider_errors: errors,
      }, 502);
    }

    // ── Insert CDR ──
    const { data: cdr } = await adminClient
      .from("telephony_cdrs")
      .insert({
        organization_id,
        provider_call_sid: callResult.callSid,
        provider_code: callResult.providerCode,
        from_number: fromNumber,
        to_number,
        direction: "outbound",
        status: "initiated",
        user_id: userId,
        crm_account_id: crm_account_id || null,
        crm_contact_id: crm_contact_id || null,
        crm_deal_id: crm_deal_id || null,
        matter_id: matter_id || null,
        provider_metadata: {
          max_duration_seconds: maxDurationSeconds,
          rate_prefix: rate.destination_prefix,
          rate_per_min: rate.retail_price_per_min,
          is_mock: callResult.isMock,
          fallback_errors: errors.length > 0 ? errors : undefined,
        },
      })
      .select("id")
      .single();

    return jsonResponse({
      success: true,
      call_sid: callResult.callSid,
      cdr_id: cdr?.id,
      provider: callResult.providerCode,
      is_mock: callResult.isMock,
      from_number: fromNumber,
      to_number,
      max_duration_seconds: maxDurationSeconds,
      rate: {
        prefix: rate.destination_prefix,
        country: rate.destination_country,
        price_per_min: rate.retail_price_per_min,
        currency: "EUR",
      },
    });
  } catch (err) {
    console.error("[telephony-outbound] Unhandled error:", err);
    return jsonResponse({ error: "internal", message: "Error interno del servidor" }, 500);
  }
});

// ── Provider-specific call initiation ──

interface CallParams {
  fromNumber: string;
  toNumber: string;
  maxDurationSeconds: number;
  webhookBaseUrl: string;
  organizationId: string;
  tenant: Record<string, unknown>;
}

interface CallResult {
  callSid: string;
  isMock: boolean;
}

async function initiateCall(
  provider: Record<string, unknown>,
  params: CallParams
): Promise<CallResult> {
  const code = provider.code as string;
  const secretName = provider.api_key_secret_name as string;
  const secretValue = secretName ? Deno.env.get(secretName) : null;

  if (!secretValue) {
    // MOCK MODE — simulate call for testing without CPaaS credentials
    console.warn(`[telephony-outbound] Secret ${secretName} not configured — MOCK mode for ${code}`);
    const mockCallSid = `MOCK_${code.toUpperCase()}_${crypto.randomUUID()}`;

    // Simulate small delay
    await new Promise((r) => setTimeout(r, 200));

    return { callSid: mockCallSid, isMock: true };
  }

  // ── REAL PROVIDER CALLS ──
  if (code === "telnyx") {
    return await initiateTelnyxCall(secretValue, params);
  } else if (code === "twilio") {
    const accountSid = Deno.env.get(
      (provider.account_sid_secret_name as string) || "TWILIO_ACCOUNT_SID"
    );
    if (!accountSid) throw new Error("TWILIO_ACCOUNT_SID not configured");
    return await initiateTwilioCall(accountSid, secretValue, params);
  } else if (code === "plivo") {
    const authId = Deno.env.get((provider.api_secret_name as string) || "PLIVO_AUTH_ID");
    if (!authId) throw new Error("PLIVO_AUTH_ID not configured");
    return await initiatePlivoCall(authId, secretValue, params);
  }

  throw new Error(`Unsupported provider: ${code}`);
}

async function initiateTelnyxCall(apiKey: string, params: CallParams): Promise<CallResult> {
  const resp = await fetch("https://api.telnyx.com/v2/calls", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      connection_id: params.tenant.subaccount_id,
      to: params.toNumber,
      from: params.fromNumber,
      time_limit_secs: params.maxDurationSeconds,
      webhook_url: `${params.webhookBaseUrl}?provider=telnyx`,
      webhook_url_method: "POST",
      record: params.tenant.record_calls ?? true ? "record-from-answer" : "do-not-record",
      client_state: btoa(JSON.stringify({ org_id: params.organizationId })),
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Telnyx ${resp.status}: ${err}`);
  }

  const data = await resp.json();
  return { callSid: data.data?.call_control_id || data.data?.call_session_id, isMock: false };
}

async function initiateTwilioCall(
  accountSid: string,
  authToken: string,
  params: CallParams
): Promise<CallResult> {
  const resp = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`,
    {
      method: "POST",
      headers: {
        Authorization: "Basic " + btoa(`${accountSid}:${authToken}`),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: params.toNumber,
        From: params.fromNumber,
        TimeLimit: String(params.maxDurationSeconds),
        StatusCallback: `${params.webhookBaseUrl}?provider=twilio`,
        StatusCallbackEvent: "initiated ringing answered completed",
        Record: params.tenant.record_calls ? "true" : "false",
        Url: `${params.webhookBaseUrl}?provider=twilio&action=twiml`,
      }),
    }
  );

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Twilio ${resp.status}: ${err}`);
  }

  const data = await resp.json();
  return { callSid: data.sid, isMock: false };
}

async function initiatePlivoCall(
  authId: string,
  authToken: string,
  params: CallParams
): Promise<CallResult> {
  const resp = await fetch(`https://api.plivo.com/v1/Account/${authId}/Call/`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa(`${authId}:${authToken}`),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: params.fromNumber,
      to: params.toNumber,
      answer_url: `${params.webhookBaseUrl}?provider=plivo&action=answer`,
      time_limit: params.maxDurationSeconds,
      record: params.tenant.record_calls ?? true,
      callback_url: `${params.webhookBaseUrl}?provider=plivo`,
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Plivo ${resp.status}: ${err}`);
  }

  const data = await resp.json();
  return { callSid: data.request_uuid, isMock: false };
}
