import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { communication_id, organization_id } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verificar que el tenant tiene IA habilitada
    const { data: config } = await supabase
      .from('tenant_ai_config')
      .select('ai_classification_enabled')
      .eq('organization_id', organization_id)
      .single();

    if (!config?.ai_classification_enabled) {
      return new Response(
        JSON.stringify({ error: 'AI classification not enabled' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obtener comunicación
    const { data: comm, error: commError } = await supabase
      .from('communications')
      .select('id, subject, body, channel')
      .eq('id', communication_id)
      .eq('organization_id', organization_id)
      .single();

    if (commError || !comm) {
      return new Response(
        JSON.stringify({ error: 'Communication not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Default classification (placeholder - integrate with OpenAI in production)
    const classification = {
      category: 'general',
      priority: 3,
      confidence: 0.75
    };

    // Update communication
    await supabase
      .from('communications')
      .update({
        ai_category: classification.category,
        ai_priority: classification.priority,
        ai_confidence: classification.confidence,
        ai_classified_at: new Date().toISOString(),
        ai_model: 'placeholder'
      })
      .eq('id', communication_id);

    return new Response(JSON.stringify(classification), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
