export interface FieldDefinition {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  description?: string;
}

export const IP_NEXUS_FIELDS: Record<string, FieldDefinition[]> = {
  matters: [
    { name: 'reference', label: 'Referencia interna', type: 'string', required: true },
    { name: 'title', label: 'Título / Nombre de marca', type: 'string', required: true },
    { name: 'ip_type', label: 'Tipo de PI', type: 'enum' },
    { name: 'ip_subtype', label: 'Subtipo de PI', type: 'string' },
    { name: 'status', label: 'Estado', type: 'enum' },
    { name: 'filing_date', label: 'Fecha de presentación', type: 'date' },
    { name: 'grant_date', label: 'Fecha de concesión', type: 'date' },
    { name: 'expiry_date', label: 'Fecha de expiración / Vigencia', type: 'date' },
    { name: 'application_number', label: 'Nº de solicitud', type: 'string' },
    { name: 'registration_number', label: 'Nº de registro', type: 'string' },
    { name: 'certificate_number', label: 'Nº de certificado', type: 'string' },
    { name: 'priority_date', label: 'Fecha de prioridad', type: 'date' },
    { name: 'priority_number', label: 'Nº de prioridad', type: 'string' },
    { name: 'country_code', label: 'País / Jurisdicción', type: 'string' },
    { name: 'jurisdiction', label: 'Jurisdicción (código)', type: 'string' },
    { name: 'classes', label: 'Clases (texto)', type: 'array' },
    { name: 'nice_classes', label: 'Clases Niza (números)', type: 'array' },
    { name: 'mark_image_url', label: 'Imagen de marca (URL)', type: 'string' },
    { name: 'images', label: 'Imágenes (URLs)', type: 'array' },
    { name: 'description', label: 'Descripción', type: 'text' },
    { name: 'figure_description', label: 'Descripción de figura', type: 'text' },
    { name: 'notes', label: 'Notas', type: 'text' },
    { name: 'applicant_name', label: 'Solicitante / Propietario', type: 'string' },
    { name: 'owner_name', label: 'Titular', type: 'string' },
    { name: 'agent_name', label: 'Agente / Responsable', type: 'string' },
    { name: 'client_ref', label: 'Referencia del cliente', type: 'string' },
    { name: 'legacy_system_id', label: 'ID sistema anterior', type: 'string', description: 'Código/ID del expediente en el sistema de origen' },
    { name: 'legacy_system_name', label: 'Sistema de origen', type: 'string', description: 'Nombre del sistema de donde se importó' },
    { name: 'created_at', label: 'Fecha de creación (origen)', type: 'date' },
    { name: 'updated_at', label: 'Fecha de modificación (origen)', type: 'date' },
  ],
  contacts: [
    { name: 'name', label: 'Nombre', type: 'string', required: true },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'phone', label: 'Teléfono', type: 'string' },
    { name: 'company_name', label: 'Empresa', type: 'string' },
    { name: 'job_title', label: 'Rol', type: 'string' },
    { name: 'address_line1', label: 'Dirección', type: 'text' },
    { name: 'country', label: 'País', type: 'string' },
    { name: 'tax_id', label: 'NIF/CIF', type: 'string' },
  ],
  deadlines: [
    { name: 'title', label: 'Título', type: 'string', required: true },
    { name: 'due_date', label: 'Fecha vencimiento', type: 'date', required: true },
    { name: 'deadline_type', label: 'Tipo', type: 'enum' },
    { name: 'priority', label: 'Prioridad', type: 'enum' },
    { name: 'status', label: 'Estado', type: 'enum' },
    { name: 'reminder_days', label: 'Días recordatorio', type: 'number' },
  ],
  costs: [
    { name: 'description', label: 'Descripción', type: 'string', required: true },
    { name: 'amount', label: 'Importe', type: 'decimal', required: true },
    { name: 'currency', label: 'Moneda', type: 'string' },
    { name: 'cost_type', label: 'Tipo de coste', type: 'enum' },
    { name: 'date', label: 'Fecha', type: 'date' },
    { name: 'invoice_number', label: 'Nº factura', type: 'string' },
    { name: 'status', label: 'Estado', type: 'enum' },
  ],
  documents: [
    { name: 'title', label: 'Título', type: 'string', required: true },
    { name: 'file_name', label: 'Nombre archivo', type: 'string' },
    { name: 'document_type', label: 'Tipo', type: 'enum' },
    { name: 'date', label: 'Fecha', type: 'date' },
    { name: 'description', label: 'Descripción', type: 'text' },
  ],
};

