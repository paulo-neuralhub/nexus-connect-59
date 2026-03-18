// ============================================================
// TEMPLATE THUMBNAIL SVG — Realistic A4 document previews
// 15 types × 4 styles = 60 unique visual combinations
// ============================================================

import * as React from 'react';

// ── STYLE PALETTES ──────────────────────────────────────────
export const STYLE_COLORS = {
  clasico: {
    accent: '#1a1a1a',
    accent2: '#666666',
    light: '#f5f5f5',
    headerBg: '#1a1a1a',
    headerBg2: '#333333',
    tableBg: '#1a1a1a',
    tableAlt: '#f9f9f9',
    border: '#cccccc',
    gold: '#666666',
    totalBg: '#1a1a1a',
    badgeBg: '#f0f0f0',
    badgeText: '#333333',
  },
  elegante: {
    accent: '#1E293B',
    accent2: '#B8860B',
    light: '#FFFDF5',
    headerBg: '#1E293B',
    headerBg2: '#334155',
    tableBg: '#1E293B',
    tableAlt: '#FAFAF5',
    border: '#D4AF37',
    gold: '#B8860B',
    totalBg: '#1E293B',
    badgeBg: '#FEF9E7',
    badgeText: '#92400E',
  },
  moderno: {
    accent: '#2563EB',
    accent2: '#334155',
    light: '#EFF6FF',
    headerBg: '#2563EB',
    headerBg2: '#1D4ED8',
    tableBg: '#2563EB',
    tableAlt: '#F8FAFC',
    border: '#DBEAFE',
    gold: '#2563EB',
    totalBg: '#2563EB',
    badgeBg: '#EFF6FF',
    badgeText: '#1E40AF',
  },
  sofisticado: {
    accent: '#6366F1',
    accent2: '#4F46E5',
    light: '#EEF2FF',
    headerBg: '#6366F1',
    headerBg2: '#4F46E5',
    tableBg: '#6366F1',
    tableAlt: '#FAFAFF',
    border: '#C7D2FE',
    gold: '#6366F1',
    totalBg: '#6366F1',
    badgeBg: '#EEF2FF',
    badgeText: '#4338CA',
  },
} as const;

export type StyleKey = keyof typeof STYLE_COLORS;

interface ThumbnailProps {
  style?: StyleKey;
  tenantName?: string;
  className?: string;
}

// ── HELPERS ──────────────────────────────────────────────────
const TextLines = ({ x, y, count, width = 140 }: { x: number; y: number; count: number; width?: number }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <rect key={i} x={x} y={y + i * 7} width={i === count - 1 ? width * 0.65 : width} height={2.5} rx={1.2} fill="#d1d5db" />
    ))}
  </>
);

const LogoPlaceholder = ({ x, y, color }: { x: number; y: number; color: string }) => (
  <g>
    <rect x={x} y={y} width="16" height="10" rx="2" fill={color} opacity="0.15" stroke={color} strokeWidth="0.3" />
    <text x={x + 8} y={y + 7} fill={color} fontSize="3.5" fontWeight="700" textAnchor="middle">IP</text>
  </g>
);

// Elegant header line for "elegante" style
const GoldLine = ({ y, color }: { y: number; color: string }) => (
  <g>
    <line x1="14" y1={y} x2="196" y2={y} stroke={color} strokeWidth="0.5" />
    <line x1="14" y1={y + 1.5} x2="196" y2={y + 1.5} stroke={color} strokeWidth="0.2" />
  </g>
);

