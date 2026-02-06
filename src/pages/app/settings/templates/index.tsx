// ============================================================
// TEMPLATES CATALOG PAGE - Catálogo visual simplificado
// 15 tipos × 18 estilos = 270 plantillas profesionales
// ============================================================

import * as React from 'react';
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, Palette, Search, LayoutGrid, List, Settings2,
  Loader2, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import { 
  TemplateCategoryTabs, 
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

export default function TemplateCatalogPage() {
  // State
  const [activeCategory, setActiveCategory] = useState<'all' | DocumentCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
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
  
  // Calculate counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<'all' | DocumentCategory, number> = {
      all: types?.length || 0,
      financiero: typesByCategory?.financiero?.length || 0,
      comunicacion: typesByCategory?.comunicacion?.length || 0,
      informe: typesByCategory?.informe?.length || 0,
      legal: typesByCategory?.legal?.length || 0,
      ip: typesByCategory?.ip?.length || 0,
    };
    return counts;
  }, [types, typesByCategory]);
  
  // Filter types by category and search
  const filteredTypes = useMemo(() => {
    let filtered = types || [];
    
    // Filter by category
    if (activeCategory !== 'all') {
      filtered = filtered.filter(t => t.category === activeCategory);
    }
    
    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.nameEn.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [types, activeCategory, searchQuery]);
  
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
  const totalCombinations = (styles?.length || 0) * (types?.length || 0);
  const activeCount = types?.filter(t => isTypeEnabled(t.id)).length || 0;
  
  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-400 flex items-center justify-center shadow-lg">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Plantillas de Documentos</h1>
            <p className="text-sm text-slate-500">
              {isLoading ? 'Cargando...' : (
                <>
                  <span className="font-semibold text-slate-700">{totalCombinations}</span> plantillas · 
                  {types?.length || 0} tipos × {styles?.length || 0} estilos. 
                  Documentos profesionales listos para usar.
                </>
              )}
            </p>
          </div>
        </div>
        
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link to="/app/settings/templates/branding">
            <Palette className="w-4 h-4" />
            Identidad de Marca
          </Link>
        </Button>
      </div>
      
      {/* Default style indicator */}
      {currentDefaultStyle && (
        <Card className="border-cyan-200 bg-gradient-to-r from-cyan-50/50 to-transparent">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <div 
                className="w-10 h-14 rounded-lg overflow-hidden border shadow-sm"
                style={{ backgroundColor: currentDefaultStyle.colors.background }}
              >
                <div 
                  className="h-3" 
                  style={{ backgroundColor: currentDefaultStyle.colors.headerBg }}
                />
                <div className="p-1.5">
                  <div 
                    className="h-1 rounded-full w-2/3 mb-1"
                    style={{ backgroundColor: currentDefaultStyle.colors.text, opacity: 0.2 }}
                  />
                  <div 
                    className="h-2 rounded-sm"
                    style={{ backgroundColor: currentDefaultStyle.colors.tableHeadBg }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-500" />
                  <span className="text-sm font-semibold text-slate-800">
                    Estilo por defecto: {currentDefaultStyle.name}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Este estilo se aplica a todos los documentos generados automáticamente
                </p>
              </div>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-cyan-600 hover:text-cyan-700">
              <Link to="/app/settings/templates/branding">
                <Settings2 className="w-4 h-4 mr-2" />
                Cambiar
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Category Tabs */}
      <TemplateCategoryTabs
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        counts={categoryCounts}
      />
      
      {/* Search and View controls */}
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
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {activeCount} activas
          </Badge>
          
          <div className="flex items-center border rounded-lg p-1 bg-white">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-1.5 rounded transition-colors',
                viewMode === 'grid' 
                  ? 'bg-slate-100 text-slate-700' 
                  : 'text-slate-400 hover:text-slate-600'
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-1.5 rounded transition-colors',
                viewMode === 'list' 
                  ? 'bg-slate-100 text-slate-700' 
                  : 'text-slate-400 hover:text-slate-600'
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Templates Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
        </div>
      ) : filteredTypes.length === 0 ? (
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
        <div className={cn(
          'grid gap-5',
          viewMode === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
            : 'grid-cols-1'
        )}>
          {filteredTypes.map((type) => (
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
