// ============================================================
// IP-NEXUS - DEMO TOUR STEPS
// Configuración de pasos para demo comercial guiada
// ============================================================

export interface TourStep {
  id: number;
  phase: 'impact' | 'core' | 'differentiator' | 'value' | 'closing';
  title: string;
  subtitle: string;
  route: string;
  duration: number; // minutos
  
  // Guión comercial
  openingHook: string;
  keyActions: string[];
  talkingPoints: string[];
  competitiveEdge: string;
  closingQuestion: string;
  
  // Datos demo a usar (opcional)
  demoData?: {
    clientId?: string;
    matterId?: string;
    clientName?: string;
    clientNIF?: string;
    matterType?: string;
    matterTitle?: string;
  };
}

export interface ClosingStep extends Omit<TourStep, 'keyActions' | 'talkingPoints' | 'competitiveEdge'> {
  keyPoints: Array<{
    metric: string;
    description: string;
    yearly?: string;
  }>;
  uniqueAdvantages: string[];
  nextSteps: string[];
}

// ==========================================
// PASOS DEL TOUR
// ==========================================
export const TOUR_STEPS: TourStep[] = [
  // ==========================================
  // FASE 1: IMPACTO INICIAL
  // ==========================================
  {
    id: 1,
    phase: 'impact',
    title: 'Dashboard',
    subtitle: 'El centro de control de tu despacho',
    route: '/app/dashboard',
    duration: 3,
    
    openingHook: '¿Cuánto tiempo dedicas cada semana a preparar informes de estado? Con IP-NEXUS, esta es tu vista al entrar cada mañana.',
    
    keyActions: [
      'Mostrar KPIs principales (expedientes, plazos, facturación)',
      'Señalar los plazos urgentes parpadeando en rojo',
      'Hacer clic en un KPI para mostrar el detalle',
      'Mostrar el gráfico de actividad mensual',
    ],
    
    talkingPoints: [
      'Todo actualizado en tiempo real, no hay que esperar informes',
      'Cada usuario ve lo relevante para su rol',
      'Los plazos urgentes (<7 días) destacan automáticamente',
      'Acceso directo a expedientes recientes',
    ],
    
    competitiveEdge: 'Otros sistemas te dan datos de ayer. Aquí ves el ahora.',
    
    closingQuestion: '¿Te imaginas empezar cada día con esta claridad?',
  },

  {
    id: 2,
    phase: 'impact',
    title: 'Búsqueda Global',
    subtitle: 'Encuentra cualquier cosa en 0.3 segundos',
    route: '/app/dashboard',
    duration: 2,
    
    openingHook: '¿Cuántas veces al día buscas información en emails, carpetas, Excel...? Mira esto.',
    
    keyActions: [
      'Pulsar Ctrl+K para abrir búsqueda global',
      'Escribir el nombre de un cliente → aparece instantáneamente',
      'Buscar un número de expediente → resultado inmediato',
      'Buscar "renovación" → muestra plazos relacionados',
    ],
    
    talkingPoints: [
      'Busca en TODO: clientes, expedientes, documentos, emails',
      'Resultados en menos de 1 segundo',
      'No necesitas recordar dónde está cada cosa',
      'Funciona desde cualquier pantalla',
    ],
    
    competitiveEdge: 'Esto te ahorra 15 minutos cada vez que buscas algo. Multiplica por 20 búsquedas al día.',
    
    closingQuestion: '¿Cuánto tiempo crees que ahorrarías al día con esto?',
  },

  // ==========================================
  // FASE 2: CORE DEL NEGOCIO
  // ==========================================
  {
    id: 3,
    phase: 'core',
    title: 'Crear Cliente',
    subtitle: 'CRM especializado en IP',
    route: '/app/crm/contacts',
    duration: 3,
    
    openingHook: 'Vamos a crear un cliente nuevo. Verás que no es un CRM genérico, está pensado para IP.',
    
    keyActions: [
      'Crear nuevo cliente: "Innovatech Demo S.L."',
      'Añadir datos fiscales (NIF, dirección)',
      'Añadir contacto principal con email y teléfono',
      'Mostrar campos específicos IP (poder, instrucciones)',
    ],
    
    talkingPoints: [
      'Campos específicos para despachos IP',
      'Múltiples contactos por cliente',
      'Historial de comunicaciones automático',
      'Resumen de facturación integrado',
    ],
    
    competitiveEdge: 'No es un CRM genérico adaptado, está diseñado desde cero para IP.',
    
    closingQuestion: '¿Trabajáis con clientes que tienen múltiples contactos?',
    
    demoData: {
      clientName: 'Innovatech Demo S.L.',
      clientNIF: 'B12345678',
    },
  },

  {
    id: 4,
    phase: 'core',
    title: 'Crear Expediente',
    subtitle: 'Gestión completa de PI',
    route: '/app/docket/matters',
    duration: 4,
    
    openingHook: 'Ahora vamos a abrir un expediente de marca para este cliente. Mira qué completo.',
    
    keyActions: [
      'Seleccionar tipo: Marca nacional',
      'Asignar al cliente recién creado',
      'Rellenar datos: denominación, clases, titular',
      'Mostrar campos específicos por tipo de IP',
      'Guardar y mostrar la ficha completa',
    ],
    
    talkingPoints: [
      'Todos los tipos de IP en un lugar',
      'Campos dinámicos según el tipo',
      'Numeración automática de referencia',
      'Timeline de actividad desde el primer día',
    ],
    
    competitiveEdge: 'Una sola pantalla para ver TODO del expediente. No abres 5 sistemas.',
    
    closingQuestion: '¿Cuántos tipos de IP gestionáis habitualmente?',
    
    demoData: {
      matterType: 'trademark',
      matterTitle: 'INNOVATECH',
    },
  },

  {
    id: 5,
    phase: 'core',
    title: 'Plazos y Alertas',
    subtitle: 'Nunca más pierdas un plazo',
    route: '/app/docket/deadlines',
    duration: 3,
    
    openingHook: '¿Alguna vez habéis tenido un susto con un plazo? Esto no volverá a pasar.',
    
    keyActions: [
      'Mostrar vista de plazos próximos',
      'Señalar los urgentes (rojos parpadeantes)',
      'Abrir detalle de un plazo → ver alertas configuradas',
      'Mostrar calendario de plazos',
      'Explicar sistema de escalado de alertas',
    ],
    
    talkingPoints: [
      '5 niveles de alerta: 30, 15, 7, 3, 1 día',
      'Email → SMS → Llamada → Escalado a supervisor',
      'Responsables de backup automáticos',
      'Cálculo automático de fechas según normativa',
    ],
    
    competitiveEdge: 'Sistema de 5 niveles con escalado. Otros solo mandan un email.',
    
    closingQuestion: '¿Habéis tenido algún incidente por un plazo olvidado?',
  },

  {
    id: 6,
    phase: 'core',
    title: 'Documentos',
    subtitle: 'Todo organizado automáticamente',
    route: '/app/docket/matters',
    duration: 2,
    
    openingHook: '¿Dónde guardáis los documentos ahora? ¿Carpetas, emails, servidor...?',
    
    keyActions: [
      'Mostrar documentos del expediente creado',
      'Subir un documento arrastrando',
      'Mostrar clasificación automática por tipo',
      'Abrir preview de un PDF',
      'Mostrar historial de versiones',
    ],
    
    talkingPoints: [
      'Almacenamiento ilimitado incluido',
      'Organización automática por tipo',
      'Preview sin descargar',
      'Versionado automático',
      'Compartir con cliente en 1 clic',
    ],
    
    competitiveEdge: 'Los documentos se vinculan solos al expediente. No hay que organizar nada.',
    
    closingQuestion: '¿Cuánto tiempo dedicáis a organizar documentos?',
  },

  // ==========================================
  // FASE 3: DIFERENCIADORES
  // ==========================================
  {
    id: 7,
    phase: 'differentiator',
    title: 'IP-SPIDER',
    subtitle: 'Vigilancia IA INCLUIDA en el precio',
    route: '/app/spider/watchlists',
    duration: 4,
    
    openingHook: '¿Pagáis por vigilancia de marcas? ¿Cuánto os cuesta? Esto te va a sorprender.',
    
    keyActions: [
      'Mostrar alertas de vigilancia activas',
      'Abrir una alerta de marca similar detectada',
      'Mostrar puntuación de similitud IA (95%)',
      'Explicar la cobertura: 150+ países',
      'Mostrar vigilancia de dominios y RRSS',
    ],
    
    talkingPoints: [
      'IA entrenada con millones de marcas',
      '95% de precisión (vs 65-78% de otros)',
      'Vigilancia 24/7 automatizada',
      'Incluye dominios y redes sociales',
      '¡Y ESTÁ INCLUIDO EN EL PRECIO!',
    ],
    
    competitiveEdge: '⚡ CLAVE: Thomson Reuters cobra €500/mes extra. Nosotros lo incluimos.',
    
    closingQuestion: '¿Cuánto pagáis ahora por vigilancia? Ese dinero os lo ahorráis.',
  },

  {
    id: 8,
    phase: 'differentiator',
    title: 'Comunicaciones',
    subtitle: '4 canales unificados',
    route: '/app/communications',
    duration: 3,
    
    openingHook: '¿Cuántas aplicaciones abres para comunicarte? Email, WhatsApp, teléfono... Mira esto.',
    
    keyActions: [
      'Mostrar bandeja unificada',
      'Filtrar por WhatsApp → ver conversaciones',
      'Filtrar por email → ver hilos',
      'Abrir una comunicación → ver vinculación a expediente',
      'Mostrar cómo enviar un WhatsApp desde aquí',
    ],
    
    talkingPoints: [
      'Email, WhatsApp, SMS y llamadas en un lugar',
      'Todo se vincula automáticamente al expediente',
      'Historial completo de cada cliente',
      'Plantillas para respuestas rápidas',
    ],
    
    competitiveEdge: 'Ningún competidor tiene WhatsApp Business integrado.',
    
    closingQuestion: '¿Usáis WhatsApp para comunicaros con clientes?',
  },

  {
    id: 9,
    phase: 'differentiator',
    title: 'Softphone',
    subtitle: 'Llama sin salir de la plataforma',
    route: '/app/communications',
    duration: 2,
    
    openingHook: 'Esto es único. Ningún otro software IP tiene esto. Mira.',
    
    keyActions: [
      'Abrir el softphone (icono de teléfono)',
      'Mostrar la interfaz de marcado',
      'Buscar un contacto → aparece instantáneamente',
      'Simular una llamada saliente',
      'Mostrar cómo queda registrada automáticamente',
    ],
    
    talkingPoints: [
      'Llama directamente desde la plataforma',
      'Las llamadas se registran automáticamente',
      'Se vinculan al cliente/expediente',
      'Grabación opcional de llamadas',
    ],
    
    competitiveEdge: '⚡ ÚNICO: Somos el único software IP con softphone integrado.',
    
    closingQuestion: '¿Cuántas llamadas hacéis al día? Imagina no tener que apuntar ninguna.',
  },

  // ==========================================
  // FASE 4: VALOR AÑADIDO
  // ==========================================
  {
    id: 10,
    phase: 'value',
    title: 'Facturación',
    subtitle: 'SII, TicketBAI, VERI*FACTU automático',
    route: '/app/finance/invoices',
    duration: 3,
    
    openingHook: '¿Cómo gestionáis el SII? ¿Es manual o automático?',
    
    keyActions: [
      'Mostrar lista de facturas con indicador SII ✓',
      'Crear factura rápida desde tiempo registrado',
      'Mostrar envío automático al SII',
      'Mostrar PDF con QR de VERI*FACTU',
      'Explicar TicketBAI para País Vasco',
    ],
    
    talkingPoints: [
      'Facturación desde tiempo y gastos en 3 clics',
      'Envío automático al SII en tiempo real',
      'TicketBAI para territorio foral',
      'VERI*FACTU preparado para 2025',
      'PDF y XML Facturae automáticos',
    ],
    
    competitiveEdge: 'Cumplimiento 100% automático. Otros requieren configuración manual.',
    
    closingQuestion: '¿Cuánto tiempo dedicáis a la facturación mensual?',
  },

  {
    id: 11,
    phase: 'value',
    title: 'Automatizaciones',
    subtitle: 'Tu despacho en piloto automático',
    route: '/app/legal-ops/workflows',
    duration: 3,
    
    openingHook: '¿Cuántas tareas repetitivas hacéis cada día? Emails de recordatorio, asignar tareas...',
    
    keyActions: [
      'Mostrar lista de workflows activos',
      'Abrir "Recordatorio de plazos" → ver el diagrama',
      'Mostrar contador de ejecuciones (145 veces)',
      'Crear workflow simple en vivo: "Si plazo < 7 días → email"',
    ],
    
    talkingPoints: [
      'Constructor visual sin programación',
      'Triggers: plazos, eventos, fechas',
      'Acciones: emails, tareas, notificaciones',
      'Se ejecutan automáticamente 24/7',
    ],
    
    competitiveEdge: 'Nuestros clientes ahorran 15 horas/semana con automatizaciones.',
    
    closingQuestion: '¿Qué tarea repetitiva te gustaría automatizar primero?',
  },

  {
    id: 12,
    phase: 'value',
    title: 'Portal Cliente',
    subtitle: 'Autoservicio 24/7',
    route: '/app/client-portal',
    duration: 2,
    
    openingHook: '¿Cuántas llamadas recibís preguntando "¿cómo va mi caso?"?',
    
    keyActions: [
      'Mostrar panel de usuarios del portal',
      'Abrir la vista que ve el cliente',
      'Mostrar expedientes del cliente',
      'Mostrar documentos compartidos',
      'Mostrar mensajería integrada',
    ],
    
    talkingPoints: [
      'Clientes acceden cuando quieran, 24/7',
      'Ven sus expedientes y documentos',
      'Reciben alertas de plazos',
      'Pueden enviar mensajes',
      'Reducción del 60% en llamadas de estado',
    ],
    
    competitiveEdge: 'Tus clientes se sienten atendidos sin que tú hagas nada.',
    
    closingQuestion: '¿Os gustaría reducir las llamadas de "¿cómo va mi caso?"?',
  },
];

