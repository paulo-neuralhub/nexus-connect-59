import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';
const PERPLEXITY_MODEL = 'sonar-pro';
const MAX_PHASE_RETRIES = 3;
const PHASE_FIELDS = [
  'phase_1_general', 'phase_2_trademarks', 'phase_3_fees',
  'phase_4_treaties', 'phase_5_digital', 'phase_6_requirements',
] as const;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const body = await req.json();
    const { action, queue_id, batch_size, priority_max, codes, dry_run } = body;

    // Handle batch codes request from IncrementalUpdateDialog
    if (codes && Array.isArray(codes)) {
      const results = [];
      for (const code of codes) {
        try {
          // Find or create queue item for this office code
          const { data: office } = await supabase
            .from('ipo_offices')
            .select('id, name')
            .eq('code', code)
            .single();

          if (!office) {
            results.push({ code, status: 'not_found', error: `Office ${code} not found` });
            continue;
          }

          // Check if queue item exists
          let { data: queueItem } = await supabase
            .from('ip_office_research_queue')
            .select('id, status')
            .eq('office_id', office.id)
            .maybeSingle();

          if (!queueItem) {
            // Create queue item
            const { data: newItem, error: insertErr } = await supabase
              .from('ip_office_research_queue')
              .insert({
                office_id: office.id,
                office_name: office.name,
                country_code: code,
                status: 'pending',
                priority: 3,
              })
              .select('id')
              .single();

            if (insertErr) {
              results.push({ code, status: 'error', error: insertErr.message });
              continue;
            }
            queueItem = newItem;
          } else if (queueItem.status === 'completed' || queueItem.status === 'partial') {
            // Reset for re-research
            await supabase.from('ip_office_research_queue').update({
              status: 'pending',
              phase_1_general: {}, phase_2_trademarks: {}, phase_3_fees: {},
              phase_4_treaties: {}, phase_5_digital: {}, phase_6_requirements: {},
              parsed_data: {}, total_tokens_used: 0, estimated_cost_usd: 0,
              auto_confidence_score: 0, research_started_at: null, research_completed_at: null,
            }).eq('id', queueItem!.id);
          }

          if (dry_run) {
            results.push({ code, office: office.name, status: 'queued', queue_id: queueItem!.id });
            continue;
          }

          // Research one phase
          const result = await researchNextPhase(supabase, queueItem!.id);
          results.push({ code, office: office.name, ...result });
        } catch (err) {
          results.push({ code, status: 'error', error: (err as Error).message });
        }
      }
      return jsonResponse({ processed: results.length, results });
    }

    if (action === 'research_phase' || action === 'research_single') {
      const result = await researchNextPhase(supabase, queue_id);
      return jsonResponse(result);
    }

    if (action === 'finalize') {
      const { data: item } = await supabase
        .from('ip_office_research_queue')
        .select('*')
        .eq('id', queue_id)
        .single();
      if (!item) return jsonResponse({ error: 'Not found' }, 404);
      const result = await finalizeOffice(supabase, queue_id, item);
      return jsonResponse(result);
    }

    if (action === 'research_batch') {
      const size = batch_size || 5;
      const maxPriority = priority_max || 5;

      const { data: queue } = await supabase
        .from('ip_office_research_queue')
        .select('*')
        .in('status', ['pending', 'researching'])
        .lte('priority', maxPriority)
        .order('priority', { ascending: true })
        .limit(size);

      if (!queue || queue.length === 0) return jsonResponse({ processed: 0, results: [] });

      const results = [];
      for (const item of queue) {
        try {
          const r = await researchNextPhase(supabase, item.id);
          results.push({ office: item.office_name, ...r });
        } catch (error) {
          results.push({ office: item.office_name, status: 'error', error: (error as Error).message });
        }
      }
      return jsonResponse({ processed: results.length, results });
    }

    if (action === 'incremental_sync') {
      const daysThreshold = 30;
      const scoreThreshold = 60;
      const bSize = batch_size || 10;

      const { data: stale } = await supabase
        .from('ip_office_research_queue')
        .select('*')
        .in('status', ['completed', 'partial'])
        .or(`auto_confidence_score.lt.${scoreThreshold},research_completed_at.lt.${new Date(Date.now() - daysThreshold * 86400000).toISOString()}`)
        .order('auto_confidence_score', { ascending: true })
        .limit(bSize);

      if (!stale || stale.length === 0) {
        return jsonResponse({ message: 'All offices up to date', refreshed: 0 });
      }

      for (const item of stale) {
        await supabase.from('ip_office_research_queue').update({
          status: 'pending',
          phase_1_general: {}, phase_2_trademarks: {}, phase_3_fees: {},
          phase_4_treaties: {}, phase_5_digital: {}, phase_6_requirements: {},
          parsed_data: {}, total_tokens_used: 0, estimated_cost_usd: 0,
          auto_confidence_score: 0, research_started_at: null, research_completed_at: null,
        }).eq('id', item.id);
      }

      return jsonResponse({ action: 'incremental_sync', refreshed: stale.length, message: `${stale.length} offices reset to pending` });
    }

    if (action === 'apply_data') {
      const { data } = await supabase.rpc('apply_research_data', { p_queue_id: queue_id });
      return jsonResponse(data);
    }

    if (action === 'retry_failed_phases') {
      const { data: item } = await supabase
        .from('ip_office_research_queue').select('*').eq('id', queue_id).single();
      if (!item) return jsonResponse({ error: 'Queue item not found' });

      const resetFields: Record<string, any> = {};
      let resetCount = 0;
      for (const field of PHASE_FIELDS) {
        const phaseData = (item as any)[field];
        if (phaseData?.status === 'error_permanent' || phaseData?.status === 'error' || phaseData?.status === 'parse_error') {
          resetFields[field] = {};
          resetCount++;
        }
      }

      if (resetCount === 0) return jsonResponse({ message: 'No failed phases to retry', reset: 0 });

      await supabase.from('ip_office_research_queue').update({
        ...resetFields,
        status: 'researching',
        updated_at: new Date().toISOString(),
      }).eq('id', queue_id);

      return jsonResponse({ message: `${resetCount} phases reset for retry`, reset: resetCount });
    }

    if (action === 'status') {
      const { data } = await supabase.from('ip_office_research_queue').select('status, priority');
      const stats = {
        total: data?.length || 0,
        pending: data?.filter((d: any) => d.status === 'pending').length || 0,
        researching: data?.filter((d: any) => d.status === 'researching').length || 0,
        completed: data?.filter((d: any) => d.status === 'completed').length || 0,
        partial: data?.filter((d: any) => d.status === 'partial').length || 0,
        failed: data?.filter((d: any) => d.status === 'failed').length || 0,
      };
      return jsonResponse(stats);
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Edge function error:', (error as Error).message);
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

function parseJsonSafe(content: string): any {
  let clean = content;
  clean = clean.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    clean = clean.substring(firstBrace, lastBrace + 1);
  }
  clean = clean.replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"');
  clean = clean.replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'");
  clean = clean.replace(/,\s*([}\]])/g, '$1');
  try { return JSON.parse(clean); } catch {
    clean = clean.replace(/[\x00-\x1F\x7F]/g, ' ');
    try { return JSON.parse(clean); } catch { return null; }
  }
}

