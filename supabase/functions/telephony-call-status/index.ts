// ============================================================
// IP-NEXUS Edge Function - Telephony Call Status Webhook
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate multipliers by destination for cost calculation
const RATE_MULTIPLIERS: Record<string, number> = {
  'ES': 1.0,    // Spain
  'PT': 1.2,    // Portugal
  'FR': 1.2,    // France
  'DE': 1.2,    // Germany
  'IT': 1.2,    // Italy
  'UK': 1.3,    // UK
  'GB': 1.3,    // UK
  'US': 1.1,    // USA
  'default': 2.0,
};

function getCountryFromPhone(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.startsWith('34')) return 'ES';
  if (cleanPhone.startsWith('351')) return 'PT';
  if (cleanPhone.startsWith('33')) return 'FR';
  if (cleanPhone.startsWith('49')) return 'DE';
  if (cleanPhone.startsWith('39')) return 'IT';
  if (cleanPhone.startsWith('44')) return 'UK';
  if (cleanPhone.startsWith('1')) return 'US';
  
  return 'default';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse form data from Twilio webhook
    const formData = await req.formData();
    const callSid = formData.get('CallSid') as string;
    const callStatus = formData.get('CallStatus') as string;
    const callDuration = formData.get('CallDuration') as string;
    const toNumber = formData.get('To') as string;
    const recordingUrl = formData.get('RecordingUrl') as string;
    const recordingSid = formData.get('RecordingSid') as string;

    console.log(`Call status update: ${callSid} -> ${callStatus}`);

    if (!callSid) {
      return new Response(
        JSON.stringify({ error: 'Missing CallSid' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the call log
    const { data: callLog, error: logError } = await supabaseClient
      .from('telephony_usage_logs')
      .select('*, tenant_id')
      .eq('call_sid', callSid)
      .single();

    if (logError || !callLog) {
      console.error('Call log not found:', callSid);
      return new Response(
        JSON.stringify({ error: 'Call log not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update call log based on status
    const updates: Record<string, unknown> = {
      status: callStatus,
      updated_at: new Date().toISOString(),
    };

    // Handle completed calls
    if (callStatus === 'completed' && callDuration) {
      const durationSeconds = parseInt(callDuration, 10);
      const durationMinutes = Math.ceil(durationSeconds / 60);
      
      // Calculate cost based on destination
      const country = getCountryFromPhone(toNumber || callLog.to_number);
      const multiplier = RATE_MULTIPLIERS[country] ?? RATE_MULTIPLIERS['default'];
      const minutesConsumed = Math.ceil(durationMinutes * multiplier);

      updates.duration_seconds = durationSeconds;
      updates.duration_minutes = durationMinutes;
      updates.minutes_consumed = minutesConsumed;
      updates.ended_at = new Date().toISOString();

      // Deduct minutes from balance
      const { error: deductError } = await supabaseClient.rpc('deduct_telephony_minutes', {
        p_tenant_id: callLog.tenant_id,
        p_minutes: minutesConsumed,
      });

      if (deductError) {
        console.error('Error deducting minutes:', deductError);
      }
    }

    // Handle recording
    if (recordingUrl && recordingSid) {
      updates.recording_url = recordingUrl;
      updates.recording_sid = recordingSid;
    }

    // Handle failed/busy/no-answer
    if (['failed', 'busy', 'no-answer', 'canceled'].includes(callStatus)) {
      updates.ended_at = new Date().toISOString();
      updates.minutes_consumed = 0;
    }

    // Update the call log
    const { error: updateError } = await supabaseClient
      .from('telephony_usage_logs')
      .update(updates)
      .eq('call_sid', callSid);

    if (updateError) {
      console.error('Error updating call log:', updateError);
    }

    // Return TwiML response (empty for status callbacks)
    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    console.error('Error in telephony-call-status:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