// ==========================================
// PASO DE CIERRE
// ==========================================
export const CLOSING_STEP: ClosingStep = {
  id: 13,
  phase: 'closing',
  title: 'Resumen de Valor',
  subtitle: 'Tu inversión, tu retorno',
  route: '/app/dashboard',
  duration: 5,
  
  openingHook: 'Hemos visto mucho. Déjame resumirte lo que esto significa para tu despacho.',
  
  closingQuestion: '¿Qué te parecería empezar con una prueba de 30 días sin compromiso?',
  
  keyPoints: [
    {
      metric: '15h/semana',
      description: 'Tiempo ahorrado en tareas manuales',
      yearly: '780 horas/año',
    },
    {
      metric: '€2,400/mes',
      description: 'Ahorro en costes operativos',
      yearly: '€28,800/año',
    },
    {
      metric: '<3 meses',
      description: 'Retorno de inversión positivo',
    },
    {
      metric: '0',
      description: 'Plazos perdidos con nuestro sistema',
    },
  ],
  
  uniqueAdvantages: [
    'IP-SPIDER incluido (otros cobran €500/mes)',
    'Softphone integrado (único en el mercado)',
    'WhatsApp Business nativo',
    'Cumplimiento automático SII/TicketBAI/VERI*FACTU',
  ],
  
  nextSteps: [
    'Configuramos tu cuenta en 24h',
    'Migramos tus datos (nosotros lo hacemos)',
    '30 días de prueba sin compromiso',
    'Soporte dedicado durante la implantación',
  ],
};

