// ============================================================
// DOCUMENT THUMBNAIL - Miniaturas pixel-perfect por tipo
// Cada tipo tiene su propia estructura visual reconocible
// ============================================================

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { DesignColors } from '@/lib/document-templates/designTokens';

// Map style names to accent colors
const STYLE_ACCENT_MAP: Record<string, string> = {
  'Clásico': '#1e293b',
  'Elegante': '#b45309',
  'Moderno': '#3b82f6',
  'Sofisticado': '#6366f1',
  'Corporativo': '#1e3a8a',
  'Creativo': '#ec4899',
  'Bold Orange': '#f97316',
  'Tech Dark': '#8b5cf6',
  'Wave Blue': '#0ea5e9',
  'Red Accent': '#ef4444',
  'Geometric': '#2563eb',
  'Split Green': '#22c55e',
  'Swiss': '#0f172a',
  'Navy & Gold': '#d97706',
  'Teal Executive': '#14b8a6',
  'Editorial': '#1e293b',
  'Monochrome': '#475569',
  'Dual Indigo': '#4f46e5',
};

interface DocumentThumbnailProps {
  typeId: string;
  styleName?: string;
  colors?: DesignColors | null;
  className?: string;
}

// Get accent color from style name or colors
function getAccentColor(styleName?: string, colors?: DesignColors | null): string {
  if (colors?.headerBg) return colors.headerBg;
  if (styleName && STYLE_ACCENT_MAP[styleName]) return STYLE_ACCENT_MAP[styleName];
  return '#0ea5e9'; // default cyan
}

