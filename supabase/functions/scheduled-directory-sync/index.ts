import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STALE_DAYS = 90;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    console.log("Starting scheduled directory sync...");

    const { data: offices } = await supabase
      .from("ipo_offices")
      .select("id, name, code, flag_emoji, country_flag, region, updated_at, tm_estimated_registration_months");

    const allOffices = offices ?? [];
    const now = new Date();
    let upToDate = 0;
    const issues: any[] = [];

    for (const office of allOffices) {
      const missing: string[] = [];
      if (!(office as any).website_official) missing.push("Website");
      if (!(office as any).tm_estimated_registration_months) missing.push("Tiempo estimado");

      const daysSinceUpdate = office.updated_at
        ? Math.floor((now.getTime() - new Date(office.updated_at).getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      const isStale = daysSinceUpdate >= STALE_DAYS;
      const isIncomplete = missing.length >= 2;

      if (isStale || isIncomplete) {
        issues.push({
          name: office.name || office.code,
          code: office.code,
          type: isStale ? "stale" : "incomplete",
          detail: isStale ? `${daysSinceUpdate}d sin actualizar` : `Faltan: ${missing.join(", ")}`,
        });
      } else {
        upToDate++;
      }
    }

    // Log to ip_office_update_logs
    await supabase.from("ip_office_update_logs").insert({
      action: "sync",
      details: {
        offices_scanned: allOffices.length,
        issues_found: issues.length,
        up_to_date: upToDate,
        issues_summary: issues.slice(0, 50),
      },
      source: "scheduled",
    });

    const result = {
      success: true,
      scanned: allOffices.length,
      upToDate,
      issuesFound: issues.length,
      issues: issues.slice(0, 20),
    };

    console.log(`Sync complete: ${allOffices.length} offices, ${issues.length} issues found`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Sync error:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
