// ============================================================
// TEMPLATE THUMBNAIL SVG — Realistic A4-proportion document previews
// Each type renders a unique recognizable mini-document
// ============================================================

import * as React from 'react';

export const STYLE_COLORS = {
  clasico:     { accent: '#1E3A5F', light: '#EFF6FF', headerBg: '#1E3A5F', tableBg: '#1E3A5F' },
  elegante:    { accent: '#0F766E', light: '#F0FDFA', headerBg: '#0F766E', tableBg: '#0F766E' },
  moderno:     { accent: '#2563EB', light: '#EFF6FF', headerBg: '#2563EB', tableBg: '#2563EB' },
  sofisticado: { accent: '#7C3AED', light: '#F5F3FF', headerBg: '#7C3AED', tableBg: '#7C3AED' },
} as const;

export type StyleKey = keyof typeof STYLE_COLORS;

interface ThumbnailProps {
  style?: StyleKey;
  tenantName?: string;
  className?: string;
}

// Helper: gray text lines
const TextLines = ({ x, y, count, width = 140 }: { x: number; y: number; count: number; width?: number }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <rect key={i} x={x} y={y + i * 8} width={i === count - 1 ? width * 0.6 : width} height={3} rx={1.5} fill="#cbd5e1" />
    ))}
  </>
);

// ============ FACTURA ============
export function FacturaSVG({ style = 'moderno', tenantName = 'Mi Empresa S.L.' }: ThumbnailProps) {
  const c = STYLE_COLORS[style];
  return (
    <svg viewBox="0 0 210 297" className="w-full h-full" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <rect width="210" height="297" fill="white" rx="2" stroke="#e2e8f0" strokeWidth="0.5" />
      {/* Header bar */}
      <rect width="210" height="38" fill={c.headerBg} />
      <text x="14" y="18" fill="white" fontSize="6" fontWeight="700">{tenantName}</text>
      <text x="14" y="27" fill="white" fontSize="4" opacity="0.8">C/ Gran Vía 42, Madrid</text>
      <text x="196" y="18" fill="white" fontSize="8" fontWeight="700" textAnchor="end">FACTURA</text>
      <text x="196" y="27" fill="white" fontSize="4" opacity="0.8" textAnchor="end">Nº FAC-2026-001</text>
      {/* Client block */}
      <rect x="14" y="48" width="90" height="28" rx="3" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.3" />
      <text x="18" y="57" fill="#64748b" fontSize="3.5">Cliente</text>
      <text x="18" y="64" fill="#1e293b" fontSize="4" fontWeight="600">[Nombre del cliente]</text>
      <text x="18" y="71" fill="#94a3b8" fontSize="3.5">[Dirección] · NIF: [NIF]</text>
      {/* Table header */}
      <rect x="14" y="86" width="182" height="12" rx="2" fill={c.tableBg} />
      <text x="18" y="94" fill="white" fontSize="4" fontWeight="600">Concepto</text>
      <text x="130" y="94" fill="white" fontSize="4" fontWeight="600">Uds.</text>
      <text x="155" y="94" fill="white" fontSize="4" fontWeight="600">Precio</text>
      <text x="182" y="94" fill="white" fontSize="4" fontWeight="600">Importe</text>
      {/* Rows */}
      {[
        { label: 'Registro de marca', price: '400,00' },
        { label: 'Tasas oficiales OEPM', price: '300,00' },
        { label: 'Búsqueda anterioridades', price: '100,00' },
      ].map((row, i) => (
        <React.Fragment key={i}>
          <rect x="14" y={98 + i * 14} width="182" height="14" fill={i % 2 === 0 ? '#f8fafc' : 'white'} />
          <text x="18" y={107 + i * 14} fill="#334155" fontSize="4">{row.label}</text>
          <text x="134" y={107 + i * 14} fill="#334155" fontSize="4">1</text>
          <text x="155" y={107 + i * 14} fill="#334155" fontSize="4">€{row.price}</text>
          <text x="182" y={107 + i * 14} fill="#334155" fontSize="4">€{row.price}</text>
          <line x1="14" y1={112 + i * 14} x2="196" y2={112 + i * 14} stroke="#e2e8f0" strokeWidth="0.3" />
        </React.Fragment>
      ))}
      {/* Subtotal */}
      <text x="155" y="157" fill="#64748b" fontSize="3.5">Subtotal</text>
      <text x="182" y="157" fill="#334155" fontSize="4">€800,00</text>
      <text x="155" y="165" fill="#64748b" fontSize="3.5">IVA (21%)</text>
      <text x="182" y="165" fill="#334155" fontSize="4">€168,00</text>
      {/* TOTAL */}
      <rect x="140" y="170" width="56" height="14" rx="2" fill={c.tableBg} />
      <text x="145" y="179" fill="white" fontSize="5" fontWeight="700">TOTAL</text>
      <text x="191" y="179" fill="white" fontSize="5" fontWeight="700" textAnchor="end">€968,00</text>
      {/* Payment info */}
      <text x="14" y="200" fill="#94a3b8" fontSize="3.5">Forma de pago: Transferencia bancaria</text>
      <text x="14" y="207" fill="#94a3b8" fontSize="3.5">IBAN: ES12 0049 1234 5678 9012 3456</text>
    </svg>
  );
}

