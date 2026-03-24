/**
 * syncMatterStatusToPipeline — When a matter's status changes,
 * automatically move the linked deal to the corresponding pipeline stage
 */
import { fromTable } from "@/lib/supabase";

export async function syncMatterStatusToPipeline(
  matterId: string,
  newStatus: string,
  orgId: string
) {
  try {
    // 1. Find linked deal
    const { data: deal, error: dealErr } = await fromTable("crm_deals")
      .select("id, pipeline_id, pipeline_stage_id, contact_id")
      .eq("matter_id", matterId)
      .eq("organization_id", orgId)
      .limit(1)
      .maybeSingle();

    if (dealErr || !deal || !deal.pipeline_id) return;

    // 2. Find stage with matching matter_status_trigger
    const { data: targetStage, error: stageErr } = await fromTable("crm_pipeline_stages")
      .select("id, name")
      .eq("pipeline_id", deal.pipeline_id)
      .eq("matter_status_trigger", newStatus)
      .limit(1)
      .maybeSingle();

    if (stageErr || !targetStage) return;
    if (deal.pipeline_stage_id === targetStage.id) return;

    // 3. Move deal
    await fromTable("crm_deals")
      .update({
        pipeline_stage_id: targetStage.id,
        stage: targetStage.name,
        stage_entered_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", deal.id);

    // 4. Log activity
    await fromTable("activities").insert({
      organization_id: orgId,
      contact_id: (deal as any).contact_id ?? null,
      deal_id: deal.id,
      matter_id: matterId,
      type: "note",
      subject: "Etapa actualizada automáticamente",
      content: `El expediente cambió a "${newStatus}". Pipeline actualizado a "${targetStage.name}"`,
    });
  } catch {
    // Don't block on sync errors
    console.error("[syncMatterStatusToPipeline] Error syncing");
  }
}
