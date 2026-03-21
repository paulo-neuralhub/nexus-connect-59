// ============================================================
// IP-NEXUS — telephony-token
// Generates WebRTC access token for browser-based softphone
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
    const organizationId = body.organization_id;
    if (!organizationId) {
      return jsonResponse({ error: "bad_request", message: "organization_id requerido" }, 400);
    }

    // ── Service client for DB operations ──
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    // ── Verify tenant telephony is active ──
    const { data: tenant, error: tenantErr } = await adminClient
      .from("telephony_tenants")
      .select("*")
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (tenantErr) {
      console.error("Tenant query error:", tenantErr);
      return jsonResponse({ error: "internal", message: "Error consultando configuración" }, 500);
    }

    if (!tenant || !tenant.is_active) {
      return jsonResponse({
        error: "telephony_not_active",
        message: "Telefonía no activada para esta organización. Contacta al administrador.",
      }, 403);
    }

    // ── Verify wallet has balance ──
    const { data: wallet } = await adminClient
      .from("telephony_wallets")
      .select("current_balance, status")
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (!wallet || wallet.current_balance < 0.50) {
      return jsonResponse({
        error: "insufficient_balance",
        message: "Saldo insuficiente. Recarga tu wallet de telefonía.",
        balance: wallet?.current_balance ?? 0,
      }, 402);
    }

    if (wallet.status === "suspended") {
      return jsonResponse({
        error: "wallet_suspended",
        message: "Wallet suspendida. Contacta al administrador.",
      }, 403);
    }

    // ── Determine active provider ──
    const providerCode = tenant.provider_code || "telnyx";

    const { data: provider } = await adminClient
      .from("telephony_providers")
      .select("*")
      .eq("code", providerCode)
      .eq("is_active", true)
      .maybeSingle();

    if (!provider) {
      return jsonResponse({
        error: "provider_not_found",
        message: "Proveedor de telefonía no encontrado o inactivo.",
      }, 404);
    }

    // ── Check provider secret exists ──
    const secretName = provider.api_key_secret_name;
    const secretValue = secretName ? Deno.env.get(secretName) : null;

    let webrtcToken: string;
    let tokenExpiresAt: string;
    const expiresInMs = 3600 * 1000; // 1 hour

    if (!secretValue) {
      // ── MOCK MODE — no real CPaaS credentials configured ──
      console.warn(`[telephony-token] Secret ${secretName} not configured — using mock token`);
      webrtcToken = `MOCK_TOKEN_${providerCode}_${crypto.randomUUID()}`;
      tokenExpiresAt = new Date(Date.now() + expiresInMs).toISOString();
    } else {
      // ── REAL PROVIDER TOKEN GENERATION ──
      try {
        if (providerCode === "telnyx") {
          webrtcToken = await generateTelnyxToken(secretValue, tenant, userId);
          tokenExpiresAt = new Date(Date.now() + expiresInMs).toISOString();
        } else if (providerCode === "twilio") {
          const accountSid = Deno.env.get(provider.account_sid_secret_name || "TWILIO_ACCOUNT_SID");
          if (!accountSid) {
            return jsonResponse({
              error: "provider_not_configured",
              message: "Configura TWILIO_ACCOUNT_SID en Backoffice → Integraciones → Telefonía",
            }, 503);
          }
          webrtcToken = await generateTwilioToken(accountSid, secretValue, tenant, userId);
          tokenExpiresAt = new Date(Date.now() + expiresInMs).toISOString();
        } else if (providerCode === "plivo") {
          const authId = Deno.env.get(provider.api_secret_name || "PLIVO_AUTH_ID");
          if (!authId) {
            return jsonResponse({
              error: "provider_not_configured",
              message: "Configura PLIVO_AUTH_ID en Backoffice → Integraciones → Telefonía",
            }, 503);
          }
          webrtcToken = await generatePlivoToken(authId, secretValue, tenant, userId);
          tokenExpiresAt = new Date(Date.now() + expiresInMs).toISOString();
        } else {
          return jsonResponse({ error: "unsupported_provider", message: `Proveedor ${providerCode} no soportado` }, 400);
        }
      } catch (providerError) {
        console.error(`[telephony-token] Provider ${providerCode} error:`, providerError);
        return jsonResponse({
          error: "provider_error",
          message: `Error generando token con ${providerCode}. Verifica las credenciales.`,
        }, 502);
      }
    }

    // ── Store session ──
    await adminClient.from("telephony_webrtc_sessions").insert({
      organization_id: organizationId,
      user_id: userId,
      access_token: webrtcToken.substring(0, 50) + "...", // truncated for security
      token_expires_at: tokenExpiresAt,
      provider_code: providerCode,
      status: "active",
    });

    return jsonResponse({
      token: webrtcToken,
      expires_at: tokenExpiresAt,
      provider: providerCode,
      is_mock: !secretValue,
      organization_id: organizationId,
    });
  } catch (err) {
    console.error("[telephony-token] Unhandled error:", err);
    return jsonResponse({ error: "internal", message: "Error interno del servidor" }, 500);
  }
});

