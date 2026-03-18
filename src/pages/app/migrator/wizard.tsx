import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, ArrowRight, Upload, CheckCircle, 
  Database, Settings, Play, FileSpreadsheet
} from 'lucide-react';
import { MIGRATION_SYSTEMS } from '@/lib/constants/migration-systems';

const WIZARD_STEPS = [
  { id: 'source', title: 'Sistema Origen', description: 'Selecciona el sistema de origen' },
  { id: 'upload', title: 'Cargar Datos', description: 'Sube los archivos a migrar' },
  { id: 'mapping', title: 'Mapear Campos', description: 'Relaciona los campos' },
  { id: 'config', title: 'Configuración', description: 'Opciones de migración' },
  { id: 'review', title: 'Revisar', description: 'Confirma la migración' },
];

export default function MigratorWizard() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const isEditing = !!projectId;

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStartMigration = () => {
    // In a real implementation, this would create the migration project
    navigate('/app/migrator');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/app/migrator')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isEditing ? 'Continuar Migración' : 'Nueva Migración'}
          </h1>
          <p className="text-muted-foreground">Asistente de migración paso a paso</p>
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            {WIZARD_STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  index < currentStep 
                    ? 'bg-green-500 text-white' 
                    : index === currentStep 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {index < currentStep ? <CheckCircle className="h-4 w-4" /> : index + 1}
                </div>
                {index < WIZARD_STEPS.length - 1 && (
                  <div className={`w-12 md:w-20 h-0.5 mx-2 ${
                    index < currentStep ? 'bg-green-500' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <h3 className="font-semibold">{WIZARD_STEPS[currentStep].title}</h3>
            <p className="text-sm text-muted-foreground">{WIZARD_STEPS[currentStep].description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardContent className="pt-6">
          {/* Step 0: Select Source System */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div>
                <Label>Nombre del Proyecto</Label>
                <Input 
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Ej: Migración desde PatSnap 2026"
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label>Sistema de Origen</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                  {Object.entries(MIGRATION_SYSTEMS).map(([key, system]) => (
                    <Card 
                      key={key}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedSystem === key 
                          ? 'border-2 border-primary shadow-md' 
                          : 'border-2 border-transparent'
                      }`}
                      onClick={() => setSelectedSystem(key)}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Database className="h-6 w-6 text-primary" />
                          <div>
                            <p className="font-medium">{system.name}</p>
                            <p className="text-xs text-muted-foreground">{system.vendor}</p>
                          </div>
                        </div>
                        {selectedSystem === key && (
                          <Badge className="bg-primary/10 text-primary">Seleccionado</Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Upload Files */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div 
                className="border-2 border-dashed rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer"
                onClick={() => document.getElementById('migration-files')?.click()}
              >
                <input
                  id="migration-files"
                  type="file"
                  className="hidden"
                  accept=".csv,.xlsx,.xls,.json,.xml"
                  multiple
                  onChange={handleFileUpload}
                />
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Arrastra tus archivos aquí</h3>
                <p className="text-muted-foreground mb-4">o haz clic para seleccionar</p>
                <div className="flex gap-2 justify-center">
                  <Badge variant="secondary">.CSV</Badge>
                  <Badge variant="secondary">.XLSX</Badge>
                  <Badge variant="secondary">.JSON</Badge>
                  <Badge variant="secondary">.XML</Badge>
                </div>
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  <Label>Archivos seleccionados ({files.length})</Label>
                  {files.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                      <FileSpreadsheet className="h-5 w-5 text-primary" />
                      <span className="flex-1 font-medium">{file.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Mapping */}
          {currentStep === 2 && (
            <div className="text-center py-8">
              <Settings className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Mapeo de Campos</h3>
              <p className="text-muted-foreground mb-4">
                El sistema analizará tus archivos y sugerirá un mapeo automático.
              </p>
              <Button variant="outline">Configurar Mapeo Manual</Button>
            </div>
          )}

          {/* Step 3: Configuration */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Duplicados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <select className="w-full p-2 rounded-md border">
                      <option>Omitir duplicados</option>
                      <option>Actualizar existentes</option>
                      <option>Crear nuevos</option>
                    </select>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Formato de Fecha</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <select className="w-full p-2 rounded-md border">
                      <option>DD/MM/YYYY</option>
                      <option>MM/DD/YYYY</option>
                      <option>YYYY-MM-DD</option>
                    </select>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Proyecto</p>
                  <p className="font-medium">{projectName || 'Sin nombre'}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Sistema Origen</p>
                  <p className="font-medium">
                    {selectedSystem ? MIGRATION_SYSTEMS[selectedSystem as keyof typeof MIGRATION_SYSTEMS]?.name : 'No seleccionado'}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Archivos</p>
                  <p className="font-medium">{files.length} archivo(s)</p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <Badge>Listo para migrar</Badge>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={handleBack}
          disabled={currentStep === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Anterior
        </Button>
        
        {currentStep === WIZARD_STEPS.length - 1 ? (
          <Button onClick={handleStartMigration}>
            <Play className="h-4 w-4 mr-2" />
            Iniciar Migración
          </Button>
        ) : (
          <Button 
            onClick={handleNext}
            disabled={
              (currentStep === 0 && (!selectedSystem || !projectName)) ||
              (currentStep === 1 && files.length === 0)
            }
          >
            Siguiente
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