export const VALUE_TRANSFORMATIONS: Record<string, Record<string, string>> = {
  ip_type: {
    'PAT': 'patent',
    'PATENT': 'patent',
    'P': 'patent',
    'TM': 'trademark',
    'TRADEMARK': 'trademark',
    'MARCA': 'trademark',
    'M': 'trademark',
    'DES': 'design',
    'DESIGN': 'design',
    'DISEÑO': 'design',
    'D': 'design',
    'COP': 'copyright',
    'COPYRIGHT': 'copyright',
    'DOM': 'domain',
    'DOMAIN': 'domain',
    'DOMINIO': 'domain',
    'TS': 'trade_secret',
    'SECRET': 'trade_secret',
  },
  status: {
    'DRAFT': 'draft',
    'BORRADOR': 'draft',
    'PENDING': 'pending',
    'PENDIENTE': 'pending',
    'EN TRÁMITE': 'pending',
    'EN TRAMITE': 'pending',
    'SOLICITUD': 'pending',
    'PRESENTADA': 'pending',
    'ACTIVE': 'active',
    'ACTIVO': 'active',
    'VIGENTE': 'active',
    'GRANTED': 'granted',
    'CONCEDIDO': 'granted',
    'REGISTRADO': 'granted',
    'REGISTRADA': 'granted',
    'REGISTRO': 'granted',
    'EXPIRED': 'expired',
    'EXPIRADO': 'expired',
    'CADUCADO': 'expired',
    'CADUCADA': 'expired',
    'VENCIDO': 'expired',
    'VENCIDA': 'expired',
    'ABANDONED': 'abandoned',
    'ABANDONADO': 'abandoned',
    'ABANDONADA': 'abandoned',
    'DESISTIDO': 'abandoned',
    'DESISTIDA': 'abandoned',
    'OPOSICIÓN': 'opposed',
    'OPOSICION': 'opposed',
    'OPOSICIÓN. NOTIFICACIÓN OFICIAL.': 'opposed',
    'DENEGADO': 'refused',
    'DENEGADA': 'refused',
    'RECHAZADO': 'refused',
    'RECHAZADA': 'refused',
    'CANCELADO': 'cancelled',
    'CANCELADA': 'cancelled',
    'ANULADO': 'cancelled',
    'ANULADA': 'cancelled',
    'RENOVACIÓN': 'renewal_pending',
    'RENOVACION': 'renewal_pending',
  },
  contact_role: {
    'CLIENT': 'client',
    'CLIENTE': 'client',
    'APPLICANT': 'applicant',
    'SOLICITANTE': 'applicant',
    'INVENTOR': 'inventor',
    'AGENT': 'agent',
    'AGENTE': 'agent',
    'ATTORNEY': 'attorney',
    'ABOGADO': 'attorney',
    'OPPONENT': 'opponent',
    'OPONENTE': 'opponent',
  },
};

// Helper to get all fields as flat list for selects
export function getAllFieldsFlat(): Array<{ entity: string; field: string; label: string }> {
  const result: Array<{ entity: string; field: string; label: string }> = [];
  
  Object.entries(IP_NEXUS_FIELDS).forEach(([entity, fields]) => {
    fields.forEach(field => {
      result.push({
        entity,
        field: field.name,
        label: `${entity}.${field.label}`
      });
    });
  });
  
  return result;
}