// ── Provider-specific token generators ──

async function generateTelnyxToken(
  apiKey: string,
  tenant: Record<string, unknown>,
  userId: string
): Promise<string> {
  // Telnyx WebRTC: Create a credential and get a SIP token
  // https://developers.telnyx.com/docs/webrtc
  const connectionId = tenant.subaccount_id;
  if (!connectionId) {
    throw new Error("Telnyx connection_id (subaccount_id) not configured for this tenant");
  }

  const resp = await fetch("https://api.telnyx.com/v2/telephony_credentials", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      connection_id: connectionId,
      name: `ipnexus_${userId}_${Date.now()}`,
      expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
    }),
  });

  if (!resp.ok) {
    const errBody = await resp.text();
    throw new Error(`Telnyx API ${resp.status}: ${errBody}`);
  }

  const data = await resp.json();
  const credentialId = data.data?.id;
  if (!credentialId) throw new Error("No credential ID returned from Telnyx");

  // Get SIP token for this credential
  const tokenResp = await fetch(
    `https://api.telnyx.com/v2/telephony_credentials/${credentialId}/token`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
    }
  );

  if (!tokenResp.ok) {
    const errBody = await tokenResp.text();
    throw new Error(`Telnyx token API ${tokenResp.status}: ${errBody}`);
  }

  const tokenText = await tokenResp.text();
  return tokenText;
}

async function generateTwilioToken(
  accountSid: string,
  authToken: string,
  tenant: Record<string, unknown>,
  userId: string
): Promise<string> {
  // Twilio: Generate Access Token with Voice Grant
  // In production, use twilio SDK or manual JWT creation
  // For now, use the Twilio REST API to create a token
  const twimlAppSid = tenant.subaccount_id || "";

  // Manual JWT creation for Twilio Access Token
  // Header
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT", cty: "twilio-fpa;v=1" }));
  const now = Math.floor(Date.now() / 1000);
  const payload = btoa(
    JSON.stringify({
      jti: `${accountSid}-${now}`,
      iss: accountSid,
      sub: accountSid,
      nbf: now,
      exp: now + 3600,
      grants: {
        identity: userId,
        voice: {
          incoming: { allow: true },
          outgoing: { application_sid: twimlAppSid },
        },
      },
    })
  );

  // Sign with HMAC-SHA256
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(authToken),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(`${header}.${payload}`));
  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return `${header}.${payload}.${sig}`;
}

async function generatePlivoToken(
  authId: string,
  authToken: string,
  tenant: Record<string, unknown>,
  userId: string
): Promise<string> {
  // Plivo: Generate JWT for WebRTC endpoint
  const endpointUsername = `ipnexus_${userId}`.replace(/-/g, "");

  const resp = await fetch(`https://api.plivo.com/v1/Account/${authId}/Endpoint/`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa(`${authId}:${authToken}`),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: endpointUsername,
      password: crypto.randomUUID().replace(/-/g, ""),
      alias: `IP-NEXUS ${userId}`,
      app_id: tenant.subaccount_id || "",
    }),
  });

  if (!resp.ok) {
    const errBody = await resp.text();
    throw new Error(`Plivo API ${resp.status}: ${errBody}`);
  }

  const data = await resp.json();
  return data.username || endpointUsername;
}
