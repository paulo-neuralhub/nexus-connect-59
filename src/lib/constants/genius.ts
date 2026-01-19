import type { AgentConfig, AgentType, KnowledgeCategory, GeneratedDocType } from '@/types/genius';

export const AGENTS: Record<AgentType, AgentConfig> = {
  guide: {
    type: 'guide',
    name: 'NEXUS GUIDE',
    description: 'Ayuda con la plataforma y tutoriales',
    icon: 'HelpCircle',
    color: '#3B82F6',
    capabilities: [
      'Explicar funcionalidades',
      'Guiar paso a paso',
      'Resolver dudas de uso',
      'Tutoriales interactivos',
    ],
  },
  ops: {
    type: 'ops',
    name: 'NEXUS OPS',
    description: 'Consulta tu cartera de PI',
    icon: 'Briefcase',
    color: '#22C55E',
    capabilities: [
      'Consultar expedientes',
      'Ver plazos y vencimientos',
      'Estado de trámites',
      'Resumen de cartera',
    ],
  },
  legal: {
    type: 'legal',
    name: 'NEXUS LEGAL',
    description: 'Asesoramiento legal de PI',
    icon: 'Scale',
    color: '#8B5CF6',
    capabilities: [
      'Consultas legales',
      'Análisis de registrabilidad',
      'Redacción de escritos',
      'Investigación jurídica',
    ],
  },
  watch: {
    type: 'watch',
    name: 'NEXUS WATCH',
    description: 'Vigilancia y conflictos',
    icon: 'Eye',
    color: '#F59E0B',
    capabilities: [
      'Análisis de conflictos',
      'Evaluación de riesgos',
      'Informes de vigilancia',
      'Recomendaciones de acción',
    ],
  },
  docs: {
    type: 'docs',
    name: 'NEXUS DOCS',
    description: 'Análisis de documentos',
    icon: 'FileSearch',
    color: '#EC4899',
    capabilities: [
      'Extracción de datos',
      'Resumen de documentos',
      'Comparación de textos',
      'OCR inteligente',
    ],
  },
  translator: {
    type: 'translator',
    name: 'NEXUS TRANSLATOR',
    description: 'Traducción legal de documentos PI',
    icon: 'Languages',
    color: '#14B8A6',
    capabilities: [
      'Traducción de contratos',
      'Traducción de patentes',
      'Glosarios especializados',
      'Terminología legal precisa',
    ],
  },
};

export const KNOWLEDGE_CATEGORIES: Record<KnowledgeCategory, { label: string; icon: string }> = {
  legislation: { label: 'Legislación', icon: 'BookOpen' },
  case_law: { label: 'Jurisprudencia', icon: 'Gavel' },
  guidelines: { label: 'Directrices', icon: 'FileText' },
  treaties: { label: 'Tratados', icon: 'Globe' },
  procedures: { label: 'Procedimientos', icon: 'ListChecks' },
  forms: { label: 'Formularios', icon: 'ClipboardList' },
  glossary: { label: 'Glosario', icon: 'BookA' },
  faq: { label: 'FAQ', icon: 'HelpCircle' },
};

export const GENERATED_DOC_TYPES: Record<GeneratedDocType, { label: string; icon: string }> = {
  opposition: { label: 'Escrito de oposición', icon: 'Shield' },
  response: { label: 'Respuesta a requerimiento', icon: 'MessageSquare' },
  renewal: { label: 'Solicitud de renovación', icon: 'RefreshCw' },
  assignment: { label: 'Contrato de cesión', icon: 'FileSignature' },
  license: { label: 'Contrato de licencia', icon: 'Key' },
  coexistence: { label: 'Acuerdo de coexistencia', icon: 'Handshake' },
  cease_desist: { label: 'Carta cease & desist', icon: 'AlertOctagon' },
  watch_report: { label: 'Informe de vigilancia', icon: 'FileSearch' },
  valuation: { label: 'Informe de valoración', icon: 'TrendingUp' },
  summary: { label: 'Resumen ejecutivo', icon: 'FileText' },
  custom: { label: 'Documento personalizado', icon: 'File' },
};

export const QUICK_PROMPTS: Record<AgentType, string[]> = {
  guide: [
    '¿Cómo creo un nuevo expediente?',
    '¿Cómo configuro alertas de vencimiento?',
    '¿Cómo invito a mi equipo?',
    '¿Cómo exporto un informe?',
  ],
  ops: [
    '¿Cuántos expedientes tengo activos?',
    '¿Qué marcas vencen este mes?',
    'Muéstrame las renovaciones pendientes',
    'Resumen de mi cartera',
  ],
  legal: [
    '¿Es registrable la marca X?',
    '¿Cuál es el plazo de oposición en EUIPO?',
    'Diferencia entre marca y nombre comercial',
    '¿Qué es el riesgo de confusión?',
  ],
  watch: [
    'Analiza el conflicto entre X e Y',
    '¿Debo oponerme a esta marca?',
    'Evalúa el riesgo de esta similitud',
    'Prepara informe de vigilancia',
  ],
  docs: [
    'Resume este documento',
    'Extrae los datos clave',
    '¿Qué plazos menciona?',
    'Identifica las partes del contrato',
  ],
  translator: [
    'Traduce este contrato al inglés',
    'Traduce estas reivindicaciones de patente',
    'Traduce este office action al español',
    '¿Cuál es la traducción de este término legal?',
  ],
};

export const AI_LIMITS = {
  free: {
    messages_per_day: 10,
    documents_per_month: 5,
  },
  starter: {
    messages_per_day: 50,
    documents_per_month: 20,
  },
  professional: {
    messages_per_day: 100,
    documents_per_month: 50,
  },
  business: {
    messages_per_day: 500,
    documents_per_month: 200,
  },
  enterprise: {
    messages_per_day: -1, // unlimited
    documents_per_month: -1,
  },
};

export const AGENT_COLORS: Record<AgentType, string> = {
  guide: 'hsl(217, 91%, 60%)', // Blue
  ops: 'hsl(142, 71%, 45%)', // Green
  legal: 'hsl(263, 70%, 50%)', // Purple
  watch: 'hsl(38, 92%, 50%)', // Amber
  docs: 'hsl(330, 81%, 60%)', // Pink
  translator: 'hsl(168, 76%, 42%)', // Teal
};
