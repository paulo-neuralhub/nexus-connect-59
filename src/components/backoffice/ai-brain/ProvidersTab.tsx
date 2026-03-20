import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, Settings, Trash2, TestTube, Loader2, RefreshCw,
  MessageSquare, Image, Wrench, Database, Zap, Search,
  Eye, Globe, Bot, Cpu, ScanLine, FileSearch
} from 'lucide-react';
import { AIProvider, ProviderCategory } from '@/types/ai-brain.types';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ProvidersTabProps {
  providers: AIProvider[];
  isLoading: boolean;
  onEdit: (provider: AIProvider) => void;
  onDelete: (id: string) => void;
  onTest: (provider: AIProvider) => void;
  onDiscoverModels: (provider: AIProvider) => void;
  onCreateDefaults?: () => void;
  testingProviderId?: string | null;
  discoveringProviderId?: string | null;
}

const CATEGORY_CONFIG: Record<string, { label: string; description: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  llm: { 
    label: 'LLM — Modelos de Lenguaje', 
    description: 'Proveedores de modelos de lenguaje para chat, análisis, generación y razonamiento',
    icon: Brain,
    color: 'text-violet-600 bg-violet-50 border-violet-200'
  },
  search: { 
    label: 'Búsqueda IA', 
    description: 'Motores de búsqueda optimizados para agentes IA con citas verificables',
    icon: Search,
    color: 'text-blue-600 bg-blue-50 border-blue-200'
  },
  vision: { 
    label: 'Visión / OCR', 
    description: 'Procesamiento de imágenes, OCR y extracción de datos de documentos',
    icon: Eye,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200'
  },
  scraping: { 
    label: 'Datos / Scraping', 
    description: 'Extracción de datos web, scraping y conversión de contenido',
    icon: Globe,
    color: 'text-amber-600 bg-amber-50 border-amber-200'
  },
};

export function ProvidersTab({ 
  providers, 
  isLoading, 
  onEdit, 
  onDelete, 
  onTest,
  onDiscoverModels,
  onCreateDefaults,
  testingProviderId,
  discoveringProviderId,
}: ProvidersTabProps) {

  const providersByCategory = useMemo(() => {
    const map: Record<string, AIProvider[]> = { llm: [], search: [], vision: [], scraping: [] };
    providers.forEach(p => {
      const cat = p.category || 'llm';
      if (!map[cat]) map[cat] = [];
      map[cat].push(p);
    });
    return map;
  }, [providers]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">Activo</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Sin configurar</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const CapabilityIcon = ({ enabled, icon: Icon, label }: { enabled?: boolean; icon: React.ComponentType<{ className?: string }>; label: string }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`p-1 rounded ${enabled ? 'text-primary' : 'text-muted-foreground/20'}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </TooltipTrigger>
      <TooltipContent><p>{label}: {enabled ? 'Sí' : 'No'}</p></TooltipContent>
    </Tooltip>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3].map(j => <Skeleton key={j} className="h-16 w-full" />)}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground/20" />
          <p className="text-muted-foreground">No hay providers configurados</p>
          {onCreateDefaults && (
            <Button variant="outline" className="mt-4" onClick={onCreateDefaults}>
              Crear providers por defecto
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const categoryOrder = ['llm', 'search', 'vision', 'scraping'];

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{providers.length} proveedores</span>
        <span>•</span>
        <span>{providers.filter(p => p.status === 'active').length} activos</span>
        <span>•</span>
        <span>{providers.filter(p => p.api_key_encrypted).length} con API key</span>
      </div>

      {categoryOrder.map(cat => {
        const config = CATEGORY_CONFIG[cat];
        const catProviders = providersByCategory[cat] || [];
        if (catProviders.length === 0) return null;

        const CatIcon = config.icon;
        
        return (
          <Card key={cat} className="overflow-hidden">
            <CardHeader className={`border-b ${config.color.split(' ').slice(1).join(' ')} border`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${config.color.split(' ').slice(1, 3).join(' ')}`}>
                  <CatIcon className={`h-5 w-5 ${config.color.split(' ')[0]}`} />
                </div>
                <div>
                  <CardTitle className="text-base">{config.label}</CardTitle>
                  <CardDescription className="text-xs mt-0.5">{config.description}</CardDescription>
                </div>
                <Badge variant="secondary" className="ml-auto">{catProviders.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {catProviders.map((provider) => (
                  <div key={provider.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        {provider.is_gateway ? (
                          <Zap className="h-4 w-4 text-amber-500" />
                        ) : cat === 'llm' ? (
                          <Bot className="h-4 w-4 text-violet-500" />
                        ) : cat === 'search' ? (
                          <Search className="h-4 w-4 text-blue-500" />
                        ) : cat === 'vision' ? (
                          <ScanLine className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <FileSearch className="h-4 w-4 text-amber-500" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">{provider.name}</p>
                          {provider.is_gateway && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">Gateway</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {provider.description || provider.code}
                        </p>
                      </div>
                    </div>
                    
                    {/* Capabilities for LLM providers */}
                    {cat === 'llm' && (
                      <div className="flex items-center gap-0.5 mx-3">
                        <CapabilityIcon enabled={provider.supports_chat} icon={MessageSquare} label="Chat" />
                        <CapabilityIcon enabled={provider.supports_vision} icon={Image} label="Vision" />
                        <CapabilityIcon enabled={provider.supports_tools} icon={Wrench} label="Tools" />
                        <CapabilityIcon enabled={provider.supports_embeddings} icon={Database} label="Embeddings" />
                      </div>
                    )}

                    <div className="flex items-center gap-2 shrink-0">
                      {getStatusBadge(provider.status)}
                      {provider.api_key_encrypted && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                          🔑 Configurado
                        </Badge>
                      )}
                      <Button variant="outline" size="sm" className="h-7 px-2" onClick={() => onEdit(provider)}>
                        <Settings className="h-3.5 w-3.5" />
                      </Button>
                      {cat === 'llm' && (
                        <Button
                          variant="outline" size="sm" className="h-7 px-2"
                          onClick={() => onDiscoverModels(provider)}
                          disabled={discoveringProviderId === provider.id}
                        >
                          {discoveringProviderId === provider.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      )}
                      <Button 
                        variant="outline" size="sm" className="h-7 px-2"
                        onClick={() => onTest(provider)}
                        disabled={testingProviderId === provider.id}
                      >
                        {testingProviderId === provider.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <TestTube className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button 
                        variant="ghost" size="sm" className="h-7 px-2 text-destructive" 
                        onClick={() => onDelete(provider.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
