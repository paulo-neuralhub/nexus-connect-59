/**
 * Portal Documents
 * Lista de documentos compartidos con el cliente - DATOS REALES
 * Tabs: Disponibles / Pendientes firma / Firmados
 */

import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePortalDocuments, useDownloadDocument, useViewDocument } from '@/hooks/use-portal-documents';
import { usePortalAuth } from '@/hooks/usePortalAuth';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  FileText, 
  Download,
  Eye,
  Filter,
  File,
  FileImage,
  FileSpreadsheet,
  FilePen,
  CheckCircle2,
  PenTool,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PortalSignatureModal } from '@/components/portal/PortalSignatureModal';
import { useQueryClient } from '@tanstack/react-query';

export default function PortalDocuments() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const { user, isImpersonating } = usePortalAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('available');
  const [signDoc, setSignDoc] = useState<any>(null);

  const { data: documents, isLoading, error } = usePortalDocuments(categoryFilter);
  const downloadMutation = useDownloadDocument();
  const viewMutation = useViewDocument();

  // Split documents by signature status
  const { available, pendingSignature, signed } = useMemo(() => {
    if (!documents) return { available: [], pendingSignature: [], signed: [] };
    const filtered = documents.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));
    return {
      available: filtered.filter(d => (d as any).portal_signature_status !== 'pending' && (d as any).portal_signature_status !== 'signed'),
      pendingSignature: filtered.filter(d => (d as any).portal_signature_status === 'pending'),
      signed: filtered.filter(d => (d as any).portal_signature_status === 'signed'),
    };
  }, [documents, search]);

  const getFileIcon = (mimeType: string) => {
    if (mimeType?.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    if (mimeType?.includes('image')) return <FileImage className="w-5 h-5 text-blue-500" />;
    if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel')) return <FileSpreadsheet className="w-5 h-5 text-green-500" />;
    if (mimeType?.includes('word') || mimeType?.includes('document')) return <FilePen className="w-5 h-5 text-blue-600" />;
    return <File className="w-5 h-5 text-muted-foreground" />;
  };

  const handleDownload = (doc: any) => {
    downloadMutation.mutate({ sharedContentId: doc.id, filePath: doc.file_path, fileName: doc.name });
  };

  const handleView = (doc: any) => {
    viewMutation.mutate(doc.id);
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderDocList = (docs: any[]) => {
    if (docs.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto opacity-30 mb-4" />
          <p className="font-medium">Sin documentos</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {docs.map((doc) => (
          <div
            key={doc.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors gap-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                {getFileIcon(doc.mime_type)}
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{doc.name}</p>
                  {!doc.viewed_at && (
                    <Badge className="bg-amber-100 text-amber-700 border-amber-200 shrink-0">Nuevo</Badge>
                  )}
                  {(doc as any).portal_signature_status === 'signed' && (
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 shrink-0">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Firmado {(doc as any).portal_signed_at && format(new Date((doc as any).portal_signed_at), "d MMM", { locale: es })}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground">
                  {doc.matter_title && (<><span className="truncate max-w-[200px]">{doc.matter_title}</span><span>•</span></>)}
                  <span>{formatFileSize(doc.file_size)}</span>
                  <span>•</span>
                  <span>{format(new Date(doc.shared_at), 'd MMM yyyy', { locale: es })}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:ml-auto">
              {(doc as any).portal_signature_status === 'pending' && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => setSignDoc(doc)}
                  disabled={isImpersonating}
                  title={isImpersonating ? 'Desactivado en modo vista' : undefined}
                >
                  <PenTool className="w-4 h-4 mr-1" /> Firmar
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => handleView(doc)}>
                <Eye className="w-4 h-4" />
              </Button>
              {doc.can_download && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDownload(doc)}
                  disabled={downloadMutation.isPending}
                >
                  <Download className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card><CardContent className="pt-6">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 mb-3" />)}</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('portal.documents.title')}</h1>
        <p className="text-muted-foreground">{t('portal.documents.subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold mt-1">{documents?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">Pendientes firma</p>
            <p className="text-2xl font-bold mt-1 text-amber-600">{pendingSignature.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">Firmados</p>
            <p className="text-2xl font-bold mt-1 text-emerald-600">{signed.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="available">Disponibles</TabsTrigger>
          <TabsTrigger value="pending" className="gap-1.5">
            Pendientes firma
            {pendingSignature.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">{pendingSignature.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="signed" className="gap-1.5">
            Firmados ✓
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <Card className="mt-4">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t('common.search')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder={t('common.filter')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  <SelectItem value="application">Solicitudes</SelectItem>
                  <SelectItem value="power">Poderes</SelectItem>
                  <SelectItem value="receipt">Acuses</SelectItem>
                  <SelectItem value="official">Oficiales</SelectItem>
                  <SelectItem value="report">Informes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <TabsContent value="available" className="mt-0">
              {renderDocList(available)}
            </TabsContent>
            <TabsContent value="pending" className="mt-0">
              {renderDocList(pendingSignature)}
            </TabsContent>
            <TabsContent value="signed" className="mt-0">
              {renderDocList(signed)}
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>

      {/* Signature Modal */}
      {signDoc && (
        <PortalSignatureModal
          open={!!signDoc}
          onClose={() => setSignDoc(null)}
          document={signDoc}
          signerName={user?.name || ''}
          userId={user?.id || ''}
          onSigned={() => {
            queryClient.invalidateQueries({ queryKey: ['portal-documents'] });
            setSignDoc(null);
          }}
          isImpersonating={isImpersonating}
        />
      )}
    </div>
  );
}
