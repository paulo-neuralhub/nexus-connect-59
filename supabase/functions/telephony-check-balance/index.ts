// ============================================================
// IP-NEXUS Edge Function - Telephony Check Balance
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckBalanceRequest {
  tenantId: string;
  destination: string;
}

// Rate multipliers by destination
const RATE_MULTIPLIERS: Record<string, number> = {
  'ES': 1.0,    // Spain
  'PT': 1.2,    // Portugal
  'FR': 1.2,    // France
  'DE': 1.2,    // Germany
  'IT': 1.2,    // Italy
  'UK': 1.3,    // UK
  'GB': 1.3,    // UK
  'US': 1.1,    // USA
  'CA': 1.2,    // Canada
  'MX': 1.5,    // Mexico
  'AR': 1.8,    // Argentina
  'BR': 1.6,    // Brazil
  'CL': 1.7,    // Chile
  'CO': 1.8,    // Colombia
  'default': 2.0, // Other countries
};

function getCountryFromPhone(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Common country codes
  if (cleanPhone.startsWith('34')) return 'ES';
  if (cleanPhone.startsWith('351')) return 'PT';
  if (cleanPhone.startsWith('33')) return 'FR';
  if (cleanPhone.startsWith('49')) return 'DE';
  if (cleanPhone.startsWith('39')) return 'IT';
  if (cleanPhone.startsWith('44')) return 'UK';
  if (cleanPhone.startsWith('1')) return 'US'; // US/Canada
  if (cleanPhone.startsWith('52')) return 'MX';
  if (cleanPhone.startsWith('54')) return 'AR';
  if (cleanPhone.startsWith('55')) return 'BR';
  if (cleanPhone.startsWith('56')) return 'CL';
  if (cleanPhone.startsWith('57')) return 'CO';
  
  return 'default';
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

    const { tenantId, destination }: CheckBalanceRequest = await req.json();

    if (!tenantId || !destination) {
      return new Response(
        JSON.stringify({ canCall: false, error: 'Missing tenantId or destination' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get tenant balance
    const { data: balance, error: balanceError } = await supabaseClient
      .from('tenant_telephony_balance')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (balanceError || !balance) {
      return new Response(
        JSON.stringify({
          canCall: false,
          minutesAvailable: 0,
          estimatedCost: 0,
          error: 'No telephony balance found',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if telephony is enabled
    if (!balance.is_enabled) {
      return new Response(
        JSON.stringify({
          canCall: false,
          minutesAvailable: balance.minutes_balance,
          estimatedCost: 0,
          error: 'Telephony is disabled for this organization',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get rate multiplier for destination
    const country = getCountryFromPhone(destination);
    const multiplier = RATE_MULTIPLIERS[country] ?? RATE_MULTIPLIERS['default'];

    // Calculate estimated cost for 1 minute
    const estimatedCostPerMinute = multiplier;

    // Check if user can make the call
    const canCall = balance.minutes_balance >= estimatedCostPerMinute;

    // Calculate how many real minutes can be called
    const effectiveMinutes = Math.floor(balance.minutes_balance / multiplier);

    return new Response(
      JSON.stringify({
        canCall,
        minutesAvailable: balance.minutes_balance,
        effectiveMinutes,
        estimatedCostPerMinute: multiplier,
        country,
        rateMultiplier: multiplier,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in telephony-check-balance:', error);
    return new Response(
      JSON.stringify({
        canCall: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
