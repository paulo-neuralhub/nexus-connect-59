export const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  // Offensive
  draft: { label: 'Borrador', variant: 'secondary' },
  filed: { label: 'Presentada', variant: 'default' },
  examining: { label: 'En curso', variant: 'default' },
  resolved: { label: 'Resuelta', variant: 'outline' },
  // Defensive
  received: { label: 'Recibida', variant: 'destructive' },
  defending: { label: 'En defensa', variant: 'default' },
  hearing: { label: 'Audiencia', variant: 'default' },
  // Coexistence
  negotiating: { label: 'Negociando', variant: 'secondary' },
  active: { label: 'Activo', variant: 'default' },
  expired: { label: 'Expirado', variant: 'outline' },
  terminated: { label: 'Terminado', variant: 'destructive' },
};

export const OUTCOME_CONFIG: Record<string, { label: string; color: string }> = {
  won: { label: 'Ganada', color: '#22c55e' },
  lost: { label: 'Perdida', color: '#ef4444' },
  agreement: { label: 'Acuerdo', color: '#3b82f6' },
  withdrawn: { label: 'Retirada', color: '#6b7280' },
  maintained: { label: 'Mantenida', color: '#22c55e' },
  partial: { label: 'Parcial', color: '#f59e0b' },
  revoked: { label: 'Revocada', color: '#ef4444' },
};

export const GROUNDS_CONFIG: Record<string, { label: string; color: string }> = {
  relative: { label: 'Anterioridad', color: '#7c3aed' },
  absolute: { label: 'Absoluto', color: '#ef4444' },
  bad_faith: { label: 'Mala fe', color: '#dc2626' },
  descriptiveness: { label: 'Descriptividad', color: '#f59e0b' },
  deceptiveness: { label: 'Engaño', color: '#ea580c' },
  public_policy: { label: 'Orden público', color: '#6b7280' },
};

export function getDeadlineUrgency(deadline: string | null): { level: string; color: string; label: string } {
  if (!deadline) return { level: 'none', color: '#d1d5db', label: 'Sin plazo' };
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return { level: 'overdue', color: '#ef4444', label: `Vencido (${Math.abs(days)}d)` };
  if (days === 0) return { level: 'today', color: '#ef4444', label: 'Hoy' };
  if (days <= 3) return { level: 'urgent', color: '#f97316', label: `${days}d` };
  if (days <= 7) return { level: 'week', color: '#eab308', label: `${days}d` };
  if (days <= 30) return { level: 'month', color: '#22c55e', label: `${days}d` };
  return { level: 'safe', color: '#d1d5db', label: `${days}d` };
}
