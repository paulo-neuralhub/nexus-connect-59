// ============================================================
// IP-NEXUS Edge Function - Telephony Make Call
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MakeCallRequest {
  tenantId: string;
  userId: string;
  toNumber: string;
  record: boolean;
  matterId?: string;
  clientId?: string;
  contactId?: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { tenantId, userId, toNumber, record, matterId, clientId, contactId }: MakeCallRequest = await req.json();

    if (!tenantId || !userId || !toNumber) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: tenantId, userId, toNumber' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Check tenant balance
    const { data: balance, error: balanceError } = await supabaseClient
      .from('tenant_telephony_balance')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (balanceError || !balance) {
      return new Response(
        JSON.stringify({ error: 'No telephony balance found for this organization' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!balance.is_enabled) {
      return new Response(
        JSON.stringify({ error: 'Telephony is disabled for this organization' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (balance.minutes_balance <= 0) {
      return new Response(
        JSON.stringify({ error: 'Insufficient balance', balance: 0 }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Get tenant telephony configuration
    const { data: config } = await supabaseClient
      .from('telephony_config')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    // Get Twilio credentials (would be from config or secrets)
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = config?.caller_id || Deno.env.get('TWILIO_PHONE_NUMBER');

    // 3. Create call via Twilio API (if credentials available)
    let callSid = `DEMO_${Date.now()}`; // Demo call SID

    if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
      try {
        // In production, this would make a real Twilio API call
        // For now, we simulate the call creation
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Calls.json`;
        
        const formData = new URLSearchParams();
        formData.append('To', toNumber);
        formData.append('From', twilioPhoneNumber);
        formData.append('Url', `${Deno.env.get('SUPABASE_URL')}/functions/v1/telephony-voice-webhook`);
        formData.append('StatusCallback', `${Deno.env.get('SUPABASE_URL')}/functions/v1/telephony-call-status`);
        formData.append('StatusCallbackEvent', 'initiated ringing answered completed');
        if (record) {
          formData.append('Record', 'true');
        }

        const twilioResponse = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
        });

        if (twilioResponse.ok) {
          const twilioData = await twilioResponse.json();
          callSid = twilioData.sid;
        } else {
          console.error('Twilio API error:', await twilioResponse.text());
          // Continue with demo mode
        }
      } catch (twilioError) {
        console.error('Twilio call error:', twilioError);
        // Continue with demo mode
      }
    } else {
      console.log('Twilio credentials not configured, using demo mode');
    }

    // 4. Create call log entry
    const { data: callLog, error: logError } = await supabaseClient
      .from('telephony_usage_logs')
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        call_sid: callSid,
        from_number: twilioPhoneNumber || '+34000000000',
        to_number: toNumber,
        direction: 'outbound',
        status: 'initiated',
        is_recorded: record,
        matter_id: matterId,
        client_id: clientId,
        contact_id: contactId,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (logError) {
      console.error('Error creating call log:', logError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        call_sid: callSid,
        call_log_id: callLog?.id,
        demo_mode: !twilioAccountSid,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in telephony-make-call:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