// ============ PRESUPUESTO ============
export function PresupuestoSVG({ style = 'moderno', tenantName = 'Mi Empresa S.L.' }: ThumbnailProps) {
  const c = STYLE_COLORS[style];
  return (
    <svg viewBox="0 0 210 297" className="w-full h-full" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <rect width="210" height="297" fill="white" rx="2" stroke="#e2e8f0" strokeWidth="0.5" />
      <rect width="210" height="38" fill={c.headerBg} />
      <text x="14" y="18" fill="white" fontSize="6" fontWeight="700">{tenantName}</text>
      <text x="14" y="27" fill="white" fontSize="4" opacity="0.8">C/ Gran Vía 42, Madrid</text>
      <text x="196" y="18" fill="white" fontSize="8" fontWeight="700" textAnchor="end">PRESUPUESTO</text>
      <text x="196" y="27" fill="white" fontSize="4" opacity="0.8" textAnchor="end">Nº PRE-2026-015</text>
      {/* Validity badge */}
      <rect x="145" y="32" width="50" height="10" rx="5" fill={c.accent} opacity="0.15" />
      <text x="170" y="39" fill={c.accent} fontSize="3.5" fontWeight="700" textAnchor="middle">Válido 30 días</text>
      {/* Client */}
      <rect x="14" y="50" width="90" height="24" rx="3" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.3" />
      <text x="18" y="59" fill="#64748b" fontSize="3.5">Para:</text>
      <text x="18" y="66" fill="#1e293b" fontSize="4" fontWeight="600">[Nombre del cliente]</text>
      {/* Table */}
      <rect x="14" y="84" width="182" height="12" rx="2" fill={c.tableBg} />
      <text x="18" y="92" fill="white" fontSize="4" fontWeight="600">Servicio</text>
      <text x="155" y="92" fill="white" fontSize="4" fontWeight="600">Precio</text>
      <text x="182" y="92" fill="white" fontSize="4" fontWeight="600">Total</text>
      {[{ l: 'Registro de marca nacional', p: '500,00' }, { l: 'Informe anterioridades', p: '250,00' }, { l: 'Asesoramiento estratégico', p: '300,00' }].map((r, i) => (
        <React.Fragment key={i}>
          <rect x="14" y={96 + i * 14} width="182" height="14" fill={i % 2 === 0 ? '#f8fafc' : 'white'} />
          <text x="18" y={105 + i * 14} fill="#334155" fontSize="4">{r.l}</text>
          <text x="155" y={105 + i * 14} fill="#334155" fontSize="4">€{r.p}</text>
          <text x="182" y={105 + i * 14} fill="#334155" fontSize="4">€{r.p}</text>
        </React.Fragment>
      ))}
      <rect x="140" y="146" width="56" height="14" rx="2" fill={c.tableBg} />
      <text x="145" y="155" fill="white" fontSize="5" fontWeight="700">TOTAL</text>
      <text x="191" y="155" fill="white" fontSize="5" fontWeight="700" textAnchor="end">€1.050,00</text>
      <TextLines x={14} y={180} count={3} />
    </svg>
  );
}

// ============ NOTA DE CRÉDITO ============
export function NotaCreditoSVG({ style = 'moderno', tenantName = 'Mi Empresa S.L.' }: ThumbnailProps) {
  const c = STYLE_COLORS[style];
  return (
    <svg viewBox="0 0 210 297" className="w-full h-full" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <rect width="210" height="297" fill="white" rx="2" stroke="#e2e8f0" strokeWidth="0.5" />
      <rect width="210" height="38" fill={c.headerBg} />
      <text x="14" y="18" fill="white" fontSize="6" fontWeight="700">{tenantName}</text>
      <text x="196" y="18" fill="white" fontSize="7" fontWeight="700" textAnchor="end">NOTA DE CRÉDITO</text>
      <text x="196" y="27" fill="white" fontSize="4" opacity="0.8" textAnchor="end">Ref. Factura: FAC-2026-001</text>
      <rect x="14" y="50" width="90" height="20" rx="3" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.3" />
      <text x="18" y="59" fill="#64748b" fontSize="3.5">Cliente:</text>
      <text x="18" y="66" fill="#1e293b" fontSize="4" fontWeight="600">[Nombre del cliente]</text>
      {/* Table with negative amounts */}
      <rect x="14" y="80" width="182" height="12" rx="2" fill={c.tableBg} />
      <text x="18" y="88" fill="white" fontSize="4" fontWeight="600">Concepto</text>
      <text x="182" y="88" fill="white" fontSize="4" fontWeight="600">Importe</text>
      <rect x="14" y="92" width="182" height="14" fill="#fef2f2" />
      <text x="18" y="101" fill="#334155" fontSize="4">Devolución servicio</text>
      <text x="182" y="101" fill="#dc2626" fontSize="4" fontWeight="700">-€1.200,00</text>
      <rect x="140" y="116" width="56" height="14" rx="2" fill="#dc2626" />
      <text x="145" y="125" fill="white" fontSize="5" fontWeight="700">TOTAL</text>
      <text x="191" y="125" fill="white" fontSize="5" fontWeight="700" textAnchor="end">-€1.200,00</text>
    </svg>
  );
}

