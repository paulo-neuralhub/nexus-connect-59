// ============================================================
// IP-NEXUS - COMPETITOR COMPARISON DATA
// Datos de comparativa vs competencia para demos
// ============================================================

export type FeatureStatus = true | false | 'partial' | string;

export interface FeatureComparison {
  name: string;
  ipnexus: FeatureStatus;
  sophia: FeatureStatus;
  patricia: FeatureStatus;
  others: FeatureStatus;
}

export interface CategoryComparison {
  name: string;
  icon: string;
  features: FeatureComparison[];
}

export const COMPETITOR_COMPARISON: CategoryComparison[] = [
  {
    name: 'Gestión de expedientes',
    icon: '📁',
    features: [
      { name: 'Marcas, patentes, diseños', ipnexus: true, sophia: true, patricia: true, others: true },
      { name: 'Vista unificada 360°', ipnexus: true, sophia: 'partial', patricia: false, others: false },
      { name: 'Timeline de actividad', ipnexus: true, sophia: false, patricia: false, others: false },
      { name: 'Búsqueda global <1s', ipnexus: true, sophia: true, patricia: 'partial', others: false },
    ]
  },
  {
    name: 'Control de plazos',
    icon: '⏰',
    features: [
      { name: 'Alertas automáticas', ipnexus: true, sophia: true, patricia: true, others: 'partial' },
      { name: 'Alertas escalonadas (5 niveles)', ipnexus: true, sophia: false, patricia: false, others: false },
      { name: 'SMS y llamadas de alerta', ipnexus: true, sophia: '€99/mes', patricia: false, others: false },
      { name: 'Cálculo automático fechas', ipnexus: true, sophia: true, patricia: true, others: false },
    ]
  },
  {
    name: 'Vigilancia de marcas',
    icon: '🕷️',
    features: [
      { name: 'Incluido en precio', ipnexus: true, sophia: '€500/mes', patricia: false, others: false },
      { name: 'IA de similitud (95%)', ipnexus: true, sophia: '78%', patricia: false, others: false },
      { name: 'Dominios y RRSS', ipnexus: true, sophia: false, patricia: false, others: false },
      { name: '150+ países', ipnexus: true, sophia: true, patricia: false, others: false },
    ]
  },
  {
    name: 'Comunicaciones',
    icon: '💬',
    features: [
      { name: 'Bandeja unificada', ipnexus: true, sophia: 'partial', patricia: false, others: false },
      { name: 'Softphone integrado', ipnexus: true, sophia: false, patricia: false, others: false },
      { name: 'WhatsApp Business', ipnexus: true, sophia: false, patricia: false, others: false },
      { name: 'Vinculación auto a expedientes', ipnexus: true, sophia: false, patricia: false, others: false },
    ]
  },
  {
    name: 'Facturación',
    icon: '💰',
    features: [
      { name: 'Facturación electrónica', ipnexus: true, sophia: true, patricia: true, others: 'partial' },
      { name: 'SII automático', ipnexus: true, sophia: 'partial', patricia: true, others: false },
      { name: 'TicketBAI', ipnexus: true, sophia: false, patricia: false, others: false },
      { name: 'VERI*FACTU (2025)', ipnexus: true, sophia: false, patricia: false, others: false },
      { name: 'Time tracking integrado', ipnexus: true, sophia: '€49/mes', patricia: 'partial', others: false },
    ]
  },
  {
    name: 'Automatización',
    icon: '⚙️',
    features: [
      { name: 'Workflows visuales', ipnexus: true, sophia: 'partial', patricia: false, others: false },
      { name: 'Triggers personalizables', ipnexus: true, sophia: false, patricia: false, others: false },
      { name: 'Sin programación', ipnexus: true, sophia: false, patricia: false, others: false },
    ]
  },
  {
    name: 'Portal cliente',
    icon: '🌐',
    features: [
      { name: 'Acceso 24/7', ipnexus: true, sophia: true, patricia: 'partial', others: false },
      { name: 'Documentos compartidos', ipnexus: true, sophia: true, patricia: 'partial', others: false },
      { name: 'Mensajería integrada', ipnexus: true, sophia: false, patricia: false, others: false },
      { name: 'Personalizable', ipnexus: true, sophia: false, patricia: false, others: false },
    ]
  },
  {
    name: 'Inteligencia Artificial',
    icon: '🧠',
    features: [
      { name: 'Asistente IA especializado', ipnexus: true, sophia: false, patricia: false, others: false },
      { name: 'Análisis de distintividad', ipnexus: true, sophia: false, patricia: false, others: false },
      { name: 'Redacción automática', ipnexus: true, sophia: false, patricia: false, others: false },
      { name: 'Búsqueda semántica', ipnexus: true, sophia: false, patricia: false, others: false },
    ]
  },
];

