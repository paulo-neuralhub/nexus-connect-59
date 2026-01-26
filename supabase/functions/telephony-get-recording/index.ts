// ============================================================
// IP-NEXUS Edge Function - Telephony Get Recording
// ============================================================

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { callSid } = await req.json();

    if (!callSid) {
      return new Response(
        JSON.stringify({ error: 'Missing callSid' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the call log with recording info
    const { data: callLog, error } = await supabaseClient
      .from('telephony_usage_logs')
      .select('recording_url, recording_sid, duration_seconds')
      .eq('call_sid', callSid)
      .single();

    if (error || !callLog) {
      return new Response(
        JSON.stringify({ error: 'Call not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!callLog.recording_url) {
      return new Response(
        JSON.stringify({ error: 'No recording available for this call' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For Twilio recordings, we might need to append .mp3 and authenticate
    let recordingUrl = callLog.recording_url;
    
    // If it's a Twilio URL, we may need to sign it or fetch it
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');

    if (recordingUrl.includes('twilio.com') && twilioAccountSid && twilioAuthToken) {
      // Add .mp3 extension if not present
      if (!recordingUrl.endsWith('.mp3') && !recordingUrl.endsWith('.wav')) {
        recordingUrl += '.mp3';
      }
    }

    return new Response(
      JSON.stringify({
        recordingUrl,
        recordingSid: callLog.recording_sid,
        duration: callLog.duration_seconds,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in telephony-get-recording:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