// ============ RECIBO ============
export function ReciboSVG({ style = 'moderno', tenantName = 'Mi Empresa S.L.' }: ThumbnailProps) {
  const c = STYLE_COLORS[style];
  return (
    <svg viewBox="0 0 210 297" className="w-full h-full" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <rect width="210" height="297" fill="white" rx="2" stroke="#e2e8f0" strokeWidth="0.5" />
      <rect width="210" height="38" fill={c.headerBg} />
      <text x="105" y="18" fill="white" fontSize="8" fontWeight="700" textAnchor="middle">RECIBO</text>
      <text x="105" y="27" fill="white" fontSize="4" opacity="0.8" textAnchor="middle">Nº 2026-0125</text>
      {/* Amount box */}
      <rect x="40" y="60" width="130" height="40" rx="6" fill={c.light} stroke={c.accent} strokeWidth="1" />
      <text x="105" y="85" fill={c.accent} fontSize="16" fontWeight="700" textAnchor="middle">€2.450,00</text>
      {/* Details */}
      <text x="30" y="120" fill="#64748b" fontSize="4">Recibido de:</text>
      <text x="80" y="120" fill="#1e293b" fontSize="4" fontWeight="600">[Nombre del cliente]</text>
      <text x="30" y="130" fill="#64748b" fontSize="4">Concepto:</text>
      <text x="80" y="130" fill="#1e293b" fontSize="4">[Referencia]</text>
      <text x="30" y="140" fill="#64748b" fontSize="4">Fecha:</text>
      <text x="80" y="140" fill="#1e293b" fontSize="4">06/02/2026</text>
      {/* PAGADO stamp */}
      <g transform="translate(105, 185) rotate(-12)">
        <rect x="-30" y="-12" width="60" height="24" rx="4" fill="none" stroke="#22c55e" strokeWidth="2" />
        <text x="0" y="5" fill="#22c55e" fontSize="12" fontWeight="700" textAnchor="middle">PAGADO</text>
      </g>
    </svg>
  );
}

// ============ CARTA OFICIAL ============
export function CartaOficialSVG({ style = 'moderno', tenantName = 'Mi Empresa S.L.' }: ThumbnailProps) {
  const c = STYLE_COLORS[style];
  return (
    <svg viewBox="0 0 210 297" className="w-full h-full" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <rect width="210" height="297" fill="white" rx="2" stroke="#e2e8f0" strokeWidth="0.5" />
      {/* Thin top accent */}
      <rect width="210" height="4" fill={c.headerBg} />
      {/* Letterhead */}
      <rect x="14" y="14" width="20" height="10" rx="2" fill={c.light} stroke={c.accent} strokeWidth="0.3" />
      <text x="24" y="21" fill={c.accent} fontSize="3.5" textAnchor="middle">LOGO</text>
      <text x="40" y="19" fill="#1e293b" fontSize="5" fontWeight="700">{tenantName}</text>
      <text x="40" y="25" fill="#94a3b8" fontSize="3.5">C/ Gran Vía 42, 28013 Madrid</text>
      <line x1="14" y1="32" x2="196" y2="32" stroke="#e2e8f0" strokeWidth="0.3" />
      {/* Recipient */}
      <text x="14" y="44" fill="#64748b" fontSize="3.5">A la atención de:</text>
      <text x="14" y="51" fill="#1e293b" fontSize="4" fontWeight="600">[Nombre del cliente]</text>
      <text x="14" y="58" fill="#94a3b8" fontSize="3.5">[Dirección del cliente]</text>
      {/* Subject */}
      <rect x="14" y="66" width="182" height="0.5" fill={c.accent} />
      <text x="14" y="76" fill="#1e293b" fontSize="4" fontWeight="600">Asunto: [Denominación] - Ref: [Referencia]</text>
      {/* Body - text lines */}
      <TextLines x={14} y={90} count={4} width={182} />
      <TextLines x={14} y={126} count={4} width={182} />
      <TextLines x={14} y={162} count={3} width={182} />
      {/* Signature */}
      <text x="14" y="210" fill="#334155" fontSize="4">Atentamente,</text>
      <line x1="14" y1="240" x2="70" y2="240" stroke="#334155" strokeWidth="0.3" />
      <text x="14" y="248" fill="#1e293b" fontSize="4" fontWeight="600">[Nombre del agente]</text>
      <text x="14" y="254" fill="#94a3b8" fontSize="3.5">Agente de Propiedad Industrial</text>
    </svg>
  );
}