// ==========================================
// FASES DEL TOUR
// ==========================================
export const TOUR_PHASES = [
  { id: 'impact', name: 'IMPACTO', steps: [1, 2], color: 'bg-purple-500', textColor: 'text-purple-600', borderColor: 'border-purple-500' },
  { id: 'core', name: 'CORE', steps: [3, 4, 5, 6], color: 'bg-blue-500', textColor: 'text-blue-600', borderColor: 'border-blue-500' },
  { id: 'differentiator', name: 'DIFERENCIADORES', steps: [7, 8, 9], color: 'bg-emerald-500', textColor: 'text-emerald-600', borderColor: 'border-emerald-500' },
  { id: 'value', name: 'VALOR', steps: [10, 11, 12], color: 'bg-amber-500', textColor: 'text-amber-600', borderColor: 'border-amber-500' },
  { id: 'closing', name: 'CIERRE', steps: [13], color: 'bg-red-500', textColor: 'text-red-600', borderColor: 'border-red-500' },
];

// ==========================================
// TIPS PARA EL PRESENTADOR
// ==========================================
export const PRESENTER_TIPS = {
  general: [
    'Deja que el prospecto hable. Haz preguntas.',
    'Adapta el ritmo a su interés. Si algo le gusta, profundiza.',
    'Si algo no le interesa, pasa rápido.',
    'Siempre relaciona con SU problema específico.',
    'Usa los datos de ahorro €€€ con frecuencia.',
  ],
  
  ifInterested: [
    'Ofrece prueba de 30 días',
    'Propón siguiente reunión técnica',
    'Envía propuesta personalizada',
  ],
  
  ifObjections: {
    'precio': 'Compara con el ahorro: €2,400/mes. Se paga solo en 2 meses.',
    'migración': 'Nosotros migramos todo. El cliente no hace nada.',
    'tiempo': 'Configuramos en 24h. Formación incluida.',
    'competencia': 'Mira la tabla comparativa. ¿Qué funcionalidad te falta?',
  },
};

// Helper para obtener todos los pasos incluyendo el cierre
export function getAllSteps(): (TourStep | ClosingStep)[] {
  return [...TOUR_STEPS, CLOSING_STEP];
}

// Helper para obtener paso por ID
export function getStepById(id: number): TourStep | ClosingStep | undefined {
  return getAllSteps().find(s => s.id === id);
}

// Helper para obtener fase de un paso
export function getPhaseForStep(stepId: number) {
  return TOUR_PHASES.find(p => p.steps.includes(stepId));
}
