export const MATTER_TYPES = {
  trademark: { label: 'Marca', icon: 'Tag', color: '#EC4899' },
  patent: { label: 'Patente', icon: 'Lightbulb', color: '#F59E0B' },
  design: { label: 'Diseño', icon: 'Palette', color: '#8B5CF6' },
  domain: { label: 'Dominio', icon: 'Globe', color: '#10B981' },
  copyright: { label: 'Copyright', icon: 'Copyright', color: '#3B82F6' },
  other: { label: 'Otro', icon: 'File', color: '#6B7280' },
} as const;

export const MATTER_STATUSES = {
  draft: { label: 'Borrador', color: '#94A3B8' },
  pending: { label: 'Pendiente', color: '#F59E0B' },
  filed: { label: 'Presentado', color: '#3B82F6' },
  published: { label: 'Publicado', color: '#8B5CF6' },
  granted: { label: 'Concedido', color: '#22C55E' },
  active: { label: 'Activo', color: '#10B981' },
  opposed: { label: 'En oposición', color: '#EF4444' },
  expired: { label: 'Expirado', color: '#6B7280' },
  abandoned: { label: 'Abandonado', color: '#94A3B8' },
  cancelled: { label: 'Cancelado', color: '#EF4444' },
} as const;

export const MARK_TYPES = {
  word: 'Denominativa',
  figurative: 'Figurativa',
  combined: 'Mixta',
  sound: 'Sonora',
  '3d': 'Tridimensional',
  other: 'Otra',
} as const;

export const JURISDICTIONS = [
  { code: 'ES', name: 'España (OEPM)' },
  { code: 'EU', name: 'Unión Europea (EUIPO)' },
  { code: 'WO', name: 'Internacional (WIPO)' },
  { code: 'US', name: 'Estados Unidos (USPTO)' },
  { code: 'GB', name: 'Reino Unido (UKIPO)' },
  { code: 'DE', name: 'Alemania (DPMA)' },
  { code: 'FR', name: 'Francia (INPI)' },
  { code: 'CN', name: 'China (CNIPA)' },
] as const;

export const DOCUMENT_CATEGORIES = {
  application: { label: 'Solicitud', icon: 'FileText' },
  certificate: { label: 'Certificado', icon: 'Award' },
  correspondence: { label: 'Correspondencia', icon: 'Mail' },
  invoice: { label: 'Factura', icon: 'Receipt' },
  report: { label: 'Informe', icon: 'FileSearch' },
  other: { label: 'Otro', icon: 'File' },
} as const;
