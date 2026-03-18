import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCreateImport } from '@/hooks/use-data-hub';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ArrowLeft, ArrowRight, Upload, FileSpreadsheet, 
  CheckCircle, Database
} from 'lucide-react';
import { IMPORT_TYPES } from '@/lib/constants/data-hub';
import { ImportWizardModal } from './components/import-wizard-modal';

const STEPS = [
  { id: 'upload', title: 'Subir Archivo', description: 'Selecciona el archivo a importar' },
  { id: 'configure', title: 'Configurar', description: 'Define el tipo de datos' },
  { id: 'mapping', title: 'Mapear Campos', description: 'Relaciona las columnas' },
  { id: 'preview', title: 'Vista Previa', description: 'Revisa antes de importar' },
  { id: 'import', title: 'Importar', description: 'Ejecuta la importación' },
];

export default function DataHubImport() {
  const { type } = useParams();
  const navigate = useNavigate();
  const createImport = useCreateImport();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [entityType, setEntityType] = useState(type || '');
  const [showWizard, setShowWizard] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setCurrentStep(1);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setCurrentStep(1);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/app/data-hub')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nueva Importación</h1>
          <p className="text-muted-foreground">Importa datos desde archivos Excel o CSV</p>
        </div>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, index) => (
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
                {index < STEPS.length - 1 && (
                  <div className={`w-16 md:w-24 h-0.5 mx-2 ${
                    index < currentStep ? 'bg-green-500' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <h3 className="font-semibold">{STEPS[currentStep].title}</h3>
            <p className="text-sm text-muted-foreground">{STEPS[currentStep].description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardContent className="pt-6">
          {/* Step 0: Upload */}
          {currentStep === 0 && (
            <div 
              className="border-2 border-dashed rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <input
                id="file-input"
                type="file"
                className="hidden"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
              />
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Arrastra tu archivo aquí</h3>
              <p className="text-muted-foreground mb-4">o haz clic para seleccionar</p>
              <div className="flex gap-2 justify-center">
                <Badge variant="secondary">.CSV</Badge>
                <Badge variant="secondary">.XLSX</Badge>
                <Badge variant="secondary">.XLS</Badge>
              </div>
            </div>
          )}

          {/* Step 1: Configure */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <FileSpreadsheet className="h-10 w-10 text-primary" />
                <div>
                  <p className="font-medium">{file?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {file && (file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button variant="outline" size="sm" className="ml-auto" onClick={() => { setFile(null); setCurrentStep(0); }}>
                  Cambiar
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Tipo de Datos a Importar</Label>
                  <Select value={entityType} onValueChange={setEntityType}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Selecciona el tipo de entidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(IMPORT_TYPES).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <Database className="h-4 w-4" />
                            {value.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2-4: Use Wizard Modal */}
          {currentStep >= 2 && (
            <div className="text-center py-8">
              <Database className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Continuar con el Asistente</h3>
              <p className="text-muted-foreground mb-6">
                El asistente te guiará a través del mapeo de campos y la importación.
              </p>
              <Button onClick={() => setShowWizard(true)}>
                Abrir Asistente de Importación
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Anterior
        </Button>
        <Button 
          onClick={() => {
            if (currentStep < 2) {
              setCurrentStep(currentStep + 1);
            } else {
              setShowWizard(true);
            }
          }}
          disabled={
            (currentStep === 0 && !file) || 
            (currentStep === 1 && !entityType)
          }
        >
          {currentStep >= 2 ? 'Abrir Asistente' : 'Siguiente'}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Import Wizard Modal */}
      <ImportWizardModal
        open={showWizard}
        onOpenChange={setShowWizard}
      />
    </div>
  );
}
