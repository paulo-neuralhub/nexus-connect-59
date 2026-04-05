/**
 * PuntoIP Galena → IP-NEXUS Field Mapping Knowledge Base
 *
 * Learned from actual Galena portal screenshots and extracted data.
 * This file is used by the AI mapper to suggest field mappings and
 * by the smart import pipeline to auto-interpret data.
 *
 * Galena uses Ext.NET 4.1.0 (ExtJS) with memory proxy stores.
 * Data comes from DirectEvent responses with loadData([...]).
 *
 * ═══════════════════════════════════════════════════════
 * GALENA ENTITIES (from portal navigation)
 * ═══════════════════════════════════════════════════════
 *
 * Marcas (main grid: GridMarcas)
 *   - Búsqueda has 2 tabs: Parámetros + Más Parámetros
 *   - ~14,496 records total, batched by letter A-Z
 *   - Sub-grids: GridEventos, GridTareas, GridExpedientesCambios,
 *     GridDocumentos, GridServiciosFacturados, GridControlTareas,
 *     GridFacturaItems, GridPagos
 *
 * Patentes (similar structure to Marcas)
 * Clientes (CRM accounts)
 * Propietarios (owners/applicants)
 * Eventos (events/timeline per matter)
 * Boletines (official gazettes)
 * Servicios (billing services)
 * Facturación (invoicing)
 *
 * Configuración:
 *   - Estados, Config. Agendas, Modelos de Carta
 *   - Clientes, Propietarios, Boletines, Eventos
 *   - Tipos de Evento, Usuarios, Calendario
 *   - Países, Clases, Abogados
 */

// ═══════════════════════════════════════════════════════
// GALENA → IP-NEXUS FIELD MAPPING (from extracted data)
// ═══════════════════════════════════════════════════════