// ============ CEASE & DESIST ============
export function CeaseDesistSVG({ style = 'moderno', tenantName = 'Mi Empresa S.L.' }: ThumbnailProps) {
  const c = STYLE_COLORS[style];
  return (
    <svg viewBox="0 0 210 297" className="w-full h-full" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <rect width="210" height="297" fill="white" rx="2" stroke="#e2e8f0" strokeWidth="0.5" />
      <rect width="210" height="4" fill={c.headerBg} />
      {/* C&D badge */}
      <rect x="160" y="10" width="36" height="14" rx="3" fill="#dc2626" />
      <text x="178" y="19" fill="white" fontSize="5" fontWeight="700" textAnchor="middle">C&D</text>
      {/* Letterhead */}
      <text x="14" y="20" fill="#1e293b" fontSize="5" fontWeight="700">{tenantName}</text>
      <line x1="14" y1="30" x2="196" y2="30" stroke="#dc2626" strokeWidth="0.8" />
      <text x="14" y="40" fill="#dc2626" fontSize="5" fontWeight="700">REQUERIMIENTO DE CESE</text>
      {/* Demands */}
      {['Cese inmediato del uso', 'Retirada de productos', 'Confirmación por escrito'].map((d, i) => (
        <React.Fragment key={i}>
          <rect x="14" y={54 + i * 18} width="3" height="12" rx="1" fill="#dc2626" />
          <text x="22" y={60 + i * 18} fill="#1e293b" fontSize="3.5" fontWeight="600">{i + 1}. {d}</text>
          <TextLines x={22} y={64 + i * 18} count={1} width={160} />
        </React.Fragment>
      ))}
      {/* Deadline */}
      <rect x="50" y={112} width="110" height="16" rx="4" fill="#fef2f2" stroke="#fecaca" strokeWidth="0.5" />
      <text x="105" y="122" fill="#dc2626" fontSize="5" fontWeight="700" textAnchor="middle">⚠ PLAZO: 10 días</text>
      <TextLines x={14} y={140} count={3} />
      {/* Signature */}
      <line x1="14" y1="180" x2="70" y2="180" stroke="#334155" strokeWidth="0.3" />
      <text x="14" y="187" fill="#1e293b" fontSize="3.5" fontWeight="600">[Nombre del abogado]</text>
    </svg>
  );
}

// ============ ACTA DE REUNIÓN ============
export function ActaReunionSVG({ style = 'moderno', tenantName = 'Mi Empresa S.L.' }: ThumbnailProps) {
  const c = STYLE_COLORS[style];
  return (
    <svg viewBox="0 0 210 297" className="w-full h-full" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <rect width="210" height="297" fill="white" rx="2" stroke="#e2e8f0" strokeWidth="0.5" />
      <rect width="210" height="30" fill={c.headerBg} />
      <text x="105" y="15" fill="white" fontSize="7" fontWeight="700" textAnchor="middle">ACTA DE REUNIÓN</text>
      <text x="105" y="24" fill="white" fontSize="4" opacity="0.8" textAnchor="middle">15 Enero 2026 · 10:00-11:30</text>
      {/* Attendees boxes */}
      <rect x="14" y="38" width="86" height="30" rx="3" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.3" />
      <text x="18" y="47" fill="#64748b" fontSize="3.5" fontWeight="600">Asistentes</text>
      <text x="18" y="54" fill="#334155" fontSize="3.5">• Juan García</text>
      <text x="18" y="60" fill="#334155" fontSize="3.5">• María López</text>
      <rect x="110" y="38" width="86" height="30" rx="3" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.3" />
      <text x="114" y="47" fill="#64748b" fontSize="3.5" fontWeight="600">Ausentes</text>
      <text x="114" y="54" fill="#94a3b8" fontSize="3.5">• Pedro Ruiz</text>
      {/* Numbered points */}
      {['Revisión del expediente', 'Estrategia de protección', 'Próximos pasos'].map((p, i) => (
        <React.Fragment key={i}>
          <circle cx="22" cy={86 + i * 28} r="6" fill={c.accent} />
          <text x="22" y={88.5 + i * 28} fill="white" fontSize="5" fontWeight="700" textAnchor="middle">{i + 1}</text>
          <text x="34" y={88 + i * 28} fill="#1e293b" fontSize="4" fontWeight="600">{p}</text>
          <TextLines x={34} y={93 + i * 28} count={2} width={150} />
        </React.Fragment>
      ))}
      <line x1="14" y1="180" x2="60" y2="180" stroke="#334155" strokeWidth="0.3" />
      <text x="14" y="187" fill="#94a3b8" fontSize="3.5">Secretario de la reunión</text>
    </svg>
  );
}

