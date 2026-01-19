import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { organization_id, sourceId, fileIds, config, job_type } = await req.json();

    // Create shadow job
    const { data: job, error: jobError } = await supabase
      .from('import_jobs')
      .insert({
        organization_id,
        source_id: sourceId,
        job_type: job_type || 'shadow_sync',
        config: config,
        status: 'running',
        started_at: new Date().toISOString(),
        progress: {
          phase: 'extracting',
          processed: 0,
          total: 0,
          percentage: 0,
          current_batch: 0,
          total_batches: 0
        }
      })
      .select()
      .single();

    if (jobError) throw jobError;

    // Get files if provided
    let filesToProcess = [];
    if (fileIds && fileIds.length > 0) {
      const { data: files } = await supabase
        .from('import_files')
        .select('*')
        .in('id', fileIds);
      filesToProcess = files || [];
    }

    // Simulate processing - collect shadow data
    const shadowData: Record<string, any[]> = {
      matters: [],
      contacts: [],
      deadlines: [],
      costs: []
    };

    // In production, this would:
    // 1. Parse the files
    // 2. Apply field mappings from config
    // 3. Transform data
    // 4. Store in shadow_data without committing to real tables

    // For now, return mock comparison
    const shadowComparison = {
      summary: {
        new_records: filesToProcess.length > 0 ? 25 : 0,
        modified_records: filesToProcess.length > 0 ? 12 : 0,
        deleted_records: 0,
        unchanged_records: filesToProcess.length > 0 ? 63 : 0,
        conflicts: filesToProcess.length > 0 ? 3 : 0
      },
      details: [],
      recommendations: [
        {
          type: 'info',
          message: '25 nuevos expedientes serán creados',
          affected_records: 25,
          suggested_action: 'Revisar antes de confirmar'
        }
      ]
    };

    // Update job with shadow data
    await supabase
      .from('import_jobs')
      .update({
        status: 'completed',
        shadow_data: shadowData,
        shadow_comparison: shadowComparison,
        completed_at: new Date().toISOString(),
        progress: {
          phase: 'validating',
          processed: 100,
          total: 100,
          percentage: 100,
          current_batch: 1,
          total_batches: 1
        }
      })
      .eq('id', job.id);

    return new Response(JSON.stringify(job), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
