/**
 * route-incoming-email - Automatic email routing to matters
 * 
 * Routes incoming emails to the correct matter based on:
 * 1. Reference in subject (with check digit validation)
 * 2. Thread ID (in_reply_to)
 * 3. Sender email (contact matching)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================
// REFERENCE PARSING (duplicated from lib for edge function)
// ============================================================

const FULL_REFERENCE_PATTERN = /\[?([A-Z]{2})-([A-Z]{2})-(\d{8})-([A-Z0-9]{3})-(\d{4})-([A-Z0-9]{2})\]?/i;
const SIMPLE_REFERENCE_PATTERN = /\[?([A-Z]{2,}-\d{4}-\d+(?:-[A-Z0-9]+)*)\]?/;

function calculateCheckDigit(base: string): string {
  const chars = base.replace(/-/g, '').toUpperCase();
  let sum = 0;
  
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    let value = char >= '0' && char <= '9' 
      ? parseInt(char, 10) 
      : char.charCodeAt(0) - 55;
    
    if (i % 2 === 0) {
      value *= 2;
      if (value > 35) value -= 9;
    }
    sum += value;
  }
  
  const check1 = String.fromCharCode(65 + (sum % 26));
  const check2 = (sum % 10).toString();
  return check1 + check2;
}

function validateCheckDigit(reference: string): boolean {
  const cleaned = reference.replace(/[\[\]]/g, '').trim();
  const match = cleaned.match(FULL_REFERENCE_PATTERN);
  if (!match) return false;
  
  const base = `${match[1]}-${match[2]}-${match[3]}-${match[4]}-${match[5]}`.toUpperCase();
  const expectedCheck = calculateCheckDigit(base);
  return expectedCheck === match[6].toUpperCase();
}

function extractReferenceFromSubject(text: string): {
  reference: string;
  isFullFormat: boolean;
  isValid: boolean;
} | null {
  if (!text) return null;
  
  let cleaned = text;
  for (let i = 0; i < 5; i++) {
    cleaned = cleaned
      .replace(/^(RE:|FW:|FWD:|RV:|ENC:|AW:|R:|SV:)\s*/gi, '')
      .trim();
  }
  
  const fullMatch = cleaned.match(FULL_REFERENCE_PATTERN);
  if (fullMatch) {
    const reference = fullMatch[0].replace(/[\[\]]/g, '');
    return {
      reference,
      isFullFormat: true,
      isValid: validateCheckDigit(reference),
    };
  }
  
  const simpleMatch = cleaned.match(SIMPLE_REFERENCE_PATTERN);
  if (simpleMatch) {
    return {
      reference: simpleMatch[1],
      isFullFormat: false,
      isValid: true,
    };
  }
  
  return null;
}

// ============================================================
// ROUTING LOGIC
// ============================================================

type RoutingResult = {
  matterId: string | null;
  status: 'auto' | 'suggested' | 'unrouted';
  reason: string;
  confidence: number;
  referenceDetected: string | null;
  referenceValid: boolean | null;
};