// ============ INFORME PORTFOLIO ============
export function InformePortfolioSVG({ style = 'moderno', tenantName = 'Mi Empresa S.L.' }: ThumbnailProps) {
  const c = STYLE_COLORS[style];
  return (
    <svg viewBox="0 0 210 297" className="w-full h-full" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <rect width="210" height="297" fill="white" rx="2" stroke="#e2e8f0" strokeWidth="0.5" />
      <rect width="210" height="30" fill={c.headerBg} />
      <text x="14" y="14" fill="white" fontSize="4" opacity="0.8">{tenantName}</text>
      <text x="14" y="24" fill="white" fontSize="7" fontWeight="700">INFORME DE PORTFOLIO</text>
      {/* 4 KPIs */}
      {[
        { label: 'Marcas', value: '42' },
        { label: 'Patentes', value: '8' },
        { label: 'Pendientes', value: '5' },
        { label: 'Países', value: '12' },
      ].map((kpi, i) => (
        <React.Fragment key={i}>
          <rect x={14 + i * 47} y="38" width="42" height="24" rx="4" fill={c.light} stroke={c.accent} strokeWidth="0.3" />
          <text x={35 + i * 47} y="50" fill={c.accent} fontSize="8" fontWeight="700" textAnchor="middle">{kpi.value}</text>
          <text x={35 + i * 47} y="58" fill="#64748b" fontSize="3" textAnchor="middle">{kpi.label}</text>
        </React.Fragment>
      ))}
      {/* Section title */}
      <rect x="14" y="72" width="80" height="0.5" fill={c.accent} />
      <text x="14" y="82" fill="#1e293b" fontSize="4.5" fontWeight="700">Resumen Ejecutivo</text>
      <TextLines x={14} y={88} count={3} />
      {/* Mini table */}
      <rect x="14" y="114" width="182" height="10" rx="2" fill={c.tableBg} />
      <text x="18" y="121" fill="white" fontSize="3.5" fontWeight="600">Activo</text>
      <text x="100" y="121" fill="white" fontSize="3.5" fontWeight="600">Acción</text>
      <text x="160" y="121" fill="white" fontSize="3.5" fontWeight="600">Fecha</text>
      {['MARCA PRINCIPAL', 'LOGO CORP', 'PATENTE-001'].map((a, i) => (
        <React.Fragment key={i}>
          <rect x="14" y={124 + i * 12} width="182" height="12" fill={i % 2 === 0 ? '#f8fafc' : 'white'} />
          <text x="18" y={132 + i * 12} fill="#334155" fontSize="3.5">{a}</text>
          <text x="100" y={132 + i * 12} fill="#64748b" fontSize="3.5">{['Renovación', 'Extensión', 'Anualidad'][i]}</text>
          <text x="160" y={132 + i * 12} fill="#64748b" fontSize="3.5">{['15/03', '30/04', '15/05'][i]}</text>
        </React.Fragment>
      ))}
      {/* Mini bar chart */}
      <text x="14" y="178" fill="#1e293b" fontSize="4" fontWeight="600">Distribución por tipo</text>
      {[30, 18, 10, 6].map((h, i) => (
        <rect key={i} x={24 + i * 22} y={200 - h} width="14" height={h} rx="2" fill={c.accent} opacity={1 - i * 0.2} />
      ))}
      <text x="14" y="210" fill="#94a3b8" fontSize="3">Marcas   Patentes  Diseños  Otros</text>
    </svg>
  );
}

// ============ INFORME VIGILANCIA ============
export function InformeVigilanciaSVG({ style = 'moderno', tenantName = 'Mi Empresa S.L.' }: ThumbnailProps) {
  const c = STYLE_COLORS[style];
  return (
    <svg viewBox="0 0 210 297" className="w-full h-full" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <rect width="210" height="297" fill="white" rx="2" stroke="#e2e8f0" strokeWidth="0.5" />
      <rect width="210" height="30" fill={c.headerBg} />
      <text x="14" y="14" fill="white" fontSize="4" opacity="0.8">{tenantName}</text>
      <text x="14" y="24" fill="white" fontSize="7" fontWeight="700">INFORME DE VIGILANCIA</text>
      {/* Alert badge */}
      <rect x="155" y="8" width="40" height="14" rx="7" fill="#fbbf24" />
      <text x="175" y="17" fill="#78350f" fontSize="4" fontWeight="700" textAnchor="middle">3 ALERTAS</text>
      {/* Comparison */}
      <text x="14" y="44" fill="#1e293b" fontSize="4" fontWeight="600">Comparación detectada</text>
      <rect x="14" y="50" width="86" height="36" rx="4" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.3" />
      <text x="57" y="62" fill={c.accent} fontSize="6" fontWeight="700" textAnchor="middle">TU MARCA</text>
      <text x="57" y="72" fill="#64748b" fontSize="3.5" textAnchor="middle">Registrada · Clases 9,35</text>
      <text x="105" y="68" fill="#64748b" fontSize="6">⚡</text>
      <rect x="110" y="50" width="86" height="36" rx="4" fill="#fef2f2" stroke="#fecaca" strokeWidth="0.3" />
      <text x="153" y="62" fill="#dc2626" fontSize="6" fontWeight="700" textAnchor="middle">SIMILAR</text>
      <text x="153" y="72" fill="#64748b" fontSize="3.5" textAnchor="middle">Solicitud · Clases 9,42</text>
      {/* Similarity bar */}
      <text x="14" y="100" fill="#64748b" fontSize="3.5">Similitud:</text>
      <rect x="50" y="95" width="120" height="6" rx="3" fill="#e2e8f0" />
      <rect x="50" y="95" width="96" height="6" rx="3" fill="#f59e0b" />
      <text x="174" y="100" fill="#f59e0b" fontSize="4" fontWeight="700">80%</text>
      {/* Results table */}
      <rect x="14" y="110" width="182" height="10" rx="2" fill={c.tableBg} />
      <text x="18" y="117" fill="white" fontSize="3.5" fontWeight="600">Marca detectada</text>
      <text x="120" y="117" fill="white" fontSize="3.5" fontWeight="600">Similitud</text>
      <text x="165" y="117" fill="white" fontSize="3.5" fontWeight="600">Riesgo</text>
      {[
        { m: 'MARCA-SIMILAR-1', s: '80%', r: 'Alto', rc: '#dc2626' },
        { m: 'MARCA-SIMILAR-2', s: '65%', r: 'Medio', rc: '#f59e0b' },
        { m: 'MARCA-LEJANA', s: '40%', r: 'Bajo', rc: '#22c55e' },
      ].map((row, i) => (
        <React.Fragment key={i}>
          <rect x="14" y={120 + i * 12} width="182" height="12" fill={i % 2 === 0 ? '#f8fafc' : 'white'} />
          <text x="18" y={128 + i * 12} fill="#334155" fontSize="3.5">{row.m}</text>
          <text x="124" y={128 + i * 12} fill="#334155" fontSize="3.5">{row.s}</text>
          <rect x="160" y={123 + i * 12} width="20" height="8" rx="4" fill={row.rc} opacity="0.15" />
          <text x="170" y={129 + i * 12} fill={row.rc} fontSize="3" fontWeight="700" textAnchor="middle">{row.r}</text>
        </React.Fragment>
      ))}
    </svg>
  );
}

