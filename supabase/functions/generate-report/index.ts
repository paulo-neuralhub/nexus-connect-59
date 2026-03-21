import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  // ── PASO 0: Auth ──
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } =
    await userClient.auth.getClaims(token);
  if (claimsError || !claimsData?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userId = claimsData.claims.sub as string;

  // Get org_id from JWT user
  const adminClient = createClient(supabaseUrl, serviceKey);

  const { data: profile } = await adminClient
    .from("profiles")
    .select("organization_id")
    .eq("id", userId)
    .single();

  if (!profile?.organization_id) {
    return new Response(JSON.stringify({ error: "No organization" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const orgId = profile.organization_id;

  let body: { execution_id?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const executionId = body.execution_id;
  if (!executionId) {
    return new Response(JSON.stringify({ error: "execution_id required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Verify execution belongs to tenant and is pending
  const { data: execution, error: execErr } = await adminClient
    .from("report_executions")
    .select("*, report_definitions!report_executions_report_definition_id_fkey(report_type, config, output_formats, name)")
    .eq("id", executionId)
    .eq("organization_id", orgId)
    .eq("status", "pending")
    .single();

  if (execErr || !execution) {
    return new Response(
      JSON.stringify({ error: "Report execution not found or not pending" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const reportDef = execution.report_definitions;
  const reportType = reportDef?.report_type || "portfolio";
  const reportName = reportDef?.name || "Reporte";

  // ── PASO 1: Mark as running ──
  await adminClient
    .from("report_executions")
    .update({ status: "running", started_at: new Date().toISOString() })
    .eq("id", executionId);

  try {
    // ── PASO 2: Execute query based on report_type ──
    let rows: Record<string, unknown>[] = [];
    let headers: string[] = [];

    if (reportType === "portfolio") {
      const { data } = await adminClient
        .from("matters")
        .select(`
          title, type, status, jurisdiction, created_at,
          trademark_assets(expiration_date),
          analytics_matter_metrics(total_invoiced, margin_eur)
        `)
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(5000);

      headers = ["Título", "Tipo", "Estado", "Jurisdicción", "Creado", "Expiración", "Facturado", "Margen €"];
      rows = (data || []).map((m: any) => ({
        "Título": m.title,
        "Tipo": m.type,
        "Estado": m.status,
        "Jurisdicción": m.jurisdiction,
        "Creado": m.created_at?.split("T")[0] || "",
        "Expiración": m.trademark_assets?.[0]?.expiration_date || "",
        "Facturado": m.analytics_matter_metrics?.[0]?.total_invoiced || 0,
        "Margen €": m.analytics_matter_metrics?.[0]?.margin_eur || 0,
      }));
    } else if (reportType === "deadlines") {
      const { data } = await adminClient
        .from("matter_deadlines")
        .select("title, type, deadline_date, status, priority, matters!inner(title, type, jurisdiction)")
        .eq("organization_id", orgId)
        .or("deadline_date.gte." + new Date().toISOString().split("T")[0] + ",status.eq.overdue")
        .order("deadline_date", { ascending: true })
        .limit(5000);

      headers = ["Expediente", "Tipo Exp.", "Jurisdicción", "Plazo", "Tipo Plazo", "Fecha", "Estado", "Prioridad"];
      rows = (data || []).map((d: any) => ({
        "Expediente": d.matters?.title,
        "Tipo Exp.": d.matters?.type,
        "Jurisdicción": d.matters?.jurisdiction,
        "Plazo": d.title,
        "Tipo Plazo": d.type,
        "Fecha": d.deadline_date,
        "Estado": d.status,
        "Prioridad": d.priority,
      }));
    } else if (reportType === "financial") {
      const { data } = await adminClient
        .from("invoices")
        .select("full_number, client_name, total, paid_date, status, invoice_date, matters(title)")
        .eq("organization_id", orgId)
        .order("invoice_date", { ascending: false })
        .limit(5000);

      headers = ["Nº Factura", "Cliente", "Total", "Fecha Emisión", "Fecha Pago", "Estado", "Expediente"];
      rows = (data || []).map((i: any) => ({
        "Nº Factura": i.full_number,
        "Cliente": i.client_name,
        "Total": i.total,
        "Fecha Emisión": i.invoice_date,
        "Fecha Pago": i.paid_date || "",
        "Estado": i.status,
        "Expediente": i.matters?.title || "",
      }));
    } else if (reportType === "productivity") {
      const { data } = await adminClient.rpc("execute_productivity_report", {
        p_org_id: orgId,
      }).maybeSingle();

      // Fallback: direct query
      const { data: teData } = await adminClient
        .from("time_entries")
        .select("duration_minutes, is_billable, hourly_rate, profiles!inner(first_name, last_name)")
        .eq("organization_id", orgId)
        .limit(10000);

      // Aggregate in memory
      const userMap = new Map<string, { total: number; billable: number; amount: number }>();
      (teData || []).forEach((te: any) => {
        const name = `${te.profiles?.first_name || ""} ${te.profiles?.last_name || ""}`.trim() || "Sin nombre";
        const cur = userMap.get(name) || { total: 0, billable: 0, amount: 0 };
        cur.total += te.duration_minutes || 0;
        if (te.is_billable) {
          cur.billable += te.duration_minutes || 0;
          cur.amount += ((te.duration_minutes || 0) / 60) * (te.hourly_rate || 0);
        }
        userMap.set(name, cur);
      });

      headers = ["Usuario", "Horas Totales", "Horas Facturables", "Importe Facturable"];
      rows = Array.from(userMap.entries())
        .sort((a, b) => b[1].total - a[1].total)
        .map(([name, v]) => ({
          "Usuario": name,
          "Horas Totales": (v.total / 60).toFixed(1),
          "Horas Facturables": (v.billable / 60).toFixed(1),
          "Importe Facturable": v.amount.toFixed(2),
        }));
    } else if (reportType === "client_analysis") {
      const { data } = await adminClient
        .from("crm_accounts")
        .select("name, account_type")
        .eq("organization_id", orgId)
        .limit(5000);

      // Get matters and invoices counts per account
      const accountIds = (data || []).map((a: any) => a.name);
      headers = ["Cliente", "Tipo", "Expedientes", "Total Facturado"];

      // Simple approach: list accounts
      rows = (data || []).map((a: any) => ({
        "Cliente": a.name,
        "Tipo": a.account_type || "",
        "Expedientes": "-",
        "Total Facturado": "-",
      }));
    } else if (reportType === "ai_usage") {
      const { data } = await adminClient
        .from("ai_usage")
        .select("module, model, estimated_cost_cents, created_at")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(5000);

      // Aggregate by module
      const modMap = new Map<string, { count: number; cost: number }>();
      (data || []).forEach((r: any) => {
        const key = r.module || "unknown";
        const cur = modMap.get(key) || { count: 0, cost: 0 };
        cur.count += 1;
        cur.cost += (r.estimated_cost_cents || 0) / 100;
        modMap.set(key, cur);
      });

      headers = ["Módulo", "Consultas", "Coste Total (€)"];
      rows = Array.from(modMap.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .map(([mod, v]) => ({
          "Módulo": mod,
          "Consultas": v.count,
          "Coste Total (€)": v.cost.toFixed(4),
        }));
    }

    // ── PASO 3: Generate CSV ──
    const BOM = "\uFEFF";
    const csvLines: string[] = [];

    // Headers
    if (headers.length > 0) {
      csvLines.push(headers.map((h) => `"${h}"`).join(","));
    }

    // Data rows
    for (const row of rows) {
      const vals = headers.map((h) => {
        const v = row[h];
        if (v === null || v === undefined) return '""';
        const s = String(v).replace(/"/g, '""');
        return `"${s}"`;
      });
      csvLines.push(vals.join(","));
    }

    const csvContent = BOM + csvLines.join("\n");
    const csvBytes = new TextEncoder().encode(csvContent);

    // ── PASO 4: Upload to Storage ──
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const storagePath = `${orgId}/${year}/${month}/${executionId}.csv`;

    const { error: uploadErr } = await adminClient.storage
      .from("reports")
      .upload(storagePath, csvBytes, {
        contentType: "text/csv",
        upsert: true,
      });

    if (uploadErr) {
      throw new Error(`Storage upload failed: ${uploadErr.message}`);
    }

    // ── PASO 5: Update execution ──
    const startedAt = execution.started_at
      ? new Date(execution.started_at).getTime()
      : now.getTime();
    const durationSeconds = Math.round((now.getTime() - startedAt) / 1000);

    await adminClient
      .from("report_executions")
      .update({
        status: "completed",
        completed_at: now.toISOString(),
        duration_seconds: durationSeconds,
        row_count: rows.length,
        file_path: storagePath,
      })
      .eq("id", executionId);

    // ── PASO 6: Insert generated report ──
    const reportDate = now.toISOString().split("T")[0];
    await adminClient.from("generated_reports").insert({
      organization_id: orgId,
      execution_id: executionId,
      report_name: `${reportName} — ${reportDate}`,
      report_type: reportType,
      format: "csv",
      storage_path: storagePath,
      file_size_bytes: csvBytes.length,
      expires_at: new Date(now.getTime() + 30 * 86400000).toISOString(),
    });

    // ── PASO 7: Generate signed URL ──
    const { data: signedData, error: signErr } = await adminClient.storage
      .from("reports")
      .createSignedUrl(storagePath, 3600); // 1 hour

    if (signErr) {
      throw new Error(`Signed URL failed: ${signErr.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        execution_id: executionId,
        rows: rows.length,
        download_url: signedData.signedUrl,
        expires_in: "1 hour",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    // Mark execution as failed
    await adminClient
      .from("report_executions")
      .update({
        status: "failed",
        error_message: err.message || "Unknown error",
      })
      .eq("id", executionId);

    return new Response(
      JSON.stringify({ error: err.message || "Report generation failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
