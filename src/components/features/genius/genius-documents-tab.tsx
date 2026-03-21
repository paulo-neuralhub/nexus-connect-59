/**
 * Genius Documents Tab — List + 4-step generator wizard
 */
import { useState } from 'react';
import { FileText, Plus, Eye, Edit, CheckCircle, Loader2, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { CoverageIndicator } from './genius-coverage-banner';

const DOC_TYPES = [
  { value: 'oa_response', label: 'Respuesta OA', icon: '📝', category: 'office_action' },
  { value: 'opposition', label: 'Oposición', icon: '⚖️', category: 'opposition' },
  { value: 'license', label: 'Licencia', icon: '📄', category: 'license' },
  { value: 'assignment', label: 'Cesión', icon: '📋', category: 'assignment' },
  { value: 'cease_desist', label: 'Cease & Desist', icon: '✉️', category: 'cease_desist' },
  { value: 'report', label: 'Informe', icon: '📊', category: 'report' },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: 'Borrador', color: 'bg-muted text-muted-foreground' },
  reviewed: { label: 'Revisado', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  approved: { label: 'Aprobado', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  sent: { label: 'Enviado', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
};

export function GeniusDocumentsTab() {
  const { currentOrganization } = useOrganization();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showWizard, setShowWizard] = useState(false);

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['genius-generated-docs', currentOrganization?.id, statusFilter],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];
      let query = supabase
        .from('genius_generated_docs')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      const { data, error } = await query.limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentOrganization?.id,
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {['all', 'draft', 'reviewed', 'approved', 'sent'].map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(s)}
            >
              {s === 'all' ? 'Todos' : STATUS_LABELS[s]?.label || s}
            </Button>
          ))}
        </div>
        <Button onClick={() => setShowWizard(true)} className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Generar documento
        </Button>
      </div>

      {/* Documents list */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Cargando...</div>
      ) : docs.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No hay documentos generados</p>
          <Button variant="outline" className="mt-4" onClick={() => setShowWizard(true)}>
            Generar primer documento
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {docs.map((doc: any) => (
            <Card key={doc.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm truncate">{doc.title}</p>
                    <Badge className={cn('text-xs', STATUS_LABELS[doc.status]?.color)}>
                      {STATUS_LABELS[doc.status]?.label || doc.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{doc.document_type}</span>
                    {doc.jurisdiction_code && <span>· {doc.jurisdiction_code}</span>}
                    <span>· v{doc.version}</span>
                    <span>· {new Date(doc.created_at).toLocaleDateString('es-ES')}</span>
                  </div>
                </div>

                {/* Workflow indicator */}
                <div className="flex items-center gap-1 text-xs">
                  <StatusDot active={true} label="Borrador" />
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  <StatusDot active={['reviewed', 'approved', 'sent'].includes(doc.status)} label="Revisado" />
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  <StatusDot active={['approved', 'sent'].includes(doc.status)} label="Aprobado" />
                </div>

                <div className="flex gap-1 ml-4">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Eye className="h-4 w-4" />
                  </Button>
                  {doc.status === 'draft' && (
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Generator Wizard */}
      <DocumentGeneratorWizard open={showWizard} onClose={() => setShowWizard(false)} />
    </div>
  );
}

function StatusDot({ active, label }: { active: boolean; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className={cn('h-2 w-2 rounded-full', active ? 'bg-green-500' : 'bg-muted')} />
      <span className="text-[9px] text-muted-foreground">{label}</span>
    </div>
  );
}

// ===== 4-Step Wizard =====
function DocumentGeneratorWizard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [docType, setDocType] = useState('');
  const [matterId, setMatterId] = useState('');
  const [jurisdiction, setJurisdiction] = useState('');
  const [language, setLanguage] = useState('es');
  const [instructions, setInstructions] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');

  // Matters
  const { data: matters = [] } = useQuery({
    queryKey: ['matters-simple-wizard', currentOrganization?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('matters')
        .select('id, reference, title, mark_name')
        .eq('organization_id', currentOrganization!.id)
        .order('updated_at', { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!currentOrganization?.id && open,
  });

  // Coverage for jurisdictions
  const { data: coverageList = [] } = useQuery({
    queryKey: ['genius-coverage-list'],
    queryFn: async () => {
      const { data } = await supabase
        .from('genius_knowledge_coverage')
        .select('jurisdiction_code, jurisdiction_name, flag_emoji, coverage_level, effective_score, supported_presentation_languages')
        .order('effective_score', { ascending: false });
      return data || [];
    },
    enabled: open,
  });

  const selectedCoverage = coverageList.find((c: any) => c.jurisdiction_code === jurisdiction);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('genius-generate-document', {
        body: {
          document_type: docType,
          matter_id: matterId || undefined,
          jurisdiction_code: jurisdiction,
          language,
          specific_instructions: instructions,
        },
      });
      if (error) throw error;
      setGeneratedContent(data?.content || 'Documento generado correctamente.');
      setStep(5); // Preview step
      toast.success('Documento generado');
    } catch {
      toast.error('Error al generar documento');
    } finally {
      setIsGenerating(false);
    }
  };

  const resetWizard = () => {
    setStep(1);
    setDocType('');
    setMatterId('');
    setJurisdiction('');
    setLanguage('es');
    setInstructions('');
    setGeneratedContent('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={resetWizard}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generar documento con IA ✨</DialogTitle>
          <p className="text-sm text-muted-foreground">Paso {Math.min(step, 4)} de 4</p>
        </DialogHeader>

        <Progress value={(Math.min(step, 4) / 4) * 100} className="h-1" />

        <div className="py-4 min-h-[300px]">
          {/* Step 1: Document type */}
          {step === 1 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {DOC_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => { setDocType(t.value); setStep(2); }}
                  className={cn(
                    'p-4 rounded-xl border-2 text-left transition-all hover:border-amber-400',
                    docType === t.value ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/20' : 'border-border'
                  )}
                >
                  <span className="text-2xl">{t.icon}</span>
                  <p className="font-medium text-sm mt-2">{t.label}</p>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Matter + Jurisdiction */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label>Expediente (opcional)</Label>
                <Select value={matterId} onValueChange={setMatterId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar expediente..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin vincular</SelectItem>
                    {matters.map((m: any) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.reference} - {m.title || m.mark_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Jurisdicción</Label>
                <Select value={jurisdiction} onValueChange={setJurisdiction}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar jurisdicción..." />
                  </SelectTrigger>
                  <SelectContent>
                    {coverageList.map((c: any) => (
                      <SelectItem key={c.jurisdiction_code} value={c.jurisdiction_code}>
                        <div className="flex items-center gap-2">
                          <span>{c.flag_emoji}</span>
                          <span>{c.jurisdiction_name}</span>
                          <CoverageIndicator level={c.coverage_level} />
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Coverage warning */}
              {selectedCoverage && ['none', 'minimal'].includes(selectedCoverage.coverage_level) && (
                <div className="p-3 rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/20 text-sm text-red-700 dark:text-red-400">
                  ⚠️ Cobertura {selectedCoverage.coverage_level === 'none' ? 'inexistente' : 'mínima'} 
                  para {selectedCoverage.jurisdiction_name}. El documento requerirá revisión experta obligatoria.
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(1)}>Anterior</Button>
                <Button onClick={() => setStep(3)} disabled={!jurisdiction}>Siguiente</Button>
              </div>
            </div>
          )}

          {/* Step 3: Language + Instructions */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <Label>Idioma del documento</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(selectedCoverage?.supported_presentation_languages || ['es', 'en']).map((l: string) => (
                      <SelectItem key={l} value={l}>
                        {l === 'es' ? 'Español' : l === 'en' ? 'Inglés' : l === 'fr' ? 'Francés' : l === 'de' ? 'Alemán' : l === 'it' ? 'Italiano' : l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Instrucciones adicionales (opcional)</Label>
                <Textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Instrucciones especiales para el documento..."
                  rows={4}
                />
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(2)}>Anterior</Button>
                <Button onClick={() => setStep(4)}>Siguiente</Button>
              </div>
            </div>
          )}

          {/* Step 4: Preview + Generate */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="font-medium">Resumen</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Tipo:</span>{' '}
                  {DOC_TYPES.find((t) => t.value === docType)?.label}
                </div>
                <div>
                  <span className="text-muted-foreground">Jurisdicción:</span>{' '}
                  {selectedCoverage?.flag_emoji} {selectedCoverage?.jurisdiction_name || jurisdiction}
                </div>
                <div>
                  <span className="text-muted-foreground">Idioma:</span> {language}
                </div>
                <div>
                  <span className="text-muted-foreground">Expediente:</span>{' '}
                  {matters.find((m: any) => m.id === matterId)?.reference || 'Sin vincular'}
                </div>
              </div>

              {instructions && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Instrucciones:</span>
                  <p className="mt-1">{instructions}</p>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Tiempo estimado: ~15-30 segundos
              </p>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(3)}>Anterior</Button>
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="bg-gradient-to-r from-amber-500 to-orange-600 text-white"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    'Generar documento con IA ✨'
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Generated preview */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Documento generado correctamente</span>
              </div>
              <div className="border rounded-lg p-4 max-h-60 overflow-y-auto prose prose-sm">
                <ReactMarkdown>{generatedContent}</ReactMarkdown>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={resetWizard}>Cerrar</Button>
                <Button onClick={resetWizard}>Guardar como borrador</Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

import ReactMarkdown from 'react-markdown';