// ============ CONTRATO ============
export function ContratoSVG({ style = 'moderno', tenantName = 'Mi Empresa S.L.', label = 'CONTRATO' }: ThumbnailProps & { label?: string }) {
  const c = STYLE_COLORS[style];
  return (
    <svg viewBox="0 0 210 297" className="w-full h-full" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <rect width="210" height="297" fill="white" rx="2" stroke="#e2e8f0" strokeWidth="0.5" />
      <rect width="210" height="30" fill={c.headerBg} />
      <text x="105" y="20" fill="white" fontSize="8" fontWeight="700" textAnchor="middle">{label}</text>
      {/* Parties */}
      <rect x="14" y="38" width="86" height="22" rx="3" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.3" />
      <text x="18" y="47" fill="#64748b" fontSize="3">PARTE A</text>
      <text x="18" y="54" fill="#1e293b" fontSize="4" fontWeight="600">[Nombre cliente]</text>
      <rect x="110" y="38" width="86" height="22" rx="3" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.3" />
      <text x="114" y="47" fill="#64748b" fontSize="3">PARTE B</text>
      <text x="114" y="54" fill="#1e293b" fontSize="4" fontWeight="600">{tenantName}</text>
      {/* Clauses */}
      {['PRIMERA — OBJETO', 'SEGUNDA — OBLIGACIONES', 'TERCERA — PRECIO', 'CUARTA — DURACIÓN'].map((cl, i) => (
        <React.Fragment key={i}>
          <rect x="14" y={70 + i * 34} width="40" height="8" rx="2" fill={c.accent} />
          <text x="18" y={76 + i * 34} fill="white" fontSize="3.5" fontWeight="700">{cl.split(' — ')[0]}</text>
          <text x="58" y={76 + i * 34} fill="#1e293b" fontSize="3.5" fontWeight="600">{cl.split(' — ')[1]}</text>
          <TextLines x={14} y={82 + i * 34} count={3} width={182} />
        </React.Fragment>
      ))}
      {/* Double signature */}
      <line x1="20" y1="230" x2="80" y2="230" stroke="#334155" strokeWidth="0.3" />
      <text x="50" y="238" fill="#64748b" fontSize="3.5" textAnchor="middle">PARTE A</text>
      <line x1="130" y1="230" x2="190" y2="230" stroke="#334155" strokeWidth="0.3" />
      <text x="160" y="238" fill="#64748b" fontSize="3.5" textAnchor="middle">PARTE B</text>
    </svg>
  );
}

// ============ NDA ============
export function NDASVG({ style = 'moderno', tenantName = 'Mi Empresa S.L.' }: ThumbnailProps) {
  return <ContratoSVG style={style} tenantName={tenantName} label="ACUERDO DE CONFIDENCIALIDAD" />;
}

// ============ LICENCIA ============
export function LicenciaSVG({ style = 'moderno', tenantName = 'Mi Empresa S.L.' }: ThumbnailProps) {
  return <ContratoSVG style={style} tenantName={tenantName} label="LICENCIA" />;
}

// ============ PODER NOTARIAL ============
export function PoderNotarialSVG({ style = 'moderno', tenantName = 'Mi Empresa S.L.' }: ThumbnailProps) {
  const c = STYLE_COLORS[style];
  return (
    <svg viewBox="0 0 210 297" className="w-full h-full" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <rect width="210" height="297" fill="white" rx="2" stroke="#e2e8f0" strokeWidth="0.5" />
      <rect width="210" height="30" fill={c.headerBg} />
      <text x="105" y="20" fill="white" fontSize="7" fontWeight="700" textAnchor="middle">PODER DE REPRESENTACIÓN</text>
      {/* Parties */}
      <rect x="14" y="38" width="86" height="22" rx="3" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.3" />
      <text x="18" y="47" fill="#64748b" fontSize="3">PODERDANTE</text>
      <text x="18" y="54" fill="#1e293b" fontSize="4" fontWeight="600">[Nombre del cliente]</text>
      <rect x="110" y="38" width="86" height="22" rx="3" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.3" />
      <text x="114" y="47" fill="#64748b" fontSize="3">APODERADO</text>
      <text x="114" y="54" fill="#1e293b" fontSize="4" fontWeight="600">{tenantName}</text>
      {/* Offices */}
      <rect x="40" y="68" width="130" height="20" rx="4" fill={c.light} />
      <text x="105" y="77" fill={c.accent} fontSize="3.5" fontWeight="600" textAnchor="middle">Oficinas Autorizadas</text>
      <text x="105" y="84" fill="#64748b" fontSize="3.5" textAnchor="middle">🇪🇸 OEPM · 🇪🇺 EUIPO · 🌐 WIPO</text>
      {/* Text */}
      <TextLines x={14} y={100} count={5} width={182} />
      <TextLines x={14} y={145} count={4} width={182} />
      {/* Triple signature */}
      <line x1="14" y1="200" x2="55" y2="200" stroke="#334155" strokeWidth="0.3" />
      <text x="35" y="208" fill="#64748b" fontSize="3" textAnchor="middle">Poderdante</text>
      <circle cx="105" cy="195" r="10" fill="none" stroke={c.accent} strokeWidth="0.8" />
      <text x="105" y="197" fill={c.accent} fontSize="3" fontWeight="700" textAnchor="middle">NOTARIO</text>
      <line x1="155" y1="200" x2="196" y2="200" stroke="#334155" strokeWidth="0.3" />
      <text x="175" y="208" fill="#64748b" fontSize="3" textAnchor="middle">Apoderado</text>
    </svg>
  );
}