async function getPerplexityKey(supabase: any): Promise<string> {
  const envKey = Deno.env.get('PERPLEXITY_API_KEY');
  if (envKey) return envKey;
  throw new Error('Perplexity API key not found');
}

async function callPerplexity(apiKey: string, systemPrompt: string, userPrompt: string): Promise<{ content: string; tokens: number; citations: string[] }> {
  const response = await fetch(PERPLEXITY_API_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: PERPLEXITY_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 4096,
    }),
  });

  const responseText = await response.text();
  if (!response.ok) {
    console.error(`Perplexity API error ${response.status}: ${responseText.slice(0, 300)}`);
    throw new Error(`Perplexity API returned ${response.status}: ${responseText.slice(0, 150)}`);
  }

  let result;
  try { result = JSON.parse(responseText); } catch {
    throw new Error('Perplexity API returned non-JSON response');
  }

  return {
    content: result.choices?.[0]?.message?.content || '{}',
    tokens: result.usage?.total_tokens || 0,
    citations: result.citations || [],
  };
}

async function researchNextPhase(supabase: any, queueId: string) {
  const { data: item } = await supabase
    .from('ip_office_research_queue').select('*').eq('id', queueId).single();
  if (!item) throw new Error('Queue item not found');

  const { data: officeData } = await supabase
    .from('ipo_offices').select('name').eq('id', item.office_id).single();
  const officeName = officeData?.name || item.office_name;
  const countryCode = item.country_code;

  const phaseBuilders = [buildPhase1, buildPhase2, buildPhase3, buildPhase4, buildPhase5, buildPhase6];
  const phaseNames = ['General', 'Trademarks', 'Fees', 'Treaties', 'Digital', 'Requirements'];

  let nextPhaseIndex = -1;
  for (let i = 0; i < PHASE_FIELDS.length; i++) {
    const phaseData = item[PHASE_FIELDS[i]];
    const status = phaseData?.status;
    const retryCount = phaseData?.retry_count || 0;
    if (!status || Object.keys(phaseData || {}).length === 0) { nextPhaseIndex = i; break; }
    if ((status === 'error' || status === 'parse_error') && retryCount < MAX_PHASE_RETRIES) { nextPhaseIndex = i; break; }
  }

  if (nextPhaseIndex === -1) {
    return await finalizeOffice(supabase, queueId, item);
  }

  if (item.status === 'pending') {
    await supabase.from('ip_office_research_queue')
      .update({ status: 'researching', research_started_at: new Date().toISOString() })
      .eq('id', queueId);
  }

  const field = PHASE_FIELDS[nextPhaseIndex];
  const phaseName = phaseNames[nextPhaseIndex];
  const existingPhaseData = item[field] || {};
  const currentRetryCount = existingPhaseData?.retry_count || 0;
  const prompt = phaseBuilders[nextPhaseIndex](officeName, countryCode);
  const systemPrompt = 'You are an IP (Intellectual Property) expert researcher with access to real-time web data. Return ONLY valid JSON responses. No markdown, no explanation, no code blocks. Just pure JSON.';

  const perplexityKey = await getPerplexityKey(supabase);

  try {
    const { content, tokens, citations } = await callPerplexity(perplexityKey, systemPrompt, prompt);
    const parsed = parseJsonSafe(content);

    if (parsed === null) {
      const newRetryCount = currentRetryCount + 1;
      const isPermanent = newRetryCount >= MAX_PHASE_RETRIES;
      const costPerTokenErr = 0.000005;
      const phaseCostErr = tokens * costPerTokenErr;

      await supabase.from('ip_office_research_queue').update({
        [field]: { status: isPermanent ? 'error_permanent' : 'parse_error', error: 'Failed to parse JSON response after cleanup', raw_content: content.slice(0, 500), retry_count: newRetryCount, tokens_used: tokens, researched_at: new Date().toISOString() },
        total_tokens_used: (item.total_tokens_used || 0) + tokens,
        total_queries_made: (item.total_queries_made || 0) + 1,
        estimated_cost_usd: (item.estimated_cost_usd || 0) + phaseCostErr,
        updated_at: new Date().toISOString(),
      }).eq('id', queueId);

      const allDone = checkAllPhasesFinal(item, field, isPermanent ? 'error_permanent' : 'parse_error');
      return { status: allDone ? 'finalizing' : 'in_progress', phase_completed: phaseName, phase_index: nextPhaseIndex + 1, total_phases: 6, tokens_used: tokens, office: officeName, done: allDone, phase_error: 'JSON parse failed', retry_count: newRetryCount };
    }

    if (citations.length > 0) parsed._sources = citations;

    const costPerToken = 0.000005;
    const phaseCost = tokens * costPerToken;

    await supabase.from('ip_office_research_queue').update({
      [field]: { status: 'completed', data: parsed, tokens_used: tokens, sources: citations, retry_count: currentRetryCount, researched_at: new Date().toISOString() },
      total_tokens_used: (item.total_tokens_used || 0) + tokens,
      total_queries_made: (item.total_queries_made || 0) + 1,
      estimated_cost_usd: (item.estimated_cost_usd || 0) + phaseCost,
      updated_at: new Date().toISOString(),
    }).eq('id', queueId);

    const allDone = checkAllPhasesFinal(item, field, 'completed');
    return { status: allDone ? 'finalizing' : 'in_progress', phase_completed: phaseName, phase_index: nextPhaseIndex + 1, total_phases: 6, tokens_used: tokens, office: officeName, done: allDone };
  } catch (error) {
    console.error(`[${officeName}] Phase ${phaseName} failed:`, (error as Error).message);
    const newRetryCount = currentRetryCount + 1;
    const isPermanent = newRetryCount >= MAX_PHASE_RETRIES;

    await supabase.from('ip_office_research_queue').update({
      [field]: { status: isPermanent ? 'error_permanent' : 'error', error: (error as Error).message, retry_count: newRetryCount, researched_at: new Date().toISOString() },
      updated_at: new Date().toISOString(),
    }).eq('id', queueId);

    const allDone = checkAllPhasesFinal(item, field, isPermanent ? 'error_permanent' : 'error');
    return { status: allDone ? 'finalizing' : 'in_progress', phase_completed: phaseName, phase_index: nextPhaseIndex + 1, total_phases: 6, tokens_used: 0, office: officeName, done: allDone, phase_error: (error as Error).message, retry_count: newRetryCount };
  }
}

