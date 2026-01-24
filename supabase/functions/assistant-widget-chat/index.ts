// supabase/functions/assistant-widget-chat/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `Eres el **Asistente IP-NEXUS**.

Objetivo: ayudar con **conceptos generales** de Propiedad Intelectual (PI) y con el uso de la plataforma IP‑NEXUS.

Reglas estrictas:
- NO analizar casos concretos, expedientes, ni dar recomendaciones específicas.
- NO generar documentos legales.
- NO hacer predicciones ni scoring.
- Si el usuario pide análisis avanzado o acciones de Genius, redirige: "Eso requiere IP‑GENIUS".
- Responde claro, breve, en español de España.
- Incluye un aviso: "La IA es orientativa y no sustituye asesoramiento profesional" cuando corresponda.
`;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface WidgetChatRequest {
  messages: ChatMessage[];
  currentPath?: string;
  context?: string;
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function monthStartISO(d: Date): string {
  const ms = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  return ms.toISOString().slice(0, 10); // YYYY-MM-DD
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      return json(503, { error: 'AI not configured (LOVABLE_API_KEY missing)' });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Auth (manual)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json(401, { error: 'Missing Authorization header' });
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) return json(401, { error: 'Invalid token' });
    const userId = userData.user.id;

    const body = (await req.json()) as WidgetChatRequest;
    if (!body?.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return json(400, { error: 'messages array required' });
    }

    // Determine organization_id (optional)
    const { data: membership } = await supabase
      .from('memberships')
      .select('organization_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    const organizationId: string | null = membership?.organization_id ?? null;

    // Load config
    const { data: config, error: cfgError } = await supabase
      .from('ai_module_config')
      .select('module_code, monthly_limit')
      .eq('module_code', 'assistant')
      .single();

    if (cfgError) throw cfgError;
    const monthlyLimit: number | null = config?.monthly_limit ?? 50;

    // Usage row
    const periodStart = monthStartISO(new Date());
    const { data: usageRow, error: usageReadErr } = await supabase
      .from('ai_module_usage')
      .select('id, usage_count')
      .eq('user_id', userId)
      .eq('module_code', 'assistant')
      .eq('period_start', periodStart)
      .maybeSingle();
    if (usageReadErr) throw usageReadErr;

    const used = usageRow?.usage_count ?? 0;
    const remaining = monthlyLimit == null ? null : Math.max(monthlyLimit - used, 0);

    if (monthlyLimit != null && remaining === 0) {
      return json(402, {
        error: 'Monthly limit reached',
        module: 'assistant',
        used,
        limit: monthlyLimit,
        remaining: 0,
        requiresUpgrade: true,
      });
    }

    // Increment usage (create or update)
    if (usageRow?.id) {
      const { error: updErr } = await supabase
        .from('ai_module_usage')
        .update({ usage_count: used + 1 })
        .eq('id', usageRow.id);
      if (updErr) throw updErr;
    } else {
      const { error: insErr } = await supabase.from('ai_module_usage').insert({
        organization_id: organizationId,
        user_id: userId,
        module_code: 'assistant',
        period_start: periodStart,
        usage_count: 1,
      });
      if (insErr) throw insErr;
    }

    // Build context
    let contextual = SYSTEM_PROMPT;
    if (body.context) contextual += `\n\nContexto visible: ${body.context}`;
    if (body.currentPath) contextual += `\nRuta actual: ${body.currentPath}`;

    // Call Lovable AI (non-stream)
    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [{ role: 'system', content: contextual }, ...body.messages.slice(-10)],
        stream: false,
        max_tokens: 700,
        temperature: 0.4,
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error('AI gateway error:', aiResp.status, t);
      if (aiResp.status === 429) return json(429, { error: 'Rate limit. Inténtalo de nuevo.' });
      if (aiResp.status === 402) return json(402, { error: 'Créditos de IA agotados.' });
      return json(500, { error: 'AI gateway error' });
    }

    const payload = await aiResp.json();
    const assistantText: string | undefined = payload?.choices?.[0]?.message?.content;

    const nextUsed = used + 1;
    const nextRemaining = monthlyLimit == null ? null : Math.max(monthlyLimit - nextUsed, 0);

    return json(200, {
      reply: assistantText ?? '',
      usage: {
        used: nextUsed,
        limit: monthlyLimit,
        remaining: nextRemaining,
        period_start: periodStart,
      },
    });
  } catch (error: unknown) {
    console.error('assistant-widget-chat error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return json(500, { error: message });
  }
});