// ============ CERTIFICADO ============
export function CertificadoSVG({ style = 'moderno', tenantName = 'Mi Empresa S.L.' }: ThumbnailProps) {
  const c = STYLE_COLORS[style];
  return (
    <svg viewBox="0 0 210 297" className="w-full h-full" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <rect width="210" height="297" fill="white" rx="2" stroke="#e2e8f0" strokeWidth="0.5" />
      {/* Decorative border */}
      <rect x="8" y="8" width="194" height="281" rx="3" fill="none" stroke={c.accent} strokeWidth="0.5" strokeDasharray="2,2" />
      <rect x="12" y="12" width="186" height="273" rx="2" fill="none" stroke={c.accent} strokeWidth="0.3" />
      {/* Central content */}
      <text x="105" y="50" fill={c.accent} fontSize="3.5" fontWeight="600" textAnchor="middle" letterSpacing="3">OFICINA DE PROPIEDAD INTELECTUAL</text>
      {/* Seal */}
      <circle cx="105" cy="85" r="18" fill={c.light} stroke={c.accent} strokeWidth="1" />
      <circle cx="105" cy="85" r="14" fill="none" stroke={c.accent} strokeWidth="0.3" />
      <text x="105" y="87" fill={c.accent} fontSize="8" fontWeight="700" textAnchor="middle">✓</text>
      <text x="105" y="115" fill="#1e293b" fontSize="9" fontWeight="700" textAnchor="middle">CERTIFICADO</text>
      <text x="105" y="124" fill="#1e293b" fontSize="5" textAnchor="middle">DE REGISTRO</text>
      <rect x="75" y="128" width="60" height="1" fill={c.accent} />
      <text x="105" y="145" fill="#64748b" fontSize="4" textAnchor="middle">Se certifica que la marca</text>
      <text x="105" y="162" fill="#1e293b" fontSize="10" fontWeight="700" textAnchor="middle">[DENOMINACIÓN]</text>
      {/* Data grid */}
      <rect x="35" y="178" width="65" height="20" rx="3" fill={c.light} />
      <text x="67" y="188" fill="#64748b" fontSize="3" textAnchor="middle">Nº Registro</text>
      <text x="67" y="194" fill="#1e293b" fontSize="4" fontWeight="600" textAnchor="middle">[Referencia]</text>
      <rect x="110" y="178" width="65" height="20" rx="3" fill={c.light} />
      <text x="142" y="188" fill="#64748b" fontSize="3" textAnchor="middle">Titular</text>
      <text x="142" y="194" fill="#1e293b" fontSize="4" fontWeight="600" textAnchor="middle">[Cliente]</text>
      {/* Official seals at bottom */}
      {[0, 1, 2].map(i => (
        <circle key={i} cx={75 + i * 30} cy="240" r="8" fill="none" stroke={c.accent} strokeWidth="0.5" />
      ))}
    </svg>
  );
}

// ============ RENOVACIÓN ============
export function RenovacionSVG({ style = 'moderno', tenantName = 'Mi Empresa S.L.' }: ThumbnailProps) {
  const c = STYLE_COLORS[style];
  return (
    <svg viewBox="0 0 210 297" className="w-full h-full" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <rect width="210" height="297" fill="white" rx="2" stroke="#e2e8f0" strokeWidth="0.5" />
      <rect width="210" height="30" fill={c.headerBg} />
      <text x="14" y="14" fill="white" fontSize="4" opacity="0.8">{tenantName}</text>
      <text x="14" y="24" fill="white" fontSize="7" fontWeight="700">RENOVACIÓN</text>
      {/* Expiry box */}
      <rect x="30" y="40" width="150" height="36" rx="6" fill="#fffbeb" stroke="#f59e0b" strokeWidth="0.8" />
      <text x="105" y="52" fill="#92400e" fontSize="3.5" textAnchor="middle">FECHA DE VENCIMIENTO</text>
      <text x="105" y="64" fill="#1e293b" fontSize="10" fontWeight="700" textAnchor="middle">15 ABR 2026</text>
      <rect x="70" y="68" width="70" height="8" rx="4" fill="#fef3c7" />
      <text x="105" y="74" fill="#92400e" fontSize="3.5" fontWeight="700" textAnchor="middle">⏳ 71 días restantes</text>
      {/* Matter info */}
      <rect x="14" y="88" width="182" height="34" rx="4" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.3" />
      <text x="18" y="98" fill="#64748b" fontSize="3.5">Referencia: <tspan fill="#1e293b" fontWeight="600">[Referencia]</tspan></text>
      <text x="18" y="106" fill="#64748b" fontSize="3.5">Denominación: <tspan fill="#1e293b" fontWeight="600">[Denominación]</tspan></text>
      <text x="18" y="114" fill="#64748b" fontSize="3.5">Clases Nice: <tspan fill="#1e293b" fontWeight="600">9, 35, 42</tspan></text>
      {/* Costs */}
      <rect x="14" y="130" width="182" height="10" rx="2" fill={c.tableBg} />
      <text x="18" y="137" fill="white" fontSize="3.5" fontWeight="600">Concepto</text>
      <text x="180" y="137" fill="white" fontSize="3.5" fontWeight="600">Importe</text>
      <rect x="14" y="140" width="182" height="12" fill="#f8fafc" />
      <text x="18" y="148" fill="#334155" fontSize="3.5">Tasa renovación OEPM</text>
      <text x="180" y="148" fill="#334155" fontSize="3.5">€400,00</text>
      <rect x="14" y="152" width="182" height="12" fill="white" />
      <text x="18" y="160" fill="#334155" fontSize="3.5">Honorarios profesionales</text>
      <text x="180" y="160" fill="#334155" fontSize="3.5">€200,00</text>
      <rect x="140" y="166" width="56" height="12" rx="2" fill={c.tableBg} />
      <text x="145" y="174" fill="white" fontSize="4" fontWeight="700">TOTAL</text>
      <text x="191" y="174" fill="white" fontSize="4" fontWeight="700" textAnchor="end">€600,00</text>
    </svg>
  );
}

