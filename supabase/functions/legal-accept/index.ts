// supabase/functions/legal-accept/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type AcceptanceMethod = 'checkbox' | 'typed_name' | 'electronic';

interface AcceptRequest {
  documentCode: string;
  featureType?: 'ai' | 'general' | 'other';
  contentHash: string;
  acceptanceMethod: AcceptanceMethod;
  signatureData?: Record<string, unknown> | null;
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function isValidIPv4(ip: string): boolean {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  return parts.every((p) => {
    if (!/^[0-9]{1,3}$/.test(p)) return false;
    const n = Number(p);
    return n >= 0 && n <= 255;
  });
}

function isValidIPv6(ip: string): boolean {
  // Pragmatic check: accept common IPv6 forms, reject obviously invalid strings.
  if (!ip.includes(':')) return false;
  return /^[0-9a-fA-F:]+$/.test(ip);
}

function normalizeIpCandidate(candidate: string): string | null {
  const trimmed = candidate.trim();
  if (!trimmed) return null;

  // Strip brackets for IPv6 like: [2001:db8::1]
  const unbracketed =
    trimmed.startsWith('[') && trimmed.includes(']')
      ? trimmed.slice(1, trimmed.indexOf(']'))
      : trimmed;

  // Strip port for IPv4:port (e.g., 203.0.113.1:12345)
  const maybeIpv4WithPort =
    unbracketed.includes('.') && unbracketed.includes(':') && unbracketed.split(':').length === 2;
  const withoutPort = maybeIpv4WithPort ? unbracketed.split(':')[0] : unbracketed;

  const ip = withoutPort.trim();
  if (isValidIPv4(ip) || isValidIPv6(ip)) return ip;

  // Fallback: extract first IPv4 that appears anywhere inside the string
  const ipv4Match = ip.match(/(\d{1,3}(?:\.\d{1,3}){3})/);
  if (ipv4Match && isValidIPv4(ipv4Match[1])) return ipv4Match[1];

  return null;
}

function getRequestIp(req: Request): string | null {
  const forwardedFor = req.headers.get('x-forwarded-for');
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  const realIp = req.headers.get('x-real-ip');

  // x-forwarded-for can contain multiple IPs. Prefer the first valid IP.
  if (forwardedFor) {
    for (const part of forwardedFor.split(',')) {
      const ip = normalizeIpCandidate(part);
      if (ip) return ip;
    }
    // As a last resort, try to extract from the whole header
    const fallback = normalizeIpCandidate(forwardedFor);
    if (fallback) return fallback;
  }

  for (const raw of [cfConnectingIp, realIp]) {
    if (!raw) continue;
    const ip = normalizeIpCandidate(raw);
    if (ip) return ip;
  }

  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json(401, { error: 'Missing Authorization header' });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return json(401, { error: 'Invalid token' });
    }
    const userId = userData.user.id;

    const body = (await req.json()) as AcceptRequest;
    if (!body?.documentCode || !body?.contentHash || !body?.acceptanceMethod) {
      return json(400, { error: 'Missing required fields: documentCode, contentHash, acceptanceMethod' });
    }
    if (body.contentHash.length !== 64) {
      return json(400, { error: 'contentHash must be SHA-256 hex (64 chars)' });
    }

    const effectiveCode = body.featureType === 'ai' ? 'ai_disclaimer' : body.documentCode;

    // 1) Documento activo por code
    const { data: doc, error: docError } = await supabase
      .from('legal_documents')
      .select('id, organization_id, code, version, is_active')
      .eq('code', effectiveCode)
      .eq('is_active', true)
      .order('effective_date', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();

    if (docError) throw docError;
    if (!doc) return json(404, { error: 'Active legal document not found' });

    // 2) Upsert aceptación (UNIQUE user_id + document_id)
    const ip = getRequestIp(req);
    const userAgent = req.headers.get('user-agent');

    const { data: acceptance, error: accError } = await supabase
      .from('legal_acceptances')
      .upsert(
        {
          organization_id: doc.organization_id ?? null,
          user_id: userId,
          document_id: doc.id,
          version_accepted: doc.version,
          content_hash: body.contentHash,
          accepted_at: new Date().toISOString(),
          ip_address: ip,
          user_agent: userAgent,
          acceptance_method: body.acceptanceMethod,
          signature_data: body.signatureData ?? null,
        },
        { onConflict: 'user_id,document_id' }
      )
      .select('id, user_id, document_id, version_accepted, accepted_at')
      .single();

    if (accError) throw accError;

    return json(200, { success: true, acceptance });
  } catch (error: unknown) {
    console.error('legal-accept error:', error);
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'object' && error !== null && 'message' in error
          ? String((error as { message?: unknown }).message ?? 'Unknown error')
          : 'Unknown error';
    return json(500, { error: message });
  }
});
