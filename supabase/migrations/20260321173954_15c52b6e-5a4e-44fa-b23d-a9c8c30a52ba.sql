-- =============================================
-- KNOWLEDGE-01 PHASE 1D — Functions, trigger, genius_check_coverage RPC
-- =============================================

-- recalculate_genius_coverage
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
    COUNT(*) FILTER (WHERE data_confidence = 'unverified') as unverified,
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

-- Trigger function
CREATE OR REPLACE FUNCTION trigger_recalculate_coverage()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.jurisdiction_code IS NOT NULL THEN
      PERFORM recalculate_genius_coverage(NEW.jurisdiction_code);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.jurisdiction_code IS NOT NULL THEN
      PERFORM recalculate_genius_coverage(OLD.jurisdiction_code);
    END IF;
    RETURN OLD;
  END IF;
END;
$$;

-- DEFERRABLE constraint trigger
DROP TRIGGER IF EXISTS genius_knowledge_coverage_update ON genius_knowledge_global;
CREATE CONSTRAINT TRIGGER genius_knowledge_coverage_update
AFTER INSERT OR UPDATE OR DELETE ON genius_knowledge_global
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION trigger_recalculate_coverage();

-- genius_check_coverage RPC
CREATE OR REPLACE FUNCTION genius_check_coverage(
  p_jurisdiction_code text,
  p_document_type text DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_coverage genius_knowledge_coverage%ROWTYPE;
  v_office ipo_offices%ROWTYPE;
  v_can_respond boolean;
  v_warnings text[] := '{}';
  v_disclaimer text := '';
BEGIN
  SELECT * INTO v_coverage FROM genius_knowledge_coverage WHERE jurisdiction_code = p_jurisdiction_code;
  SELECT * INTO v_office FROM ipo_offices WHERE code = p_jurisdiction_code;

  v_can_respond := COALESCE(v_coverage.coverage_level, 'none') != 'none';

  IF COALESCE(v_coverage.coverage_level, 'none') = 'none' THEN
    v_warnings := array_append(v_warnings, 'No tenemos conocimiento legal verificado para ' || COALESCE(v_coverage.jurisdiction_name, p_jurisdiction_code));
  END IF;

  IF v_coverage.has_outdated_content THEN
    v_warnings := array_append(v_warnings, 'Parte del conocimiento puede estar desactualizado desde ' || to_char(v_coverage.outdated_since, 'DD Mon YYYY'));
  END IF;

  IF v_coverage.quality_penalty_applied THEN
    v_warnings := array_append(v_warnings, 'Gran parte del conocimiento proviene de investigación IA no verificada oficialmente');
  END IF;

  IF v_office.rep_requirement_type IN ('local_only','licensed_attorney','registered_agent') THEN
    v_warnings := array_append(v_warnings, 'REPRESENTACIÓN LEGAL: ' || COALESCE(v_office.rep_requirement_notes, ''));
  END IF;

  IF v_office.requires_translation THEN
    v_warnings := array_append(v_warnings, 'TRADUCCIÓN REQUERIDA: Los documentos deben presentarse en ' || COALESCE(v_office.accepted_filing_languages[1], 'idioma local') || '. El Genius redacta en inglés — se requiere traducción certificada.');
  END IF;

  v_disclaimer := '⚠️ Información orientativa. No constituye asesoramiento legal.';
  IF COALESCE(v_coverage.coverage_level, 'none') IN ('minimal','none') THEN
    v_disclaimer := v_disclaimer || ' Cobertura limitada para ' || COALESCE(v_coverage.jurisdiction_name, p_jurisdiction_code) || '. Verificar con especialista local.';
  END IF;

  RETURN jsonb_build_object(
    'can_respond', v_can_respond,
    'coverage_level', COALESCE(v_coverage.coverage_level, 'none'),
    'effective_score', COALESCE(v_coverage.effective_score, 0),
    'quality_penalty', COALESCE(v_coverage.quality_penalty_applied, false),
    'supported_languages', COALESCE(v_coverage.supported_presentation_languages, '{}'),
    'requires_translation', COALESCE(v_office.requires_translation, false),
    'rep_requirement', COALESCE(v_office.rep_requirement_type, 'none'),
    'rep_notes', v_office.rep_requirement_notes,
    'warnings', v_warnings,
    'alerts', COALESCE(v_coverage.alerts, '{}'),
    'disclaimer', v_disclaimer,
    'last_verification', v_coverage.last_verification
  );
END;
$$;