// ============================================================
// IP-NEXUS - Internal Reference Configuration Page
// ============================================================

import { useState, useEffect } from 'react';
import { Hash, Info, Sparkles } from 'lucide-react';
import { 
  useInternalReferenceConfig, 
  useUpdateInternalReferenceConfig,
  TEMPLATE_VARIABLES,
  PRESET_FORMATS,
  generatePreview,
} from '@/hooks/use-internal-reference-config';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { usePageTitle } from '@/contexts/page-context';
import { cn } from '@/lib/utils';

export default function InternalReferenceConfigPage() {
  usePageTitle('Referencia Interna');
  
  const { data: config, isLoading } = useInternalReferenceConfig();
  const updateConfig = useUpdateInternalReferenceConfig();
  
  // Local state
  const [template, setTemplate] = useState('{YEAR}/{TYPE}/{SEQ}');
  const [seqPadding, setSeqPadding] = useState(3);
  const [seqScope, setSeqScope] = useState<'YEAR' | 'TYPE_YEAR' | 'GLOBAL'>('YEAR');
  const [uppercase, setUppercase] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  
  // Load config into local state
  useEffect(() => {
    if (config) {
      setTemplate(config.template);
      setSeqPadding(config.seq_padding);
      setSeqScope(config.seq_scope);
      setUppercase(config.uppercase);
      
      // Check if matches a preset
      const matchingPreset = PRESET_FORMATS.find(p => p.template === config.template);
      setSelectedPreset(matchingPreset?.template || 'custom');
    }
  }, [config]);
  
  // Generate preview
  const preview = generatePreview(template, seqPadding, uppercase);
  
  // Handle preset selection
  const handlePresetSelect = (presetTemplate: string) => {
    if (presetTemplate === 'custom') {
      setSelectedPreset('custom');
    } else {
      setSelectedPreset(presetTemplate);
      setTemplate(presetTemplate);
    }
  };
  
  // Handle variable click (append to template)
  const handleVariableClick = (variable: string) => {
    setTemplate(t => t + variable);
    setSelectedPreset('custom');
  };
  
  // Handle save
  const handleSave = () => {
    updateConfig.mutate({
      template,
      seq_padding: seqPadding,
      seq_scope: seqScope,
      uppercase,
      preview_example: preview,
    });
  };
  
  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Hash className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Referencia Interna</h1>
          <p className="text-muted-foreground">
            Configura el formato automático de la referencia interna de tus expedientes
          </p>
        </div>
      </div>
      
      {/* Preview Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Sparkles className="h-8 w-8 text-primary" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">Vista previa</p>
              <p className="font-mono text-2xl font-bold text-primary">{preview}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Preset Formats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Formato Rápido</CardTitle>
          <CardDescription>Selecciona un formato predefinido o personaliza el tuyo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {PRESET_FORMATS.map((preset) => (
              <button
                key={preset.template}
                onClick={() => handlePresetSelect(preset.template)}
                className={cn(
                  "flex flex-col items-start px-3 py-2 rounded-lg border transition-all text-left",
                  selectedPreset === preset.template
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50 bg-card"
                )}
              >
                <span className="text-sm font-medium">{preset.name}</span>
                <span className="text-xs font-mono text-muted-foreground">{preset.example}</span>
              </button>
            ))}
            <button
              onClick={() => handlePresetSelect('custom')}
              className={cn(
                "flex flex-col items-start px-3 py-2 rounded-lg border transition-all text-left",
                selectedPreset === 'custom'
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50 bg-card"
              )}
            >
              <span className="text-sm font-medium">Personalizado</span>
              <span className="text-xs text-muted-foreground">Define tu formato</span>
            </button>
          </div>
        </CardContent>
      </Card>
      
      {/* Custom Template */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Plantilla Personalizada</CardTitle>
          <CardDescription>Usa variables para construir tu formato de referencia</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Template Input */}
          <div className="space-y-2">
            <Label htmlFor="template">Formato</Label>
            <Input
              id="template"
              value={template}
              onChange={(e) => {
                setTemplate(e.target.value);
                setSelectedPreset('custom');
              }}
              placeholder="{YEAR}/{TYPE}/{SEQ}"
              className="font-mono"
            />
          </div>
          
          {/* Variables */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Variables disponibles
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Haz clic en una variable para añadirla al formato</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <div className="flex flex-wrap gap-2">
              {TEMPLATE_VARIABLES.map((v) => (
                <button
                  key={v.var}
                  onClick={() => handleVariableClick(v.var)}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors"
                >
                  <Badge variant="secondary" className="font-mono text-xs">
                    {v.var}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{v.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Sequence Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Opciones de Secuencia</CardTitle>
          <CardDescription>Configura cómo se genera el número secuencial</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Padding */}
            <div className="space-y-2">
              <Label>Dígitos de secuencia</Label>
              <Select 
                value={seqPadding.toString()} 
                onValueChange={(v) => setSeqPadding(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 dígitos (01-99)</SelectItem>
                  <SelectItem value="3">3 dígitos (001-999)</SelectItem>
                  <SelectItem value="4">4 dígitos (0001-9999)</SelectItem>
                  <SelectItem value="5">5 dígitos (00001-99999)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Scope */}
            <div className="space-y-2">
              <Label>Reinicio de secuencia</Label>
              <Select value={seqScope} onValueChange={(v: 'YEAR' | 'TYPE_YEAR' | 'GLOBAL') => setSeqScope(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="YEAR">Cada año</SelectItem>
                  <SelectItem value="TYPE_YEAR">Por tipo + año</SelectItem>
                  <SelectItem value="GLOBAL">Nunca (continua)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Uppercase toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <Label>Mayúsculas</Label>
              <p className="text-sm text-muted-foreground">Convertir todo a mayúsculas</p>
            </div>
            <Switch checked={uppercase} onCheckedChange={setUppercase} />
          </div>
        </CardContent>
      </Card>
      
      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={updateConfig.isPending}
          size="lg"
        >
          {updateConfig.isPending ? 'Guardando...' : 'Guardar Configuración'}
        </Button>
      </div>
    </div>
  );
}