// ═════════════════════════════════════════════════════════════
// FACTURA
// ═════════════════════════════════════════════════════════════
export function FacturaSVG({ style = 'moderno', tenantName = 'Mi Empresa S.L.' }: ThumbnailProps) {
  const c = STYLE_COLORS[style];
  const isClassic = style === 'clasico';
  const isElegant = style === 'elegante';
  return (
    <svg viewBox="0 0 210 297" className="w-full h-full" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <rect width="210" height="297" fill="white" rx="2" stroke="#e2e8f0" strokeWidth="0.5" />
      {/* Header */}
      {isClassic ? (
        <g>
          <LogoPlaceholder x={14} y={10} color={c.accent} />
          <text x="36" y="17" fill="#1a1a1a" fontSize="5" fontWeight="700">{tenantName}</text>
          <text x="36" y="23" fill="#666" fontSize="3.2">C/ Gran Vía 42, 28013 Madrid · CIF: B-12345678</text>
          <text x="196" y="14" fill="#1a1a1a" fontSize="9" fontWeight="700" textAnchor="end">FACTURA</text>
          <text x="196" y="22" fill="#666" fontSize="3.5" textAnchor="end">Nº FAC-2026-001</text>
          <line x1="14" y1="28" x2="196" y2="28" stroke="#ccc" strokeWidth="0.5" />
        </g>
      ) : isElegant ? (
        <g>
          <rect width="210" height="36" fill={c.headerBg} />
          <LogoPlaceholder x={14} y={8} color="white" />
          <text x="36" y="16" fill="white" fontSize="5" fontWeight="700">{tenantName}</text>
          <text x="36" y="23" fill="white" fontSize="3" opacity="0.7">C/ Gran Vía 42, 28013 Madrid</text>
          <text x="196" y="16" fill="white" fontSize="8" fontWeight="700" textAnchor="end">FACTURA</text>
          <text x="196" y="24" fill={c.gold} fontSize="3.5" textAnchor="end">Nº FAC-2026-001</text>
          <rect y="36" width="210" height="1.5" fill={c.gold} />
        </g>
      ) : (
        <g>
          {style === 'sofisticado' && <defs><linearGradient id="hg1" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={c.headerBg} /><stop offset="100%" stopColor={c.headerBg2} /></linearGradient></defs>}
          <rect width="210" height="38" fill={style === 'sofisticado' ? 'url(#hg1)' : c.headerBg} rx={style === 'moderno' ? 0 : 0} />
          <text x="14" y="16" fill="white" fontSize="5.5" fontWeight="700">{tenantName}</text>
          <text x="14" y="24" fill="white" fontSize="3" opacity="0.75">C/ Gran Vía 42, 28013 Madrid · CIF: B-12345678</text>
          <text x="196" y="16" fill="white" fontSize="9" fontWeight="700" textAnchor="end">FACTURA</text>
          <text x="196" y="25" fill="white" fontSize="3.5" opacity="0.8" textAnchor="end">Nº FAC-2026-001</text>
        </g>
      )}
      {/* Client block */}
      {(() => { const top = isClassic ? 34 : 46; return (
        <g>
          <rect x="14" y={top} width="95" height="26" rx="3" fill={c.light} stroke={isElegant ? c.gold : '#e2e8f0'} strokeWidth="0.3" />
          <text x="18" y={top + 8} fill="#94a3b8" fontSize="3">Cliente</text>
          <text x="18" y={top + 14} fill="#1e293b" fontSize="3.8" fontWeight="600">Empresa Demo S.A.</text>
          <text x="18" y={top + 20} fill="#94a3b8" fontSize="3">Av. Constitución 15, Madrid · A-87654321</text>
          <text x="196" y={top + 8} fill="#94a3b8" fontSize="3" textAnchor="end">Fecha: 06/02/2026</text>
        </g>
      );})()}
      {/* Table */}
      {(() => { const tTop = isClassic ? 68 : 80; return (
        <g>
          <rect x="14" y={tTop} width="182" height="11" rx={isClassic ? 0 : 2} fill={c.tableBg} />
          <text x="18" y={tTop + 7.5} fill="white" fontSize="3.5" fontWeight="600">Concepto</text>
          <text x="125" y={tTop + 7.5} fill="white" fontSize="3.5" fontWeight="600">Uds.</text>
          <text x="150" y={tTop + 7.5} fill="white" fontSize="3.5" fontWeight="600">Precio</text>
          <text x="185" y={tTop + 7.5} fill="white" fontSize="3.5" fontWeight="600" textAnchor="end">Importe</text>
          {[
            { label: 'Registro de marca nacional', price: '400,00' },
            { label: 'Tasas oficiales OEPM', price: '550,00' },
            { label: 'Búsqueda anterioridades', price: '100,00' },
          ].map((row, i) => (
            <React.Fragment key={i}>
              <rect x="14" y={tTop + 11 + i * 13} width="182" height="13" fill={i % 2 === 0 ? c.tableAlt : 'white'} />
              <text x="18" y={tTop + 19 + i * 13} fill="#334155" fontSize="3.5">{row.label}</text>
              <text x="129" y={tTop + 19 + i * 13} fill="#334155" fontSize="3.5">1</text>
              <text x="150" y={tTop + 19 + i * 13} fill="#334155" fontSize="3.5">€{row.price}</text>
              <text x="185" y={tTop + 19 + i * 13} fill="#334155" fontSize="3.5" textAnchor="end">€{row.price}</text>
              {isClassic && <line x1="14" y1={tTop + 24 + i * 13} x2="196" y2={tTop + 24 + i * 13} stroke="#ddd" strokeWidth="0.3" />}
            </React.Fragment>
          ))}
          {/* Totals */}
          <text x="150" y={tTop + 56} fill="#64748b" fontSize="3">Subtotal</text>
          <text x="185" y={tTop + 56} fill="#334155" fontSize="3.5" textAnchor="end">€1.050,00</text>
          <text x="150" y={tTop + 63} fill="#64748b" fontSize="3">IVA (21%)</text>
          <text x="185" y={tTop + 63} fill="#334155" fontSize="3.5" textAnchor="end">€220,50</text>
          {isElegant && <line x1="140" y1={tTop + 66} x2="196" y2={tTop + 66} stroke={c.gold} strokeWidth="0.3" />}
          <rect x="140" y={tTop + 68} width="56" height="13" rx={isClassic ? 0 : 2} fill={c.totalBg} />
          <text x="145" y={tTop + 76.5} fill="white" fontSize="4.5" fontWeight="700">TOTAL</text>
          <text x="191" y={tTop + 76.5} fill="white" fontSize="4.5" fontWeight="700" textAnchor="end">€1.270,50</text>
        </g>
      );})()}
      {/* Payment info */}
      <text x="14" y="195" fill="#94a3b8" fontSize="3">Forma de pago: Transferencia bancaria</text>
      <text x="14" y="201" fill="#94a3b8" fontSize="3">IBAN: ES12 3456 7890 1234 5678 9012</text>
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════
// PRESUPUESTO
// ═════════════════════════════════════════════════════════════
export function PresupuestoSVG({ style = 'moderno', tenantName = 'Mi Empresa S.L.' }: ThumbnailProps) {
  const c = STYLE_COLORS[style];
  const isClassic = style === 'clasico';
  return (
    <svg viewBox="0 0 210 297" className="w-full h-full" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <rect width="210" height="297" fill="white" rx="2" stroke="#e2e8f0" strokeWidth="0.5" />
      {isClassic ? (
        <g>
          <text x="14" y="16" fill="#1a1a1a" fontSize="5" fontWeight="700">{tenantName}</text>
          <text x="196" y="16" fill="#1a1a1a" fontSize="9" fontWeight="700" textAnchor="end">PRESUPUESTO</text>
          <text x="196" y="24" fill="#666" fontSize="3.5" textAnchor="end">Nº PRE-2026-015</text>
          <line x1="14" y1="28" x2="196" y2="28" stroke="#ccc" strokeWidth="0.5" />
        </g>
      ) : (
        <g>
          {style === 'sofisticado' && <defs><linearGradient id="hgp" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={c.headerBg} /><stop offset="100%" stopColor={c.headerBg2} /></linearGradient></defs>}
          <rect width="210" height="38" fill={style === 'sofisticado' ? 'url(#hgp)' : c.headerBg} />
          <text x="14" y="16" fill="white" fontSize="5.5" fontWeight="700">{tenantName}</text>
          <text x="14" y="24" fill="white" fontSize="3" opacity="0.75">C/ Gran Vía 42, 28013 Madrid</text>
          <text x="196" y="16" fill="white" fontSize="8" fontWeight="700" textAnchor="end">PRESUPUESTO</text>
          <text x="196" y="25" fill="white" fontSize="3.5" opacity="0.8" textAnchor="end">Nº PRE-2026-015</text>
          {style === 'elegante' && <rect y="38" width="210" height="1.5" fill={c.gold} />}
        </g>
      )}
      {/* Validity badge */}
      <rect x="148" y={isClassic ? 30 : 42} width="48" height="10" rx="5" fill={c.badgeBg} stroke={c.accent} strokeWidth="0.3" />
      <text x="172" y={isClassic ? 37 : 49} fill={c.badgeText} fontSize="3.2" fontWeight="700" textAnchor="middle">✓ Válido 30 días</text>
      {/* Client */}
      {(() => { const top = isClassic ? 44 : 56; return (
        <g>
          <text x="14" y={top} fill="#94a3b8" fontSize="3">Para:</text>
          <text x="14" y={top + 7} fill="#1e293b" fontSize="4" fontWeight="600">Empresa Demo S.A.</text>
          <text x="14" y={top + 13} fill="#94a3b8" fontSize="3">María García López · A-87654321</text>
        </g>
      );})()}
      {/* Table */}
      {(() => { const tTop = isClassic ? 64 : 76; return (
        <g>
          <rect x="14" y={tTop} width="182" height="11" rx={isClassic ? 0 : 2} fill={c.tableBg} />
          <text x="18" y={tTop + 7.5} fill="white" fontSize="3.5" fontWeight="600">Servicio</text>
          <text x="125" y={tTop + 7.5} fill="white" fontSize="3.5" fontWeight="600">Uds.</text>
          <text x="150" y={tTop + 7.5} fill="white" fontSize="3.5" fontWeight="600">Precio</text>
          <text x="185" y={tTop + 7.5} fill="white" fontSize="3.5" fontWeight="600" textAnchor="end">Total</text>
          {[
            { l: 'Registro marca nacional', p: '400,00' },
            { l: 'Informe anterioridades', p: '250,00' },
            { l: 'Asesoramiento estratégico', p: '300,00' },
          ].map((r, i) => (
            <React.Fragment key={i}>
              <rect x="14" y={tTop + 11 + i * 13} width="182" height="13" fill={i % 2 === 0 ? c.tableAlt : 'white'} />
              <text x="18" y={tTop + 19 + i * 13} fill="#334155" fontSize="3.5">{r.l}</text>
              <text x="129" y={tTop + 19 + i * 13} fill="#334155" fontSize="3.5">1</text>
              <text x="150" y={tTop + 19 + i * 13} fill="#334155" fontSize="3.5">€{r.p}</text>
              <text x="185" y={tTop + 19 + i * 13} fill="#334155" fontSize="3.5" textAnchor="end">€{r.p}</text>
            </React.Fragment>
          ))}
          <rect x="140" y={tTop + 52} width="56" height="13" rx={isClassic ? 0 : 2} fill={c.totalBg} />
          <text x="145" y={tTop + 60.5} fill="white" fontSize="4.5" fontWeight="700">TOTAL</text>
          <text x="191" y={tTop + 60.5} fill="white" fontSize="4.5" fontWeight="700" textAnchor="end">€950,00</text>
        </g>
      );})()}
      {/* Conditions */}
      <text x="14" y="175" fill="#94a3b8" fontSize="3">Condiciones de pago: 50% inicio, 50% finalización</text>
      <TextLines x={14} y={182} count={2} />
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════
// NOTA DE CRÉDITO
// ═════════════════════════════════════════════════════════════
export function NotaCreditoSVG({ style = 'moderno', tenantName = 'Mi Empresa S.L.' }: ThumbnailProps) {
  const c = STYLE_COLORS[style];
  const isClassic = style === 'clasico';
  return (
    <svg viewBox="0 0 210 297" className="w-full h-full" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <rect width="210" height="297" fill="white" rx="2" stroke="#e2e8f0" strokeWidth="0.5" />
      {isClassic ? (
        <g>
          <text x="14" y="16" fill="#1a1a1a" fontSize="5" fontWeight="700">{tenantName}</text>
          <text x="196" y="16" fill="#1a1a1a" fontSize="7" fontWeight="700" textAnchor="end">NOTA DE CRÉDITO</text>
          <text x="196" y="24" fill="#666" fontSize="3.5" textAnchor="end">Nº NC-2026-003</text>
          <line x1="14" y1="28" x2="196" y2="28" stroke="#ccc" strokeWidth="0.5" />
        </g>
      ) : (
        <g>
          <rect width="210" height="36" fill={c.headerBg} />
          <text x="14" y="16" fill="white" fontSize="5.5" fontWeight="700">{tenantName}</text>
          <text x="196" y="16" fill="white" fontSize="7" fontWeight="700" textAnchor="end">NOTA DE CRÉDITO</text>
          <text x="196" y="25" fill="white" fontSize="3.5" opacity="0.8" textAnchor="end">Nº NC-2026-003</text>
          {style === 'elegante' && <rect y="36" width="210" height="1.5" fill={c.gold} />}
        </g>
      )}
      {(() => { const top = isClassic ? 34 : 44; return (
        <g>
          <text x="14" y={top} fill="#94a3b8" fontSize="3">Ref. Factura: FAC-2026-001</text>
          <text x="14" y={top + 8} fill="#94a3b8" fontSize="3">Cliente:</text>
          <text x="14" y={top + 14} fill="#1e293b" fontSize="4" fontWeight="600">Empresa Demo S.A.</text>
          {/* Table */}
          <rect x="14" y={top + 22} width="182" height="11" rx={isClassic ? 0 : 2} fill={c.tableBg} />
          <text x="18" y={top + 29.5} fill="white" fontSize="3.5" fontWeight="600">Concepto</text>
          <text x="185" y={top + 29.5} fill="white" fontSize="3.5" fontWeight="600" textAnchor="end">Importe</text>
          <rect x="14" y={top + 33} width="182" height="13" fill="#fef2f2" />
          <text x="18" y={top + 41} fill="#334155" fontSize="3.5">Ajuste servicios profesionales</text>
          <text x="185" y={top + 41} fill="#dc2626" fontSize="3.8" fontWeight="700" textAnchor="end">-€200,00</text>
          <rect x="140" y={top + 50} width="56" height="13" rx={isClassic ? 0 : 2} fill="#dc2626" />
          <text x="145" y={top + 58.5} fill="white" fontSize="4" fontWeight="700">ABONO</text>
          <text x="191" y={top + 58.5} fill="white" fontSize="4" fontWeight="700" textAnchor="end">-€200,00</text>
          <text x="14" y={top + 76} fill="#94a3b8" fontSize="3">Forma de devolución: Abono en cuenta</text>
        </g>
      );})()}
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════
// RECIBO DE PAGO
// ═════════════════════════════════════════════════════════════
export function ReciboSVG({ style = 'moderno', tenantName = 'Mi Empresa S.L.' }: ThumbnailProps) {
  const c = STYLE_COLORS[style];
  const isClassic = style === 'clasico';
  return (
    <svg viewBox="0 0 210 297" className="w-full h-full" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <rect width="210" height="297" fill="white" rx="2" stroke="#e2e8f0" strokeWidth="0.5" />
      {isClassic ? (
        <g>
          <text x="14" y="16" fill="#1a1a1a" fontSize="5" fontWeight="700">{tenantName}</text>
          <text x="196" y="16" fill="#1a1a1a" fontSize="9" fontWeight="700" textAnchor="end">RECIBO</text>
          <text x="196" y="24" fill="#666" fontSize="3.5" textAnchor="end">Nº R-2026-0125</text>
          <line x1="14" y1="28" x2="196" y2="28" stroke="#ccc" strokeWidth="0.5" />
        </g>
      ) : (
        <g>
          <rect width="210" height="34" fill={c.headerBg} />
          <text x="105" y="16" fill="white" fontSize="9" fontWeight="700" textAnchor="middle">RECIBO</text>
          <text x="105" y="25" fill="white" fontSize="3.5" opacity="0.8" textAnchor="middle">Nº R-2026-0125</text>
          {style === 'elegante' && <rect y="34" width="210" height="1.5" fill={c.gold} />}
        </g>
      )}
      {/* Amount box */}
      {(() => { const top = isClassic ? 50 : 55; return (
        <g>
          <rect x="38" y={top} width="134" height="40" rx="6" fill={c.light} stroke={c.accent} strokeWidth={isClassic ? 0.5 : 1} />
          <text x="105" y={top + 25} fill={c.accent} fontSize="18" fontWeight="700" textAnchor="middle">€2.450,00</text>
          {/* Details */}
          <text x="30" y={top + 58} fill="#64748b" fontSize="3.5">Concepto:</text>
          <text x="75" y={top + 58} fill="#1e293b" fontSize="3.5">Servicios profesionales PI</text>
          <text x="30" y={top + 66} fill="#64748b" fontSize="3.5">Recibido de:</text>
          <text x="75" y={top + 66} fill="#1e293b" fontSize="3.5" fontWeight="600">Empresa Demo S.A.</text>
          <text x="30" y={top + 74} fill="#64748b" fontSize="3.5">Fecha:</text>
          <text x="75" y={top + 74} fill="#1e293b" fontSize="3.5">06/02/2026</text>
        </g>
      );})()}
      {/* PAGADO stamp */}
      <g transform="translate(105, 185) rotate(-12)">
        <rect x="-30" y="-12" width="60" height="24" rx="4" fill="none" stroke="#22c55e" strokeWidth="2.5" />
        <text x="0" y="5" fill="#22c55e" fontSize="12" fontWeight="700" textAnchor="middle">PAGADO</text>
      </g>
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════
// CARTA OFICIAL
// ═════════════════════════════════════════════════════════════
export function CartaOficialSVG({ style = 'moderno', tenantName = 'Mi Empresa S.L.' }: ThumbnailProps) {
  const c = STYLE_COLORS[style];
  const isClassic = style === 'clasico';
  const isElegant = style === 'elegante';
  return (
    <svg viewBox="0 0 210 297" className="w-full h-full" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <rect width="210" height="297" fill="white" rx="2" stroke="#e2e8f0" strokeWidth="0.5" />
      {/* Top accent */}
      {!isClassic && <rect width="210" height="4" fill={c.headerBg} />}
      {isElegant && <rect width="210" y="4" height="1" fill={c.gold} />}
      {/* Letterhead */}
      <LogoPlaceholder x={14} y={isClassic ? 10 : 14} color={c.accent} />
      <text x="36" y={isClassic ? 17 : 21} fill="#1e293b" fontSize="5" fontWeight="700">{tenantName}</text>
      <text x="36" y={isClassic ? 23 : 27} fill="#94a3b8" fontSize="3">C/ Gran Vía 42, 28013 Madrid · Tel: +34 91 555 0100</text>
      <line x1="14" y1={isClassic ? 28 : 32} x2="196" y2={isClassic ? 28 : 32} stroke={isElegant ? c.gold : '#e2e8f0'} strokeWidth={isElegant ? 0.5 : 0.3} />
      {/* Recipient */}
      <text x="14" y={isClassic ? 38 : 42} fill="#64748b" fontSize="3">A la atención de:</text>
      <text x="14" y={isClassic ? 45 : 49} fill="#1e293b" fontSize="4" fontWeight="600">María García López</text>
      <text x="14" y={isClassic ? 51 : 55} fill="#94a3b8" fontSize="3">Empresa Demo S.A. · Av. Constitución 15, Madrid</text>
      {/* Date */}
      <text x="196" y={isClassic ? 38 : 42} fill="#94a3b8" fontSize="3" textAnchor="end">Madrid, 6 de febrero de 2026</text>
      {/* Subject line */}
      <rect x="14" y={isClassic ? 58 : 62} width="182" height="0.5" fill={c.accent} />
      <text x="14" y={isClassic ? 68 : 72} fill="#1e293b" fontSize="3.8" fontWeight="600">Asunto: Registro de Marca — Ref: EXP-2026-001</text>
      {/* Body text */}
      <text x="14" y={isClassic ? 80 : 84} fill="#64748b" fontSize="3.5">Estimada Sra. García,</text>
      <TextLines x={14} y={isClassic ? 88 : 92} count={3} width={182} />
      <TextLines x={14} y={isClassic ? 112 : 116} count={4} width={182} />
      <TextLines x={14} y={isClassic ? 142 : 146} count={3} width={182} />
      {/* Signature */}
      <text x="14" y="195" fill="#334155" fontSize="3.5">Atentamente,</text>
      <line x1="14" y1="220" x2="75" y2="220" stroke="#334155" strokeWidth="0.3" />
      <text x="14" y="227" fill="#1e293b" fontSize="3.8" fontWeight="600">{tenantName}</text>
      <text x="14" y="233" fill="#94a3b8" fontSize="3">Agente de Propiedad Industrial</text>
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════
// CEASE & DESIST
// ═════════════════════════════════════════════════════════════
export function CeaseDesistSVG({ style = 'moderno', tenantName = 'Mi Empresa S.L.' }: ThumbnailProps) {
  const c = STYLE_COLORS[style];
  const isClassic = style === 'clasico';
  return (
    <svg viewBox="0 0 210 297" className="w-full h-full" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <rect width="210" height="297" fill="white" rx="2" stroke="#e2e8f0" strokeWidth="0.5" />
      {!isClassic && <rect width="210" height="4" fill={c.headerBg} />}
      {/* Warning badge */}
      <rect x="160" y={isClassic ? 8 : 10} width="34" height="12" rx="3" fill="#dc2626" />
      <text x="177" y={isClassic ? 16 : 18} fill="white" fontSize="4.5" fontWeight="700" textAnchor="middle">C&D</text>
      {/* Letterhead */}
      <text x="14" y={isClassic ? 16 : 18} fill="#1e293b" fontSize="5" fontWeight="700">{tenantName}</text>
      <line x1="14" y1={isClassic ? 22 : 24} x2="196" y2={isClassic ? 22 : 24} stroke="#dc2626" strokeWidth="0.8" />
      <text x="14" y={isClassic ? 32 : 34} fill="#dc2626" fontSize="5.5" fontWeight="700">CARTA DE CESE Y DESISTIMIENTO</text>
      {/* Parties */}
      <text x="14" y={isClassic ? 42 : 44} fill="#64748b" fontSize="3">De: {tenantName}</text>
      <text x="14" y={isClassic ? 48 : 50} fill="#64748b" fontSize="3">Para: <tspan fill="#1e293b" fontWeight="600">Empresa Demo S.A.</tspan></text>
      <text x="14" y={isClassic ? 54 : 56} fill="#64748b" fontSize="3">Ref: INF-2026-0042</text>
      {/* Body */}
      <TextLines x={14} y={isClassic ? 62 : 64} count={3} width={182} />
      {/* Demands */}
      <text x="14" y={isClassic ? 88 : 90} fill="#dc2626" fontSize="4" fontWeight="700">REQUERIMOS:</text>
      {['Cese inmediato del uso de la marca', 'Retirada de todos los productos'].map((d, i) => (
        <React.Fragment key={i}>
          <rect x="14" y={isClassic ? 94 + i * 16 : 96 + i * 16} width="3" height="10" rx="1" fill="#dc2626" />
          <text x="22" y={isClassic ? 100 + i * 16 : 102 + i * 16} fill="#1e293b" fontSize="3.5" fontWeight="600">{i + 1}. {d}</text>
          <TextLines x={22} y={isClassic ? 104 + i * 16 : 106 + i * 16} count={1} width={170} />
        </React.Fragment>
      ))}
      {/* Deadline */}
      <rect x="45" y={isClassic ? 130 : 132} width="120" height="16" rx="4" fill="#fef2f2" stroke="#fecaca" strokeWidth="0.5" />
      <text x="105" y={isClassic ? 140 : 142} fill="#dc2626" fontSize="5" fontWeight="700" textAnchor="middle">⚠ PLAZO: 10 días hábiles</text>
      {/* Signature */}
      <line x1="14" y1="170" x2="75" y2="170" stroke="#334155" strokeWidth="0.3" />
      <text x="14" y="177" fill="#1e293b" fontSize="3.5" fontWeight="600">Departamento Legal</text>
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════
// ACTA DE REUNIÓN
// ═════════════════════════════════════════════════════════════
export function ActaReunionSVG({ style = 'moderno', tenantName = 'Mi Empresa S.L.' }: ThumbnailProps) {
  const c = STYLE_COLORS[style];
  const isClassic = style === 'clasico';
  return (
    <svg viewBox="0 0 210 297" className="w-full h-full" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <rect width="210" height="297" fill="white" rx="2" stroke="#e2e8f0" strokeWidth="0.5" />
      {isClassic ? (
        <g>
          <text x="14" y="16" fill="#1a1a1a" fontSize="5" fontWeight="700">{tenantName}</text>
          <text x="105" y="32" fill="#1a1a1a" fontSize="7" fontWeight="700" textAnchor="middle">ACTA DE REUNIÓN</text>
          <line x1="14" y1="36" x2="196" y2="36" stroke="#ccc" strokeWidth="0.5" />
        </g>
      ) : (
        <g>
          <rect width="210" height="28" fill={c.headerBg} />
          <text x="105" y="14" fill="white" fontSize="7" fontWeight="700" textAnchor="middle">ACTA DE REUNIÓN</text>
          <text x="105" y="22" fill="white" fontSize="3.5" opacity="0.8" textAnchor="middle">15 Enero 2026 · 10:00-11:30</text>
          {style === 'elegante' && <rect y="28" width="210" height="1" fill={c.gold} />}
        </g>
      )}
      {/* Attendees */}
      {(() => { const top = isClassic ? 42 : 36; return (
        <g>
          <text x="14" y={top} fill="#94a3b8" fontSize="3">Fecha: 15 Enero 2026 · 10:00-11:30</text>
          <rect x="14" y={top + 6} width="86" height="26" rx="3" fill={c.light} stroke={c.border} strokeWidth="0.3" />
          <text x="18" y={top + 14} fill="#64748b" fontSize="3" fontWeight="600">Asistentes</text>
          <text x="18" y={top + 20} fill="#334155" fontSize="3">• Carlos Mendoza</text>
          <text x="18" y={top + 25} fill="#334155" fontSize="3">• María García</text>
          <rect x="110" y={top + 6} width="86" height="26" rx="3" fill={c.light} stroke={c.border} strokeWidth="0.3" />
          <text x="114" y={top + 14} fill="#64748b" fontSize="3" fontWeight="600">Ausentes</text>
          <text x="114" y={top + 20} fill="#94a3b8" fontSize="3">• Pedro Ruiz</text>
        </g>
      );})()}
      {/* Numbered points */}
      {(() => { const top = isClassic ? 82 : 76; return (
        <g>
          <text x="14" y={top} fill="#1e293b" fontSize="4" fontWeight="700">ORDEN DEL DÍA:</text>
          {['Revisión del expediente', 'Estrategia de protección', 'Próximos pasos y calendario'].map((p, i) => (
            <React.Fragment key={i}>
              <circle cx="22" cy={top + 12 + i * 24} r="5" fill={c.accent} />
              <text x="22" y={top + 14 + i * 24} fill="white" fontSize="4" fontWeight="700" textAnchor="middle">{i + 1}</text>
              <text x="32" y={top + 14 + i * 24} fill="#1e293b" fontSize="3.5" fontWeight="600">{p}</text>
              <TextLines x={32} y={top + 18 + i * 24} count={2} width={155} />
            </React.Fragment>
          ))}
        </g>
      );})()}
      {/* Signatures */}
      <line x1="14" y1="175" x2="60" y2="175" stroke="#334155" strokeWidth="0.3" />
      <text x="14" y="182" fill="#94a3b8" fontSize="3">Secretario</text>
      <line x1="130" y1="175" x2="196" y2="175" stroke="#334155" strokeWidth="0.3" />
      <text x="163" y="182" fill="#94a3b8" fontSize="3" textAnchor="middle">Presidente</text>
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════
// INFORME PORTFOLIO
// ═════════════════════════════════════════════════════════════
export function InformePortfolioSVG({ style = 'moderno', tenantName = 'Mi Empresa S.L.' }: ThumbnailProps) {
  const c = STYLE_COLORS[style];
  const isClassic = style === 'clasico';
  return (
    <svg viewBox="0 0 210 297" className="w-full h-full" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <rect width="210" height="297" fill="white" rx="2" stroke="#e2e8f0" strokeWidth="0.5" />
      {isClassic ? (
        <g>
          <text x="14" y="14" fill="#666" fontSize="3.5">{tenantName}</text>
          <text x="14" y="24" fill="#1a1a1a" fontSize="7" fontWeight="700">INFORME DE PORTFOLIO IP</text>
          <line x1="14" y1="28" x2="196" y2="28" stroke="#ccc" strokeWidth="0.5" />
        </g>
      ) : (
        <g>
          <rect width="210" height="28" fill={c.headerBg} />
          <text x="14" y="12" fill="white" fontSize="3.5" opacity="0.8">{tenantName}</text>
          <text x="14" y="22" fill="white" fontSize="7" fontWeight="700">INFORME DE PORTFOLIO IP</text>
          {style === 'elegante' && <rect y="28" width="210" height="1" fill={c.gold} />}
        </g>
      )}
      {/* Client + date */}
      <text x="14" y={isClassic ? 36 : 38} fill="#94a3b8" fontSize="3">Cliente: Empresa Demo S.A. · Fecha: 06/02/2026</text>
      {/* 4 KPIs */}
      {[
        { label: 'Marcas', value: '42' },
        { label: 'Patentes', value: '8' },
        { label: 'Pendientes', value: '5' },
        { label: 'Países', value: '12' },
      ].map((kpi, i) => (
        <React.Fragment key={i}>
          <rect x={14 + i * 47} y={isClassic ? 42 : 44} width="42" height="22" rx="3" fill={c.light} stroke={c.accent} strokeWidth="0.3" />
          <text x={35 + i * 47} y={isClassic ? 53 : 55} fill={c.accent} fontSize="8" fontWeight="700" textAnchor="middle">{kpi.value}</text>
          <text x={35 + i * 47} y={isClassic ? 60 : 62} fill="#64748b" fontSize="2.8" textAnchor="middle">{kpi.label}</text>
        </React.Fragment>
      ))}
      {/* Section title */}
      <text x="14" y={isClassic ? 76 : 78} fill="#1e293b" fontSize="4" fontWeight="700">Resumen Ejecutivo</text>
      <TextLines x={14} y={isClassic ? 82 : 84} count={2} />
      {/* Table */}
      {(() => { const tTop = isClassic ? 100 : 102; return (
        <g>
          <rect x="14" y={tTop} width="182" height="9" rx={isClassic ? 0 : 2} fill={c.tableBg} />
          <text x="18" y={tTop + 6.5} fill="white" fontSize="3" fontWeight="600">Activo</text>
          <text x="100" y={tTop + 6.5} fill="white" fontSize="3" fontWeight="600">Acción</text>
          <text x="160" y={tTop + 6.5} fill="white" fontSize="3" fontWeight="600">Fecha</text>
          {['MARCA PRINCIPAL', 'LOGO CORP', 'PATENTE-001'].map((a, i) => (
            <React.Fragment key={i}>
              <rect x="14" y={tTop + 9 + i * 10} width="182" height="10" fill={i % 2 === 0 ? c.tableAlt : 'white'} />
              <text x="18" y={tTop + 15.5 + i * 10} fill="#334155" fontSize="3">{a}</text>
              <text x="100" y={tTop + 15.5 + i * 10} fill="#64748b" fontSize="3">{['Renovación', 'Extensión', 'Anualidad'][i]}</text>
              <text x="160" y={tTop + 15.5 + i * 10} fill="#64748b" fontSize="3">{['15/03', '30/04', '15/05'][i]}</text>
            </React.Fragment>
          ))}
        </g>
      );})()}
      {/* Mini bar chart */}
      <text x="14" y="160" fill="#1e293b" fontSize="3.5" fontWeight="600">Distribución por tipo</text>
      {[30, 18, 10, 6].map((h, i) => (
        <rect key={i} x={24 + i * 22} y={180 - h} width="14" height={h} rx="2" fill={c.accent} opacity={1 - i * 0.2} />
      ))}
      <text x="14" y="190" fill="#94a3b8" fontSize="2.5">Marcas   Patentes  Diseños  Otros</text>
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════
// INFORME VIGILANCIA
// ═════════════════════════════════════════════════════════════
export function InformeVigilanciaSVG({ style = 'moderno', tenantName = 'Mi Empresa S.L.' }: ThumbnailProps) {
  const c = STYLE_COLORS[style];
  const isClassic = style === 'clasico';
  return (
    <svg viewBox="0 0 210 297" className="w-full h-full" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <rect width="210" height="297" fill="white" rx="2" stroke="#e2e8f0" strokeWidth="0.5" />
      {isClassic ? (
        <g>
          <text x="14" y="14" fill="#666" fontSize="3.5">{tenantName}</text>
          <text x="14" y="24" fill="#1a1a1a" fontSize="7" fontWeight="700">INFORME DE VIGILANCIA</text>
          <line x1="14" y1="28" x2="196" y2="28" stroke="#ccc" strokeWidth="0.5" />
        </g>
      ) : (
        <g>
          <rect width="210" height="28" fill={c.headerBg} />
          <text x="14" y="12" fill="white" fontSize="3.5" opacity="0.8">{tenantName}</text>
          <text x="14" y="22" fill="white" fontSize="7" fontWeight="700">INFORME DE VIGILANCIA</text>
        </g>
      )}
      {/* Alert badge */}
      <rect x="155" y={isClassic ? 8 : 6} width="40" height="12" rx="6" fill="#fbbf24" />
      <text x="175" y={isClassic ? 16 : 14} fill="#78350f" fontSize="3.5" fontWeight="700" textAnchor="middle">3 ALERTAS</text>
      {/* Period */}
      <text x="14" y={isClassic ? 36 : 38} fill="#94a3b8" fontSize="3">Periodo: Ene-Feb 2026</text>
      {/* Alert cards */}
      {[
        { level: '🔴', color: '#dc2626', bg: '#fef2f2', title: 'Alta: Marca similar', desc: '"NEXUX" en Clase 42 · Similitud: 87%' },
        { level: '🟡', color: '#f59e0b', bg: '#fffbeb', title: 'Media: Dominio', desc: 'ip-nexus.io registrado' },
        { level: '🟢', color: '#22c55e', bg: '#f0fdf4', title: 'Baja: Publicación', desc: 'Marca en boletín EUIPO' },
      ].map((alert, i) => (
        <React.Fragment key={i}>
          <rect x="14" y={isClassic ? 42 + i * 28 : 44 + i * 28} width="182" height="24" rx="3" fill={alert.bg} stroke={alert.color} strokeWidth="0.3" />
          <text x="20" y={isClassic ? 50 + i * 28 : 52 + i * 28} fill={alert.color} fontSize="3">{alert.level}</text>
          <text x="30" y={isClassic ? 52 + i * 28 : 54 + i * 28} fill="#1e293b" fontSize="3.5" fontWeight="600">{alert.title}</text>
          <text x="30" y={isClassic ? 59 + i * 28 : 61 + i * 28} fill="#64748b" fontSize="3">{alert.desc}</text>
        </React.Fragment>
      ))}
      {/* Recommendations */}
      <text x="14" y={isClassic ? 136 : 138} fill="#1e293b" fontSize="4" fontWeight="700">RECOMENDACIONES:</text>
      <TextLines x={14} y={isClassic ? 143 : 145} count={3} width={182} />
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════
// CONTRATO
// ═════════════════════════════════════════════════════════════
export function ContratoSVG({ style = 'moderno', tenantName = 'Mi Empresa S.L.', label = 'CONTRATO DE\nSERVICIOS PROFESIONALES' }: ThumbnailProps & { label?: string }) {
  const c = STYLE_COLORS[style];
  const isClassic = style === 'clasico';
  const lines = label.split('\n');
  return (
    <svg viewBox="0 0 210 297" className="w-full h-full" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <rect width="210" height="297" fill="white" rx="2" stroke="#e2e8f0" strokeWidth="0.5" />
      {isClassic ? (
        <g>
          <text x="105" y="18" fill="#1a1a1a" fontSize="7" fontWeight="700" textAnchor="middle">{lines[0]}</text>
          {lines[1] && <text x="105" y="26" fill="#1a1a1a" fontSize="5" textAnchor="middle">{lines[1]}</text>}
          <line x1="70" y1="30" x2="140" y2="30" stroke="#ccc" strokeWidth="0.5" />
        </g>
      ) : (
        <g>
          <rect width="210" height="28" fill={c.headerBg} />
          <text x="105" y={lines[1] ? 14 : 18} fill="white" fontSize="6" fontWeight="700" textAnchor="middle">{lines[0]}</text>
          {lines[1] && <text x="105" y="22" fill="white" fontSize="4.5" textAnchor="middle">{lines[1]}</text>}
          {style === 'elegante' && <rect y="28" width="210" height="1" fill={c.gold} />}
        </g>
      )}
      {/* Location + date */}
      <text x="14" y={isClassic ? 40 : 38} fill="#94a3b8" fontSize="3">En Madrid, a 6 de febrero de 2026</text>
      {/* Parties */}
      <text x="14" y={isClassic ? 50 : 48} fill="#1e293b" fontSize="3.5" fontWeight="700">REUNIDOS:</text>
      <rect x="14" y={isClassic ? 54 : 52} width="86" height="18" rx="3" fill={c.light} stroke={c.border} strokeWidth="0.3" />
      <text x="18" y={isClassic ? 61 : 59} fill="#64748b" fontSize="2.5">PARTE A</text>
      <text x="18" y={isClassic ? 67 : 65} fill="#1e293b" fontSize="3.5" fontWeight="600">Empresa Demo S.A.</text>
      <rect x="110" y={isClassic ? 54 : 52} width="86" height="18" rx="3" fill={c.light} stroke={c.border} strokeWidth="0.3" />
      <text x="114" y={isClassic ? 61 : 59} fill="#64748b" fontSize="2.5">PARTE B</text>
      <text x="114" y={isClassic ? 67 : 65} fill="#1e293b" fontSize="3.5" fontWeight="600">{tenantName}</text>
      {/* Clauses */}
      {['PRIMERA — Objeto', 'SEGUNDA — Precio', 'TERCERA — Duración', 'CUARTA — Confidencialidad'].map((cl, i) => {
        const yBase = (isClassic ? 80 : 78) + i * 26;
        return (
          <React.Fragment key={i}>
            <rect x="14" y={yBase} width={isClassic ? 0 : 3} height="8" rx="1" fill={c.accent} />
            <text x={isClassic ? 14 : 22} y={yBase + 6} fill="#1e293b" fontSize="3.5" fontWeight="600">{cl}</text>
            <TextLines x={isClassic ? 14 : 22} y={yBase + 10} count={2} width={isClassic ? 182 : 170} />
          </React.Fragment>
        );
      })}
      {/* Double signature */}
      <line x1="20" y1="200" x2="80" y2="200" stroke="#334155" strokeWidth="0.3" />
      <text x="50" y="207" fill="#64748b" fontSize="3" textAnchor="middle">PARTE A</text>
      <line x1="130" y1="200" x2="190" y2="200" stroke="#334155" strokeWidth="0.3" />
      <text x="160" y="207" fill="#64748b" fontSize="3" textAnchor="middle">PARTE B</text>
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════
// NDA — Unique design with lock icon
// ═════════════════════════════════════════════════════════════
export function NDASVG({ style = 'moderno', tenantName = 'Mi Empresa S.L.' }: ThumbnailProps) {
  const c = STYLE_COLORS[style];
  const isClassic = style === 'clasico';
  return (
    <svg viewBox="0 0 210 297" className="w-full h-full" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <rect width="210" height="297" fill="white" rx="2" stroke="#e2e8f0" strokeWidth="0.5" />
      {isClassic ? (
        <g>
          <text x="105" y="16" fill="#1a1a1a" fontSize="6" fontWeight="700" textAnchor="middle">ACUERDO DE CONFIDENCIALIDAD</text>
          <text x="105" y="24" fill="#666" fontSize="3.5" textAnchor="middle">(Non-Disclosure Agreement)</text>
          <line x1="60" y1="28" x2="150" y2="28" stroke="#ccc" strokeWidth="0.5" />
        </g>
      ) : (
        <g>
          <rect width="210" height="32" fill={c.headerBg} />
          <text x="105" y="14" fill="white" fontSize="5.5" fontWeight="700" textAnchor="middle">ACUERDO DE CONFIDENCIALIDAD</text>
          <text x="105" y="24" fill="white" fontSize="3.5" opacity="0.7" textAnchor="middle">(Non-Disclosure Agreement)</text>
          {style === 'elegante' && <rect y="32" width="210" height="1" fill={c.gold} />}
        </g>
      )}
      {/* Lock icon */}
      <circle cx="105" cy={isClassic ? 42 : 48} r="8" fill={c.light} stroke={c.accent} strokeWidth="0.5" />
      <text x="105" y={isClassic ? 45 : 51} fill={c.accent} fontSize="7" textAnchor="middle">🔒</text>
      {/* Parties */}
      <text x="14" y={isClassic ? 60 : 66} fill="#1e293b" fontSize="3.5" fontWeight="600">Partes:</text>
      <text x="14" y={isClassic ? 67 : 73} fill="#334155" fontSize="3.5">1. {tenantName} ("Parte Divulgante")</text>
      <text x="14" y={isClassic ? 73 : 79} fill="#334155" fontSize="3.5">2. Empresa Demo S.A. ("Parte Receptora")</text>
      {/* Sections */}
      {['1. DEFINICIONES', '2. OBLIGACIONES', '3. DURACIÓN: 2 años', '4. JURISDICCIÓN: España'].map((s, i) => {
        const yBase = (isClassic ? 84 : 90) + i * 20;
        return (
          <React.Fragment key={i}>
            <text x="14" y={yBase} fill="#1e293b" fontSize="3.5" fontWeight="600">{s}</text>
            <TextLines x={14} y={yBase + 4} count={2} width={182} />
          </React.Fragment>
        );
      })}
      {/* Double signature */}
      <line x1="20" y1="195" x2="80" y2="195" stroke="#334155" strokeWidth="0.3" />
      <text x="50" y="202" fill="#64748b" fontSize="3" textAnchor="middle">Parte Divulgante</text>
      <line x1="130" y1="195" x2="190" y2="195" stroke="#334155" strokeWidth="0.3" />
      <text x="160" y="202" fill="#64748b" fontSize="3" textAnchor="middle">Parte Receptora</text>
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════
// LICENCIA DE MARCA — Unique design
// ═════════════════════════════════════════════════════════════
export function LicenciaSVG({ style = 'moderno', tenantName = 'Mi Empresa S.L.' }: ThumbnailProps) {
  const c = STYLE_COLORS[style];
  const isClassic = style === 'clasico';
  return (
    <svg viewBox="0 0 210 297" className="w-full h-full" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <rect width="210" height="297" fill="white" rx="2" stroke="#e2e8f0" strokeWidth="0.5" />
      {isClassic ? (
        <g>
          <text x="105" y="16" fill="#1a1a1a" fontSize="6" fontWeight="700" textAnchor="middle">CONTRATO DE LICENCIA</text>
          <text x="105" y="24" fill="#666" fontSize="5" textAnchor="middle">DE MARCA</text>
          <line x1="60" y1="28" x2="150" y2="28" stroke="#ccc" strokeWidth="0.5" />
        </g>
      ) : (
        <g>
          <rect width="210" height="28" fill={c.headerBg} />
          <text x="105" y="13" fill="white" fontSize="6" fontWeight="700" textAnchor="middle">CONTRATO DE LICENCIA</text>
          <text x="105" y="22" fill="white" fontSize="4.5" textAnchor="middle">DE MARCA</text>
          {style === 'elegante' && <rect y="28" width="210" height="1" fill={c.gold} />}
        </g>
      )}
      {/* Parties */}
      <text x="14" y={isClassic ? 38 : 40} fill="#64748b" fontSize="3">Licenciante: <tspan fill="#1e293b" fontWeight="600">{tenantName}</tspan></text>
      <text x="14" y={isClassic ? 45 : 47} fill="#64748b" fontSize="3">Licenciatario: <tspan fill="#1e293b" fontWeight="600">Empresa Demo S.A.</tspan></text>
      {/* Trademark object box */}
      <rect x="25" y={isClassic ? 54 : 56} width="160" height="30" rx="4" fill={c.light} stroke={c.accent} strokeWidth="0.5" />
      <text x="105" y={isClassic ? 64 : 66} fill="#64748b" fontSize="3" textAnchor="middle">MARCA OBJETO:</text>
      <text x="105" y={isClassic ? 71 : 73} fill="#1e293b" fontSize="5" fontWeight="700" textAnchor="middle">[Denominación]</text>
      <text x="105" y={isClassic ? 78 : 80} fill="#64748b" fontSize="3" textAnchor="middle">Nº Registro: XXXXXXX · Clases: 9, 35, 42</text>
      {/* Key terms */}
      {[
        { label: 'TERRITORIO', value: 'España + Unión Europea' },
        { label: 'DURACIÓN', value: '3 años' },
        { label: 'ROYALTY', value: '5% ventas netas' },
      ].map((t, i) => (
        <React.Fragment key={i}>
          <text x="14" y={(isClassic ? 98 : 100) + i * 12} fill="#64748b" fontSize="3" fontWeight="600">{t.label}:</text>
          <text x="60" y={(isClassic ? 98 : 100) + i * 12} fill="#1e293b" fontSize="3.5">{t.value}</text>
        </React.Fragment>
      ))}
      <TextLines x={14} y={isClassic ? 138 : 140} count={3} width={182} />
      {/* Double signature */}
      <line x1="20" y1="185" x2="80" y2="185" stroke="#334155" strokeWidth="0.3" />
      <text x="50" y="192" fill="#64748b" fontSize="3" textAnchor="middle">Licenciante</text>
      <line x1="130" y1="185" x2="190" y2="185" stroke="#334155" strokeWidth="0.3" />
      <text x="160" y="192" fill="#64748b" fontSize="3" textAnchor="middle">Licenciatario</text>
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════
// PODER NOTARIAL
// ═════════════════════════════════════════════════════════════
export function PoderNotarialSVG({ style = 'moderno', tenantName = 'Mi Empresa S.L.' }: ThumbnailProps) {
  const c = STYLE_COLORS[style];
  const isClassic = style === 'clasico';
  return (
    <svg viewBox="0 0 210 297" className="w-full h-full" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <rect width="210" height="297" fill="white" rx="2" stroke="#e2e8f0" strokeWidth="0.5" />
      {isClassic ? (
        <g>
          <text x="105" y="16" fill="#1a1a1a" fontSize="7" fontWeight="700" textAnchor="middle">PODER NOTARIAL</text>
          <text x="105" y="24" fill="#666" fontSize="3.5" textAnchor="middle">Para representación ante oficinas de PI</text>
          <line x1="50" y1="28" x2="160" y2="28" stroke="#ccc" strokeWidth="0.5" />
        </g>
      ) : (
        <g>
          <rect width="210" height="28" fill={c.headerBg} />
          <text x="105" y="14" fill="white" fontSize="7" fontWeight="700" textAnchor="middle">PODER NOTARIAL</text>
          <text x="105" y="23" fill="white" fontSize="3.5" opacity="0.8" textAnchor="middle">Para representación ante oficinas de PI</text>
          {style === 'elegante' && <rect y="28" width="210" height="1" fill={c.gold} />}
        </g>
      )}
      {/* Parties */}
      <rect x="14" y={isClassic ? 34 : 36} width="86" height="20" rx="3" fill={c.light} stroke={c.border} strokeWidth="0.3" />
      <text x="18" y={isClassic ? 42 : 44} fill="#64748b" fontSize="2.5">PODERDANTE</text>
      <text x="18" y={isClassic ? 49 : 51} fill="#1e293b" fontSize="3.5" fontWeight="600">Empresa Demo S.A.</text>
      <rect x="110" y={isClassic ? 34 : 36} width="86" height="20" rx="3" fill={c.light} stroke={c.border} strokeWidth="0.3" />
      <text x="114" y={isClassic ? 42 : 44} fill="#64748b" fontSize="2.5">APODERADO</text>
      <text x="114" y={isClassic ? 49 : 51} fill="#1e293b" fontSize="3.5" fontWeight="600">{tenantName}</text>
      {/* Offices */}
      <rect x="35" y={isClassic ? 60 : 62} width="140" height="18" rx="4" fill={c.light} />
      <text x="105" y={isClassic ? 69 : 71} fill={c.accent} fontSize="3" fontWeight="600" textAnchor="middle">Oficinas Autorizadas</text>
      <text x="105" y={isClassic ? 75 : 77} fill="#64748b" fontSize="3" textAnchor="middle">🇪🇸 OEPM · 🇪🇺 EUIPO · 🌐 WIPO</text>
      {/* Faculties */}
      <text x="14" y={isClassic ? 88 : 90} fill="#1e293b" fontSize="3.5" fontWeight="700">FACULTADES:</text>
      <TextLines x={14} y={isClassic ? 94 : 96} count={4} width={182} />
      <TextLines x={14} y={isClassic ? 126 : 128} count={3} width={182} />
      {/* Notary seal + signature */}
      <circle cx="105" cy="172" r="10" fill="none" stroke={c.accent} strokeWidth="0.8" />
      <text x="105" y="174" fill={c.accent} fontSize="3" fontWeight="700" textAnchor="middle">NOTARIO</text>
      <line x1="14" y1="195" x2="65" y2="195" stroke="#334155" strokeWidth="0.3" />
      <text x="40" y="202" fill="#64748b" fontSize="3" textAnchor="middle">Poderdante</text>
      <line x1="145" y1="195" x2="196" y2="195" stroke="#334155" strokeWidth="0.3" />
      <text x="170" y="202" fill="#64748b" fontSize="3" textAnchor="middle">Apoderado</text>
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════
// CERTIFICADO DE REGISTRO
// ═════════════════════════════════════════════════════════════
export function CertificadoSVG({ style = 'moderno', tenantName = 'Mi Empresa S.L.' }: ThumbnailProps) {
  const c = STYLE_COLORS[style];
  return (
    <svg viewBox="0 0 210 297" className="w-full h-full" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <rect width="210" height="297" fill="white" rx="2" stroke="#e2e8f0" strokeWidth="0.5" />
      {/* Decorative border */}
      <rect x="8" y="8" width="194" height="281" rx="3" fill="none" stroke={c.accent} strokeWidth="0.5" strokeDasharray="2,2" />
      <rect x="12" y="12" width="186" height="273" rx="2" fill="none" stroke={c.accent} strokeWidth="0.3" />
      {/* Central layout */}
      <text x="105" y="38" fill={c.accent} fontSize="3" fontWeight="600" textAnchor="middle" letterSpacing="2">OFICINA DE PROPIEDAD INTELECTUAL</text>
      {/* Seal */}
      <circle cx="105" cy="65" r="15" fill={c.light} stroke={c.accent} strokeWidth="0.8" />
      <circle cx="105" cy="65" r="11" fill="none" stroke={c.accent} strokeWidth="0.3" />
      <text x="105" y="69" fill={c.accent} fontSize="10" fontWeight="700" textAnchor="middle">✓</text>
      {/* Title */}
      <text x="105" y="95" fill="#1e293b" fontSize="9" fontWeight="700" textAnchor="middle">CERTIFICADO</text>
      <text x="105" y="104" fill="#1e293b" fontSize="5" textAnchor="middle">DE REGISTRO DE MARCA</text>
      <rect x="75" y="108" width="60" height="1" fill={c.accent} />
      {/* Trademark name */}
      <text x="105" y="124" fill="#64748b" fontSize="3.5" textAnchor="middle">Se certifica que la marca</text>
      <text x="105" y="138" fill="#1e293b" fontSize="10" fontWeight="700" textAnchor="middle">[DENOMINACIÓN]</text>
      {/* Data grid */}
      <rect x="30" y="150" width="70" height="18" rx="3" fill={c.light} />
      <text x="65" y="159" fill="#64748b" fontSize="2.5" textAnchor="middle">Nº Registro</text>
      <text x="65" y="165" fill="#1e293b" fontSize="3.5" fontWeight="600" textAnchor="middle">XXXXXXX</text>
      <rect x="110" y="150" width="70" height="18" rx="3" fill={c.light} />
      <text x="145" y="159" fill="#64748b" fontSize="2.5" textAnchor="middle">Titular</text>
      <text x="145" y="165" fill="#1e293b" fontSize="3.5" fontWeight="600" textAnchor="middle">Empresa Demo S.A.</text>
      <rect x="30" y="172" width="70" height="18" rx="3" fill={c.light} />
      <text x="65" y="181" fill="#64748b" fontSize="2.5" textAnchor="middle">Clases Nice</text>
      <text x="65" y="187" fill="#1e293b" fontSize="3.5" fontWeight="600" textAnchor="middle">9, 35, 42</text>
      <rect x="110" y="172" width="70" height="18" rx="3" fill={c.light} />
      <text x="145" y="181" fill="#64748b" fontSize="2.5" textAnchor="middle">Territorio</text>
      <text x="145" y="187" fill="#1e293b" fontSize="3.5" fontWeight="600" textAnchor="middle">Unión Europea</text>
      {/* Official seals */}
      {[0, 1, 2].map(i => (
        <circle key={i} cx={75 + i * 30} cy="218" r="7" fill="none" stroke={c.accent} strokeWidth="0.4" />
      ))}
      <text x="105" y="238" fill="#94a3b8" fontSize="3" textAnchor="middle">Expedido por: {tenantName}</text>
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════
// AVISO DE RENOVACIÓN
// ═════════════════════════════════════════════════════════════
export function RenovacionSVG({ style = 'moderno', tenantName = 'Mi Empresa S.L.' }: ThumbnailProps) {
  const c = STYLE_COLORS[style];
  const isClassic = style === 'clasico';
  return (
    <svg viewBox="0 0 210 297" className="w-full h-full" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <rect width="210" height="297" fill="white" rx="2" stroke="#e2e8f0" strokeWidth="0.5" />
      {isClassic ? (
        <g>
          <text x="14" y="14" fill="#666" fontSize="3.5">{tenantName}</text>
          <text x="14" y="24" fill="#1a1a1a" fontSize="7" fontWeight="700">⏰ AVISO DE RENOVACIÓN</text>
          <line x1="14" y1="28" x2="196" y2="28" stroke="#ccc" strokeWidth="0.5" />
        </g>
      ) : (
        <g>
          <rect width="210" height="28" fill={c.headerBg} />
          <text x="14" y="12" fill="white" fontSize="3.5" opacity="0.8">{tenantName}</text>
          <text x="14" y="22" fill="white" fontSize="7" fontWeight="700">⏰ AVISO DE RENOVACIÓN</text>
          {style === 'elegante' && <rect y="28" width="210" height="1" fill={c.gold} />}
        </g>
      )}
      {/* Greeting */}
      <text x="14" y={isClassic ? 38 : 40} fill="#334155" fontSize="3.5">Estimada Sra. García,</text>
      <TextLines x={14} y={isClassic ? 44 : 46} count={2} width={182} />
      {/* Expiry box */}
      <rect x="25" y={isClassic ? 58 : 60} width="160" height="36" rx="5" fill="#fffbeb" stroke="#f59e0b" strokeWidth="0.8" />
      <text x="105" y={isClassic ? 69 : 71} fill="#64748b" fontSize="3" textAnchor="middle">Marca: [Denominación] · Nº: XXXXXXX</text>
      <text x="105" y={isClassic ? 78 : 80} fill="#1e293b" fontSize="8" fontWeight="700" textAnchor="middle">Vencimiento: 15 ABR 2026</text>
      <rect x="70" y={isClassic ? 82 : 84} width="70" height="8" rx="4" fill="#fef3c7" />
      <text x="105" y={isClassic ? 88 : 90} fill="#92400e" fontSize="3.2" fontWeight="700" textAnchor="middle">⚠ Quedan 68 días</text>
      {/* Costs table */}
      {(() => { const tTop = isClassic ? 102 : 104; return (
        <g>
          <rect x="14" y={tTop} width="182" height="9" rx={isClassic ? 0 : 2} fill={c.tableBg} />
          <text x="18" y={tTop + 6.5} fill="white" fontSize="3" fontWeight="600">Concepto</text>
          <text x="180" y={tTop + 6.5} fill="white" fontSize="3" fontWeight="600">Importe</text>
          <rect x="14" y={tTop + 9} width="182" height="10" fill={c.tableAlt} />
          <text x="18" y={tTop + 15.5} fill="#334155" fontSize="3">Tasa renovación OEPM</text>
          <text x="180" y={tTop + 15.5} fill="#334155" fontSize="3">€400,00</text>
          <rect x="14" y={tTop + 19} width="182" height="10" fill="white" />
          <text x="18" y={tTop + 25.5} fill="#334155" fontSize="3">Honorarios profesionales</text>
          <text x="180" y={tTop + 25.5} fill="#334155" fontSize="3">€200,00</text>
          <rect x="140" y={tTop + 31} width="56" height="11" rx={isClassic ? 0 : 2} fill={c.totalBg} />
          <text x="145" y={tTop + 38.5} fill="white" fontSize="3.5" fontWeight="700">TOTAL</text>
          <text x="191" y={tTop + 38.5} fill="white" fontSize="3.5" fontWeight="700" textAnchor="end">€600,00</text>
        </g>
      );})()}
      {/* Contact */}
      <text x="14" y="165" fill="#94a3b8" fontSize="3">Para proceder, contacte: {tenantName}</text>
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════
// MASTER TYPE MAP
// ═════════════════════════════════════════════════════════════
const TYPE_MAP: Record<string, React.FC<ThumbnailProps>> = {
  // Financiero
  factura: FacturaSVG,
  invoice: FacturaSVG,
  presupuesto: PresupuestoSVG,
  quote: PresupuestoSVG,
  'nota-credito': NotaCreditoSVG,
  'credit-note': NotaCreditoSVG,
  recibo: ReciboSVG,
  receipt: ReciboSVG,
  // Comunicación
  'carta-oficial': CartaOficialSVG,
  'official-letter': CartaOficialSVG,
  'cease-desist': CeaseDesistSVG,
  'acta-reunion': ActaReunionSVG,
  'meeting-minutes': ActaReunionSVG,
  // Informes
  'informe-portfolio': InformePortfolioSVG,
  'portfolio-report': InformePortfolioSVG,
  informe: InformePortfolioSVG,
  'informe-vigilancia': InformeVigilanciaSVG,
  'watch-report': InformeVigilanciaSVG,
  vigilancia: InformeVigilanciaSVG,
  // Legal
  contrato: ContratoSVG,
  contract: ContratoSVG,
  nda: NDASVG,
  licencia: LicenciaSVG,
  license: LicenciaSVG,
  'poder-notarial': PoderNotarialSVG,
  'power-of-attorney': PoderNotarialSVG,
  // IP
  certificado: CertificadoSVG,
  certificate: CertificadoSVG,
  renovacion: RenovacionSVG,
  renewal: RenovacionSVG,
  // Extras
  'acuse-recibo': CertificadoSVG, // Fallback to certificado layout
  'escrito-oposicion': CeaseDesistSVG, // Reuse C&D layout
  opposition: CeaseDesistSVG,
};

interface TemplateThumbnailSVGProps {
  typeId: string;
  style?: StyleKey;
  tenantName?: string;
  className?: string;
}

export function TemplateThumbnailSVG({ typeId, style = 'moderno', tenantName, className }: TemplateThumbnailSVGProps) {
  const id = typeId.toLowerCase();
  const Component = TYPE_MAP[id] || CartaOficialSVG;
  return (
    <div className={className}>
      <Component style={style} tenantName={tenantName} />
    </div>
  );
}