// ============ ACUSE DE RECIBO ============
export function AcuseReciboSVG({ style = 'moderno', tenantName = 'Mi Empresa S.L.' }: ThumbnailProps) {
  const c = STYLE_COLORS[style];
  return (
    <svg viewBox="0 0 210 297" className="w-full h-full" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <rect width="210" height="297" fill="white" rx="2" stroke="#e2e8f0" strokeWidth="0.5" />
      <rect width="210" height="30" fill={c.headerBg} />
      <text x="105" y="20" fill="white" fontSize="7" fontWeight="700" textAnchor="middle">ACUSE DE RECIBO</text>
      <rect x="30" y="50" width="150" height="28" rx="4" fill={c.light} stroke={c.accent} strokeWidth="0.5" />
      <text x="105" y="63" fill="#64748b" fontSize="3.5" textAnchor="middle">Referencia</text>
      <text x="105" y="72" fill="#1e293b" fontSize="6" fontWeight="700" textAnchor="middle">[Referencia] · 06/02/2026</text>
      <TextLines x={14} y={96} count={3} width={182} />
      {/* Received stamp */}
      <g transform="translate(105, 155) rotate(-8)">
        <rect x="-35" y="-14" width="70" height="28" rx="5" fill="none" stroke={c.accent} strokeWidth="2" />
        <text x="0" y="5" fill={c.accent} fontSize="10" fontWeight="700" textAnchor="middle">RECIBIDO</text>
      </g>
      <text x="105" y="200" fill="#94a3b8" fontSize="3.5" textAnchor="middle">Fecha de recepción: 06/02/2026</text>
    </svg>
  );
}

// ============ ESCRITO DE OPOSICIÓN ============
export function EscritoOposicionSVG({ style = 'moderno', tenantName = 'Mi Empresa S.L.' }: ThumbnailProps) {
  const c = STYLE_COLORS[style];
  return (
    <svg viewBox="0 0 210 297" className="w-full h-full" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <rect width="210" height="297" fill="white" rx="2" stroke="#e2e8f0" strokeWidth="0.5" />
      <rect width="210" height="30" fill={c.headerBg} />
      <text x="14" y="14" fill="white" fontSize="4" opacity="0.8">{tenantName}</text>
      <text x="14" y="24" fill="white" fontSize="6" fontWeight="700">ESCRITO DE OPOSICIÓN</text>
      {/* Official reference */}
      <rect x="14" y="38" width="182" height="18" rx="3" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.3" />
      <text x="18" y="47" fill="#64748b" fontSize="3.5">Expediente: <tspan fill="#1e293b" fontWeight="600">OPO-2026-0042</tspan></text>
      <text x="18" y="53" fill="#64748b" fontSize="3.5">Marca impugnada: <tspan fill="#dc2626" fontWeight="600">[Denominación]</tspan></text>
      {/* Arguments */}
      {['Motivo de la oposición', 'Similitud fonética y visual', 'Riesgo de confusión'].map((arg, i) => (
        <React.Fragment key={i}>
          <text x="18" y={72 + i * 24} fill="#1e293b" fontSize="3.5" fontWeight="600">• {arg}</text>
          <TextLines x={22} y={77 + i * 24} count={2} width={170} />
        </React.Fragment>
      ))}
      {/* Signature */}
      <line x1="14" y1="160" x2="70" y2="160" stroke="#334155" strokeWidth="0.3" />
      <text x="14" y="167" fill="#1e293b" fontSize="3.5" fontWeight="600">Agente de PI</text>
    </svg>
  );
}

// ============ MASTER COMPONENT - Maps type ID to SVG ============
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
  'acuse-recibo': AcuseReciboSVG,
  'escrito-oposicion': EscritoOposicionSVG,
  opposition: EscritoOposicionSVG,
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