export const GALENA_MATTERS_FIELD_MAP: Record<string, {
  ipNexusField: string;
  ipNexusEntity: string;
  description: string;
  transform?: string;
  example?: string;
}> = {
  // ── Identity ──
  Codigo: {
    ipNexusField: 'legacy_system_id',
    ipNexusEntity: 'matters',
    description: 'Código interno del expediente en Galena',
    example: '50983',
  },
  Id: {
    ipNexusField: 'legacy_system_id',
    ipNexusEntity: 'matters',
    description: 'ID numérico interno en Galena (si Codigo no existe)',
    example: '172687',
  },
  RefInterna: {
    ipNexusField: 'reference',
    ipNexusEntity: 'matters',
    description: 'Referencia interna del despacho',
  },

  // ── Mark info ──
  Nombre: {
    ipNexusField: 'title',
    ipNexusEntity: 'matters',
    description: 'Nombre/denominación de la marca',
    example: 'TQ CureBand',
  },
  Materia: {
    ipNexusField: 'mark_name',
    ipNexusEntity: 'matters',
    description: 'Nombre de la materia (generalmente = Nombre)',
  },
  TipoSigno: {
    ipNexusField: 'ip_subtype',
    ipNexusEntity: 'matters',
    description: 'Tipo de signo: M=Marca, P=Patente, D=Diseño',
    transform: 'map_ip_type',
  },
  DescripcionFigura: {
    ipNexusField: 'figure_description',
    ipNexusEntity: 'matters',
    description: 'Descripción de la figura/etiqueta de la marca',
  },
  Imagen: {
    ipNexusField: 'mark_image_url',
    ipNexusEntity: 'matters',
    description: 'Ruta relativa de la imagen del logo',
    transform: 'prepend_base_url',
    example: '/documentos/logos/188188.jpg',
  },
  TieneImagen: {
    ipNexusField: '_skip',
    ipNexusEntity: 'matters',
    description: 'Booleano — true si tiene imagen (no importar)',
  },

  // ── Status ──
  Estado: {
    ipNexusField: 'status',
    ipNexusEntity: 'matters',
    description: 'Estado del expediente en texto libre',
    transform: 'map_status',
    example: 'OPOSICIÓN. NOTIFICACIÓN OFICIAL.',
  },
  Inactivo: {
    ipNexusField: 'is_archived',
    ipNexusEntity: 'matters',
    description: 'true = expediente archivado/inactivo',
  },

  // ── Filing & Registration ──
  SolicitudNro: {
    ipNexusField: 'application_number',
    ipNexusEntity: 'matters',
    description: 'Número de solicitud oficial',
    example: '2025-011321',
  },
  SolicitudFecha: {
    ipNexusField: 'filing_date',
    ipNexusEntity: 'matters',
    description: 'Fecha de presentación de la solicitud',
    transform: 'parse_date',
  },
  RegistroNro: {
    ipNexusField: 'registration_number',
    ipNexusEntity: 'matters',
    description: 'Número de registro otorgado',
  },
  RegistroFecha: {
    ipNexusField: 'registration_date',
    ipNexusEntity: 'matters',
    description: 'Fecha de registro/concesión',
    transform: 'parse_date',
  },
  Certificado: {
    ipNexusField: 'certificate_number',
    ipNexusEntity: 'matters',
    description: 'Número de certificado',
  },
  Vigencia: {
    ipNexusField: 'expiry_date',
    ipNexusEntity: 'matters',
    description: 'Fecha de vigencia/expiración',
    transform: 'parse_date',
  },

  // ── Classification ──
  Clases: {
    ipNexusField: 'nice_classes',
    ipNexusEntity: 'matters',
    description: 'Clases Niza (puede ser "5" o "5, 9, 42")',
    transform: 'parse_nice_classes',
    example: '5',
  },

  // ── Geography ──
  Paises: {
    ipNexusField: 'jurisdiction',
    ipNexusEntity: 'matters',
    description: 'País de la solicitud',
    transform: 'map_country',
    example: 'Venezuela',
  },

  // ── Parties ──
  Cliente: {
    ipNexusField: 'client_ref',
    ipNexusEntity: 'matters',
    description: 'Nombre del cliente/despacho asociado',
    example: 'LUDOVIC, GRAJALES Y CARDENAS & ASOCIADOS ABOGADOS',
  },
  IdCliente: {
    ipNexusField: '_link_client_id',
    ipNexusEntity: 'matters',
    description: 'ID del cliente en Galena (para vincular contactos)',
  },
  ClienteEmail: {
    ipNexusField: '_client_email',
    ipNexusEntity: 'matters',
    description: 'Email del cliente (crear contacto si no existe)',
  },
  Propietario: {
    ipNexusField: 'owner_name',
    ipNexusEntity: 'matters',
    description: 'Nombre del propietario/titular de la marca',
    example: 'TQ BRANDS S.A.',
  },
  OficinaResponsable: {
    ipNexusField: 'agent_name',
    ipNexusEntity: 'matters',
    description: 'Oficina/agente responsable del trámite',
    example: 'MONTOYA, KOCIECKI & ASOCIADOS',
  },
  IdOficinaResponsable: {
    ipNexusField: '_link_agent_id',
    ipNexusEntity: 'matters',
    description: 'ID de la oficina responsable en Galena',
  },
  ResponsableEmail: {
    ipNexusField: '_agent_email',
    ipNexusEntity: 'matters',
    description: 'Email del responsable',
  },

  // ── Audit ──
  CreadoPor: {
    ipNexusField: '_created_by_username',
    ipNexusEntity: 'matters',
    description: 'Usuario que creó el registro en Galena',
    example: 'amontoya',
  },
  ModificadoPor: {
    ipNexusField: '_modified_by_username',
    ipNexusEntity: 'matters',
    description: 'Usuario que modificó el registro',
  },
  FechaCreacion: {
    ipNexusField: 'created_at',
    ipNexusEntity: 'matters',
    description: 'Fecha de creación del expediente en Galena',
    transform: 'parse_date',
  },
  FechaModificacion: {
    ipNexusField: 'updated_at',
    ipNexusEntity: 'matters',
    description: 'Última modificación en Galena',
    transform: 'parse_date',
  },
};

// ═══════════════════════════════════════════════════════
// GALENA GRID COLUMNS (from GridMarcas inspection)
// ═══════════════════════════════════════════════════════

export const GALENA_GRID_COLUMNS = [
  'Codigo', 'RefInterna', 'TipoSigno', 'TieneImagen',
  'OficinaResponsable', 'Cliente', 'Propietario', 'Nombre',
  'Clases', 'Estado', 'SolicitudNro', 'SolicitudFecha',
  'RegistroNro', 'RegistroFecha', 'Certificado', 'Vigencia',
  'Paises', 'CreadoPor', 'ModificadoPor', 'FechaCreacion',
  'FechaModificacion',
] as const;

