/**
 * IP Market — Notification Types & Constants
 */

// ── All market notification type codes ──
export const MARKET_NOTIFICATION_TYPES = {
  OFFER_RECEIVED: 'market_offer_received',
  OFFER_ACCEPTED: 'market_offer_accepted',
  OFFER_REJECTED: 'market_offer_rejected',
  PAYMENT_RECEIVED: 'market_payment_received',
  MILESTONE_COMPLETED: 'market_milestone_completed',
  MILESTONE_APPROVED: 'market_milestone_approved',
  DELIVERY_COMPLETE: 'market_delivery_complete',
  PAYMENT_RELEASED: 'market_payment_released',
  DISPUTE_OPENED: 'market_dispute_opened',
  NEW_MESSAGE: 'market_new_message',
  REQUEST_EXPIRING: 'market_request_expiring',
} as const;

export type MarketNotificationType = typeof MARKET_NOTIFICATION_TYPES[keyof typeof MARKET_NOTIFICATION_TYPES];

// All market type values for filtering
export const ALL_MARKET_TYPES = Object.values(MARKET_NOTIFICATION_TYPES);

// ── Config per type: icon, color, category, tab mapping ──
export interface MarketNotificationConfig {
  label: string;
  icon: string;        // lucide icon name
  color: string;
  bgColor: string;
  /** Which Market tab this notification relates to */
  tab: 'rfq' | 'offers' | 'transactions' | 'messages' | 'general';
}

export const MARKET_NOTIFICATION_CONFIG: Record<MarketNotificationType, MarketNotificationConfig> = {
  [MARKET_NOTIFICATION_TYPES.OFFER_RECEIVED]: {
    label: 'Oferta recibida',
    icon: 'MessageSquare',
    color: '#3b82f6',
    bgColor: 'rgba(59,130,246,0.08)',
    tab: 'rfq',
  },
  [MARKET_NOTIFICATION_TYPES.OFFER_ACCEPTED]: {
    label: 'Oferta aceptada',
    icon: 'CheckCircle',
    color: '#10b981',
    bgColor: 'rgba(16,185,129,0.08)',
    tab: 'offers',
  },
  [MARKET_NOTIFICATION_TYPES.OFFER_REJECTED]: {
    label: 'Oferta no seleccionada',
    icon: 'XCircle',
    color: '#ef4444',
    bgColor: 'rgba(239,68,68,0.08)',
    tab: 'offers',
  },
  [MARKET_NOTIFICATION_TYPES.PAYMENT_RECEIVED]: {
    label: 'Pago recibido',
    icon: 'CreditCard',
    color: '#f59e0b',
    bgColor: 'rgba(245,158,11,0.08)',
    tab: 'transactions',
  },
  [MARKET_NOTIFICATION_TYPES.MILESTONE_COMPLETED]: {
    label: 'Milestone completado',
    icon: 'Flag',
    color: '#8b5cf6',
    bgColor: 'rgba(139,92,246,0.08)',
    tab: 'transactions',
  },
  [MARKET_NOTIFICATION_TYPES.MILESTONE_APPROVED]: {
    label: 'Milestone aprobado',
    icon: 'CheckCircle',
    color: '#10b981',
    bgColor: 'rgba(16,185,129,0.08)',
    tab: 'transactions',
  },
  [MARKET_NOTIFICATION_TYPES.DELIVERY_COMPLETE]: {
    label: 'Servicio completado',
    icon: 'Package',
    color: '#00b4d8',
    bgColor: 'rgba(0,180,216,0.08)',
    tab: 'transactions',
  },
  [MARKET_NOTIFICATION_TYPES.PAYMENT_RELEASED]: {
    label: 'Pago liberado',
    icon: 'DollarSign',
    color: '#10b981',
    bgColor: 'rgba(16,185,129,0.08)',
    tab: 'transactions',
  },
  [MARKET_NOTIFICATION_TYPES.DISPUTE_OPENED]: {
    label: 'Disputa abierta',
    icon: 'AlertTriangle',
    color: '#ef4444',
    bgColor: 'rgba(239,68,68,0.08)',
    tab: 'transactions',
  },
  [MARKET_NOTIFICATION_TYPES.NEW_MESSAGE]: {
    label: 'Nuevo mensaje',
    icon: 'MessageCircle',
    color: '#6366f1',
    bgColor: 'rgba(99,102,241,0.08)',
    tab: 'messages',
  },
  [MARKET_NOTIFICATION_TYPES.REQUEST_EXPIRING]: {
    label: 'Solicitud por expirar',
    icon: 'Clock',
    color: '#f97316',
    bgColor: 'rgba(249,115,22,0.08)',
    tab: 'rfq',
  },
};

// ── Tab badge counts helper ──
export type MarketTab = 'rfq' | 'offers' | 'transactions';

export function getTabFromType(type: MarketNotificationType): MarketTab | null {
  const config = MARKET_NOTIFICATION_CONFIG[type];
  if (!config) return null;
  if (config.tab === 'rfq') return 'rfq';
  if (config.tab === 'offers') return 'offers';
  if (config.tab === 'transactions') return 'transactions';
  return null;
}