function checkAllPhasesFinal(item: any, updatedField: string, newStatus: string): boolean {
  const finalStatuses = ['completed', 'error_permanent'];
  for (const field of PHASE_FIELDS) {
    if (field === updatedField) { if (!finalStatuses.includes(newStatus)) return false; continue; }
    const phaseData = item[field];
    const status = phaseData?.status;
    if (!status || !finalStatuses.includes(status)) return false;
  }
  return true;
}

async function finalizeOffice(supabase: any, queueId: string, item: any) {
  let allParsedData: any = {};
  let completedCount = 0;
  let errorCount = 0;

  for (const field of PHASE_FIELDS) {
    const phaseData = item[field];
    if (phaseData?.status === 'completed' && phaseData.data) {
      completedCount++;
      const parsed = { ...phaseData.data };
      delete parsed._sources;
      if (parsed.fees) { allParsedData.fees = [...(allParsedData.fees || []), ...parsed.fees]; delete parsed.fees; }
      if (parsed.treaties) { allParsedData.treaties = [...(allParsedData.treaties || []), ...parsed.treaties]; delete parsed.treaties; }
      if (parsed.treaty_summary) { allParsedData = { ...allParsedData, ...parsed.treaty_summary }; delete parsed.treaty_summary; }
      allParsedData = { ...allParsedData, ...parsed };
    } else if (phaseData?.status === 'error' || phaseData?.status === 'parse_error' || phaseData?.status === 'error_permanent') {
      errorCount++;
    }
  }

  let finalStatus = 'completed';
  let needsReview = false;
  if (errorCount > 0 && completedCount === 0) { finalStatus = 'failed'; needsReview = true; }
  else if (errorCount > 0) { finalStatus = 'partial'; needsReview = true; }

  const confidenceScore = Math.round((completedCount / PHASE_FIELDS.length) * 100);

  await supabase.from('ip_office_research_queue').update({
    status: finalStatus,
    parsed_data: allParsedData,
    auto_confidence_score: confidenceScore,
    needs_human_review: needsReview,
    research_completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    review_notes: errorCount > 0 ? `${completedCount}/6 fases completadas, ${errorCount}/6 con error` : null,
  }).eq('id', queueId);

  if (completedCount > 0) {
    try {
      const { data: applyResult, error: applyError } = await supabase.rpc('apply_research_data', { p_queue_id: queueId });
      if (applyError) {
        console.error('apply_research_data error:', applyError);
        return { status: finalStatus, office: item.office_name, done: true, completed_phases: completedCount, error_phases: errorCount, apply_error: applyError.message };
      }
      return { status: finalStatus, office: item.office_name, done: true, completed_phases: completedCount, error_phases: errorCount, apply_result: applyResult };
    } catch (e) {
      console.error('apply_research_data exception:', e);
      return { status: finalStatus, office: item.office_name, done: true, completed_phases: completedCount, error_phases: errorCount, apply_error: (e as Error).message };
    }
  }

  return { status: finalStatus, office: item.office_name, done: true, completed_phases: completedCount, error_phases: errorCount };
}