// Additional fields found in data but not in grid columns
export const GALENA_EXTRA_FIELDS = [
  'Id', 'Materia', 'Imagen', 'Inactivo', 'IdCliente',
  'ClienteEmail', 'IdOficinaResponsable', 'ResponsableEmail',
  'DescripcionFigura',
] as const;

// ═══════════════════════════════════════════════════════
// GALENA SUB-ENTITY GRIDS (found on marcas.aspx)
// ═══════════════════════════════════════════════════════

export const GALENA_SUB_GRIDS = {
  GridEventos: {
    description: 'Eventos/historial por expediente',
    columns: ['Fecha', 'Descripcion', 'Comentarios', 'CreadoPor', 'FechaCreacion'],
    ipNexusEntity: 'matter_timeline',
  },
  GridTareas: {
    description: 'Tareas/agenda por expediente',
    columns: ['Name', 'Asunto', 'Vencimiento', 'Finalizacion', 'CreadoPor', 'AsignadoA'],
    ipNexusEntity: 'matter_deadlines',
  },
  GridExpedientesCambios: {
    description: 'Expedientes relacionados (renovaciones, cesiones, etc.)',
    columns: ['Codigo', 'Tipo', 'Estado', 'SolicitudFecha', 'FechaCreacion'],
    ipNexusEntity: 'matter_families',
  },
  GridDocumentos: {
    description: 'Documentos adjuntos',
    columns: ['FechaCreacion', 'Descripcion', 'Archivo', 'CreadoPor'],
    ipNexusEntity: 'matter_documents',
  },
  GridControlTareas: {
    description: 'Control de tareas con contexto completo',
    columns: ['Name', 'Asunto', 'Vencimiento', 'Finalizado', 'Expediente',
              'SolicitudNro', 'Propietario', 'Vigencia', 'RefInterna', 'AsignadoA'],
    ipNexusEntity: 'matter_deadlines',
  },
} as const;

// ═══════════════════════════════════════════════════════
// GALENA SEARCH DIALOG FIELDS (from Búsqueda screenshots)
// ═══════════════════════════════════════════════════════

export const GALENA_SEARCH_PARAMS = {
  // Tab "Parámetros"
  parametros: [
    'Oficina (Oficina Responsable)',
    'Codigo (Código Expediente)',
    'Cliente (Nombre Cliente)',
    'Contacto (Nombre o Apellido del Contacto)',
    'Tramitante (Nombre Tramitante) + País Tramitante',
    'Propietario (Nombre Propietario) + País Propietario',
    'Marca (Denominación)',
    'Ref. Cliente + Ref. Interna',
    'Solicitud (Número Solicitud) + Registro (Número Registro)',
    'Solicitud Desde/Hasta (fechas)',
    'Vigencia Desde/Hasta (fechas)',
    'Estado (Estado del Expediente)',
    'Clase (Clase Niza)',
    'País (País Solicitud) + País (País Cliente)',
    'Boletín (Boletín Publicación)',
    'Tipo Evento + Evento Desde/Hasta',
    'Incluir Anexos (checkbox)',
  ],
  // Tab "Más Parámetros"
  masParametros: [
    'Consultar: Todas las Marcas / Marcas Registradas / Marcas Solicitadas',
    'Archivo: Expedientes Activos / Expedientes Inactivos / Todos',
    'Usuario (Creado por) + Modificado Por',
    'Creación Desde/Hasta',
    'Modif. Desde/Hasta',
    'Prueba de Uso Desde/Hasta',
    'Registro Desde/Hasta',
    'Cobertura (palabra clave del Producto o Servicio)',
    'Comentarios (palabra clave)',
    'Responsable (dropdown)',
    'Tipo Solicitud (dropdown)',
  ],
} as const;

// ═══════════════════════════════════════════════════════
// GALENA ATTORNEYS/ABOGADOS (from Configuración)
// ═══════════════════════════════════════════════════════

export const GALENA_ABOGADOS_COLUMNS = [
  'Iniciales', 'Nombre', 'Apellido', 'Cédula',
  'Nacionalidad', 'Estado Civil', 'Email',
] as const;

// ═══════════════════════════════════════════════════════
// GALENA EVENTOS SEARCH (from Eventos screenshot)
// ═══════════════════════════════════════════════════════

export const GALENA_EVENTOS_SEARCH = [
  'Materia (Tipo de Materia)',
  'Tipo Evento (Tipo de Evento)',
  'Usuario (Creado Por)',
  'Evento Desde/Hasta',
  'Creación Desde/Hasta',
] as const;

