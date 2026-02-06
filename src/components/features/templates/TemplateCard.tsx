// ============================================================
// TEMPLATE CARD - Card de plantilla con preview y toggle
// ============================================================

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Eye, FileText, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import type { DocumentType, DesignTokens, DocumentCategory } from '@/lib/document-templates/designTokens';
import { CATEGORY_LABELS } from '@/lib/document-templates/designTokens';

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
  const colors = defaultStyle?.colors;
  
  return (
    <div
      className={cn(
        'group relative bg-white rounded-xl overflow-hidden transition-all duration-200',
        isEnabled
          ? 'border border-slate-200 hover:border-cyan-300 hover:shadow-lg'
          : 'border border-dashed border-slate-300 opacity-60',
        className
      )}
    >
      {/* Miniatura del documento */}
      <button
        onClick={onPreview}
        className="w-full aspect-[3/4] relative overflow-hidden bg-slate-50"
        style={{ backgroundColor: colors?.background || '#ffffff' }}
      >
        {/* Header del documento */}
        <div
          className="h-10"
          style={{ backgroundColor: colors?.headerBg || '#2563eb' }}
        />
        
        {/* Content area */}
        <div className="p-4 space-y-2">
          {/* Title placeholder */}
          <div 
            className="h-3 rounded-full w-1/2"
            style={{ backgroundColor: colors?.text || '#333', opacity: 0.3 }}
          />
          
          {/* Content lines */}
          <div className="space-y-1.5 pt-2">
            <div 
              className="h-2 rounded-full w-full"
              style={{ backgroundColor: colors?.text || '#333', opacity: 0.12 }}
            />
            <div 
              className="h-2 rounded-full w-4/5"
              style={{ backgroundColor: colors?.text || '#333', opacity: 0.12 }}
            />
            <div 
              className="h-2 rounded-full w-2/3"
              style={{ backgroundColor: colors?.text || '#333', opacity: 0.12 }}
            />
          </div>
          
          {/* Table preview */}
          <div className="pt-3">
            <div 
              className="h-4 rounded-sm mb-1"
              style={{ backgroundColor: colors?.tableHeadBg || '#2563eb' }}
            />
            <div className="space-y-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-3 rounded-sm"
                  style={{ backgroundColor: colors?.backgroundAlt || '#f8fafc' }}
                />
              ))}
            </div>
          </div>
          
          {/* Total bar */}
          <div
            className="h-4 rounded-sm mt-2"
            style={{ backgroundColor: colors?.totalBg || '#2563eb' }}
          />
        </div>
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2">
              <Eye className="h-4 w-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">Vista previa</span>
            </div>
          </div>
        </div>
        
        {/* Icon badge */}
        <div className="absolute top-2 left-2 w-8 h-8 rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center text-lg shadow-sm">
          {documentType.icon}
        </div>
        
        {/* Style name badge */}
        {defaultStyle && (
          <Badge 
            variant="secondary" 
            className="absolute top-2 right-2 text-[10px] bg-white/90 backdrop-blur-sm shadow-sm"
          >
            {defaultStyle.name}
          </Badge>
        )}
      </button>
      
      {/* Info */}
      <div className="p-4 border-t border-slate-100">
        <h3 className="font-semibold text-base text-slate-800 mb-1">
          {documentType.name}
        </h3>
        <p className="text-sm text-slate-500 line-clamp-2 mb-3">
          {documentType.description}
        </p>
        
        {/* Category and formats */}
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="outline" className="text-xs">
            {CATEGORY_LABELS[documentType.category]}
          </Badge>
          <Badge variant="outline" className="text-xs flex items-center gap-1">
            <FileText className="h-3 w-3" />
            PDF
          </Badge>
          <Badge variant="outline" className="text-xs flex items-center gap-1">
            <FileSpreadsheet className="h-3 w-3" />
            DOCX
          </Badge>
        </div>
        
        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={onPreview}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            Vista previa
          </Button>
          
          <div className="flex items-center gap-2">
            <Switch
              checked={isEnabled}
              onCheckedChange={onToggle}
              className="data-[state=checked]:bg-cyan-500"
            />
            <span className={cn(
              'text-xs font-medium',
              isEnabled ? 'text-emerald-600' : 'text-slate-400'
            )}>
              {isEnabled ? '✓ Activada' : 'Desactivada'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
