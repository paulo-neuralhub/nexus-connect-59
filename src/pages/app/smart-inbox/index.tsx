/**
 * Documentos Oficiales — /app/smart-inbox
 * IPO document processing with 2-panel layout
 */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  Building2, Upload, CheckCircle, AlertTriangle, Clock, Search, FileText,
  ArrowRight, Loader2, Zap, Download, ExternalLink, Link as LinkIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { useIpoDocuments, type IpoDocument } from '@/hooks/use-ipo-documents';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow, differenceInDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';

// ── Helpers ──
const FLAG_MAP: Record<string, string> = {
  US: '🇺🇸', USPTO: '🇺🇸',
  EM: '🇪🇺', EUIPO: '🇪🇺',
  EP: '🏛️', EPO: '🏛️',
  ES: '🇪🇸', OEPM: '🇪🇸',
  JP: '🇯🇵', JPO: '🇯🇵',
  CN: '🇨🇳', CNIPA: '🇨🇳',
  KR: '🇰🇷', KIPO: '🇰🇷',
  GB: '🇬🇧', UKIPO: '🇬🇧',
};

const OFFICE_NAME_MAP: Record<string, string> = {
  US: 'USPTO', EM: 'EUIPO', EP: 'EPO', ES: 'OEPM', JP: 'JPO',
};

function getFlag(code: string | null) {
  if (!code) return '🌐';
  return FLAG_MAP[code.toUpperCase()] || '🌐';
}

function getOfficeName(code: string | null, parsed: any) {
  if (parsed?.office_name) return parsed.office_name;
  if (!code) return 'Desconocida';
  return OFFICE_NAME_MAP[code.toUpperCase()] || code.toUpperCase();
}

function getDocTypeBadge(docType: string | undefined) {
  switch (docType) {
    case 'office_action': return { label: 'OA', bg: 'bg-orange-100 text-orange-700' };
    case 'publication_notice': return { label: 'Publicación', bg: 'bg-blue-100 text-blue-700' };
    case 'registration_certificate': return { label: 'Certificado', bg: 'bg-emerald-100 text-emerald-700' };
    case 'rejection': return { label: 'Denegación', bg: 'bg-red-100 text-red-700' };
    default: return { label: 'Documento', bg: 'bg-muted text-muted-foreground' };
  }
}

function getDeadlineFromDoc(doc: IpoDocument): string | null {
  const pd = doc.parsed_data;
  if (!pd) return null;
  return pd.response_deadline_date || pd.opposition_deadline || pd.expiry_date || null;
}

function getUrgencyBadge(doc: IpoDocument) {
  const deadline = getDeadlineFromDoc(doc);
  if (!deadline) return null;
  const days = differenceInDays(new Date(deadline), new Date());
  if (days < 0) return { label: 'VENCIDO', color: '#DC2626', days, bg: 'bg-destructive/10' };
  if (days < 7) return { label: `🔴 ${days}d`, color: '#DC2626', days, bg: 'bg-destructive/10' };
  if (days <= 30) return { label: `${days} días`, color: '#B45309', days, bg: 'bg-amber-100' };
  if (days <= 90) return { label: `${days} días`, color: '#2563EB', days, bg: 'bg-blue-50' };
  if (days <= 365) return { label: `${days} días`, color: '#2563EB', days, bg: 'bg-blue-50' };
  return { label: `${days}d`, color: '#94A3B8', days, bg: 'bg-muted' };
}

function getBorderColor(doc: IpoDocument) {
  if (doc.processing_status === 'unprocessed' && doc.parsing_status === 'pending') return '#EF4444';
  const deadline = getDeadlineFromDoc(doc);
  if (!deadline) return '#94A3B8';
  const days = differenceInDays(new Date(deadline), new Date());
  if (days < 7) return '#EF4444';
  if (days < 30) return '#F97316';
  if (days < 90) return '#F59E0B';
  if (days < 365) return '#3B82F6';
  return '#94A3B8';
}

function getConfidenceInfo(value: number) {
  const pct = Math.round(value * 100);
  if (pct >= 90) return { pct, color: '#10B981', label: 'Alta confianza' };
  if (pct >= 70) return { pct, color: '#F59E0B', label: 'Confianza media — revisar' };
  return { pct, color: '#EF4444', label: 'Baja confianza — revisión manual requerida' };
}