export const GALENA_EVENTOS_COLUMNS = [
  'Materia', 'Fecha', 'Evento', 'Comentarios',
  'Codigo Expediente', 'Creado Por', 'Fecha Creación',
] as const;

// ═══════════════════════════════════════════════════════
// GALENA BOLETINES (from Boletines screenshot)
// ═══════════════════════════════════════════════════════

export const GALENA_BOLETINES_COLUMNS = [
  'Número', 'Fecha Publicación', 'Descripción', 'País',
] as const;

// ═══════════════════════════════════════════════════════
// SMART IMPORT RULES — AI interpretation logic
// ═══════════════════════════════════════════════════════

/**
 * Rules for the AI to auto-interpret Galena data and create
 * IP-NEXUS entities that don't exist in Galena.
 *
 * These are applied after field mapping, during the "smart import" phase.
 * Every auto-generated item requires human confirmation before saving.
 */
export const SMART_IMPORT_RULES = {
  // ── Auto-generate deadlines from dates ──
  deadlines: {
    description: 'Crear plazos automáticos basados en fechas del expediente',
    rules: [
      {
        condition: 'Vigencia is set and status is "registered" or "active"',
        action: 'Create renewal deadline 6 months before Vigencia',
        type: 'renewal',
        priority: 'high',
        reminderDays: [180, 90, 30],
      },
      {
        condition: 'SolicitudFecha is set and no RegistroFecha',
        action: 'Create status check deadline 12 months after filing',
        type: 'status_check',
        priority: 'medium',
        reminderDays: [30, 7],
      },
      {
        condition: 'Estado contains "OPOSICIÓN"',
        action: 'Create opposition response deadline (30 days from import)',
        type: 'opposition_response',
        priority: 'urgent',
        reminderDays: [7, 3, 1],
      },
    ],
  },

  // ── Auto-create contacts from party data ──
  contacts: {
    description: 'Crear contactos CRM desde datos de partes del expediente',
    rules: [
      {
        fields: ['Cliente', 'ClienteEmail', 'IdCliente'],
        action: 'Create or link CRM account for client',
        role: 'client',
      },
      {
        fields: ['Propietario'],
        action: 'Create or link CRM account for owner/applicant',
        role: 'owner',
      },
      {
        fields: ['OficinaResponsable', 'ResponsableEmail'],
        action: 'Create or link CRM account for agent/firm',
        role: 'agent',
      },
    ],
  },

  // ── Status interpretation ──
  statusInterpretation: {
    description: 'Interpretar estados de Galena para acciones automáticas',
    mappings: {
      'OPOSICIÓN': { phase: 'F4', alert: true, alertMessage: 'Expediente en oposición — requiere acción' },
      'NOTIFICACIÓN OFICIAL': { phase: 'F3', alert: true, alertMessage: 'Notificación oficial pendiente' },
      'PUBLICACIÓN': { phase: 'F5', alert: false },
      'REGISTRADO': { phase: 'F6', alert: false },
      'REGISTRADA': { phase: 'F6', alert: false },
      'VIGENTE': { phase: 'F6', alert: false },
      'CADUCADO': { phase: 'F8', alert: true, alertMessage: 'Expediente caducado — verificar renovación' },
      'CADUCADA': { phase: 'F8', alert: true, alertMessage: 'Expediente caducado — verificar renovación' },
      'RENOVACIÓN': { phase: 'F8', alert: true, alertMessage: 'Renovación pendiente' },
    },
  },

  // ── Image URL resolution ──
  images: {
    description: 'Resolver URLs de imágenes de Galena',
    baseUrl: 'https://mkgalena.puntoip.info',
    pathPrefix: '/documentos/logos/',
  },
} as const;

// ═══════════════════════════════════════════════════════
// DEDUP KEY — for incremental sync
// ═══════════════════════════════════════════════════════

/**
 * How to identify if a Galena record already exists in IP-NEXUS.
 * Used during incremental sync to skip or update existing records.
 */
export const GALENA_DEDUP_STRATEGY = {
  primaryKey: 'Codigo',           // Unique in Galena
  ipNexusField: 'legacy_system_id', // Where we store it
  ipNexusSystemName: 'PuntoIP Galena',
  fallbackKeys: ['SolicitudNro', 'Nombre+Paises'], // If Codigo is missing
} as const;
