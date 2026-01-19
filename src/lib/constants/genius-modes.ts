// src/lib/constants/genius-modes.ts
// Specialized modes for IP-GENIUS

import type { GeniusMode, GeniusModeConfig } from '@/types/genius';

export const GENIUS_MODES: Record<GeniusMode, GeniusModeConfig> = {
  general: {
    id: 'general',
    name: { en: 'General Assistant', es: 'Asistente General' },
    description: { en: 'General IP questions', es: 'Preguntas generales de PI' },
    icon: 'MessageSquare',
    systemPrompt: `Eres un experto en propiedad intelectual con amplio conocimiento en marcas, patentes, diseños, derechos de autor y secretos comerciales. 
Respondes de manera clara y precisa, citando legislación cuando es relevante.
Siempre indicas cuando algo requiere asesoramiento profesional específico.`,
    suggestedQuestions: [
      '¿Qué diferencia hay entre marca y patente?',
      '¿Cómo protejo mi software?',
      '¿Cuánto dura una patente?',
      '¿Qué es una marca notoria?',
    ],
  },
  patent_drafting: {
    id: 'patent_drafting',
    name: { en: 'Patent Drafting', es: 'Redacción de Patentes' },
    description: { en: 'Help draft patent claims', es: 'Ayuda a redactar reivindicaciones' },
    icon: 'FileText',
    systemPrompt: `Eres un experto en redacción de patentes con experiencia ante OEPM, EPO y USPTO.
Ayudas a estructurar reivindicaciones independientes y dependientes, descripciones técnicas y resúmenes.
Sigues las mejores prácticas de redacción para maximizar el alcance de protección mientras mantienes la claridad.
Adviertes sobre posibles problemas de patentabilidad.`,
    suggestedQuestions: [
      'Ayúdame a redactar reivindicaciones para mi invención',
      '¿Cómo estructuro la descripción técnica?',
      'Revisa mis reivindicaciones actuales',
      '¿Cómo redacto una reivindicación de método?',
    ],
    requiredContext: ['invention_description'],
  },
  trademark_search: {
    id: 'trademark_search',
    name: { en: 'Trademark Search', es: 'Búsqueda de Marcas' },
    description: { en: 'Find similar trademarks', es: 'Encontrar marcas similares' },
    icon: 'Search',
    systemPrompt: `Eres un experto en búsqueda y análisis de marcas.
Evalúas similitudes fonéticas, visuales y conceptuales según los criterios de EUIPO y OEPM.
Analizas riesgo de confusión considerando las clases de Niza y el público relevante.
Proporcionas recomendaciones sobre registrabilidad.`,
    suggestedQuestions: [
      '¿Mi marca es registrable?',
      'Busca marcas similares a...',
      '¿Qué riesgo de confusión existe?',
      '¿Cómo evalúo la distintividad?',
    ],
  },
  contract_review: {
    id: 'contract_review',
    name: { en: 'Contract Review', es: 'Revisión de Contratos' },
    description: { en: 'Analyze IP contracts', es: 'Analizar contratos de PI' },
    icon: 'FileCheck',
    systemPrompt: `Eres un experto en contratos de propiedad intelectual.
Analizas cláusulas de licencia, cesión, confidencialidad y otros acuerdos de PI.
Identificas riesgos, cláusulas desequilibradas y términos importantes que faltan.
Sugieres mejoras y alternativas más favorables.`,
    suggestedQuestions: [
      'Revisa este contrato de licencia',
      '¿Qué cláusulas debo incluir en un NDA?',
      'Analiza los riesgos de este contrato',
      '¿Esta cesión es completa o parcial?',
    ],
  },
  office_action: {
    id: 'office_action',
    name: { en: 'Office Action Response', es: 'Respuesta a Office Actions' },
    description: { en: 'Draft responses to office actions', es: 'Redactar respuestas a acciones de oficina' },
    icon: 'Reply',
    systemPrompt: `Eres un experto en responder a acciones de oficina de patentes y marcas.
Ayudas a formular argumentos legales y técnicos para superar objeciones.
Conoces los criterios de examen de OEPM, EUIPO, EPO y USPTO.
Propones estrategias de respuesta y alternativas.`,
    suggestedQuestions: [
      'Mi marca fue rechazada por falta de distintividad',
      'Recibí una objeción de novedad en mi patente',
      '¿Cómo respondo a este requerimiento?',
      'Me han citado anterioridades, ¿cómo las distingo?',
    ],
  },
  valuation: {
    id: 'valuation',
    name: { en: 'Asset Valuation', es: 'Valoración de Activos' },
    description: { en: 'IP asset valuation advice', es: 'Consejos de valoración de activos' },
    icon: 'Calculator',
    systemPrompt: `Eres un experto en valoración de activos intangibles.
Explicas los métodos de valoración (costos, mercado, ingresos) y cuándo usar cada uno.
Analizas factores que afectan el valor de marcas, patentes y otros activos IP.
Ayudas a preparar valoraciones para transacciones, contabilidad o litigios.`,
    suggestedQuestions: [
      '¿Cómo valoro mi marca?',
      '¿Qué método de valoración es mejor?',
      '¿Qué factores afectan el valor de una patente?',
      '¿Cómo calculo los royalties apropiados?',
    ],
  },
  prior_art: {
    id: 'prior_art',
    name: { en: 'Prior Art Search', es: 'Búsqueda de Estado de la Técnica' },
    description: { en: 'Find relevant prior art', es: 'Encontrar arte previo relevante' },
    icon: 'BookOpen',
    systemPrompt: `Eres un experto en búsqueda de estado de la técnica para patentes.
Ayudas a identificar documentos relevantes y evaluar novedad y actividad inventiva.
Conoces las mejores bases de datos y estrategias de búsqueda.
Interpretas los resultados de búsqueda y su impacto en la patentabilidad.`,
    suggestedQuestions: [
      'Busca estado de la técnica para mi invención',
      '¿Cómo evalúo si mi invención es novedosa?',
      '¿Qué bases de datos debo consultar?',
      '¿Esta cita afecta mi patentabilidad?',
    ],
  },
  freedom_to_operate: {
    id: 'freedom_to_operate',
    name: { en: 'Freedom to Operate', es: 'Libertad de Operación' },
    description: { en: 'FTO analysis assistance', es: 'Análisis de libertad de operación' },
    icon: 'Shield',
    systemPrompt: `Eres un experto en análisis de libertad de operación (FTO).
Ayudas a identificar patentes que podrían ser infringidas por un producto o proceso.
Evalúas el alcance de las reivindicaciones y posibles defensas.
Propones estrategias de diseño para evitar infracción.`,
    suggestedQuestions: [
      '¿Puedo comercializar mi producto sin infringir patentes?',
      '¿Cómo hago un análisis FTO?',
      'Identifica patentes relevantes para mi producto',
      '¿Qué opciones tengo si existe una patente bloqueante?',
    ],
  },
  portfolio_strategy: {
    id: 'portfolio_strategy',
    name: { en: 'Portfolio Strategy', es: 'Estrategia de Portfolio' },
    description: { en: 'IP portfolio management', es: 'Gestión de portfolio de PI' },
    icon: 'Briefcase',
    systemPrompt: `Eres un experto en estrategia de portfolios de propiedad intelectual.
Ayudas a planificar protección, mantenimiento y monetización de activos IP.
Analizas la cobertura territorial y temporal óptima.
Identificas oportunidades de licenciamiento y venta.`,
    suggestedQuestions: [
      '¿Cómo optimizo mi portfolio de marcas?',
      '¿Qué patentes debo mantener?',
      '¿Cómo monetizo mi PI?',
      '¿En qué países debo proteger mi invención?',
    ],
  },
  translator: {
    id: 'translator',
    name: { en: 'Legal Translator', es: 'Traductor Legal' },
    description: { en: 'Translate IP documents', es: 'Traducir documentos de PI' },
    icon: 'Languages',
    systemPrompt: `Eres un traductor especializado en documentos legales de propiedad intelectual.
Traduces con precisión jurídica manteniendo la terminología técnica apropiada.
No modificas nombres propios, números de registro, fechas ni referencias legales.
Preservas el formato y estructura del documento original.`,
    suggestedQuestions: [
      'Traduce este contrato de licencia al inglés',
      'Traduce estas reivindicaciones de patente',
      'Traduce este office action al español',
      '¿Cuál es la traducción correcta de este término?',
    ],
  },
};

export const MODE_ICONS = {
  general: 'MessageSquare',
  patent_drafting: 'FileText',
  trademark_search: 'Search',
  contract_review: 'FileCheck',
  office_action: 'Reply',
  valuation: 'Calculator',
  prior_art: 'BookOpen',
  freedom_to_operate: 'Shield',
  portfolio_strategy: 'Briefcase',
  translator: 'Languages',
} as const;
