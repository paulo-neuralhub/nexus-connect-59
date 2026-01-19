import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Eye, Trash2, Database, RefreshCw, Loader2 } from 'lucide-react';
import { AIRAGCollection } from '@/types/ai-brain.types';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface RAGTabProps {
  ragCollections: AIRAGCollection[];
  isLoading: boolean;
  onAdd: () => void;
  onEdit: (rag: AIRAGCollection) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  onRefresh: (id: string) => void;
  refreshingId?: string | null;
}

export function RAGTab({ 
  ragCollections, 
  isLoading, 
  onAdd, 
  onEdit, 
  onDelete,
  onToggleActive,
  onRefresh,
  refreshingId 
}: RAGTabProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>RAG Knowledge Bases</CardTitle>
            <CardDescription>Bases de conocimiento para retrieval augmented generation</CardDescription>
          </div>
          <Skeleton className="h-9 w-28" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>RAG Knowledge Bases</CardTitle>
          <CardDescription>Bases de conocimiento para retrieval augmented generation</CardDescription>
        </div>
        <Button onClick={onAdd}>
          <Plus className="h-4 w-4 mr-2" />
          New RAG
        </Button>
      </CardHeader>
      <CardContent>
        {ragCollections.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Database className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No hay bases de conocimiento configuradas</p>
            <p className="text-sm">Añade una base RAG para comenzar</p>
          </div>
        ) : (
          <div className="space-y-4">
            {ragCollections.map((rag) => (
              <div key={rag.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Database className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{rag.name}</p>
                      <Badge variant="outline">{rag.collection_type}</Badge>
                      {rag.auto_update_enabled && (
                        <Badge className="bg-blue-500/10 text-blue-600">Auto-update</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {rag.document_count} docs • {rag.chunk_count.toLocaleString()} chunks • {rag.total_tokens.toLocaleString()} tokens
                    </p>
                    {rag.description && (
                      <p className="text-xs text-muted-foreground mt-1">{rag.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {rag.last_updated_at 
                      ? formatDistanceToNow(new Date(rag.last_updated_at), { addSuffix: true, locale: es })
                      : 'Never updated'}
                  </span>
                  <Switch 
                    checked={rag.is_active} 
                    onCheckedChange={(checked) => onToggleActive(rag.id, checked)}
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onRefresh(rag.id)}
                    disabled={refreshingId === rag.id}
                  >
                    {refreshingId === rag.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onEdit(rag)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-destructive" 
                    onClick={() => onDelete(rag.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