// ── Component ──
export default function SmartInboxPage() {
  const { data: documents = [], isLoading } = useIpoDocuments();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState('auto');
  const [searchModal, setSearchModal] = useState(false);
  const [matterSearch, setMatterSearch] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Counts
  const counts = useMemo(() => {
    const pending = documents.filter(d => d.processing_status === 'unprocessed' && d.parsing_status === 'pending').length;
    const manual = documents.filter(d => d.processing_status === 'unprocessed' && d.parsing_status !== 'pending').length;
    const processed = documents.filter(d => d.processing_status === 'processed').length;
    return { pending, manual, processed, all: documents.length };
  }, [documents]);

  // Auto-select default tab
  const activeTab = tab === 'auto'
    ? (counts.pending > 0 ? 'pending' : counts.manual > 0 ? 'manual_review' : 'all')
    : tab;

  // Filter
  const filtered = useMemo(() => {
    switch (activeTab) {
      case 'pending': return documents.filter(d => d.processing_status === 'unprocessed' && d.parsing_status === 'pending');
      case 'manual_review': return documents.filter(d => d.processing_status === 'unprocessed' && d.parsing_status !== 'pending');
      case 'processed': return documents.filter(d => d.processing_status === 'processed');
      default: return documents;
    }
  }, [documents, activeTab]);

  const selected = documents.find(d => d.id === selectedId) || null;

  const handleAnalyze = async (docId: string) => {
    toast.info('🤖 IP-GENIUS está analizando el documento. Recibirás una notificación cuando termine.');
    try {
      const client: any = supabase;
      await client
        .from('ipo_incoming_documents')
        .update({ parsing_status: 'manual_review' })
        .eq('id', docId);
      queryClient.invalidateQueries({ queryKey: ['ipo-documents'] });
    } catch { /* silent */ }
  };

  const handleMarkProcessed = async (docId: string) => {
    try {
      const client: any = supabase;
      await client
        .from('ipo_incoming_documents')
        .update({ processing_status: 'processed', processed_at: new Date().toISOString() })
        .eq('id', docId);
      queryClient.invalidateQueries({ queryKey: ['ipo-documents'] });
      queryClient.invalidateQueries({ queryKey: ['ipo-document-counts'] });
      toast.success('✅ Documento marcado como procesado');
    } catch { /* silent */ }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Documentos Oficiales
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Notificaciones de oficinas IP</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Upload className="w-3.5 h-3.5" /> Subir documento
        </Button>
      </div>

      {/* KPI Pills */}
      <div className="flex gap-3 flex-wrap">
        <KpiPill icon="🔴" label="Sin procesar" count={counts.pending} color="bg-red-50 text-red-700 border-red-200" />
        <KpiPill icon="🟡" label="Revisión manual" count={counts.manual} color="bg-amber-50 text-amber-700 border-amber-200" />
        <KpiPill icon="🔵" label="Procesados" count={counts.processed} color="bg-blue-50 text-blue-700 border-blue-200" />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={v => setTab(v)}>
        <TabsList>
          <TabsTrigger value="pending" className="text-xs gap-1">
            Sin procesar {counts.pending > 0 && <Badge variant="destructive" className="h-4 px-1 text-[9px]">{counts.pending}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="manual_review" className="text-xs">Revisión manual ({counts.manual})</TabsTrigger>
          <TabsTrigger value="processed" className="text-xs">Procesados ({counts.processed})</TabsTrigger>
          <TabsTrigger value="all" className="text-xs">Todos ({counts.all})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 2-Panel Layout */}
      <div className="flex gap-4 min-h-[500px]">
        {/* Left: List */}
        <div className="w-full lg:w-[40%] space-y-2 overflow-auto max-h-[700px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No hay documentos en esta categoría</p>
            </div>
          ) : (
            filtered.map(doc => (
              <DocCard
                key={doc.id}
                doc={doc}
                isSelected={selectedId === doc.id}
                onClick={() => setSelectedId(doc.id)}
              />
            ))
          )}
        </div>

        {/* Right: Detail */}
        <div className="hidden lg:block flex-1 min-w-0">
          {selected ? (
            <DetailPanel
              doc={selected}
              onAnalyze={handleAnalyze}
              onMarkProcessed={handleMarkProcessed}
              onSearchMatter={() => setSearchModal(true)}
              onViewMatter={() => selected.matched_matter_id && navigate(`/app/expedientes/${selected.matched_matter_id}`)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Building2 className="w-16 h-16 opacity-15 mb-4" />
              <p className="text-sm">Selecciona un documento para ver el detalle</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile detail (shown below list) */}
      {selected && (
        <div className="lg:hidden">
          <DetailPanel
            doc={selected}
            onAnalyze={handleAnalyze}
            onMarkProcessed={handleMarkProcessed}
            onSearchMatter={() => setSearchModal(true)}
            onViewMatter={() => selected.matched_matter_id && navigate(`/app/expedientes/${selected.matched_matter_id}`)}
          />
        </div>
      )}

      {/* Matter search modal */}
      <Dialog open={searchModal} onOpenChange={setSearchModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Buscar expediente</DialogTitle>
            <DialogDescription>Vincula este documento a un expediente existente</DialogDescription>
          </DialogHeader>
          <Input placeholder="Buscar por título o referencia..." value={matterSearch} onChange={e => setMatterSearch(e.target.value)} />
          <p className="text-xs text-muted-foreground text-center py-4">Escribe para buscar expedientes</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Sub-components ──

function KpiPill({ icon, label, count, color }: { icon: string; label: string; count: number; color: string }) {
  return (
    <div className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium', color)}>
      <span>{icon}</span>
      <span>{count}</span>
      <span className="opacity-75">{label}</span>
    </div>
  );
}

function DocCard({ doc, isSelected, onClick }: { doc: IpoDocument; isSelected: boolean; onClick: () => void }) {
  const pd = doc.parsed_data;
  const docType = getDocTypeBadge(pd?.document_type);
  const urgency = getUrgencyBadge(doc);
  const borderColor = getBorderColor(doc);
  const isPending = doc.processing_status === 'unprocessed' && doc.parsing_status === 'pending';
  const isManualReview = doc.processing_status === 'unprocessed' && doc.parsing_status !== 'pending';
  const deadline = getDeadlineFromDoc(doc);
  const officeName = getOfficeName(doc.source_ipo_code, pd);

  const docTitle = pd?.document_type === 'office_action' ? 'Office Action'
    : pd?.document_type === 'publication_notice' ? 'Aviso de publicación'
    : pd?.document_type === 'registration_certificate' ? 'Certificado de registro'
    : 'Documento';

  const docNumber = pd?.serial_number || pd?.application_number || pd?.registration_number || '';

  return (
    <div
      className={cn(
        'group relative rounded-xl border bg-card cursor-pointer transition-all duration-150',
        'hover:shadow-md hover:-translate-y-0.5',
        isSelected && 'bg-accent/50 shadow-md ring-1 ring-primary/20',
        isPending && 'animate-pulse',
      )}
      style={{
        borderLeftWidth: '4px',
        borderLeftColor: borderColor,
      }}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3.5 pt-3 pb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-lg leading-none flex-shrink-0">{getFlag(doc.source_ipo_code)}</span>
          <span className="text-[13px] font-bold text-foreground">{officeName}</span>
          <span className="text-muted-foreground text-[11px]">·</span>
          <Badge className={cn('text-[9px] px-1.5 py-0 h-[18px] border-0 font-medium', docType.bg)}>{docType.label}</Badge>
          <span className="text-muted-foreground text-[11px]">·</span>
          <span className="text-[11px] text-muted-foreground whitespace-nowrap">
            hace {doc.received_at ? formatDistanceToNow(new Date(doc.received_at), { addSuffix: false, locale: es }) : '—'}
          </span>
        </div>
        {urgency && (
          <Badge
            className={cn('text-[10px] px-2 py-0.5 h-[20px] border-0 font-semibold tabular-nums flex-shrink-0', urgency.bg)}
            style={{ color: urgency.color }}
          >
            {urgency.label}
          </Badge>
        )}
      </div>

      {/* Body */}
      <div className="px-3.5 pb-2">
        <p className="text-[14px] font-semibold text-foreground truncate leading-tight">
          {docTitle} — {docNumber}
        </p>
      </div>

      {/* Linked matter */}
      <div className="px-3.5 py-1.5 border-t border-border/50">
        {doc.matter ? (
          <p className="text-xs flex items-center gap-1.5 text-emerald-600 truncate">
            <LinkIcon className="w-3 h-3 flex-shrink-0" />
            {doc.matter.reference} · {doc.matter.title}
          </p>
        ) : (
          <p className="text-xs flex items-center gap-1.5 text-amber-600">
            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
            Sin expediente asignado
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="px-3.5 py-2 border-t border-border/50">
        {isPending ? (
          <p className="text-xs flex items-center gap-1.5 text-destructive font-medium">
            <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" />
            Pendiente de análisis
          </p>
        ) : isManualReview ? (
          <p className="text-xs flex items-center gap-1.5 text-amber-600 font-medium">
            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
            Requiere revisión manual
          </p>
        ) : deadline ? (
          <p className="text-xs flex items-center gap-1.5 text-muted-foreground" style={urgency && urgency.days !== undefined && urgency.days <= 30 ? { color: urgency.color } : undefined}>
            <Clock className="w-3 h-3 flex-shrink-0" />
            Responder antes: {format(new Date(deadline), "dd MMM yyyy", { locale: es })}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function DetailPanel({
  doc, onAnalyze, onMarkProcessed, onSearchMatter, onViewMatter
}: {
  doc: IpoDocument;
  onAnalyze: (id: string) => void;
  onMarkProcessed: (id: string) => void;
  onSearchMatter: () => void;
  onViewMatter: () => void;
}) {
  const pd = doc.parsed_data;
  const docType = getDocTypeBadge(pd?.document_type);
  const urgency = getUrgencyBadge(doc);
  const isPending = doc.processing_status === 'unprocessed' && doc.parsing_status === 'pending';
  const deadlines = Array.isArray(doc.deadlines_created) ? doc.deadlines_created : [];

  // Build parsed_data table rows
  const extractedFields: { label: string; value: string }[] = [];
  if (pd) {
    if (pd.serial_number) extractedFields.push({ label: 'Número expediente', value: pd.serial_number });
    if (pd.application_number) extractedFields.push({ label: 'Número solicitud', value: pd.application_number });
    if (pd.registration_number) extractedFields.push({ label: 'Número registro', value: pd.registration_number });
    if (pd.document_type) extractedFields.push({ label: 'Tipo documento', value: pd.document_type.replace(/_/g, ' ') });
    if (pd.mark_name) extractedFields.push({ label: 'Marca', value: pd.mark_name });
    if (pd.action_date) extractedFields.push({ label: 'Fecha del acto', value: pd.action_date });
    if (pd.response_deadline_months) extractedFields.push({ label: 'Plazo de respuesta', value: `${pd.response_deadline_months} meses` });
    if (pd.response_deadline_date) extractedFields.push({ label: 'Fecha límite', value: pd.response_deadline_date });
    if (pd.opposition_deadline) extractedFields.push({ label: 'Fecha oposición', value: pd.opposition_deadline });
    if (pd.publication_date) extractedFields.push({ label: 'Fecha publicación', value: pd.publication_date });
    if (pd.registration_date) extractedFields.push({ label: 'Fecha registro', value: pd.registration_date });
    if (pd.expiry_date) extractedFields.push({ label: 'Fecha vencimiento', value: pd.expiry_date });
    if (pd.examiner_name) extractedFields.push({ label: 'Examinador', value: pd.examiner_name });
    if (pd.classes) extractedFields.push({ label: 'Clases', value: pd.classes.join(', ') });
    if (pd.language) extractedFields.push({ label: 'Idioma', value: pd.language.toUpperCase() });
    if (pd.requires_translation) extractedFields.push({ label: 'Traducción', value: 'Requerida' });
    if (pd.rejection_grounds) extractedFields.push({ label: 'Motivos', value: pd.rejection_grounds.join(', ').replace(/_/g, ' ') });
    if (pd.conflicting_marks) extractedFields.push({ label: 'Marcas conflictivas', value: pd.conflicting_marks.join(', ') });
  }

  return (
    <Card className="h-full overflow-auto">
      <CardContent className="p-5 space-y-5">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{getFlag(doc.source_ipo_code)}</span>
            <span className="text-lg font-bold">{getOfficeName(doc.source_ipo_code, pd)}</span>
          </div>
          <p className="text-base font-semibold text-foreground">
            {pd?.document_type === 'office_action' ? 'Office Action' :
             pd?.document_type === 'publication_notice' ? 'Aviso de publicación' :
             pd?.document_type === 'registration_certificate' ? 'Certificado de registro' :
             'Documento oficial'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Recibido: {doc.received_at ? format(new Date(doc.received_at), "dd 'de' MMMM yyyy, HH:mm", { locale: es }) : 'Desconocido'}
          </p>
          <div className="flex gap-1.5 mt-2">
            <Badge className={cn('text-[10px]', docType.bg)}>{docType.label}</Badge>
            {urgency && (
              <Badge className={cn('text-[10px] border-0', urgency.bg)} style={{ color: urgency.color }}>
                {urgency.label}
              </Badge>
            )}
            {doc.processing_status === 'processed' && (
              <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">✅ Procesado</Badge>
            )}
          </div>
        </div>

        {/* Pending state */}
        {isPending && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center space-y-2">
            <Loader2 className="w-8 h-8 text-red-400 mx-auto animate-spin" />
            <p className="text-sm font-medium text-red-700">⏳ Documento pendiente de análisis</p>
            <p className="text-xs text-red-600">IP-GENIUS aún no ha procesado este documento</p>
            <Button size="sm" className="gap-1.5 mt-2" onClick={() => onAnalyze(doc.id)}>
              <Zap className="w-3.5 h-3.5" /> Analizar con IP-GENIUS
            </Button>
          </div>
        )}

        {/* IP-GENIUS extraction */}
        {pd && !isPending && (
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200/50 rounded-lg p-4 space-y-3">
            <p className="text-xs font-semibold text-blue-800 flex items-center gap-1.5">
              🤖 IP-GENIUS extrajo automáticamente:
            </p>
            <div className="divide-y divide-blue-200/30">
              {extractedFields.map(f => (
                <div key={f.label} className="flex justify-between py-1.5 text-xs">
                  <span className="text-muted-foreground">{f.label}</span>
                  <span className="font-medium text-foreground text-right max-w-[60%] truncate">{f.value}</span>
                </div>
              ))}
            </div>

            {/* Confidence bar */}
            {doc.parsing_confidence != null && (
              <div className="pt-2">
                {(() => {
                  const ci = getConfidenceInfo(doc.parsing_confidence);
                  return (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-muted-foreground">Confianza del análisis</span>
                        <span className="font-semibold" style={{ color: ci.color }}>{ci.pct}% — {ci.label}</span>
                      </div>
                      <div className="h-2 bg-white/70 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${ci.pct}%`, backgroundColor: ci.color }}
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* Linked matter */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Expediente vinculado</p>
          {doc.matter ? (
            <Card className="border-emerald-200 bg-emerald-50/30">
              <CardContent className="p-3 space-y-1">
                <p className="text-sm font-semibold">{doc.matter.reference}</p>
                <p className="text-xs text-muted-foreground">{doc.matter.title}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Badge className="text-[9px] bg-muted">{doc.matter.type}</Badge>
                  <Badge className="text-[9px] bg-muted">{doc.matter.status}</Badge>
                  {doc.match_confidence != null && (
                    <Badge className="text-[9px] bg-emerald-100 text-emerald-700">
                      Match {Math.round(doc.match_confidence * 100)}%
                    </Badge>
                  )}
                  {doc.auto_matched && (
                    <span className="text-[9px] text-emerald-600">Auto-vinculado ✅</span>
                  )}
                </div>
                <Button variant="ghost" size="sm" className="text-xs gap-1 mt-1 h-7 px-2" onClick={() => doc.matched_matter_id && window.location.assign(`/app/expedientes/${doc.matched_matter_id}`)}>
                  Ver expediente completo <ArrowRight className="w-3 h-3" />
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
              <p className="text-xs text-amber-700">No se encontró expediente automáticamente</p>
              <Button variant="outline" size="sm" className="text-xs gap-1 h-7" onClick={onSearchMatter}>
                <Search className="w-3 h-3" /> Buscar expediente...
              </Button>
            </div>
          )}
        </div>

        {/* Deadlines created */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Plazos creados</p>
          {deadlines.length > 0 ? (
            <div className="space-y-1">
              {deadlines.map((dl: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs bg-emerald-50 rounded px-2.5 py-1.5">
                  <span>{dl.type?.replace(/_/g, ' ')}</span>
                  <span className="text-emerald-600 font-medium">{dl.deadline} ✅</span>
                </div>
              ))}
            </div>
          ) : doc.processing_status !== 'processed' && doc.matched_matter_id ? (
            <Button variant="outline" size="sm" className="text-xs gap-1">
              <Zap className="w-3 h-3" /> Generar plazos automáticamente
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">Sin plazos asociados</p>
          )}
        </div>

        {/* Raw content */}
        {doc.raw_email_content && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contenido original</p>
            <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground font-mono whitespace-pre-wrap leading-relaxed max-h-40 overflow-auto">
              {doc.raw_email_content}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {doc.processing_status !== 'processed' && (
            <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => onMarkProcessed(doc.id)}>
              <CheckCircle className="w-3.5 h-3.5" /> Marcar procesado
            </Button>
          )}
          {doc.matched_matter_id && (
            <Button size="sm" variant="outline" className="text-xs gap-1" onClick={onViewMatter}>
              <ExternalLink className="w-3.5 h-3.5" /> Ver expediente
            </Button>
          )}
          {doc.file_storage_path && (
            <Button size="sm" variant="outline" className="text-xs gap-1">
              <Download className="w-3.5 h-3.5" /> Descargar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
