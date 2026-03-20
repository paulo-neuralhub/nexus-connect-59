// ============================================================
// IP-NEXUS - DOCUMENTS LIST PAGE
// ============================================================

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';
import { usePageTitle } from '@/contexts/page-context';
import { FileText, Search, Upload, Filter, FolderOpen, File, Image, FileSpreadsheet, FileArchive } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface DocumentRecord {
  id: string;
  name: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
  source: 'matter' | 'client';
  matter_title?: string | null;
  contact_name?: string | null;
}

const FILE_TYPE_ICONS: Record<string, typeof FileText> = {
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  xls: FileSpreadsheet,
  xlsx: FileSpreadsheet,
  png: Image,
  jpg: Image,
  jpeg: Image,
  zip: FileArchive,
  rar: FileArchive,
};

function getFileIcon(fileType: string | null) {
  if (!fileType) return File;
  const ext = fileType.toLowerCase().replace('.', '');
  return FILE_TYPE_ICONS[ext] || File;
}

function formatFileSize(bytes: number | null) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsListPage() {
  usePageTitle('Documentos');

  const { currentOrganization } = useOrganization();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Query matter_documents
  const { data: matterDocs = [], isLoading: loadingMatter } = useQuery({
    queryKey: ['matter-documents', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];
      const client: any = supabase;
      const { data, error } = await client
        .from('matter_documents')
        .select('id, name, file_type, file_size, created_at, matter_id, matters(title)')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) {
        console.warn('[Documents] matter_documents query error:', error.message);
        return [];
      }

      return (data || []).map((d: any) => ({
        id: d.id,
        name: d.name || 'Sin nombre',
        file_type: d.file_type,
        file_size: d.file_size,
        created_at: d.created_at,
        source: 'matter' as const,
        matter_title: d.matters?.title || null,
      }));
    },
    enabled: !!currentOrganization?.id,
    staleTime: 1000 * 60,
  });

  // Query client_documents
  const { data: clientDocs = [], isLoading: loadingClient } = useQuery({
    queryKey: ['client-documents', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];
      const client: any = supabase;
      const { data, error } = await client
        .from('client_documents')
        .select('id, name, file_type, file_size, created_at, contact_id, contacts(name)')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) {
        console.warn('[Documents] client_documents query error:', error.message);
        return [];
      }

      return (data || []).map((d: any) => ({
        id: d.id,
        name: d.name || 'Sin nombre',
        file_type: d.file_type,
        file_size: d.file_size,
        created_at: d.created_at,
        source: 'client' as const,
        contact_name: d.contacts?.name || null,
      }));
    },
    enabled: !!currentOrganization?.id,
    staleTime: 1000 * 60,
  });

  const isLoading = loadingMatter || loadingClient;

  // Merge and filter
  const allDocs: DocumentRecord[] = useMemo(() => {
    const merged = [...matterDocs, ...clientDocs].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return merged.filter((doc) => {
      if (search) {
        const s = search.toLowerCase();
        if (!doc.name.toLowerCase().includes(s)) return false;
      }
      if (typeFilter !== 'all') {
        const ext = (doc.file_type || '').toLowerCase().replace('.', '');
        if (typeFilter === 'pdf' && ext !== 'pdf') return false;
        if (typeFilter === 'image' && !['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return false;
        if (typeFilter === 'spreadsheet' && !['xls', 'xlsx', 'csv'].includes(ext)) return false;
        if (typeFilter === 'document' && !['doc', 'docx', 'odt', 'txt'].includes(ext)) return false;
      }
      return true;
    });
  }, [matterDocs, clientDocs, search, typeFilter]);

  // Unique file types for badge
  const fileTypeStats = useMemo(() => {
    const all = [...matterDocs, ...clientDocs];
    return {
      total: all.length,
      matter: matterDocs.length,
      client: clientDocs.length,
    };
  }, [matterDocs, clientDocs]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documentos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {fileTypeStats.total} documentos · {fileTypeStats.matter} de expedientes · {fileTypeStats.client} de clientes
          </p>
        </div>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Subir documento
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar documentos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="pdf">PDF</SelectItem>
            <SelectItem value="document">Documentos</SelectItem>
            <SelectItem value="spreadsheet">Hojas de cálculo</SelectItem>
            <SelectItem value="image">Imágenes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && allDocs.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderOpen className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-medium mb-1">
              {search ? 'Sin resultados' : 'No hay documentos'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {search
                ? `No se encontraron documentos para "${search}"`
                : 'Los documentos de expedientes y clientes aparecerán aquí'}
            </p>
            {!search && (
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Subir primer documento
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Document list */}
      {!isLoading && allDocs.length > 0 && (
        <div className="space-y-2">
          {allDocs.map((doc) => {
            const Icon = getFileIcon(doc.file_type);
            return (
              <div
                key={`${doc.source}-${doc.id}`}
                className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{doc.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {doc.source === 'matter' && doc.matter_title && (
                      <span className="truncate">📁 {doc.matter_title}</span>
                    )}
                    {doc.source === 'client' && doc.contact_name && (
                      <span className="truncate">👤 {doc.contact_name}</span>
                    )}
                    <span>·</span>
                    <span>{formatDistanceToNow(new Date(doc.created_at), { addSuffix: true, locale: es })}</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs shrink-0">
                  {doc.source === 'matter' ? 'Expediente' : 'Cliente'}
                </Badge>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatFileSize(doc.file_size)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
