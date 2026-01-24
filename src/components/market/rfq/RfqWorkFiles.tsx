// src/components/market/rfq/RfqWorkFiles.tsx
import { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  FileText, 
  Download, 
  Upload, 
  Image as ImageIcon,
  File,
  FileSpreadsheet,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { useRfqWorkFiles, useUploadRfqWorkFile, type RfqWorkFile } from '@/hooks/market/useRfqWorkflow';

interface RfqWorkFilesProps {
  requestId: string;
  isReadOnly?: boolean;
}

function getFileIcon(type: string | null) {
  if (!type) return <File className="h-5 w-5" />;
  if (type.startsWith('image/')) return <ImageIcon className="h-5 w-5 text-blue-500" />;
  if (type.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
  if (type.includes('spreadsheet') || type.includes('excel')) return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
  return <File className="h-5 w-5" />;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function RfqWorkFiles({ requestId, isReadOnly = false }: RfqWorkFilesProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: files = [], isLoading } = useRfqWorkFiles(requestId);
  const uploadFile = useUploadRfqWorkFile();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    for (const file of Array.from(fileList)) {
      await uploadFile.mutateAsync({
        requestId,
        file,
        isDeliverable: false,
      });
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const deliverables = files.filter(f => f.is_deliverable);
  const otherFiles = files.filter(f => !f.is_deliverable);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Archivos Compartidos
          </CardTitle>
          {!isReadOnly && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadFile.isPending}
              >
                {uploadFile.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Subir archivo
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                onChange={handleFileChange}
              />
            </>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No hay archivos compartidos</p>
          </div>
        ) : (
          <>
            {/* Deliverables section */}
            {deliverables.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Entregables ({deliverables.length})
                </h4>
                <div className="space-y-2">
                  {deliverables.map((file) => (
                    <FileRow key={file.id} file={file} />
                  ))}
                </div>
              </div>
            )}

            {/* Other files */}
            {otherFiles.length > 0 && (
              <div>
                {deliverables.length > 0 && (
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">
                    Otros archivos ({otherFiles.length})
                  </h4>
                )}
                <div className="space-y-2">
                  {otherFiles.map((file) => (
                    <FileRow key={file.id} file={file} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function FileRow({ file }: { file: RfqWorkFile }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="shrink-0">
        {getFileIcon(file.file_type)}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{file.file_name}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatFileSize(file.file_size)}</span>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Avatar className="h-4 w-4">
              <AvatarImage src={file.uploader?.avatar_url || undefined} />
              <AvatarFallback className="text-[8px]">
                {file.uploader?.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <span>{file.uploader?.full_name || 'Usuario'}</span>
          </div>
          <span>•</span>
          <span>{format(new Date(file.created_at), 'dd MMM', { locale: es })}</span>
        </div>
      </div>

      {file.is_deliverable && (
        <Badge variant="secondary" className="shrink-0">
          Entregable
        </Badge>
      )}

      <a
        href={file.file_path}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0"
      >
        <Button variant="ghost" size="icon">
          <Download className="h-4 w-4" />
        </Button>
      </a>
    </div>
  );
}
