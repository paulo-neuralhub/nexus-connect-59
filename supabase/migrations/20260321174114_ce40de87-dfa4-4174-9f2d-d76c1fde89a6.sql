-- Fix: add data_confidence to genius_knowledge_global and re-create function
ALTER TABLE genius_knowledge_global ADD COLUMN IF NOT EXISTS data_confidence text DEFAULT 'unverified';

-- Fix recalculate function (was already created, replacing)
CREATE OR REPLACE FUNCTION recalculate_genius_coverage(p_jurisdiction_code text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_chunks_stats record;
  v_doc_coverage record;
  v_raw_score integer := 0;
  v_effective_score integer;
  v_level text;
  v_quality_penalty boolean := false;
BEGIN
  SELECT
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE data_confidence = 'verified_official') as verified_official,
    COUNT(*) FILTER (WHERE data_confidence = 'verified_secondary') as verified_secondary,
    COUNT(*) FILTER (WHERE data_confidence = 'ai_researched') as ai_researched,
    COUNT(*) FILTER (WHERE data_confidence = 'unverified' OR data_confidence IS NULL) as unverified,
    COUNT(*) FILTER (WHERE last_verified_at < now() - interval '180 days' AND is_active = true) as outdated_count,
    MIN(last_verified_at) as oldest_verification
  INTO v_chunks_stats
  FROM genius_knowledge_global
  WHERE jurisdiction_code = p_jurisdiction_code AND is_active = true;

  SELECT
    CASE WHEN EXISTS(SELECT 1 FROM genius_knowledge_global WHERE jurisdiction_code = p_jurisdiction_code AND knowledge_type = 'deadline' AND is_active) THEN 35 ELSE 0 END as deadline_pts,
    CASE WHEN EXISTS(SELECT 1 FROM genius_knowledge_global WHERE jurisdiction_code = p_jurisdiction_code AND document_category = 'office_action' AND knowledge_type = 'template_structure' AND is_active) THEN 30 ELSE 0 END as oa_pts,
    CASE WHEN EXISTS(SELECT 1 FROM genius_knowledge_global WHERE jurisdiction_code = p_jurisdiction_code AND knowledge_type = 'legislation' AND is_active) THEN 20 ELSE 0 END as legislation_pts,
    CASE WHEN EXISTS(SELECT 1 FROM genius_knowledge_global WHERE jurisdiction_code = p_jurisdiction_code AND knowledge_type = 'fee_structure' AND is_active) THEN 10 ELSE 0 END as fees_pts,
    CASE WHEN EXISTS(SELECT 1 FROM genius_knowledge_global WHERE jurisdiction_code = p_jurisdiction_code AND knowledge_type = 'jurisprudence' AND is_active) THEN 5 ELSE 0 END as juris_pts,
    EXISTS(SELECT 1 FROM genius_knowledge_global WHERE jurisdiction_code = p_jurisdiction_code AND document_category = 'office_action' AND is_active) as has_oa,
    EXISTS(SELECT 1 FROM genius_knowledge_global WHERE jurisdiction_code = p_jurisdiction_code AND document_category = 'opposition' AND is_active) as has_opposition,
    EXISTS(SELECT 1 FROM genius_knowledge_global WHERE jurisdiction_code = p_jurisdiction_code AND document_category = 'license' AND is_active) as has_license,
    EXISTS(SELECT 1 FROM genius_knowledge_global WHERE jurisdiction_code = p_jurisdiction_code AND knowledge_type = 'deadline' AND is_active) as has_deadlines
  INTO v_doc_coverage;

  v_raw_score := LEAST(100, v_doc_coverage.deadline_pts + v_doc_coverage.oa_pts + v_doc_coverage.legislation_pts + v_doc_coverage.fees_pts + v_doc_coverage.juris_pts);

  IF v_chunks_stats.total > 0 AND v_chunks_stats.ai_researched::float / v_chunks_stats.total > 0.5 THEN
    v_quality_penalty := true;
    v_effective_score := ROUND(v_raw_score * 0.7);
  ELSE
    v_effective_score := v_raw_score;
  END IF;

  v_level := CASE
    WHEN v_effective_score >= 80 THEN 'complete'
    WHEN v_effective_score >= 40 THEN 'partial'
    WHEN v_effective_score > 0 THEN 'minimal'
    ELSE 'none'
  END;

  UPDATE genius_knowledge_coverage SET
    total_kb_chunks = v_chunks_stats.total,
    verified_official_chunks = v_chunks_stats.verified_official,
    verified_secondary_chunks = v_chunks_stats.verified_secondary,
    ai_researched_chunks = v_chunks_stats.ai_researched,
    unverified_chunks = v_chunks_stats.unverified,
    cov_oa_response = CASE WHEN v_doc_coverage.has_oa THEN 'partial' ELSE 'none' END,
    cov_opposition = CASE WHEN v_doc_coverage.has_opposition THEN 'partial' ELSE 'none' END,
    cov_license = CASE WHEN v_doc_coverage.has_license THEN 'partial' ELSE 'none' END,
    cov_deadlines = CASE WHEN v_doc_coverage.has_deadlines THEN 'complete' ELSE 'none' END,
    cov_legislation = CASE WHEN v_doc_coverage.legislation_pts > 0 THEN 'partial' ELSE 'none' END,
    coverage_score = v_raw_score,
    effective_score = v_effective_score,
    coverage_level = v_level,
    quality_penalty_applied = v_quality_penalty,
    has_outdated_content = COALESCE(v_chunks_stats.outdated_count, 0) > 0,
    outdated_since = CASE WHEN COALESCE(v_chunks_stats.outdated_count, 0) > 0 THEN v_chunks_stats.oldest_verification ELSE NULL END,
    last_kb_update = now(),
    updated_at = now()
  WHERE jurisdiction_code = p_jurisdiction_code;

  UPDATE ipo_offices SET
    genius_coverage_level = v_level,
    genius_coverage_score = v_effective_score,
    genius_kb_chunks = v_chunks_stats.total,
    genius_last_kb_update = now()
  WHERE code = p_jurisdiction_code;

  INSERT INTO genius_kb_update_log (jurisdiction_code, action, details)
  VALUES (p_jurisdiction_code, 'coverage_recalculated',
    jsonb_build_object('raw_score', v_raw_score, 'effective_score', v_effective_score, 'level', v_level, 'quality_penalty', v_quality_penalty, 'total_chunks', v_chunks_stats.total));
