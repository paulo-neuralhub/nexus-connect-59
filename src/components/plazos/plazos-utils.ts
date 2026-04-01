// Shared constants and helpers for Plazos

export const DEADLINE_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  office_action:       { label: 'Respuesta Oficina',   color: '#3b82f6' },
  opposition:          { label: 'Oposición',            color: '#7c3aed' },
  opposition_response: { label: 'Resp. Oposición',      color: '#4338ca' },
  renewal:             { label: 'Renovación',           color: '#22c55e' },
  paris_priority:      { label: 'Prioridad Paris',      color: '#ef4444' },
  maintenance_fee:     { label: 'Tasa Mantenimiento',   color: '#f59e0b' },
  grace_period:        { label: 'Gracia',               color: '#f97316' },
  cancellation:        { label: 'Cancelación',          color: '#6b7280' },
  publication:         { label: 'Publicación',          color: '#06b6d4' },
  filing:              { label: 'Presentación',         color: '#3b82f6' },
  payment:             { label: 'Pago',                 color: '#22c55e' },
  default:             { label: 'Otro',                 color: '#94a3b8' },
};

export const URGENCY_COLORS: Record<string, string> = {
  overdue: '#ef4444',
  today:   '#ef4444',
  urgent:  '#f97316',
  week:    '#eab308',
  month:   '#22c55e',
  safe:    '#d1d5db',
};

export function getUrgencyLevel(days: number): string {
  if (days < 0) return 'overdue';
  if (days === 0) return 'today';
  if (days <= 3) return 'urgent';
  if (days <= 7) return 'week';
  if (days <= 30) return 'month';
  return 'safe';
}
