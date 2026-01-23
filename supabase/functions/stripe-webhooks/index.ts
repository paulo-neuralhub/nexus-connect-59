import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@13.0.0';

type BillingCycle = 'monthly' | 'yearly';

function isoDateOnly(tsSeconds: number) {
  return new Date(tsSeconds * 1000).toISOString().slice(0, 10);
}

serve(async (req) => {
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  
  if (!stripeKey || !webhookSecret) {
    console.error('Stripe not configured');
    return new Response(JSON.stringify({ error: 'Stripe not configured' }), { status: 503 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response(JSON.stringify({ error: 'No signature' }), { status: 400 });
  }

  const body = await req.text();
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const errMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', errMessage);
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 });
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Guardar evento
  await supabase.from('webhook_events').insert({
    source: 'stripe',
    event_type: event.type,
    event_id: event.id,
    payload: event.data.object,
  });
  
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const module = session.metadata?.module;

        // ===== VOIP SUBSCRIPTION CHECKOUT =====
        if (module === 'voip' && session.mode === 'subscription') {
          const organizationId = session.metadata?.organization_id;
          const voipPlanId = session.metadata?.voip_plan_id;
          const userId = session.metadata?.user_id || null;
          const billingCycle = (session.metadata?.billing_cycle as BillingCycle | undefined) || 'monthly';

          if (!organizationId || !voipPlanId || !session.customer || !session.subscription) break;

          // Ensure local stripe_customers row exists
          const customerId = session.customer.toString();
          const { data: existingCustomer } = await supabase
            .from('stripe_customers')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .single();

          let stripeCustomerRecordId = existingCustomer?.id as string | undefined;
          if (!stripeCustomerRecordId) {
            const { data: inserted } = await supabase
              .from('stripe_customers')
              .upsert(
                {
                  organization_id: organizationId,
                  stripe_customer_id: customerId,
                  metadata: { module: 'voip' },
                },
                { onConflict: 'stripe_customer_id' }
              )
              .select('id')
              .single();
            stripeCustomerRecordId = inserted?.id as string | undefined;
          }

          const subscription = await stripe.subscriptions.retrieve(session.subscription.toString());
          const priceId = subscription.items.data[0]?.price?.id;
          const unitAmount = subscription.items.data[0]?.price?.unit_amount ?? 0;

          if (!stripeCustomerRecordId || !priceId) break;

          // Upsert stripe_subscriptions (VoIP)
          const { data: stripeSub } = await supabase
            .from('stripe_subscriptions')
            .upsert(
              {
                organization_id: organizationId,
                stripe_customer_record_id: stripeCustomerRecordId,
                stripe_subscription_id: subscription.id,
                stripe_price_id: priceId,
                status: subscription.status,
                current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                cancel_at_period_end: subscription.cancel_at_period_end,
                amount_cents: unitAmount,
                currency: subscription.currency,
                stripe_metadata: subscription.metadata ?? {},
              },
              { onConflict: 'stripe_subscription_id' }
            )
            .select('*')
            .single();

          // Activate/update VoIP subscription
          const { data: plan } = await supabase
            .from('voip_pricing_plans')
            .select('included_minutes, name, code')
            .eq('id', voipPlanId)
            .single();

          const billingStart = isoDateOnly(subscription.current_period_start);
          const billingEnd = isoDateOnly(subscription.current_period_end);

          const { data: voipSub } = await supabase
            .from('voip_subscriptions')
            .upsert(
              {
                organization_id: organizationId,
                plan_id: voipPlanId,
                status: 'active',
                billing_cycle_start: billingStart,
                billing_cycle_end: billingEnd,
                minutes_used: 0,
                minutes_included: plan?.included_minutes ?? 0,
              },
              { onConflict: 'organization_id' }
            )
            .select('id')
            .single();

          if (stripeSub?.id && voipSub?.id) {
            await supabase
              .from('stripe_subscriptions')
              .update({ voip_subscription_id: voipSub.id })
              .eq('id', stripeSub.id);
          }

          try {
            await supabase.rpc('log_event', {
              p_event_type: 'subscription.created',
              p_title: `✅ Suscripción VoIP activada: ${plan?.name || voipPlanId}`,
              p_description: `Checkout completado (${billingCycle}).`,
              p_organization_id: organizationId,
              p_user_id: userId,
              p_event_data: {
                module: 'voip',
                voip_plan_id: voipPlanId,
                stripe_subscription_id: subscription.id,
                stripe_price_id: priceId,
                amount_cents: unitAmount,
                currency: subscription.currency,
                billing_cycle_start: billingStart,
                billing_cycle_end: billingEnd,
              },
              p_source: 'stripe',
              p_tags: ['voip', 'stripe', 'subscription', 'success'],
              p_related_entity_type: 'voip_subscription',
              p_related_entity_id: voipSub?.id ?? null,
            });
          } catch {
            // ignore
          }

          break;
        }

        // ===== EXISTING SAAS FLOW =====
        const organizationId = session.metadata?.organization_id;
        const planId = session.metadata?.plan_id;
        const billingCycle = session.metadata?.billing_cycle;
        
        if (organizationId && planId) {
          // Actualizar suscripción
          await supabase
            .from('subscriptions')
            .update({
              plan_id: planId,
              status: 'active',
              billing_cycle: billingCycle,
              stripe_subscription_id: session.subscription as string,
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(
                Date.now() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000
              ).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('organization_id', organizationId);
          
          // Registrar en historial
          await supabase.from('subscription_history').insert({
            organization_id: organizationId,
            event_type: 'upgraded',
            new_plan_id: planId,
            amount: session.amount_total ? session.amount_total / 100 : 0,
            currency: session.currency,
          });
        }
        break;
      }
      
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        // ===== VOIP PATH =====
        if (subscriptionId) {
          const { data: voipStripeSub } = await supabase
            .from('stripe_subscriptions')
            .select('id, organization_id, voip_subscription_id')
            .eq('stripe_subscription_id', subscriptionId)
            .single();

          if (voipStripeSub?.organization_id) {
            const orgId = voipStripeSub.organization_id as string;

            await supabase.from('stripe_invoices').upsert(
              {
                organization_id: orgId,
                stripe_subscription_record_id: voipStripeSub.id,
                stripe_invoice_id: invoice.id,
                stripe_charge_id: (invoice.charge as string) || null,
                stripe_payment_intent_id: (invoice.payment_intent as string) || null,
                invoice_number: invoice.number || null,
                subtotal_cents: invoice.subtotal,
                tax_cents: invoice.tax || 0,
                total_cents: invoice.total,
                amount_paid_cents: invoice.amount_paid,
                amount_due_cents: 0,
                currency: invoice.currency,
                status: 'paid',
                billing_reason: invoice.billing_reason || null,
                period_start: invoice.period_start
                  ? new Date(invoice.period_start * 1000).toISOString()
                  : null,
                period_end: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
                paid_at: new Date().toISOString(),
                invoice_pdf_url: invoice.invoice_pdf || null,
                hosted_invoice_url: invoice.hosted_invoice_url || null,
                attempt_count: invoice.attempt_count || 0,
                next_payment_attempt: invoice.next_payment_attempt
                  ? new Date(invoice.next_payment_attempt * 1000).toISOString()
                  : null,
                last_error_message: invoice.last_finalization_error?.message || null,
              },
              { onConflict: 'stripe_invoice_id' }
            );

            // Renewal resets minutes when cycle invoice
            if (invoice.billing_reason === 'subscription_cycle') {
              const linePeriod = invoice.lines?.data?.[0]?.period;
              if (linePeriod?.start && linePeriod?.end) {
                const { data: vsub } = await supabase
                  .from('voip_subscriptions')
                  .select('plan_id')
                  .eq('organization_id', orgId)
                  .single();

                const { data: plan } = await supabase
                  .from('voip_pricing_plans')
                  .select('included_minutes')
                  .eq('id', vsub?.plan_id)
                  .single();

                await supabase
                  .from('voip_subscriptions')
                  .update({
                    minutes_used: 0,
                    minutes_included: plan?.included_minutes ?? 0,
                    status: 'active',
                    billing_cycle_start: isoDateOnly(linePeriod.start),
                    billing_cycle_end: isoDateOnly(linePeriod.end),
                  })
                  .eq('organization_id', orgId);

                try {
                  await supabase.rpc('log_event', {
                    p_event_type: 'subscription.renewed',
                    p_title: `✅ Renovación VoIP: ${(invoice.amount_paid / 100).toFixed(2)}€`,
                    p_description: 'Renovación procesada y minutos reseteados.',
                    p_organization_id: orgId,
                    p_event_data: {
                      stripe_invoice_id: invoice.id,
                      invoice_number: invoice.number,
                      amount_cents: invoice.amount_paid,
                      period_start: linePeriod.start,
                      period_end: linePeriod.end,
                    },
                    p_source: 'stripe',
                    p_tags: ['voip', 'stripe', 'renewal'],
                  });
                } catch {
                  // ignore
                }
              }
            }

            break;
          }
        }
        
        // Buscar suscripción
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('organization_id')
          .eq('stripe_subscription_id', subscriptionId)
          .single();
        
        if (subscription) {
          // Registrar pago
          await supabase.from('payments').insert({
            organization_id: subscription.organization_id,
            stripe_invoice_id: invoice.id,
            amount: invoice.amount_paid / 100,
            currency: invoice.currency,
            status: 'succeeded',
            paid_at: new Date().toISOString(),
          });
          
          // Actualizar estado de suscripción
          const periodEnd = invoice.lines?.data?.[0]?.period?.end;
          if (periodEnd) {
            await supabase
              .from('subscriptions')
              .update({
                status: 'active',
                current_period_end: new Date(periodEnd * 1000).toISOString(),
              })
              .eq('stripe_subscription_id', subscriptionId);
          }
        }
        break;
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        // ===== VOIP PATH =====
        if (subscriptionId) {
          const { data: voipStripeSub } = await supabase
            .from('stripe_subscriptions')
            .select('id, organization_id')
            .eq('stripe_subscription_id', subscriptionId)
            .single();

          if (voipStripeSub?.organization_id) {
            const orgId = voipStripeSub.organization_id as string;

            await supabase.from('stripe_invoices').upsert(
              {
                organization_id: orgId,
                stripe_subscription_record_id: voipStripeSub.id,
                stripe_invoice_id: invoice.id,
                invoice_number: invoice.number || null,
                subtotal_cents: invoice.subtotal,
                tax_cents: invoice.tax || 0,
                total_cents: invoice.total,
                amount_paid_cents: invoice.amount_paid,
                amount_due_cents: invoice.amount_due,
                currency: invoice.currency,
                status: invoice.status || 'open',
                billing_reason: invoice.billing_reason || null,
                attempt_count: invoice.attempt_count || 0,
                next_payment_attempt: invoice.next_payment_attempt
                  ? new Date(invoice.next_payment_attempt * 1000).toISOString()
                  : null,
                last_error_message: invoice.last_finalization_error?.message || null,
                invoice_pdf_url: invoice.invoice_pdf || null,
                hosted_invoice_url: invoice.hosted_invoice_url || null,
                period_start: invoice.period_start
                  ? new Date(invoice.period_start * 1000).toISOString()
                  : null,
                period_end: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
              },
              { onConflict: 'stripe_invoice_id' }
            );

            await supabase.from('stripe_payment_attempts').insert({
              organization_id: orgId,
              amount_cents: invoice.amount_due,
              currency: invoice.currency,
              status: 'failed',
              error_message: invoice.last_finalization_error?.message || null,
            });

            await supabase
              .from('stripe_subscriptions')
              .update({ status: 'past_due' })
              .eq('stripe_subscription_id', subscriptionId);

            // Escalado: 3+ intentos => suspensión VoIP
            if ((invoice.attempt_count || 0) >= 3) {
              await supabase
                .from('voip_subscriptions')
                .update({ status: 'suspended' })
                .eq('organization_id', orgId);

              try {
                await supabase.rpc('log_event', {
                  p_event_type: 'subscription.suspended',
                  p_title: `🚨 VoIP suspendido (${invoice.attempt_count} fallos)`,
                  p_description: `Impago: ${(invoice.amount_due / 100).toFixed(2)}€`,
                  p_organization_id: orgId,
                  p_event_data: {
                    stripe_invoice_id: invoice.id,
                    amount_due_cents: invoice.amount_due,
                    attempt_count: invoice.attempt_count,
                  },
                  p_source: 'stripe',
                  p_tags: ['voip', 'stripe', 'payment_failed', 'suspended'],
                });
              } catch {
                // ignore
              }
            } else {
              await supabase
                .from('voip_subscriptions')
                .update({ status: 'past_due' })
                .eq('organization_id', orgId);

              try {
                await supabase.rpc('log_event', {
                  p_event_type: 'payment.invoice.failed',
                  p_title: `⚠️ Pago fallido VoIP (${invoice.attempt_count}/3)`,
                  p_description: `Importe: ${(invoice.amount_due / 100).toFixed(2)}€`,
                  p_organization_id: orgId,
                  p_event_data: {
                    stripe_invoice_id: invoice.id,
                    amount_due_cents: invoice.amount_due,
                    attempt_count: invoice.attempt_count,
                    next_payment_attempt: invoice.next_payment_attempt,
                  },
                  p_source: 'stripe',
                  p_tags: ['voip', 'stripe', 'payment_failed'],
                });
              } catch {
                // ignore
              }
            }

            break;
          }
        }
        
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('organization_id')
          .eq('stripe_subscription_id', subscriptionId)
          .single();
        
        if (subscription) {
          await supabase
            .from('subscriptions')
            .update({ status: 'past_due' })
            .eq('stripe_subscription_id', subscriptionId);
          
          await supabase.from('subscription_history').insert({
            organization_id: subscription.organization_id,
            event_type: 'payment_failed',
            metadata: { invoice_id: invoice.id },
          });
        }
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        // ===== VOIP PATH =====
        const { data: voipStripeSub } = await supabase
          .from('stripe_subscriptions')
          .select('organization_id')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (voipStripeSub?.organization_id) {
          const orgId = voipStripeSub.organization_id as string;

          await supabase
            .from('stripe_subscriptions')
            .update({ status: 'canceled', canceled_at: new Date().toISOString() })
            .eq('stripe_subscription_id', subscription.id);

          await supabase
            .from('voip_subscriptions')
            .update({ status: 'cancelled' })
            .eq('organization_id', orgId);

          try {
            await supabase.rpc('log_event', {
              p_event_type: 'subscription.cancelled',
              p_title: '❌ Suscripción VoIP cancelada',
              p_description: 'Stripe notificó cancelación.',
              p_organization_id: orgId,
              p_event_data: {
                stripe_subscription_id: subscription.id,
                cancellation_reason: subscription.cancellation_details?.reason,
              },
              p_source: 'stripe',
              p_tags: ['voip', 'stripe', 'cancelled'],
            });
          } catch {
            // ignore
          }

          break;
        }
        
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('organization_id, plan_id')
          .eq('stripe_subscription_id', subscription.id)
          .single();
        
        if (sub) {
          // Obtener plan free
          const { data: freePlan } = await supabase
            .from('subscription_plans')
            .select('id')
            .eq('code', 'free')
            .single();
          
          await supabase
            .from('subscriptions')
            .update({
              plan_id: freePlan?.id,
              status: 'canceled',
              canceled_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subscription.id);
          
          await supabase.from('subscription_history').insert({
            organization_id: sub.organization_id,
            event_type: 'canceled',
            previous_plan_id: sub.plan_id,
            new_plan_id: freePlan?.id,
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;

        // VOIP update if exists
        const { data: voipStripeSub } = await supabase
          .from('stripe_subscriptions')
          .select('id')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (voipStripeSub?.id) {
          await supabase
            .from('stripe_subscriptions')
            .update({
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
            })
            .eq('stripe_subscription_id', subscription.id);
          break;
        }

        // otherwise ignore here (SaaS flow handled elsewhere)
        break;
      }

      case 'payment_method.attached': {
        const pm = event.data.object as Stripe.PaymentMethod;
        if (!pm.customer) break;

        if (pm.type === 'card' && pm.card) {
          await supabase
            .from('stripe_customers')
            .update({
              default_payment_method_id: pm.id,
              metadata: {
                card_brand: pm.card.brand,
                card_last4: pm.card.last4,
                card_exp_month: pm.card.exp_month,
                card_exp_year: pm.card.exp_year,
              },
            })
            .eq('stripe_customer_id', pm.customer.toString());
        }
        break;
      }

      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute;

        try {
          await supabase.rpc('log_event', {
            p_event_type: 'payment.dispute.created',
            p_title: `🚨 Disputa Stripe: ${(dispute.amount / 100).toFixed(2)}€`,
            p_description: `Razón: ${dispute.reason}.`,
            p_event_data: {
              dispute_id: dispute.id,
              amount_cents: dispute.amount,
              reason: dispute.reason,
              charge_id: dispute.charge,
            },
            p_source: 'stripe',
            p_tags: ['stripe', 'dispute', 'urgent'],
          });
        } catch {
          // ignore
        }

        break;
      }
    }
    
    // Marcar evento como procesado
    await supabase
      .from('webhook_events')
      .update({ status: 'processed', processed_at: new Date().toISOString() })
      .eq('event_id', event.id);
    
    return new Response(JSON.stringify({ received: true }), { status: 200 });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    await supabase
      .from('webhook_events')
      .update({ status: 'failed', error_message: errorMessage })
      .eq('event_id', event.id);
    
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
});

