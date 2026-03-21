/**
 * genius-approve-research — KNOWLEDGE-01 Phase 2
 * Superadmin-only. Approves/rejects research chunks with atomic transaction.
 * Generates embeddings ONLY at approval time.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const openaiKey = Deno.env.get("OPENAI_API_KEY");

  // --- Auth ---
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer "))
    return json({ error: "Unauthorized" }, 401);

  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: authErr,
  } = await userClient.auth.getUser();
  if (authErr || !user) return json({ error: "Unauthorized" }, 401);

  // --- Superadmin check ---
  const adminClient = createClient(supabaseUrl, serviceKey);
  const { data: roleRow } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "super_admin")
    .maybeSingle();

  if (!roleRow) return json({ error: "Forbidden: super_admin required" }, 403);

  // --- Parse body ---
  const body = await req.json();
  const {
    queue_id,
    approved_chunk_indices = [],
    rejected_chunk_indices = [],
    approved_office_updates = {},
    reviewer_notes,
  } = body;

  if (!queue_id) return json({ error: "queue_id required" }, 400);

  // --- Fetch queue item ---
  const { data: queueItem, error: fetchErr } = await adminClient
    .from("genius_kb_update_queue")
    .select("*")
    .eq("id", queue_id)
    .single();

  if (fetchErr || !queueItem)
    return json({ error: "Queue item not found" }, 404);

  if (queueItem.status !== "in_review")
    return json(
      { error: `Cannot approve: status is '${queueItem.status}', expected 'in_review'` },
      409
    );

  const proposedChunks = (queueItem.proposed_chunks as any[]) || [];
  const jurisdictionCode = queueItem.jurisdiction_code;

  // --- Mark as processing ---
  await adminClient
    .from("genius_kb_update_queue")
    .update({ status: "processing", locked_by: user.id, locked_at: new Date().toISOString() })
    .eq("id", queue_id);

  // --- ATOMIC TRANSACTION via individual operations with rollback on failure ---
  const insertedChunkIds: string[] = [];
  let failed = false;
  let failureReason = "";

  try {
    // Step A: Insert approved chunks with embeddings
    for (const idx of approved_chunk_indices) {
      if (idx < 0 || idx >= proposedChunks.length) continue;
      const chunk = proposedChunks[idx];

      // Generate embedding
      let embedding: number[] | null = null;
      if (openaiKey && chunk.embedding_needed !== false) {
        try {
          const embResp = await fetch(
            "https://api.openai.com/v1/embeddings",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${openaiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "text-embedding-3-small",
                input: `${chunk.title}\n\n${chunk.content}`.slice(0, 8000),
              }),
            }
          );
          if (embResp.ok) {
            const embData = await embResp.json();
            embedding = embData.data?.[0]?.embedding || null;
          } else {
            console.warn(`Embedding failed for chunk ${idx}: ${embResp.status}`);
          }
        } catch (e) {
          console.warn(`Embedding error for chunk ${idx}:`, e);
        }
      }

      // Insert into genius_knowledge_global
      const { data: inserted, error: insertErr } = await adminClient
        .from("genius_knowledge_global")
        .insert({
          jurisdiction_code: jurisdictionCode,
          title: chunk.title,
          content: chunk.content,
          knowledge_type: chunk.knowledge_type || "procedure",
          document_category: chunk.document_category || null,
          article_reference: chunk.article_reference || null,
          source_name: chunk.source_name || "AI Research",
          source_url: chunk.source_url || null,
          data_confidence: "ai_researched",
          embedding: embedding,
          is_active: true,
          last_verified_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (insertErr) {
        throw new Error(`Failed to insert chunk ${idx}: ${insertErr.message}`);
      }

      insertedChunkIds.push(inserted.id);
    }

    // Step B: Update ipo_offices if there are approved updates
    if (Object.keys(approved_office_updates).length > 0) {
      const updatePayload: Record<string, any> = {
        ...approved_office_updates,
        data_confidence: "ai_researched",
        last_data_verification: new Date().toISOString(),
      };

      const { error: officeErr } = await adminClient
        .from("ipo_offices")
        .update(updatePayload)
        .eq("jurisdiction_code", jurisdictionCode);

      if (officeErr) {
        throw new Error(`Failed to update ipo_offices: ${officeErr.message}`);
      }
    }

    // Step C: Update queue item
    const { error: queueUpdateErr } = await adminClient
      .from("genius_kb_update_queue")
      .update({
        status: "completed",
        approved_chunk_ids: insertedChunkIds,
        rejected_chunk_count: rejected_chunk_indices.length,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        locked_by: null,
        lock_expires_at: null,
      })
      .eq("id", queue_id);

    if (queueUpdateErr) {
      throw new Error(`Failed to update queue: ${queueUpdateErr.message}`);
    }

    // Step D: Log
    await adminClient.from("genius_kb_update_log").insert({
      queue_id,
      jurisdiction_code: jurisdictionCode,
      action: "chunks_added",
      details: {
        approved_count: insertedChunkIds.length,
        rejected_count: rejected_chunk_indices.length,
        office_updates: Object.keys(approved_office_updates),
        reviewer_notes: reviewer_notes || null,
      },
      performed_by: user.id,
    });

    // Step E: Coverage recalculation is triggered by the DEFERRABLE trigger
    // on genius_knowledge_global, so it runs automatically after inserts.
  } catch (err) {
    failed = true;
    failureReason = String(err);
    console.error("Approval transaction failed:", err);

    // --- ROLLBACK: delete any inserted chunks ---
    if (insertedChunkIds.length > 0) {
      await adminClient
        .from("genius_knowledge_global")
        .delete()
        .in("id", insertedChunkIds);
    }

    // Reset queue status
    await adminClient
      .from("genius_kb_update_queue")
      .update({
        status: "in_review",
        processing_error: failureReason,
        locked_by: null,
      })
      .eq("id", queue_id);

    // Log failure
    await adminClient.from("genius_kb_update_log").insert({
      queue_id,
      jurisdiction_code: jurisdictionCode,
      action: "research_failed",
      details: { error: failureReason, rollback_chunks: insertedChunkIds.length },
      performed_by: user.id,
    });

    return json({ error: "Approval failed, rolled back", details: failureReason }, 500);
  }

  // --- Notify ---
  await adminClient.from("admin_notifications").insert({
    type: "genius_research",
    severity: "info",
    title: `Investigación aprobada: ${jurisdictionCode}`,
    message: `${insertedChunkIds.length} chunks aprobados, ${rejected_chunk_indices.length} rechazados para ${jurisdictionCode}.`,
    metadata: { queue_id, jurisdiction_code: jurisdictionCode },
  });

  return json({
    success: true,
    queue_id,
    jurisdiction_code: jurisdictionCode,
    chunks_approved: insertedChunkIds.length,
    chunks_rejected: rejected_chunk_indices.length,
    office_updates_applied: Object.keys(approved_office_updates).length,
    chunk_ids: insertedChunkIds,
  });
});

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
