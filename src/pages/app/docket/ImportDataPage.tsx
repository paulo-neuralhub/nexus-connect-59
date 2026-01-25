import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Loader2, Upload, Download, FileText, CheckCircle, AlertTriangle, XCircle, ExternalLink } from "lucide-react";
import { useFileImport, ImportRecord, ImportableOffice } from "@/hooks/useFileImport";
import { Link } from "react-router-dom";

export default function ImportDataPage() {
  const { importableOffices, importHistory, isLoading, uploadFile, isUploading } = useFileImport();
  
  const [selectedOffice, setSelectedOffice] = React.useState<string>('');
  const [dragActive, setDragActive] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [lastResult, setLastResult] = React.useState<ImportRecord | null>(null);
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const currentOffice = importableOffices.find(o => o.id === selectedOffice);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0] && selectedOffice) {
      await handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && selectedOffice) {
      await handleUpload(e.target.files[0]);
    }
  };

  const handleUpload = async (file: File) => {
    try {
      // Simulate progress
      setUploadProgress(10);
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await uploadFile({ officeId: selectedOffice, file });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Create a record-like object from result
      if (result.success) {
        setLastResult({
          id: result.import_id || 'new',
          office_code: currentOffice?.code || '',
          file_name: file.name,
          file_type: file.name.split('.').pop() || 'unknown',
          file_size: file.size,
          import_status: 'completed',
          records_found: result.records_found || 0,
          records_imported: result.records_imported || 0,
          records_updated: 0,
          records_failed: result.records_failed || 0,
          requires_review: result.requires_review || false,
          review_count: result.review_count || 0,
          created_at: new Date().toISOString(),
        });
      }
      
      setTimeout(() => setUploadProgress(0), 1000);
    } catch (error) {
      setUploadProgress(0);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'partial': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Loader2 className="h-4 w-4 animate-spin" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Importar Datos de Oficina</h1>
        <p className="text-muted-foreground mt-1">
          Para oficinas sin conexión automática, puedes importar datos desde archivos Excel, CSV o PDF.
        </p>
      </div>

      {/* Step 1: Select Office */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Paso 1: Seleccionar Oficina</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedOffice} onValueChange={setSelectedOffice}>
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder="Seleccionar oficina..." />
            </SelectTrigger>
            <SelectContent>
              {importableOffices.map((office) => (
                <SelectItem key={office.id} value={office.id}>
                  <span className="flex items-center gap-2">
                    <span>{office.flag_emoji}</span>
                    <span>{office.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {importableOffices.length === 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              No hay oficinas configuradas para importación de archivos.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Upload File */}
      {selectedOffice && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Paso 2: Subir Archivo</CardTitle>
            <CardDescription>
              Esta oficina acepta: {currentOffice?.accepted_formats.join(', ').toUpperCase()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Drop Zone */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              } ${isUploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <div className="space-y-4">
                  <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary" />
                  <div className="max-w-xs mx-auto">
                    <Progress value={uploadProgress} />
                    <p className="text-sm text-muted-foreground mt-2">
                      {uploadProgress < 50 ? 'Subiendo archivo...' : 
                       uploadProgress < 90 ? 'Procesando datos...' : 
                       'Finalizando...'}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                  <p className="font-medium">Arrastra tu archivo aquí</p>
                  <p className="text-sm text-muted-foreground">o haz clic para seleccionar</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Formatos: {currentOffice?.accepted_formats.map(f => `.${f}`).join(', ')} • Tamaño máximo: 10MB
                  </p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept={currentOffice?.accepted_formats.map(f => `.${f}`).join(',')}
                onChange={handleFileSelect}
                disabled={isUploading}
              />
            </div>

            {/* Template Download */}
            <div className="flex items-center gap-4">
              {currentOffice?.has_template && (
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Descargar plantilla Excel para {currentOffice.code}
                </Button>
              )}
              <Button variant="ghost" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver instrucciones de formato
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Last Result */}
      {lastResult && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Importación Completada
            </CardTitle>
            <CardDescription>
              {lastResult.file_name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <div className="text-2xl font-bold text-green-700">{lastResult.records_imported}</div>
                <div className="text-sm text-muted-foreground">Importados correctamente</div>
              </div>
              {lastResult.requires_review && lastResult.review_count! > 0 && (
                <div>
                  <div className="text-2xl font-bold text-yellow-700">{lastResult.review_count}</div>
                  <div className="text-sm text-muted-foreground">Requieren revisión</div>
                </div>
              )}
              {lastResult.records_failed > 0 && (
                <div>
                  <div className="text-2xl font-bold text-red-700">{lastResult.records_failed}</div>
                  <div className="text-sm text-muted-foreground">Con errores</div>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/app/docket">Ver expedientes importados</Link>
              </Button>
              {lastResult.requires_review && lastResult.review_count! > 0 && (
                <Button size="sm" asChild>
                  <Link to="/app/expedientes/revision">
                    Revisar pendientes ({lastResult.review_count})
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import History */}
      {importHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Historial de Importaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {importHistory.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(record.import_status)}
                    <div>
                      <div className="font-medium">{record.file_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {record.office_code} • {new Date(record.created_at).toLocaleString('es-ES')}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-right">
                    <div>{record.records_imported} importados</div>
                    {record.requires_review && record.review_count! > 0 && (
                      <Link to="/app/expedientes/revision" className="text-primary hover:underline">
                        {record.review_count} pendientes
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
