// ============================================================
// TEMPLATE CARD - Card de plantilla con preview y toggle
// Diseño SILK: miniaturas pixel-perfect por tipo de documento
// ============================================================

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Eye } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { DocumentThumbnail } from './DocumentThumbnail';
import type { DocumentType, DesignTokens } from '@/lib/document-templates/designTokens';

interface TemplateCardProps {
  documentType: DocumentType;
  defaultStyle: DesignTokens | null;
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  onPreview: () => void;
  className?: string;
}

export function TemplateCard({
  documentType,
  defaultStyle,
  isEnabled,
  onToggle,
  onPreview,
  className,
}: TemplateCardProps) {
  return (
    <div className={cn(
      "group bg-white border rounded-xl overflow-hidden transition-all duration-200 cursor-pointer",
      isEnabled 
        ? "border-slate-200 hover:shadow-lg hover:border-cyan-300" 
        : "border-dashed border-slate-300 opacity-60",
      className
    )}>
      {/* MINIATURA */}
      <div 
        className="p-5 bg-gradient-to-b from-slate-50 to-white"
        onClick={onPreview}
      >
        <DocumentThumbnail
          typeId={documentType.id}
          styleName={defaultStyle?.name}
          colors={defaultStyle?.colors}
        />
      </div>
      
      {/* INFO */}
      <div className="px-5 pb-4">
        <h3 className="font-semibold text-slate-800 text-sm">{documentType.name}</h3>
        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{documentType.description}</p>
        
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
          <button 
            onClick={onPreview}
            className="text-xs text-cyan-600 font-medium hover:text-cyan-700 flex items-center gap-1 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" /> Vista previa
          </button>
          
          {/* Toggle ON/OFF */}
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-[10px]",
              isEnabled ? "text-cyan-600 font-medium" : "text-slate-400"
            )}>
              {isEnabled ? 'ON' : 'OFF'}
            </span>
            <Switch 
              checked={isEnabled} 
              onCheckedChange={onToggle}
              className="data-[state=checked]:bg-cyan-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