async function routeEmail(
  supabase: any,
  email: {
    from: string;
    subject: string;
    messageId?: string;
    inReplyTo?: string;
    organizationId?: string;
  }
): Promise<RoutingResult> {
  // 1. Try to extract reference from subject
  const refResult = extractReferenceFromSubject(email.subject);
  
  if (refResult) {
    if (refResult.isFullFormat && !refResult.isValid) {
      // Invalid check digit - possible tampering or typo
      return {
        matterId: null,
        status: 'unrouted',
        reason: 'Referencia detectada pero check digit inválido',
        confidence: 0,
        referenceDetected: refResult.reference,
        referenceValid: false,
      };
    }
    
    // Search for matter by reference
    let query = supabase
      .from('matters')
      .select('id, organization_id')
      .eq('reference', refResult.reference);
    
    if (email.organizationId) {
      query = query.eq('organization_id', email.organizationId);
    }
    
    const { data: matter } = await query.maybeSingle();
    
    if (matter) {
      return {
        matterId: matter.id,
        status: 'auto',
        reason: 'Referencia válida encontrada en asunto',
        confidence: 1.0,
        referenceDetected: refResult.reference,
        referenceValid: refResult.isValid,
      };
    } else {
      return {
        matterId: null,
        status: 'unrouted',
        reason: 'Referencia válida pero expediente no encontrado en base de datos',
        confidence: 0.5,
        referenceDetected: refResult.reference,
        referenceValid: refResult.isValid,
      };
    }
  }
  
  // 2. Try to route by thread (in_reply_to)
  if (email.inReplyTo) {
    const { data: parentComm } = await supabase
      .from('communications')
      .select('matter_id')
      .eq('external_id', email.inReplyTo)
      .not('matter_id', 'is', null)
      .maybeSingle();
    
    if (parentComm?.matter_id) {
      return {
        matterId: parentComm.matter_id,
        status: 'auto',
        reason: 'Enrutado por thread (in_reply_to)',
        confidence: 0.95,
        referenceDetected: null,
        referenceValid: null,
      };
    }
  }
  
  // 3. Try to find contact by sender email
  const senderEmail = email.from.match(/<([^>]+)>/)?.[1] || email.from;
  
  const { data: contact } = await supabase
    .from('contacts')
    .select('id, account_id')
    .eq('email', senderEmail.toLowerCase())
    .maybeSingle();
  
  if (contact?.account_id) {
    // Find most recent active matter for this account
    const { data: matter } = await supabase
      .from('matters')
      .select('id')
      .eq('account_id', contact.account_id)
      .not('status', 'eq', 'closed')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (matter) {
      return {
        matterId: matter.id,
        status: 'suggested',
        reason: 'Sugerido por contacto del remitente',
        confidence: 0.6,
        referenceDetected: null,
        referenceValid: null,
      };
    }
  }
  
  // 4. No routing possible
  return {
    matterId: null,
    status: 'unrouted',
    reason: 'No se pudo determinar expediente automáticamente',
    confidence: 0,
    referenceDetected: null,
    referenceValid: null,
  };
}

// ============================================================
// MAIN HANDLER
// ============================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      email_id,           // If processing from email_ingestion_queue
      from,
      to,
      subject,
      body: emailBody,
      html,
      message_id,
      in_reply_to,
      attachments,
      organization_id,
    } = body;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Route the email
    const routing = await routeEmail(supabase, {
      from,
      subject,
      messageId: message_id,
      inReplyTo: in_reply_to,
      organizationId: organization_id,
    });

    console.log('[route-incoming-email] Routing result:', {
      subject,
      routing,
    });

    // If we have an email_id from ingestion queue, update it
    if (email_id) {
      await supabase
        .from('email_ingestion_queue')
        .update({
          status: routing.status === 'auto' ? 'completed' : 
                  routing.status === 'suggested' ? 'pending' : 'manual_review',
          matched_matter_id: routing.matterId,
          processing_completed_at: new Date().toISOString(),
          extracted_data: {
            routing_status: routing.status,
            routing_reason: routing.reason,
            routing_confidence: routing.confidence,
            reference_detected: routing.referenceDetected,
            reference_valid: routing.referenceValid,
          },
        })
        .eq('id', email_id);
    }

    // If auto-routed, create the communication record
    if (routing.status === 'auto' && routing.matterId) {
      // Get matter's organization_id
      const { data: matter } = await supabase
        .from('matters')
        .select('organization_id')
        .eq('id', routing.matterId)
        .single();

      if (matter) {
        const { error: commError } = await supabase
          .from('communications')
          .insert({
            organization_id: matter.organization_id,
            matter_id: routing.matterId,
            channel: 'email',
            direction: 'inbound',
            subject,
            body: emailBody || html,
            sender_email: from,
            external_id: message_id,
            metadata: {
              to,
              in_reply_to,
              attachments: attachments?.map((a: any) => ({
                filename: a.filename,
                content_type: a.contentType,
                size: a.size,
              })),
              routing: routing,
            },
          });

        if (commError) {
          console.error('[route-incoming-email] Failed to create communication:', commError);
        }
      }
    }

    // Create alert for unrouted emails
    if (routing.status === 'unrouted' || routing.status === 'suggested') {
      const { data: orgData } = organization_id 
        ? { data: { organization_id } }
        : await supabase
            .from('email_ingestion_queue')
            .select('organization_id')
            .eq('id', email_id)
            .single();

      if (orgData?.organization_id) {
        await supabase.from('notifications').insert({
          organization_id: orgData.organization_id,
          type: 'email_needs_routing',
          title: 'Email pendiente de clasificar',
          message: `De: ${from}\nAsunto: ${subject}`,
          priority: routing.status === 'suggested' ? 'low' : 'medium',
          metadata: {
            email_id,
            from,
            subject,
            suggested_matter_id: routing.matterId,
            routing_reason: routing.reason,
          },
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        routing,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[route-incoming-email] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
