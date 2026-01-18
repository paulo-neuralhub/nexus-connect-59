import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Briefcase, 
  Clock, 
  RefreshCw,
  DollarSign,
  Users,
  ArrowRight,
  Check
} from 'lucide-react';
import { useReportTemplates, useGenerateReport } from '@/hooks/use-reports';
import { DATE_RANGES } from '@/lib/constants/reports';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const QUICK_REPORTS = [
  { 
    type: 'portfolio_summary',
    name: 'Resumen de Cartera',
    description: 'Vista general de todos tus activos de PI',
    icon: Briefcase,
    color: '#3B82F6',
  },
  { 
    type: 'deadline_report',
    name: 'Informe de Plazos',
    description: 'Plazos próximos y vencidos',
    icon: Clock,
    color: '#EF4444',
  },
  { 
    type: 'renewal_forecast',
    name: 'Previsión de Renovaciones',
    description: 'Renovaciones y costes previstos a 12 meses',
    icon: RefreshCw,
    color: '#F59E0B',
  },
  { 
    type: 'cost_analysis',
    name: 'Análisis de Costes',
    description: 'Desglose detallado de costes por periodo',
    icon: DollarSign,
    color: '#22C55E',
  },
  { 
    type: 'client_report',
    name: 'Informe para Cliente',
    description: 'Resumen ejecutivo para enviar a cliente',
    icon: Users,
    color: '#8B5CF6',
  },
];

export default function NewReportPage() {
  const navigate = useNavigate();
  const { data: templates = [] } = useReportTemplates();
  const generateMutation = useGenerateReport();
  
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [reportName, setReportName] = useState('');
  const [dateRange, setDateRange] = useState('last_30_days');
  const [format, setFormat] = useState<'pdf' | 'xlsx'>('pdf');
  
  const handleQuickReport = (type: string) => {
    setSelectedType(type);
    const config = QUICK_REPORTS.find(r => r.type === type);
    setReportName(`${config?.name} - ${new Date().toLocaleDateString('es-ES')}`);
    setStep(2);
  };
  
  const handleGenerate = async () => {
    try {
      const template = templates.find(t => t.report_type === selectedType);
      
      await generateMutation.mutateAsync({
        templateId: template?.id,
        name: reportName,
        format,
        parameters: {
          report_type: selectedType,
          date_range: dateRange,
        },
      });
      
      toast.success('Informe en generación');
      navigate('/app/reports');
    } catch {
      toast.error('Error al generar informe');
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress */}
      <div className="flex items-center gap-4 mb-8">
        <Step number={1} label="Tipo" active={step >= 1} completed={step > 1} />
        <div className="flex-1 h-px bg-border"></div>
        <Step number={2} label="Configurar" active={step >= 2} completed={step > 2} />
        <div className="flex-1 h-px bg-border"></div>
        <Step number={3} label="Generar" active={step >= 3} completed={false} />
      </div>
      
      {/* Step 1: Seleccionar tipo */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Nuevo Informe</h1>
            <p className="text-muted-foreground">Selecciona el tipo de informe que quieres generar</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {QUICK_REPORTS.map(report => {
              const Icon = report.icon;
              return (
                <button
                  key={report.type}
                  onClick={() => handleQuickReport(report.type)}
                  className="bg-card border rounded-xl p-4 text-left hover:border-primary/50 transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${report.color}15` }}
                    >
                      <Icon className="w-6 h-6" style={{ color: report.color }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {report.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>
          
          {/* Plantillas personalizadas */}
          {templates.filter(t => !t.is_system).length > 0 && (
            <div>
              <h3 className="font-semibold text-foreground mb-3">Mis Plantillas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.filter(t => !t.is_system).map(template => (
                  <button
                    key={template.id}
                    onClick={() => {
                      setSelectedType(template.report_type);
                      setReportName(`${template.name} - ${new Date().toLocaleDateString('es-ES')}`);
                      setStep(2);
                    }}
                    className="bg-card border rounded-xl p-4 text-left hover:border-primary/50 transition-all"
                  >
                    <p className="font-medium text-foreground">{template.name}</p>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Step 2: Configurar */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Configurar Informe</h1>
            <p className="text-muted-foreground">Personaliza los parámetros del informe</p>
          </div>
          
          <div className="bg-card rounded-xl border p-6 space-y-6">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Nombre del informe
              </label>
              <input
                type="text"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 bg-background"
              />
            </div>
            
            {/* Periodo */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Periodo
              </label>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                {Object.entries(DATE_RANGES).slice(0, 5).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => setDateRange(key)}
                    className={cn(
                      "px-3 py-2 text-sm rounded-lg border transition-colors",
                      dateRange === key
                        ? "bg-primary text-primary-foreground border-primary"
                        : "hover:bg-muted"
                    )}
                  >
                    {config.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Formato */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Formato
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="format"
                    value="pdf"
                    checked={format === 'pdf'}
                    onChange={() => setFormat('pdf')}
                    className="text-primary"
                  />
                  <span>PDF</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="format"
                    value="xlsx"
                    checked={format === 'xlsx'}
                    onChange={() => setFormat('xlsx')}
                    className="text-primary"
                  />
                  <span>Excel</span>
                </label>
              </div>
            </div>
          </div>
          
          {/* Acciones */}
          <div className="flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 border rounded-lg hover:bg-muted"
            >
              Atrás
            </button>
            <button
              onClick={handleGenerate}
              disabled={!reportName || generateMutation.isPending}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
            >
              {generateMutation.isPending ? (
                <>Generando...</>
              ) : (
                <>Generar informe <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Step({ number, label, active, completed }: {
  number: number;
  label: string;
  active: boolean;
  completed: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
        completed ? "bg-green-500 text-white" :
        active ? "bg-primary text-primary-foreground" :
        "bg-muted text-muted-foreground"
      )}>
        {completed ? <Check className="w-4 h-4" /> : number}
      </div>
      <span className={cn(
        "text-sm font-medium",
        active ? "text-foreground" : "text-muted-foreground"
      )}>
        {label}
      </span>
    </div>
  );
}
