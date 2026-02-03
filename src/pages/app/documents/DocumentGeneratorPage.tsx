// ============================================================
// DOCUMENT GENERATOR PAGE
// Main page for generating documents with style + type selection
// ============================================================

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FileText, Download, Eye, Save, ArrowLeft, 
  Loader2, CheckCircle, AlertCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { StyleSelector, DocumentTypeSelector, DocumentPreview } from '@/components/documents/generator';
import { useDocumentStyles, useDocumentTypes, useDocumentData } from '@/hooks/documents';
import { downloadPDF, previewPDF } from '@/lib/document-templates/generatePDF';
import { useOrganization } from '@/contexts/organization-context';
import type { DesignTokens, DocumentType } from '@/lib/document-templates/designTokens';

export default function DocumentGeneratorPage() {
  const navigate = useNavigate();
  const previewRef = useRef<HTMLDivElement>(null);
  const { currentOrganization } = useOrganization();
  
  // State
  const [selectedStyle, setSelectedStyle] = useState<DesignTokens | null>(null);
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('style');

  // Hooks
  const stylesQuery = useDocumentStyles();
  const typesQuery = useDocumentTypes();
  const documentData = useDocumentData({ matterId: undefined, contactId: undefined });

  const styles = stylesQuery.data || [];
  const types = typesQuery.data || [];
  const isLoading = stylesQuery.isLoading || typesQuery.isLoading;

  // Auto-select first style if none selected
  if (!selectedStyle && styles.length > 0) {
    setSelectedStyle(styles[0]);
  }

  // Handle style selection
  const handleStyleSelect = (style: DesignTokens) => {
    setSelectedStyle(style);
    if (!selectedType) {
      setActiveTab('type');
    }
  };

  // Handle type selection
  const handleTypeSelect = (type: DocumentType) => {
    setSelectedType(type);
    setActiveTab('preview');
  };

  // Generate and download PDF
  const handleDownloadPDF = async () => {
    if (!previewRef.current || !selectedType) return;
    
    setIsGenerating(true);
    try {
      const filename = `${selectedType.id}-${Date.now()}.pdf`;
      await downloadPDF(previewRef.current, filename);
      toast.success('PDF descargado correctamente');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error al generar el PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  // Preview PDF in new tab
  const handlePreviewPDF = async () => {
    if (!previewRef.current) return;
    
    setIsGenerating(true);
    try {
      await previewPDF(previewRef.current);
    } catch (error) {
      console.error('Error previewing PDF:', error);
      toast.error('Error al previsualizar el PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  // Save document to database
  const handleSaveDocument = async () => {
    if (!selectedStyle || !selectedType) {
      toast.error('Selecciona un estilo y tipo de documento');
      return;
    }
    
    toast.success('Documento guardado (funcionalidad en desarrollo)');
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Generador de Documentos</h1>
                <p className="text-sm text-muted-foreground">
                  {selectedStyle ? selectedStyle.name : 'Selecciona un estilo'} 
                  {selectedType && ` — ${selectedType.name}`}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={handlePreviewPDF}
              disabled={!selectedType || isGenerating}
            >
              <Eye className="h-4 w-4 mr-2" />
              Vista previa
            </Button>
            <Button 
              variant="outline" 
              onClick={handleSaveDocument}
              disabled={!selectedType}
            >
              <Save className="h-4 w-4 mr-2" />
              Guardar
            </Button>
            <Button 
              onClick={handleDownloadPDF}
              disabled={!selectedType || isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Descargar PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel - Selectors */}
        <div className="w-[400px] border-r flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid grid-cols-3 mx-4 mt-4">
              <TabsTrigger value="style" className="flex items-center gap-2">
                <span className={cn(
                  'w-2 h-2 rounded-full',
                  selectedStyle ? 'bg-success' : 'bg-muted-foreground'
                )} />
                Estilo
              </TabsTrigger>
              <TabsTrigger value="type" className="flex items-center gap-2">
                <span className={cn(
                  'w-2 h-2 rounded-full',
                  selectedType ? 'bg-success' : 'bg-muted-foreground'
                )} />
                Tipo
              </TabsTrigger>
              <TabsTrigger value="data">Datos</TabsTrigger>
            </TabsList>

            <TabsContent value="style" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full p-4">
                {isLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <StyleSelector 
                    selectedStyleId={selectedStyle?.id || null}
                    onSelect={handleStyleSelect}
                  />
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="type" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full p-4">
                {isLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <DocumentTypeSelector 
                    selectedTypeId={selectedType?.id || null}
                    onSelect={handleTypeSelect}
                  />
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="data" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full p-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Datos del documento</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Company info summary */}
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Tu empresa</div>
                      <div className="text-sm font-medium">{documentData.company.name}</div>
                      <div className="text-xs text-muted-foreground">{documentData.company.cif}</div>
                    </div>
                    
                    {/* Client info summary */}
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Cliente</div>
                      <div className="text-sm font-medium">{documentData.client.name}</div>
                      <div className="text-xs text-muted-foreground">{documentData.client.company}</div>
                    </div>

                    {/* Status */}
                    <div className="pt-4 border-t">
                      <div className="flex items-center gap-2 text-xs">
                        {documentData.isLoading ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Cargando datos...</span>
                          </>
                        ) : documentData.hasRealData ? (
                          <>
                            <CheckCircle className="h-3 w-3 text-success" />
                            <span className="text-success">Datos reales cargados</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-3 w-3 text-warning" />
                            <span className="text-warning">Usando placeholders</span>
                          </>
                        )}
                      </div>
                    </div>

                    <Button variant="outline" size="sm" className="w-full">
                      Editar datos de empresa
                    </Button>
                  </CardContent>
                </Card>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right panel - Preview */}
        <div className="flex-1 bg-muted/30 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <DocumentPreview
              ref={previewRef}
              style={selectedStyle}
              documentType={selectedType}
              data={documentData}
              className="h-full"
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
