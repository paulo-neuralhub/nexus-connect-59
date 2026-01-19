import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Search,
  Zap,
  Clock,
  AlertTriangle,
  UserPlus,
  TrendingUp,
  DollarSign,
  Send,
  RefreshCw,
  FolderPlus,
  Bell,
  Trophy
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useCreateWorkflowTemplate } from '@/hooks/workflow/useWorkflows';
import { PREDEFINED_WORKFLOW_TEMPLATES } from '@/types/workflow.types';
import type { PredefinedTemplate, WorkflowCategory } from '@/types/workflow.types';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  'FolderPlus': FolderPlus,
  'Clock': Clock,
  'AlertTriangle': AlertTriangle,
  'Trophy': Trophy,
  'UserPlus': UserPlus,
  'RefreshCw': RefreshCw,
  'DollarSign': DollarSign,
  'Send': Send,
  'Bell': Bell,
};

const CATEGORY_INFO: Record<WorkflowCategory, { label: string; color: string }> = {
  onboarding: { label: 'Onboarding', color: 'bg-blue-100 text-blue-700' },
  deadlines: { label: 'Plazos', color: 'bg-orange-100 text-orange-700' },
  notifications: { label: 'Notificaciones', color: 'bg-purple-100 text-purple-700' },
  crm: { label: 'CRM', color: 'bg-pink-100 text-pink-700' },
  billing: { label: 'Facturación', color: 'bg-amber-100 text-amber-700' },
  spider: { label: 'Spider', color: 'bg-red-100 text-red-700' },
  custom: { label: 'Personalizado', color: 'bg-gray-100 text-gray-700' }
};

export function WorkflowTemplateGallery() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const createWorkflow = useCreateWorkflowTemplate();

  const filteredTemplates = PREDEFINED_WORKFLOW_TEMPLATES.filter(template => {
    const matchesSearch = !search || 
      template.name.toLowerCase().includes(search.toLowerCase()) ||
      template.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleUseTemplate = async (template: PredefinedTemplate) => {
    try {
      const workflow = await createWorkflow.mutateAsync({
        code: `${template.code}_${Date.now()}`,
        name: template.name,
        description: template.description,
        category: template.category,
        trigger_type: template.trigger_type,
        trigger_config: template.trigger_config,
        conditions: template.conditions,
        actions: template.actions,
        is_active: false,
        is_system: false,
        organization_id: null // Will be set by the hook
      });
      
      navigate(`/app/workflow/${workflow.id}/edit`);
    } catch (error) {
      console.error('Error creating workflow from template:', error);
    }
  };

  const categories = Object.entries(CATEGORY_INFO);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/app/workflow')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Galería de Plantillas</h1>
          <p className="text-muted-foreground">Elige una plantilla como punto de partida</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar plantillas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            Todas
          </Button>
          {categories.map(([key, info]) => (
            <Button 
              key={key}
              variant={selectedCategory === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(key)}
            >
              {info.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map(template => {
          const IconComponent = ICON_MAP[template.icon] || Zap;
          const categoryInfo = CATEGORY_INFO[template.category];
          
          return (
            <Card 
              key={template.code} 
              className="hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => handleUseTemplate(template)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={cn(
                    "p-2.5 rounded-lg transition-colors",
                    `bg-${template.color}-100 group-hover:bg-${template.color}-200`
                  )}
                  style={{ backgroundColor: `var(--${template.color}-100, #f0f0f0)` }}
                  >
                    <IconComponent className="h-5 w-5" style={{ color: `var(--${template.color}-600, #666)` }} />
                  </div>
                  <Badge variant="outline" className={categoryInfo.color}>
                    {categoryInfo.label}
                  </Badge>
                </div>
                <CardTitle className="text-lg mt-3">{template.name}</CardTitle>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{template.actions.length} acciones</span>
                  <Button variant="ghost" size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground">
                    Usar Plantilla
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-semibold mb-2">No se encontraron plantillas</h3>
            <p className="text-muted-foreground text-sm">
              Prueba con otros términos de búsqueda o categoría
            </p>
          </CardContent>
        </Card>
      )}

      {/* Create from scratch */}
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <Zap className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
          <h3 className="font-semibold mb-2">¿No encuentras lo que buscas?</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Crea un workflow completamente personalizado desde cero
          </p>
          <Button onClick={() => navigate('/app/workflow/new')}>
            Crear desde Cero
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