END;
$$;

-- Now seed data
UPDATE ipo_offices o SET
  opposition_period_days = sod.opposition_days,
  opposition_extensible = sod.is_extendable,
  opposition_max_extension_days = COALESCE(sod.max_extension_days, 0),
  opposition_legal_basis = sod.legal_notes,
  opposition_count_from = COALESCE(sod.count_from, 'publication'),
  last_data_verification = now()
FROM spider_opposition_deadlines sod
WHERE o.code = sod.jurisdiction_code;

UPDATE ipo_offices SET rep_requirement_type='licensed_attorney', rep_requirement_notes='US-licensed attorney required for non-US applicants (37 CFR 11.14, effective Aug 2019)', accepted_filing_languages=ARRAY['en'], use_requirement_years=5, renewal_period_years=10 WHERE code='US';
UPDATE ipo_offices SET rep_requirement_type='local_only', rep_requirement_notes='Non-EEA applicants must appoint EEA-resident representative (Art. 119 RMUE)', accepted_filing_languages=ARRAY['en','fr','de','es','it'], use_requirement_years=5, exam_type='substantive', renewal_period_years=10 WHERE code='EM';
UPDATE ipo_offices SET rep_requirement_type='none', accepted_filing_languages=ARRAY['es'], use_requirement_years=5, renewal_period_years=10 WHERE code='ES';
UPDATE ipo_offices SET rep_requirement_type='registered_agent', rep_requirement_notes='Licensed benrishi (patent attorney) required for foreign applicants', accepted_filing_languages=ARRAY['ja'], requires_translation=true, translation_requirements='Official Japanese translation required for all documents', use_requirement_years=3 WHERE code='JP';
UPDATE ipo_offices SET rep_requirement_type='registered_agent', rep_requirement_notes='Registered trademark agent required for foreign applicants (CNIPA rule)', accepted_filing_languages=ARRAY['zh'], requires_translation=true, use_requirement_years=3 WHERE code='CN';

UPDATE genius_knowledge_coverage SET supported_presentation_languages=ARRAY['en','es','fr','de','it'] WHERE jurisdiction_code='EM';
UPDATE genius_knowledge_coverage SET supported_presentation_languages=ARRAY['en'] WHERE jurisdiction_code='US';
UPDATE genius_knowledge_coverage SET supported_presentation_languages=ARRAY['es'] WHERE jurisdiction_code='ES';
UPDATE genius_knowledge_coverage SET supported_presentation_languages=ARRAY['en'], alerts=ARRAY['Translation to Japanese required before filing'] WHERE jurisdiction_code='JP';
UPDATE genius_knowledge_coverage SET supported_presentation_languages=ARRAY['en'], alerts=ARRAY['Translation to Chinese (Simplified) required before filing'] WHERE jurisdiction_code='CN';

-- Recalculate coverage
DO $$
DECLARE j_code text;
BEGIN
  FOR j_code IN SELECT DISTINCT jurisdiction_code FROM genius_knowledge_global WHERE jurisdiction_code IS NOT NULL AND is_active = true
  LOOP
    PERFORM recalculate_genius_coverage(j_code);
  END LOOP;
END $$;