// ============================================================
// FACTURA / PRESUPUESTO / NOTA CRÉDITO / RECIBO
// ============================================================
function FinancialThumbnail({ accent, label }: { accent: string; label: string }) {
  return (
    <div className="p-3 h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="w-12 h-1.5 bg-slate-800 rounded-full mb-1" />
          <div className="w-8 h-1 bg-slate-300 rounded-full" />
        </div>
        <div className="text-right">
          <div className="text-[6px] font-bold text-slate-700 uppercase tracking-wider">{label}</div>
          <div className="w-10 h-1 bg-slate-200 rounded-full mt-0.5 ml-auto" />
        </div>
      </div>
      
      {/* Separator */}
      <div className="h-px bg-slate-100 mb-2" />
      
      {/* Meta: 2 columnas */}
      <div className="flex justify-between mb-3">
        <div>
          <div className="w-6 h-0.5 bg-slate-300 rounded-full mb-1" />
          <div className="w-14 h-1 bg-slate-700 rounded-full mb-0.5" />
          <div className="w-10 h-0.5 bg-slate-200 rounded-full" />
        </div>
        <div className="text-right">
          <div className="w-6 h-0.5 bg-slate-300 rounded-full mb-1 ml-auto" />
          <div className="w-10 h-1 bg-slate-700 rounded-full mb-0.5" />
        </div>
      </div>
      
      {/* TABLA */}
      <div className="flex-1">
        {/* Header de tabla */}
        <div className="flex gap-1 mb-1">
          <div className="flex-1 h-2 rounded-sm" style={{ backgroundColor: accent }} />
          <div className="w-6 h-2 rounded-sm" style={{ backgroundColor: accent }} />
          <div className="w-6 h-2 rounded-sm" style={{ backgroundColor: accent }} />
        </div>
        {/* Filas */}
        {[1, 2, 3, 4].map((_, i) => (
          <div key={i} className="flex gap-1 mb-0.5">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-sm" />
            <div className="w-6 h-1.5 bg-slate-100 rounded-sm" />
            <div className="w-6 h-1.5 bg-slate-100 rounded-sm" />
          </div>
        ))}
      </div>
      
      {/* TOTAL */}
      <div className="mt-auto">
        <div className="flex justify-end">
          <div className="w-20">
            <div className="flex justify-between mb-0.5">
              <div className="w-6 h-0.5 bg-slate-300 rounded-full" />
              <div className="w-6 h-0.5 bg-slate-300 rounded-full" />
            </div>
            <div 
              className="flex justify-between items-center rounded-sm px-1 py-0.5"
              style={{ backgroundColor: accent }}
            >
              <div className="w-5 h-1 bg-white/60 rounded-full" />
              <div className="w-6 h-1 bg-white/80 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CARTA OFICIAL
// ============================================================
function LetterThumbnail({ accent }: { accent: string }) {
  return (
    <div className="p-3 h-full flex flex-col">
      {/* Header simple */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="w-12 h-1.5 bg-slate-800 rounded-full mb-1" />
          <div className="w-8 h-0.5 bg-slate-300 rounded-full" />
        </div>
        <div className="w-8 h-8 rounded opacity-20" style={{ backgroundColor: accent }} />
      </div>
      
      <div className="h-px bg-slate-100 mb-3" />
      
      {/* Destinatario */}
      <div className="mb-3">
        <div className="w-6 h-0.5 bg-slate-300 rounded-full mb-1" />
        <div className="w-16 h-1 bg-slate-700 rounded-full mb-0.5" />
        <div className="w-12 h-0.5 bg-slate-200 rounded-full" />
      </div>
      
      {/* Asunto */}
      <div className="mb-3 pb-1 border-b-2" style={{ borderColor: accent }}>
        <div className="w-20 h-1 bg-slate-600 rounded-full" />
      </div>
      
      {/* Párrafos de texto */}
      <div className="flex-1 space-y-2">
        <div className="space-y-0.5">
          <div className="w-full h-0.5 bg-slate-200 rounded-full" />
          <div className="w-11/12 h-0.5 bg-slate-200 rounded-full" />
          <div className="w-9/12 h-0.5 bg-slate-200 rounded-full" />
        </div>
        <div className="space-y-0.5">
          <div className="w-full h-0.5 bg-slate-200 rounded-full" />
          <div className="w-10/12 h-0.5 bg-slate-200 rounded-full" />
          <div className="w-8/12 h-0.5 bg-slate-200 rounded-full" />
        </div>
        <div className="space-y-0.5">
          <div className="w-full h-0.5 bg-slate-200 rounded-full" />
          <div className="w-7/12 h-0.5 bg-slate-200 rounded-full" />
        </div>
      </div>
      
      {/* Firma */}
      <div className="mt-auto pt-2">
        <div className="w-14 h-px bg-slate-800 mb-1" />
        <div className="w-12 h-1 bg-slate-600 rounded-full mb-0.5" />
        <div className="w-8 h-0.5 bg-slate-300 rounded-full" />
      </div>
    </div>
  );
}

// ============================================================
// CEASE & DESIST
// ============================================================
function CeaseDesistThumbnail() {
  return (
    <div className="p-3 h-full flex flex-col">
      {/* Header con acento rojo */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="w-12 h-1.5 bg-slate-800 rounded-full mb-0.5" />
          <div className="w-8 h-0.5 bg-slate-300 rounded-full" />
        </div>
        <div className="text-[5px] font-bold text-red-600 uppercase">C&D</div>
      </div>
      
      <div className="h-px bg-slate-100 mb-2" />
      
      {/* Asunto en rojo */}
      <div className="mb-2 pb-1 border-b-2 border-red-500">
        <div className="w-16 h-1 bg-slate-600 rounded-full" />
      </div>
      
      {/* Párrafo intro */}
      <div className="space-y-0.5 mb-2">
        <div className="w-full h-0.5 bg-slate-200 rounded-full" />
        <div className="w-10/12 h-0.5 bg-slate-200 rounded-full" />
      </div>
      
      {/* Cláusulas con borde izquierdo rojo */}
      <div className="flex-1 space-y-1">
        {[1, 2, 3].map(i => (
          <div key={i} className="border-l-2 border-red-400 pl-1 bg-red-50/50 rounded-r-sm py-0.5">
            <div className="w-8 h-0.5 bg-red-300 rounded-full mb-0.5" />
            <div className="w-full h-0.5 bg-slate-200 rounded-full" />
          </div>
        ))}
      </div>
      
      {/* Firma */}
      <div className="mt-auto pt-2">
        <div className="w-10 h-px bg-slate-800 mb-0.5" />
        <div className="w-8 h-0.5 bg-slate-400 rounded-full" />
      </div>
    </div>
  );
}

// ============================================================
// ACTA DE REUNIÓN
// ============================================================
function MeetingMinutesThumbnail({ accent }: { accent: string }) {
  return (
    <div className="p-3 h-full flex flex-col">
      {/* Header */}
      <div className="rounded-sm p-1.5 mb-2" style={{ backgroundColor: accent }}>
        <div className="w-10 h-1 bg-white/80 rounded-full mb-0.5" />
        <div className="w-6 h-0.5 bg-white/50 rounded-full" />
      </div>
      
      {/* 2 columnas asistentes */}
      <div className="flex gap-1 mb-2">
        <div className="flex-1 bg-slate-50 rounded-sm p-1">
          <div className="w-5 h-0.5 bg-slate-300 rounded-full mb-0.5" />
          <div className="w-8 h-0.5 bg-slate-500 rounded-full mb-0.5" />
          <div className="w-7 h-0.5 bg-slate-500 rounded-full" />
        </div>
        <div className="flex-1 bg-slate-50 rounded-sm p-1">
          <div className="w-5 h-0.5 bg-slate-300 rounded-full mb-0.5" />
          <div className="w-8 h-0.5 bg-slate-500 rounded-full mb-0.5" />
          <div className="w-7 h-0.5 bg-slate-500 rounded-full" />
        </div>
      </div>
      
      {/* Secciones numeradas */}
      <div className="flex-1 space-y-1.5">
        {['1.', '2.', '3.'].map((n, i) => (
          <div key={i}>
            <div className="flex items-center gap-1 mb-0.5">
              <div className="w-6 h-1 rounded-full" style={{ backgroundColor: accent }} />
            </div>
            <div className="pl-1 space-y-0.5">
              <div className="w-full h-0.5 bg-slate-200 rounded-full" />
              <div className="w-8/12 h-0.5 bg-slate-200 rounded-full" />
            </div>
          </div>
        ))}
      </div>
      
      {/* Firma */}
      <div className="mt-auto pt-1">
        <div className="w-10 h-px bg-slate-800 mb-0.5" />
        <div className="w-8 h-0.5 bg-slate-400 rounded-full" />
      </div>
    </div>
  );
}

// ============================================================
// INFORME / VIGILANCIA
// ============================================================
function ReportThumbnail({ accent }: { accent: string }) {
  return (
    <div className="p-3 h-full flex flex-col">
      {/* Header */}
      <div className="rounded-sm p-1.5 mb-2" style={{ backgroundColor: accent }}>
        <div className="w-10 h-1 bg-white/80 rounded-full mb-0.5" />
        <div className="w-6 h-0.5 bg-white/50 rounded-full" />
      </div>
      
      {/* KPI grid */}
      <div className="grid grid-cols-4 gap-1 mb-2">
        {[1, 2, 3, 4].map(i => (
          <div 
            key={i} 
            className="bg-slate-50 rounded-sm p-1 text-center border-l-2"
            style={{ borderColor: accent }}
          >
            <div className="w-3 h-1.5 bg-slate-700 rounded-full mx-auto mb-0.5" />
            <div className="w-5 h-0.5 bg-slate-300 rounded-full mx-auto" />
          </div>
        ))}
      </div>
      
      {/* Sección */}
      <div className="mb-2">
        <div 
          className="w-10 h-1 rounded-full mb-1"
          style={{ backgroundColor: accent }}
        />
        <div className="space-y-0.5">
          <div className="w-full h-0.5 bg-slate-200 rounded-full" />
          <div className="w-9/12 h-0.5 bg-slate-200 rounded-full" />
        </div>
      </div>
      
      {/* Mini tabla */}
      <div className="flex-1">
        <div className="flex gap-0.5 mb-0.5">
          <div className="flex-1 h-1.5 rounded-sm" style={{ backgroundColor: accent }} />
          <div className="w-4 h-1.5 rounded-sm" style={{ backgroundColor: accent }} />
          <div className="w-4 h-1.5 rounded-sm" style={{ backgroundColor: accent }} />
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-0.5 mb-0.5">
            <div className="flex-1 h-1 bg-slate-100 rounded-sm" />
            <div className="w-4 h-1 bg-slate-100 rounded-sm" />
            <div className="w-4 h-1 bg-slate-100 rounded-sm" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// CONTRATO / NDA / LICENCIA
// ============================================================
function ContractThumbnail({ accent, label }: { accent: string; label: string }) {
  return (
    <div className="p-3 h-full flex flex-col">
      {/* Header */}
      <div className="text-center mb-3">
        <div className="w-12 h-1.5 bg-slate-800 rounded-full mx-auto mb-1" />
        <div className="text-[6px] font-bold text-slate-700 uppercase tracking-wider">{label}</div>
      </div>
      
      <div className="h-px bg-slate-100 mb-2" />
      
      {/* Meta 2 cols */}
      <div className="flex justify-between mb-3">
        <div>
          <div className="w-5 h-0.5 bg-slate-300 rounded-full mb-0.5" />
          <div className="w-12 h-1 bg-slate-700 rounded-full" />
        </div>
        <div className="text-right">
          <div className="w-5 h-0.5 bg-slate-300 rounded-full mb-0.5 ml-auto" />
          <div className="w-12 h-1 bg-slate-700 rounded-full" />
        </div>
      </div>
      
      {/* Cláusulas */}
      <div className="flex-1 space-y-2">
        {['PRIMERA', 'SEGUNDA', 'TERCERA', 'CUARTA'].map((_, i) => (
          <div key={i}>
            <div className="w-10 h-1 rounded-full mb-0.5" style={{ backgroundColor: accent }} />
            <div className="space-y-0.5 pl-1">
              <div className="w-full h-0.5 bg-slate-200 rounded-full" />
              <div className="w-10/12 h-0.5 bg-slate-200 rounded-full" />
            </div>
          </div>
        ))}
      </div>
      
      {/* Doble firma */}
      <div className="mt-auto pt-2 flex gap-4">
        <div>
          <div className="w-10 h-px bg-slate-800 mb-0.5" />
          <div className="w-8 h-0.5 bg-slate-400 rounded-full" />
        </div>
        <div>
          <div className="w-10 h-px bg-slate-800 mb-0.5" />
          <div className="w-8 h-0.5 bg-slate-400 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PODER NOTARIAL
// ============================================================
function PowerOfAttorneyThumbnail() {
  return (
    <div className="p-3 h-full flex flex-col">
      {/* Header centrado */}
      <div className="text-center mb-2">
        <div className="w-10 h-1.5 bg-slate-800 rounded-full mx-auto mb-1" />
        <div className="text-[6px] font-bold text-slate-700 uppercase">PODER</div>
        <div className="text-[4px] text-slate-400 uppercase">Representación</div>
      </div>
      
      <div className="h-px bg-slate-100 mb-2" />
      
      {/* Meta */}
      <div className="flex justify-between mb-2">
        <div>
          <div className="w-5 h-0.5 bg-slate-300 rounded-full mb-0.5" />
          <div className="w-12 h-1 bg-slate-700 rounded-full" />
        </div>
        <div className="text-right">
          <div className="w-5 h-0.5 bg-slate-300 rounded-full mb-0.5 ml-auto" />
          <div className="w-12 h-1 bg-slate-700 rounded-full" />
        </div>
      </div>
      
      {/* Oficinas — 3 flags */}
      <div className="flex gap-1 justify-center mb-2">
        {['🇪🇺', '🇪🇸', '🌐'].map((f, i) => (
          <div key={i} className="w-6 h-5 bg-slate-50 rounded-sm flex items-center justify-center text-[6px]">
            {f}
          </div>
        ))}
      </div>
      
      {/* Texto */}
      <div className="flex-1 space-y-0.5">
        <div className="w-full h-0.5 bg-slate-200 rounded-full" />
        <div className="w-11/12 h-0.5 bg-slate-200 rounded-full" />
        <div className="w-9/12 h-0.5 bg-slate-200 rounded-full" />
        <div className="w-full h-0.5 bg-slate-200 rounded-full" />
        <div className="w-8/12 h-0.5 bg-slate-200 rounded-full" />
      </div>
      
      {/* Doble firma */}
      <div className="mt-auto pt-2 flex gap-4">
        <div>
          <div className="w-10 h-px bg-slate-800 mb-0.5" />
          <div className="w-8 h-0.5 bg-slate-400 rounded-full" />
        </div>
        <div>
          <div className="w-10 h-px bg-slate-800 mb-0.5" />
          <div className="w-8 h-0.5 bg-slate-400 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CERTIFICADO
// ============================================================
function CertificateThumbnail({ accent }: { accent: string }) {
  return (
    <div className="p-3 h-full flex flex-col items-center justify-center text-center">
      {/* Logo */}
      <div 
        className="w-6 h-6 rounded-full border-2 flex items-center justify-center mb-2"
        style={{ borderColor: accent }}
      >
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accent }} />
      </div>
      
      {/* Título centrado */}
      <div className="text-[6px] font-bold text-slate-700 uppercase tracking-wider mb-1">CERTIFICADO</div>
      <div className="w-16 h-0.5 rounded-full mb-3" style={{ backgroundColor: accent }} />
      
      {/* Grid de datos */}
      <div className="grid grid-cols-2 gap-1 w-full mb-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-slate-50 rounded-sm p-1">
            <div className="w-5 h-0.5 bg-slate-300 rounded-full mb-0.5" />
            <div className="w-8 h-1 bg-slate-700 rounded-full" />
          </div>
        ))}
      </div>
      
      {/* Sellos */}
      <div className="flex gap-3 mt-auto">
        {[1, 2, 3].map(i => (
          <div 
            key={i} 
            className="w-4 h-4 rounded-full border flex items-center justify-center"
            style={{ borderColor: accent }}
          >
            <span className="text-[4px]" style={{ color: accent }}>✓</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// RENOVACIÓN
// ============================================================
function RenewalThumbnail() {
  return (
    <div className="p-3 h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="w-10 h-1.5 bg-slate-800 rounded-full mb-0.5" />
          <div className="w-6 h-0.5 bg-slate-300 rounded-full" />
        </div>
        <div className="text-[5px] font-bold text-slate-500">RENOVACIÓN</div>
      </div>
      
      {/* Fecha destacada */}
      <div className="border-2 border-amber-400 rounded-sm p-2 text-center mb-2">
        <div className="text-[5px] text-slate-400 uppercase">Vencimiento</div>
        <div className="text-[8px] font-bold text-slate-700">15 ABR 2026</div>
        <div className="mt-1 bg-amber-100 rounded-full px-1 py-0.5">
          <div className="text-[4px] text-amber-700 font-bold">⏳ 71 DÍAS</div>
        </div>
      </div>
      
      {/* Mini tabla */}
      <div className="flex-1">
        <div className="flex gap-0.5 mb-0.5">
          <div className="flex-1 h-1.5 bg-slate-700 rounded-sm" />
          <div className="w-5 h-1.5 bg-slate-700 rounded-sm" />
          <div className="w-4 h-1.5 bg-slate-700 rounded-sm" />
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-0.5 mb-0.5">
            <div className="flex-1 h-1 bg-slate-100 rounded-sm" />
            <div className="w-5 h-1 bg-slate-100 rounded-sm" />
            <div className="w-4 h-1 bg-slate-100 rounded-sm" />
          </div>
        ))}
      </div>
      
      {/* Alerta */}
      <div className="mt-auto bg-amber-50 border-l-2 border-amber-400 rounded-sm p-1">
        <div className="w-full h-0.5 bg-amber-200 rounded-full mb-0.5" />
        <div className="w-9/12 h-0.5 bg-amber-200 rounded-full" />
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export function DocumentThumbnail({ typeId, styleName, colors, className }: DocumentThumbnailProps) {
  const accent = getAccentColor(styleName, colors);
  
  // Map type IDs to their thumbnails
  const getThumbnailComponent = () => {
    const id = typeId.toLowerCase();
    
    // Financiero
    if (id === 'invoice' || id === 'factura') {
      return <FinancialThumbnail accent={accent} label="FACTURA" />;
    }
    if (id === 'quote' || id === 'presupuesto') {
      return <FinancialThumbnail accent={accent} label="PRESUPUESTO" />;
    }
    if (id === 'credit-note' || id === 'nota-credito' || id.includes('credit')) {
      return <FinancialThumbnail accent={accent} label="NOTA CRÉDITO" />;
    }
    if (id === 'receipt' || id === 'recibo') {
      return <FinancialThumbnail accent={accent} label="RECIBO" />;
    }
    
    // Comunicación
    if (id === 'official-letter' || id === 'carta' || id.includes('letter')) {
      return <LetterThumbnail accent={accent} />;
    }
    if (id === 'cease-desist' || id === 'cease' || id.includes('cease')) {
      return <CeaseDesistThumbnail />;
    }
    if (id === 'meeting-minutes' || id === 'acta' || id.includes('meeting') || id.includes('minutes')) {
      return <MeetingMinutesThumbnail accent={accent} />;
    }
    
    // Informes
    if (id === 'portfolio-report' || id === 'informe' || id.includes('portfolio')) {
      return <ReportThumbnail accent={accent} />;
    }
    if (id === 'watch-report' || id === 'vigilancia' || id.includes('surveillance') || id.includes('watch')) {
      return <ReportThumbnail accent={accent} />;
    }
    
    // Legal
    if (id === 'contract' || id === 'contrato') {
      return <ContractThumbnail accent={accent} label="CONTRATO" />;
    }
    if (id === 'nda' || id.includes('confidential')) {
      return <ContractThumbnail accent={accent} label="NDA" />;
    }
    if (id === 'license' || id === 'licencia') {
      return <ContractThumbnail accent={accent} label="LICENCIA" />;
    }
    if (id === 'power-of-attorney' || id === 'poder' || id.includes('power')) {
      return <PowerOfAttorneyThumbnail />;
    }
    
    // IP
    if (id === 'certificate' || id === 'certificado') {
      return <CertificateThumbnail accent={accent} />;
    }
    if (id === 'renewal' || id === 'renovacion' || id.includes('renewal')) {
      return <RenewalThumbnail />;
    }
    
    // Default fallback - letter
    return <LetterThumbnail accent={accent} />;
  };
  
  return (
    <div 
      className={cn(
        "bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden",
        className
      )}
      style={{ aspectRatio: '1/1.3' }}
    >
      {getThumbnailComponent()}
    </div>
  );
}
