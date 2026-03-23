import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verificar usuario
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Obtener org_id del usuario
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const workflowId = url.searchParams.get("workflow_id");

    // GET un workflow específico
    if (workflowId) {
      const { data: workflow, error } = await supabase
        .from("genius_workflow_runs")
        .select(`
          id, status, workflow_type, goal_text,
          plan_json, current_step, total_steps,
          results_json, approval_payload, error_message,
          trace_id, tokens_by_agent, cost_by_agent,
          quality_scores, started_at, completed_at,
          matter_id, client_id
        `)
        .eq("id", workflowId)
        .eq("organization_id", profile.organization_id)
        .single();

      if (error || !workflow) {
        return new Response(JSON.stringify({ error: "Workflow not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Calcular progreso porcentual
      const progress = workflow.total_steps > 0
        ? Math.round((workflow.current_step / workflow.total_steps) * 100)
        : 0;

      // Calcular tiempo transcurrido
      const elapsed = workflow.started_at
        ? Math.round((Date.now() - new Date(workflow.started_at).getTime()) / 1000)
        : 0;

      return new Response(JSON.stringify({
        ...workflow,
        progress,
        elapsed_seconds: elapsed,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET lista de workflows activos del usuario
    const { data: activeWorkflows } = await supabase
      .from("genius_workflow_runs")
      .select(`
        id, status, workflow_type, goal_text,
        current_step, total_steps, started_at,
        matter_id, error_message
      `)
      .eq("organization_id", profile.organization_id)
      .eq("user_id", user.id)
      .in("status", ["planning", "running", "paused", "approval_needed"])
      .order("started_at", { ascending: false })
      .limit(5);

    return new Response(JSON.stringify({
      active_workflows: activeWorkflows || [],
      count: activeWorkflows?.length || 0,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
