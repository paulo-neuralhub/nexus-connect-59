// ============================================================
// TEMPLATES CATALOG PAGE - Catálogo visual de plantillas
// 15 tipos × 18 estilos = 270 combinaciones
// SIN enlace al generador - Este ES el catálogo directo
// ============================================================

import * as React from 'react';
import { useState, useMemo } from 'react';
import { 
  FileText, Search, LayoutGrid, ChevronDown, Check,
  Loader2, Banknote, Mail, BarChart3, Scale, Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

import { 
  TemplateCard, 
  TemplatePreviewModal 
} from '@/components/features/templates';
import { useDocumentTypes, useDocumentTypesByCategory } from '@/hooks/documents/useDocumentTypes';
import { useDocumentStyles, useDocumentStyle } from '@/hooks/documents/useDocumentStyles';
import { 
  useTemplatePreferences, 
  useSetDefaultStyle, 
  useToggleDocumentType,
  useActiveDocumentTypes 
} from '@/hooks/documents/useTemplatePreferences';
import type { DocumentType, DocumentCategory, DesignTokens } from '@/lib/document-templates/designTokens';

// Category configuration with icons and emojis
const CATEGORY_CONFIG: { 
  key: DocumentCategory; 
  label: string; 
  emoji: string;
  icon: React.ElementType;
}[] = [
  { key: 'financiero', label: 'Financiero', emoji: '💰', icon: Banknote },
  { key: 'comunicacion', label: 'Comunicación', emoji: '📨', icon: Mail },
  { key: 'informe', label: 'Informes', emoji: '📊', icon: BarChart3 },
  { key: 'legal', label: 'Legal', emoji: '⚖️', icon: Scale },
  { key: 'ip', label: 'IP', emoji: '🏆', icon: Award },
];

export default function TemplateCatalogPage() {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [previewType, setPreviewType] = useState<DocumentType | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // Data hooks
  const { data: types, isLoading: typesLoading } = useDocumentTypes();
  const { data: typesByCategory } = useDocumentTypesByCategory();
  const { data: styles, isLoading: stylesLoading } = useDocumentStyles();
  const { data: prefs } = useTemplatePreferences();
  const { isTypeEnabled } = useActiveDocumentTypes();
  
  // Get default style
  const { data: defaultStyle } = useDocumentStyle(prefs?.default_style_id || null);
  const fallbackStyle = styles?.[0] || null;
  const currentDefaultStyle = defaultStyle || fallbackStyle;
  
  // Mutations
  const setDefaultStyleMutation = useSetDefaultStyle();
  const toggleTypeMutation = useToggleDocumentType();
  
  const isLoading = typesLoading || stylesLoading;
  
  // Filter types by search
  const filteredTypesByCategory = useMemo(() => {
    if (!typesByCategory) return null;
    
    if (!searchQuery.trim()) return typesByCategory;
    
    const query = searchQuery.toLowerCase();
    const filtered: Record<DocumentCategory, DocumentType[]> = {} as any;
    
    Object.entries(typesByCategory).forEach(([cat, typesList]) => {
      const matching = (typesList as DocumentType[]).filter(t => 
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query)
      );
      if (matching.length > 0) {
        filtered[cat as DocumentCategory] = matching;
      }
    });
    
    return filtered;
  }, [typesByCategory, searchQuery]);
  
  // Handlers
  const handlePreview = (type: DocumentType) => {
    setPreviewType(type);
    setIsPreviewOpen(true);
  };
  
  const handleToggle = (typeId: string, enabled: boolean) => {
    toggleTypeMutation.mutate({ typeId, enabled });
  };
  
  const handleStyleChange = (style: DesignTokens) => {
    setDefaultStyleMutation.mutate(style.id);
  };
  
  // Stats
  const totalTypes = types?.length || 0;
  const totalStyles = styles?.length || 0;
  const totalCombinations = totalTypes * totalStyles;
  const activeCount = types?.filter(t => isTypeEnabled(t.id)).length || 0;
  
  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #00b4d8, #00d4aa)',
              boxShadow: '0 4px 14px rgba(0, 180, 216, 0.25)',
            }}
          >
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Plantillas de Documentos</h1>
            <p className="text-sm text-slate-500">
              {isLoading ? 'Cargando...' : (
                <span>
                  <span className="font-semibold text-slate-700">{totalTypes}</span> tipos × 
                  <span className="font-semibold text-slate-700"> {totalStyles}</span> estilos = 
                  <span className="font-semibold text-cyan-600"> {totalCombinations}</span> combinaciones
                </span>
              )}
            </p>
          </div>
        </div>
        
        {/* Default Style Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className="gap-2 min-w-[200px] justify-between"
              disabled={isLoading}
            >
              <div className="flex items-center gap-2">
                {currentDefaultStyle && (
                  <div 
                    className="w-5 h-7 rounded border shadow-sm overflow-hidden shrink-0"
                    style={{ backgroundColor: currentDefaultStyle.colors.background }}
                  >
                    <div 
                      className="h-1.5" 
                      style={{ backgroundColor: currentDefaultStyle.colors.headerBg }}
                    />
                  </div>
                )}
                <span className="text-sm">
                  Estilo por defecto: <span className="font-semibold">{currentDefaultStyle?.name || 'Ninguno'}</span>
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 max-h-80 overflow-y-auto">
            <DropdownMenuLabel>Seleccionar estilo por defecto</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {styles?.map((style) => (
              <DropdownMenuItem 
                key={style.id}
                onClick={() => handleStyleChange(style)}
                className="flex items-center gap-3 cursor-pointer"
              >
                {/* Mini preview */}
                <div 
                  className="w-6 h-8 rounded border shadow-sm overflow-hidden shrink-0"
                  style={{ backgroundColor: style.colors.background }}
                >
                  <div 
                    className="h-2" 
                    style={{ backgroundColor: style.colors.headerBg }}
                  />
                </div>
                <span className="flex-1">{style.name}</span>
                {currentDefaultStyle?.id === style.id && (
                  <Check className="h-4 w-4 text-cyan-500" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Search and Stats */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar plantilla..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white"
          />
        </div>
        
        <Badge 
          variant="outline" 
          className="text-xs px-3 py-1.5"
          style={{
            background: 'linear-gradient(135deg, #f1f4f9, #e8ebf0)',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
          }}
        >
          <span className="text-emerald-600 font-semibold">{activeCount}</span>
          <span className="text-slate-500 ml-1">activas de {totalTypes}</span>
        </Badge>
      </div>
      
      {/* Templates Grid by Category */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
        </div>
      ) : !filteredTypesByCategory || Object.keys(filteredTypesByCategory).length === 0 ? (
        <div className="text-center py-20">
          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No se encontraron plantillas</p>
          {searchQuery && (
            <Button 
              variant="link" 
              onClick={() => setSearchQuery('')}
              className="mt-2"
            >
              Limpiar búsqueda
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {CATEGORY_CONFIG.map(({ key, label, emoji, icon: Icon }) => {
            const categoryTypes = filteredTypesByCategory[key];
            if (!categoryTypes || categoryTypes.length === 0) return null;
            
            return (
              <div key={key}>
                {/* Category Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div 
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                    style={{
                      background: '#f1f4f9',
                      boxShadow: 'inset 1px 1px 3px #cdd1dc, inset -1px -1px 3px #ffffff',
                    }}
                  >
                    <span className="text-lg">{emoji}</span>
                    <span className="font-semibold text-slate-700">{label}</span>
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {categoryTypes.length}
                    </Badge>
                  </div>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>
                
                {/* Category Grid - 3 columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {categoryTypes.map((type) => (
                    <TemplateCard
                      key={type.id}
                      documentType={type}
                      defaultStyle={currentDefaultStyle}
                      isEnabled={isTypeEnabled(type.id)}
                      onToggle={(enabled) => handleToggle(type.id, enabled)}
                      onPreview={() => handlePreview(type)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Preview Modal */}
      <TemplatePreviewModal
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        documentType={previewType}
        defaultStyle={currentDefaultStyle}
        allStyles={styles || []}
        isEnabled={previewType ? isTypeEnabled(previewType.id) : true}
        onToggle={(enabled) => previewType && handleToggle(previewType.id, enabled)}
        onStyleChange={handleStyleChange}
      />
    </div>
  );
}