export const COMPETITORS = {
  sophia: { name: 'Sophia', country: 'ES', price: '€150-400/mes', color: '#64748B' },
  patricia: { name: 'Patricia', country: 'ES', price: '€200-500/mes', color: '#94A3B8' },
  others: { name: 'Otros', country: 'Varios', price: 'Variable', color: '#CBD5E1' },
};

export const ROI_DATA = {
  timeSaved: {
    weekly: 15, // horas
    yearly: 780, // horas
  },
  moneySaved: {
    monthly: 2400,
    yearly: 28800,
    breakdown: [
      { concept: 'Reporting automático', amount: 450, icon: '📊' },
      { concept: 'Vigilancia incluida (vs competencia)', amount: 500, icon: '🕷️' },
      { concept: 'Reducción llamadas (portal)', amount: 300, icon: '📞' },
      { concept: 'Automatizaciones', amount: 600, icon: '⚙️' },
      { concept: 'Menos errores/incidencias', amount: 550, icon: '🛡️' },
    ]
  },
  roiPositive: '<3 meses',
};

export const UNIQUE_FEATURES = [
  {
    icon: '🕷️',
    title: 'IP-SPIDER',
    description: 'Vigilancia con IA incluida',
    comparison: 'Otros cobran €500/mes extra',
    savings: '€6,000/año',
    color: 'violet',
  },
  {
    icon: '📞',
    title: 'Softphone',
    description: 'Llamadas desde la plataforma',
    comparison: 'Único en el mercado IP',
    savings: 'Productividad +20%',
    color: 'blue',
  },
  {
    icon: '💬',
    title: 'WhatsApp Business',
    description: 'Comunicación directa integrada',
    comparison: 'Ningún competidor lo tiene',
    savings: '30 min/día',
    color: 'green',
  },
  {
    icon: '🔒',
    title: 'Cumplimiento total',
    description: 'SII + TicketBAI + VERI*FACTU',
    comparison: 'Otros solo tienen SII parcial',
    savings: 'Cero multas',
    color: 'amber',
  },
  {
    icon: '⚙️',
    title: 'Workflows visuales',
    description: 'Automatiza sin programar',
    comparison: 'Competencia requiere desarrollo',
    savings: '15h/semana',
    color: 'cyan',
  },
  {
    icon: '🌐',
    title: 'Portal 24/7',
    description: 'Clientes acceden siempre',
    comparison: 'Otros tienen portales básicos',
    savings: '-60% llamadas',
    color: 'indigo',
  },
];

// Función para calcular score de funcionalidades
export function calculateFeatureScore(comparison: CategoryComparison[]): {
  ipnexus: number;
  sophia: number;
  patricia: number;
  others: number;
} {
  let totals = { ipnexus: 0, sophia: 0, patricia: 0, others: 0 };
  let count = 0;
  
  comparison.forEach(category => {
    category.features.forEach(feature => {
      count++;
      totals.ipnexus += feature.ipnexus === true ? 1 : feature.ipnexus === 'partial' ? 0.5 : 0;
      totals.sophia += feature.sophia === true ? 1 : feature.sophia === 'partial' ? 0.5 : 0;
      totals.patricia += feature.patricia === true ? 1 : feature.patricia === 'partial' ? 0.5 : 0;
      totals.others += feature.others === true ? 1 : feature.others === 'partial' ? 0.5 : 0;
    });
  });
  
  return {
    ipnexus: Math.round((totals.ipnexus / count) * 100),
    sophia: Math.round((totals.sophia / count) * 100),
    patricia: Math.round((totals.patricia / count) * 100),
    others: Math.round((totals.others / count) * 100),
  };
}