// === Prompt builders (6 phases) ===

function buildPhase1(office: string, code: string): string {
  return `RESEARCH: General information about the intellectual property office "${office}" (country/org code: ${code}).
Search the web for the most current and accurate data. Provide comprehensive JSON with: official_name_local, official_name_english, acronym, office_type (national/regional/international), parent_organization, established_year, phone_main, phone_international, email_general, email_trademarks, physical_address, city, latitude, longitude, website_main, website_trademarks, website_efiling, website_search, website_fees, timezone, office_hours (as object with mon_fri/sat/sun), official_languages (ISO 639-1 array), filing_languages (array). Return ONLY valid JSON.`;
}

function buildPhase2(office: string, code: string): string {
  return `RESEARCH: Trademark registration process at "${office}" (${code}).
Search the web for current official procedures. Provide JSON with: handles_trademarks, handles_patents, handles_designs, handles_utility_models, handles_copyrights, handles_geographical_indications, requires_local_agent (boolean), agent_requirement_type (always/non_resident/refusal_only/never), agent_requirement_details (detailed explanation for foreign applicants), power_of_attorney_required, tm_filing_methods (array: online/paper/madrid), tm_online_filing_system, tm_online_filing_url, tm_search_database, tm_search_url, tm_classification_system (nice/nice_custom/custom), tm_multi_class, tm_use_requirement, tm_use_requirement_details, tm_opposition_period_days, tm_opposition_extendable, tm_registration_duration_years, tm_renewal_period_years, tm_grace_period_months, tm_estimated_registration_months, tm_examination_months, tm_priority_claim_months, tm_types_accepted (array from: word/figurative/combined/3d/sound/color/motion/hologram/position/pattern/scent). Return ONLY valid JSON.`;
}

