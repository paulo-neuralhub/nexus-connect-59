/**
 * Smart Inbox — /app/smart-inbox
 * Procesamiento de documentos de oficinas PI
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NeoBadge } from '@/components/ui/neo-badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Upload, Settings, CheckCircle, AlertTriangle, Clock, Search, FileText, ArrowRight, Inbox } from 'lucide-react';
import { toast } from 'sonner';

interface IncomingDocument {
  id: string;
  source_type: string;
  source_email_from: string | null;
  source_ipo_code: string | null;
  parsing_status: 'pending' | 'parsed' | 'low_confidence' | 'manual_review' | 'error';
  processing_status: 'unprocessed' | 'processed' | 'partial' | 'failed';
  match_confidence: number | null;
  matched_matter_title: string | null;
  matched_matter_ref: string | null;
  parsed_data: {
    application_number?: string;
    mark_name?: string;
    action_type?: string;
    deadline_date?: string;
    summary_text?: string;
  };
  actions_taken: string[];
  received_at: string;
}

const MOCK_DOCS: IncomingDocument[] = [
  {
    id: 'd1', source_type: 'email', source_email_from: 'notifications@euipo.europa.eu', source_ipo_code: 'EUIPO',
    parsing_status: 'parsed', processing_status: 'processed', match_confidence: 0.95,
    matched_matter_title: 'NEXUS — EUIPO', matched_matter_ref: 'NX-2024-001',
    parsed_data: { application_number: 'TM 018123456', mark_name: 'NEXUS', action_type: 'registration', deadline_date: '15/08/2026', summary_text: 'Registro confirmado de marca NEXUS' },
    actions_taken: ['Plazo creado', 'Notificación enviada'], received_at: '09:15 hoy',
  },
  {
    id: 'd2', source_type: 'email', source_email_from: 'office@uspto.gov', source_ipo_code: 'USPTO',
    parsing_status: 'low_confidence', processing_status: 'unprocessed', match_confidence: 0.60,
    matched_matter_title: null, matched_matter_ref: null,
    parsed_data: { application_number: '88/123,456', action_type: 'office_action', summary_text: 'Office Action — likelihood of confusion' },
    actions_taken: [], received_at: '08:45 hoy',
  },
  {
    id: 'd3', source_type: 'manual_upload', source_email_from: null, source_ipo_code: 'OEPM',
    parsing_status: 'parsed', processing_status: 'processed', match_confidence: 0.90,
    matched_matter_title: 'BETA — OEPM', matched_matter_ref: 'BT-2024-001',
    parsed_data: { application_number: 'M4012345', mark_name: 'BETA', action_type: 'renewal_due', deadline_date: '01/09/2026', summary_text: 'Aviso de renovación' },
    actions_taken: ['Plazo creado'], received_at: 'ayer',
  },
  {
    id: 'd4', source_type: 'email', source_email_from: 'info@jpo.go.jp', source_ipo_code: 'JPO',
    parsing_status: 'manual_review', processing_status: 'unprocessed', match_confidence: 0.30,
    matched_matter_title: null, matched_matter_ref: null,
    parsed_data: { summary_text: 'Documento en japonés — requiere revisión manual' },
    actions_taken: [], received_at: 'hace 2 días',
  },
];

const MOCK_SUGGESTIONS = [
  { id: 's1', title: 'ALPHA — USPTO', ref: 'AL-2025-001' },
  { id: 's2', title: 'BETA — USPTO', ref: 'BT-2025-002' },
];

export default function SmartInboxPage() {
  const [tab, setTab] = useState('unprocessed');
  const [docs, setDocs] = useState(MOCK_DOCS);
  const [searchMatter, setSearchMatter] = useState('');
  const [assignModal, setAssignModal] = useState<string | null>(null);

  const unprocessed = docs.filter(d => d.processing_status === 'unprocessed');
  const manualReview = docs.filter(d => d.parsing_status === 'manual_review' || d.parsing_status === 'low_confidence');
  const processed = docs.filter(d => d.processing_status === 'processed');

  const filtered = tab === 'unprocessed' ? unprocessed
    : tab === 'manual_review' ? manualReview
    : tab === 'processed' ? processed
    : docs;

  const assignToMatter = (docId: string, matterTitle: string) => {
    setDocs(prev => prev.map(d => d.id === docId
      ? { ...d, matched_matter_title: matterTitle, match_confidence: 1.0, processing_status: 'processed' as const, parsing_status: 'parsed' as const, actions_taken: ['Asignado manualmente', 'Plazo creado'] }
      : d
    ));
    setAssignModal(null);
    toast.success(`Documento asignado a ${matterTitle}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">📥 Smart Inbox — Documentos de Oficinas PI</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Upload className="w-3.5 h-3.5" /> Subir documento
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Settings className="w-3.5 h-3.5" /> Configurar email
          </Button>
        </div>
      </div>

      {/* KPI Badges */}
      <div className="flex gap-4 flex-wrap">
        <NeoBadge value={unprocessed.length} label="Sin procesar" color="#EF4444" size="lg" />
        <NeoBadge value={docs.filter(d => d.processing_status === 'processed' && d.received_at.includes('hoy')).length} label="Auto-match hoy" color="#10B981" size="lg" />
        <NeoBadge value={manualReview.length} label="Rev. manual" color="#F59E0B" size="lg" />
        <NeoBadge value={processed.length} label="Procesados" color="#3B82F6" size="lg" />
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="unprocessed" className="text-xs gap-1">
            Sin procesar {unprocessed.length > 0 && <Badge variant="destructive" className="h-4 px-1 text-[9px]">{unprocessed.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="manual_review" className="text-xs">Revisión manual ({manualReview.length})</TabsTrigger>
          <TabsTrigger value="processed" className="text-xs">Procesados ({processed.length})</TabsTrigger>
          <TabsTrigger value="all" className="text-xs">Todos</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Documents */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Inbox className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No hay documentos en esta categoría</p>
          </div>
        )}
        {filtered.map(doc => (
          <Card key={doc.id} className={
            doc.parsing_status === 'manual_review' || doc.parsing_status === 'low_confidence'
              ? 'border-amber-200 bg-amber-50/30' : ''
          }>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {doc.processing_status === 'processed' && (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-[10px]">
                        ✅ Auto-matched ({Math.round((doc.match_confidence || 0) * 100)}%)
                      </Badge>
                    )}
                    {doc.parsing_status === 'low_confidence' && (
                      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-[10px]">
                        ⚠️ Revisión manual ({Math.round((doc.match_confidence || 0) * 100)}%)
                      </Badge>
                    )}
                    {doc.parsing_status === 'manual_review' && (
                      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-[10px]">
                        ⚠️ Revisión manual
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">{doc.received_at}</span>
                  </div>
                  <h3 className="font-semibold text-sm">
                    {doc.source_type === 'email' ? 'Email' : 'Subida manual'} {doc.source_ipo_code} — {doc.parsed_data.action_type === 'registration' ? 'Registro confirmado' : doc.parsed_data.action_type === 'office_action' ? 'Office Action' : doc.parsed_data.action_type === 'renewal_due' ? 'Aviso de renovación' : doc.parsed_data.summary_text?.substring(0, 50)}
                  </h3>
                  {doc.matched_matter_title && (
                    <div className="text-xs text-muted-foreground">
                      Expediente: <span className="font-medium text-foreground">{doc.matched_matter_title}</span> ({doc.matched_matter_ref})
                    </div>
                  )}
                  {doc.parsed_data.application_number && (
                    <div className="text-xs text-muted-foreground">
                      Nº {doc.parsed_data.application_number}
                      {doc.parsed_data.deadline_date && ` · Plazo: ${doc.parsed_data.deadline_date}`}
                    </div>
                  )}
                  {doc.actions_taken.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Acciones: {doc.actions_taken.map(a => `${a} ✓`).join(' · ')}
                    </div>
                  )}

                  {/* Suggestions for low confidence */}
                  {(doc.parsing_status === 'low_confidence' || doc.parsing_status === 'manual_review') && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">Sugerencias:</span>
                      {MOCK_SUGGESTIONS.map(s => (
                        <Button key={s.id} variant="outline" size="sm" className="h-6 text-[10px]" onClick={() => assignToMatter(doc.id, s.title)}>
                          {s.title}
                        </Button>
                      ))}
                      <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={() => setAssignModal(doc.id)}>
                        <Search className="w-3 h-3" /> Buscar...
                      </Button>
                    </div>
                  )}
                </div>

                {doc.processing_status === 'processed' && (
                  <Button variant="outline" size="sm" className="h-7 text-xs shrink-0">
                    Ver detalle
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Assign Modal */}
      <Dialog open={!!assignModal} onOpenChange={() => setAssignModal(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Asignar a expediente</DialogTitle>
            <DialogDescription className="text-xs">Busca por nombre, número o cliente</DialogDescription>
          </DialogHeader>
          <Input placeholder="Buscar expediente..." value={searchMatter} onChange={e => setSearchMatter(e.target.value)} />
          <div className="space-y-1.5 max-h-48 overflow-auto">
            {MOCK_SUGGESTIONS.map(s => (
              <Button key={s.id} variant="ghost" className="w-full justify-start text-sm h-auto py-2" onClick={() => assignModal && assignToMatter(assignModal, s.title)}>
                <div>
                  <div className="font-medium">{s.title}</div>
                  <div className="text-xs text-muted-foreground">{s.ref}</div>
                </div>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
