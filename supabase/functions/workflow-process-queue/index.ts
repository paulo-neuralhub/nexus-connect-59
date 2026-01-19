import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { batch_size = 5 } = await req.json().catch(() => ({}));

    console.log('[Queue Processor] Starting queue processing...');

    // Get pending queue items that are due
    const { data: queueItems, error: queueError } = await supabase
      .from('workflow_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .is('locked_at', null)
      .order('priority', { ascending: true })
      .order('scheduled_for', { ascending: true })
      .limit(batch_size);

    if (queueError) throw queueError;

    if (!queueItems || queueItems.length === 0) {
      console.log('[Queue Processor] No pending items to process');
      return new Response(JSON.stringify({
        success: true,
        processed: 0,
        message: 'No pending items'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[Queue Processor] Found ${queueItems.length} items to process`);

    const results = [];
    const lockId = `processor-${Date.now()}`;

    for (const item of queueItems) {
      try {
        // Lock the item
        const { error: lockError } = await supabase
          .from('workflow_queue')
          .update({
            locked_at: new Date().toISOString(),
            locked_by: lockId,
            status: 'processing',
            attempts: item.attempts + 1
          })
          .eq('id', item.id)
          .is('locked_at', null); // Only lock if not already locked

        if (lockError) {
          console.log(`[Queue Processor] Failed to lock item ${item.id}, skipping`);
          continue;
        }

        console.log(`[Queue Processor] Processing queue item ${item.id} for workflow ${item.workflow_id}`);

        // Call the workflow-execute function
        const { data: executeResult, error: executeError } = await supabase.functions.invoke('workflow-execute', {
          body: { queue_id: item.id }
        });

        if (executeError) {
          throw executeError;
        }

        results.push({
          queue_id: item.id,
          workflow_id: item.workflow_id,
          success: true,
          result: executeResult
        });

        console.log(`[Queue Processor] Successfully processed item ${item.id}`);

      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[Queue Processor] Error processing item ${item.id}:`, error);

        // Check if we should retry
        if (item.attempts + 1 < item.max_attempts) {
          await supabase
            .from('workflow_queue')
            .update({
              status: 'pending',
              locked_at: null,
              locked_by: null,
              last_error: errorMessage,
              scheduled_for: new Date(Date.now() + Math.pow(2, item.attempts) * 60000).toISOString()
            })
            .eq('id', item.id);
        } else {
          await supabase
            .from('workflow_queue')
            .update({
              status: 'failed',
              last_error: errorMessage
            })
            .eq('id', item.id);
        }

        results.push({
          queue_id: item.id,
          workflow_id: item.workflow_id,
          success: false,
          error: errorMessage
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return new Response(JSON.stringify({
      success: true,
      processed: results.length,
      succeeded: successCount,
      failed: failCount,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Queue Processor] Fatal error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
