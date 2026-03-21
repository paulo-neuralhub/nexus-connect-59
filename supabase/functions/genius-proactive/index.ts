import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");

  try {
    const db = createClient(supabaseUrl, supabaseServiceKey);

    // Get all tenants with proactive analysis enabled
    const { data: tenants } = await db
      .from("genius_tenant_config")
      .select("organization_id")
      .eq("is_active", true)
      .eq("disclaimer_accepted", true)
      .eq("feature_proactive_analysis", true);

    if (!tenants?.length) {
      return new Response(
        JSON.stringify({ message: "No tenants with proactive analysis", processed: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let processed = 0;
    const results: { org_id: string; suggestions: number; error?: string }[] = [];

    for (const tenant of tenants) {
      const orgId = tenant.organization_id;

      try {
        // Check existing recent proactive suggestions (avoid duplicates)
        const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
        const { data: recentSuggestions } = await db
          .from("genius_messages")
          .select("content")
          .eq("organization_id", orgId)
          .eq("content_type", "proactive")
          .eq("action_status", "pending")
          .gte("created_at", sevenDaysAgo);

        const existingTopics = new Set(
          (recentSuggestions || []).map((s: any) => s.content?.slice(0, 50))
        );

        // ── Analysis 1: Renewals without deal (next 90 days) ──
        const in90Days = new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0];
        const { data: expiringMatters } = await db
          .from("matters")
          .select("id, reference, title, expiry_date")
          .eq("organization_id", orgId)
          .eq("status", "registered")
          .lte("expiry_date", in90Days)
          .gte("expiry_date", new Date().toISOString().split("T")[0])
          .limit(10);

        // ── Analysis 2: Marks without Spider watch ──
        const { data: trademarks } = await db
          .from("matters")
          .select("id, reference, title")
          .eq("organization_id", orgId)
          .eq("type", "trademark")
          .in("status", ["registered", "granted"])
          .limit(20);

        let unwatchedCount = 0;
        if (trademarks?.length) {
          const matterIds = trademarks.map((m: any) => m.id);
          const { data: watches } = await db
            .from("spider_watches")
            .select("id")
            .eq("organization_id", orgId)
            .in("matter_id", matterIds);
          const watchedMatterIds = new Set((watches || []).map((w: any) => w.id));
          unwatchedCount = matterIds.filter((id: string) => !watchedMatterIds.has(id)).length;
        }

        // ── Analysis 3: Risk of non-use (EUIPO 5-year rule) ──
        const fourYearsAgo = new Date(Date.now() - 4 * 365 * 86400000).toISOString().split("T")[0];
        const { data: oldRegistrations } = await db
          .from("matters")
          .select("id, reference, title, filing_date")
          .eq("organization_id", orgId)
          .eq("type", "trademark")
          .eq("status", "registered")
          .lte("filing_date", fourYearsAgo)
          .limit(10);

        // ── Build suggestions ───────────────────────
        const suggestions: { content: string; priority: string; action?: string; data?: any }[] = [];

        if (expiringMatters?.length) {
          const content = `🔴 ${expiringMatters.length} marca(s) vencen en los próximos 90 días: ${expiringMatters
            .slice(0, 3)
            .map((m: any) => `${m.reference} (${m.expiry_date})`)
            .join(", ")}`;
          if (!existingTopics.has(content.slice(0, 50))) {
            suggestions.push({
              content,
              priority: "high",
              action: "add_deadline",
              data: { matter_ids: expiringMatters.map((m: any) => m.id) },
            });
          }
        }

        if (unwatchedCount > 0) {
          const content = `🟡 ${unwatchedCount} marca(s) registrada(s) sin vigilancia Spider activa. Riesgo de infracción no detectada.`;
          if (!existingTopics.has(content.slice(0, 50))) {
            suggestions.push({
              content,
              priority: "medium",
              action: "activate_spider_watch",
            });
          }
        }

        if (oldRegistrations?.length) {
          const content = `🟡 ${oldRegistrations.length} marca(s) con >4 años sin uso acreditado documentado. En EUIPO, 5 años sin uso = vulnerable a cancelación (Art. 58 RMUE).`;
          if (!existingTopics.has(content.slice(0, 50))) {
            suggestions.push({ content, priority: "medium" });
          }
        }

        // Limit to 5 suggestions per day
        const toInsert = suggestions.slice(0, 5);

        // Create a proactive conversation or find existing
        let convId: string | null = null;
        if (toInsert.length) {
          const { data: existingConv } = await db
            .from("genius_conversations")
            .select("id")
            .eq("organization_id", orgId)
            .eq("context_type", "general")
            .eq("status", "active")
            .like("title", "Análisis proactivo%")
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          if (existingConv) {
            convId = existingConv.id;
          } else {
            // Get first user of org for conversation
            const { data: orgUser } = await db
              .from("profiles")
              .select("id")
              .eq("organization_id", orgId)
              .limit(1)
              .single();

            if (orgUser) {
              const { data: newConv } = await db
                .from("genius_conversations")
                .insert({
                  organization_id: orgId,
                  user_id: orgUser.id,
                  context_type: "general",
                  title: `Análisis proactivo — ${new Date().toISOString().split("T")[0]}`,
                  status: "active",
                })
                .select("id")
                .single();
              convId = newConv?.id || null;
            }
          }

          if (convId) {
            for (const suggestion of toInsert) {
              await db.from("genius_messages").insert({
                organization_id: orgId,
                conversation_id: convId,
                role: "assistant",
                content: suggestion.content,
                content_type: "proactive",
                proposed_action: suggestion.action || null,
                action_data: suggestion.data || null,
                action_status: suggestion.action ? "pending" : null,
              });
            }
          }
        }

        results.push({ org_id: orgId, suggestions: toInsert.length });
        processed++;
      } catch (tenantErr) {
        console.error(`Proactive error for org ${orgId}:`, tenantErr);
        results.push({
          org_id: orgId,
          suggestions: 0,
          error: tenantErr instanceof Error ? tenantErr.message : "Unknown",
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: `Processed ${processed}/${tenants.length} tenants`,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("genius-proactive error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