function buildPhase3(office: string, code: string): string {
  return `RESEARCH: ALL official government fees at "${office}" (${code}) for trademarks, patents and designs.
Search the official website and WIPO sources for current fee schedules. Provide JSON with "fees" array. Each fee object: ip_type (trademark/patent/design), service_category (filing/examination/registration/renewal/opposition/cancellation/assignment/appeal/certified_copy), service_name, fee_amount (number, local currency), fee_currency, fee_amount_eur (EUR equivalent number), fee_type (per_class/fixed/tiered), fee_per_additional (number or null), fee_base_includes (integer), online_discount_pct (number), source_url, notes. Include ALL available trademark fees. Return ONLY valid JSON.`;
}

function buildPhase4(office: string, code: string): string {
  return `RESEARCH: International IP treaties that "${office}" (${code}) has signed/ratified.
Search WIPO and official sources. Check: Madrid Protocol, Paris Convention, TRIPS, Nice Agreement, Vienna Agreement, Singapore Treaty, Trademark Law Treaty, Hague Agreement, PCT, Lisbon Agreement, Berne Convention.
Provide JSON with "treaties" array (treaty_name, treaty_full_name, member (boolean), member_since (date string YYYY-MM-DD or null), status (active/signed_not_ratified/denounced)) AND "treaty_summary" object with boolean flags: madrid_protocol_member, paris_convention_member, trips_member, nice_agreement_member, vienna_agreement_member, singapore_treaty_member, hague_agreement_member, pct_member. Return ONLY valid JSON.`;
}

function buildPhase5(office: string, code: string): string {
  return `RESEARCH: Digital capabilities and automation infrastructure at "${office}" (${code}).
Search for current digital services and e-filing systems. Provide JSON with: has_api (boolean), api_type (rest/soap/none), api_url, api_documentation_url, api_authentication (api_key/oauth2/open/none), api_cost (free/paid/none), has_bulk_data, efiling_available, efiling_mandatory, efiling_system_name, accepts_electronic_signatures, has_online_payment, payment_methods (array: credit_card/bank_transfer/deposit_account/paypal), has_online_search, has_online_status_tracking, digital_maturity_score (1-10 integer), automation_capability (high/medium/low/none), automation_notes. Return ONLY valid JSON.`;
}

function buildPhase6(office: string, code: string): string {
  return `RESEARCH: Business context for trademark filing at "${office}" (${code}).
Search for practical filing guidance and known issues. Provide JSON with: examination_approach (ex_officio_absolute_and_relative/ex_officio_absolute_only/no_examination), special_requirements (array of strings), common_pitfalls (array of strings), enforcement_environment (strong/moderate/weak), business_recommendations (string with strategic advice). Return ONLY valid JSON.`;
}
