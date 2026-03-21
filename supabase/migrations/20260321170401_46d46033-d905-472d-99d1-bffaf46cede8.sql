-- GENIUS-01 Phase 1c: Seed knowledge base

INSERT INTO genius_knowledge_global
  (knowledge_type, jurisdiction_code, document_category, title, content, source_name, article_reference, language)
VALUES
('template_structure','EM','office_action',
 'Estructura Respuesta OA EUIPO — Rechazo Absoluto',
 'ESTRUCTURA OBLIGATORIA (Art. 7 RMUE): 1. ENCABEZADO: Nº solicitud | Denominación | Titular | Representante. 2. REFERENCIA AL EXAMINADOR: En respuesta al Oficio de Examen de [fecha]. 3. FUNDAMENTO DEL RECHAZO CITADO: El examinador cita el Art. 7.1.[x] RMUE. 4. CONTESTACIÓN: Argumentos de distintividad/diferenciación. Si Art. 7.1.b: carácter distintivo intrínseco o adquirido. Si Art. 7.1.c: no descriptividad o polisemia. Si Art. 8 (relativo): análisis comparativo visual/fonético/conceptual. 5. DOCUMENTACIÓN APORTADA. 6. PROPUESTA DE LIMITACIÓN. 7. SOLICITUD: Se solicita la admisión a registro. 8. FIRMA: Representante acreditado ante EUIPO. PLAZO: 2 MESES (extensible +2 meses). IDIOMA: ES/EN/FR/DE/IT. TONO: Formal, impersonal, indicativo.',
 'Directrices de Examen EUIPO 2024','Art. 7, 8, 71 RMUE','es'),

('template_structure','US','office_action',
 'Structure USPTO Office Action Response',
 'MANDATORY STRUCTURE (37 CFR 2.62): 1. HEADER: Serial No. | Applicant | Mark. 2. RESPONSE TO REFUSAL: Address each ground separately with TMEP citations. 3. COMPARISON OF MARKS (if 2d): Visual, Phonetic, Conceptual, Commercial impression. 4. COMPARISON OF GOODS/SERVICES: Nature, purpose, channels of trade, sophistication. 5. AMENDMENT TO IDENTIFICATION (if applicable). 6. DECLARATION acquired distinctiveness (37 CFR 2.41). 7. ATTORNEY OF RECORD: USPTO bar admission (37 CFR 11.14). DEADLINE: 3 months (extendable to 6). LANGUAGE: English ONLY. TONE: Formal, assertive.',
 'USPTO TMEP 2024','37 CFR 2.62, TMEP §704, 15 U.S.C. §1052','en'),

('template_structure','ES','office_action',
 'Estructura Respuesta Examen OEPM',
 'ESTRUCTURA OBLIGATORIA: 1. DESTINATARIO: OEPM Madrid. 2. REFERENCIA: Nº solicitud MXXXXXXXX. 3. IDENTIFICACIÓN SOLICITANTE: Nombre, NIF, domicilio. 4. REFERENCIA AL OFICIO con fecha. 5. ALEGACIONES: Art. 5 LP distintividad; Art. 6 LP análisis comparativo. 6. DOCUMENTACIÓN APORTADA. 7. SOLICITUD EXPRESA. 8. LUGAR, FECHA Y FIRMA. PLAZO: 1 MES ABSOLUTO — SIN PRÓRROGA. IDIOMA: SOLO ESPAÑOL. SI SE SUPERA PLAZO → DESISTIMIENTO AUTOMÁTICO.',
 'Ley 17/2001 de Marcas','Arts. 5, 6, 20 Ley 17/2001','es'),

('deadline','EM','opposition',
 'Plazos Oposición EUIPO',
 'PLAZO: 3 meses desde publicación EUTM Gazette. NO extensible. FEE: €320 (1 clase) / €540 (2+). FUNDAMENTOS: Arts. 8.1.a, 8.1.b, 8.5 RMUE. PRUEBA DE USO: Si marca oponente > 5 años (Art. 47). Cooling-off: 2 meses.',
 'RMUE','Arts. 8, 46, 47 RMUE','es'),

('deadline','US','opposition',
 'Opposition Deadlines USPTO',
 'DEADLINE: 30 days from Official Gazette publication. EXTENSION: Up to 180 days total. FEE: $600/class. GROUNDS: §2(d) likelihood of confusion, §2(a-f). PROCESS: Notice → Answer → Discovery → Trial → Decision.',
 'USPTO TTAB','15 U.S.C. §1063, TBMP','en'),

('deadline','ES','opposition',
 'Plazos Oposición OEPM',
 'PLAZO: 2 meses desde publicación BOPI. NO extensible — absoluto. Art. 18 Ley 17/2001.',
 'Ley 17/2001','Art. 18 Ley 17/2001','es'),

('template_structure','EM','opposition',
 'Estructura Escrito Oposición EUIPO',
 'ESTRUCTURA (Form TM7): 1. DATOS MARCA OPONENTE: Nº registro, titular, representante. 2. DATOS MARCA IMPUGNADA: Nº solicitud, denominación, clases. 3. GROUNDS: Art. 8.1.a (idéntica), 8.1.b (confusión), 8.5 (notoria). 4. ANÁLISIS COMPARATIVO: Visual, Fonético, Conceptual. 5. COMPARACIÓN P/S: clases Nice. 6. EVIDENCIA DE USO (si > 5 años, Art. 47). FEE: €320/€540. PLAZO: 3 meses — NO extensible.',
 'Directrices Oposición EUIPO','Arts. 8, 46, 47 RMUE','es'),

('template_structure',NULL,'license',
 'Estructura Contrato Licencia de Marca',
 'CLÁUSULAS: 1. PARTES. 2. OBJETO: marca(s), registro, clases. 3. TERRITORIO. 4. EXCLUSIVIDAD. 5. DURACIÓN. 6. ROYALTIES. 7. QUALITY CONTROL (USPTO: obligatorio Lanham Act — sin QC = naked license = abandono). 8. SUBLICENCIA. 9. REGISTRO: EUIPO Art. 25 RMUE. 10. RESOLUCIÓN. 11. LEY APLICABLE. 12. FIRMAS.',
 'Práctica contractual PI','Arts. 25, 26 RMUE; Lanham Act §45','es'),

('template_structure',NULL,'cease_desist',
 'Estructura Carta Cease and Desist',
 'ELEMENTOS: 1. REMITENTE (titular). 2. DESTINATARIO (infractor). 3. DERECHOS INVOCADOS: registro, clases, territorio. 4. DESCRIPCIÓN INFRACCIÓN. 5. FUNDAMENTO LEGAL. 6. DEMANDAS: cesar, retirar, indemnizar. 7. PLAZO: 10-15 días. 8. ADVERTENCIA LEGAL. 9. RESERVA DERECHOS. 10. FIRMA ABOGADO. NOTA: IP-GENIUS redacta borrador. Abogado decide envío.',
 'Práctica procesal PI',NULL,'es'),

('template_structure','GB','office_action',
 'Structure UKIPO Examination Report Response',
 'STRUCTURE: 1. HEADER: Application No., Mark, Applicant. 2. RESPONSE TO OBJECTION: Reference to Examiner Report date. 3. ARGUMENTS: Trade Marks Act 1994 s.3 (absolute), s.5 (relative). 4. EVIDENCE (if applicable). 5. AMENDMENTS (if applicable). 6. REQUEST FOR REGISTRATION. DEADLINE: 2 months. LANGUAGE: English only.',
 'Trade Marks Act 1994','TMA 1994 s.3, s.5','en')

ON CONFLICT DO NOTHING;