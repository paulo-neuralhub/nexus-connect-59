import { useState, useEffect } from 'react';
import { 
  Mail, 
  Eye, 
  Code,
  Variable,
  Info,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  useSaveEmailTemplate,
  EmailTemplate,
  TEMPLATE_VARIABLES,
  TEMPLATE_CATEGORIES,
  detectVariables,
  renderTemplate,
} from '@/hooks/communications/useTemplates';
import { cn } from '@/lib/utils';

interface EmailTemplateEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: EmailTemplate | null;
}

export function EmailTemplateEditor({ open, onOpenChange, template }: EmailTemplateEditorProps) {
  const saveTemplate = useSaveEmailTemplate();
  const isEditing = !!template?.id;

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    category: 'notification',
    subject: '',
    body_html: '',
    body_text: '',
  });

  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [previewData, setPreviewData] = useState<Record<string, string>>({});

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || '',
        code: template.code || '',
        description: template.description || '',
        category: template.category || 'notification',
        subject: template.subject || '',
        body_html: template.body_html || '',
        body_text: template.body_text || '',
      });
    } else {
      setFormData({
        name: '',
        code: '',
        description: '',
        category: 'notification',
        subject: '',
        body_html: '',
        body_text: '',
      });
    }
    setActiveTab('edit');
    setPreviewData({});
  }, [template, open]);

  const detectedVars = [
    ...detectVariables(formData.subject),
    ...detectVariables(formData.body_html),
  ].filter((v, i, arr) => arr.indexOf(v) === i);

  const insertVariable = (varName: string) => {
    setFormData(prev => ({
      ...prev,
      body_html: prev.body_html + `{{${varName}}}`,
    }));
  };

  const handleSave = () => {
    if (!formData.name || !formData.code || !formData.subject || !formData.body_html) {
      return;
    }
    
    saveTemplate.mutate({
      id: template?.id,
      ...formData,
      variables: detectedVars.map(name => ({
        name,
        description: TEMPLATE_VARIABLES.find(v => v.name === name)?.description,
      })),
    }, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Mail className="w-4 h-4 text-primary" />
            </div>
            {isEditing ? 'Editar plantilla de Email' : 'Nueva plantilla de Email'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'edit' | 'preview')} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid grid-cols-2 w-[200px]">
            <TabsTrigger value="edit">
              <Code className="w-4 h-4 mr-2" />
              Editar
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="flex-1 overflow-hidden mt-4">
            <div className="grid md:grid-cols-3 gap-6 h-full">
              {/* Left column: Configuration */}
              <ScrollArea className="h-[calc(70vh-150px)]">
                <div className="space-y-4 pr-4">
                  <div>
                    <Label>Nombre *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Recordatorio de plazo"
                    />
                  </div>

                  <div>
                    <Label className="flex items-center gap-1">
                      Código *
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="w-3 h-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            Identificador único para uso programático
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <Input
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                      placeholder="deadline_reminder"
                      className="font-mono text-sm"
                    />
                  </div>

                  <div>
                    <Label>Descripción</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe el propósito de esta plantilla..."
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label>Categoría</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(v) => setFormData({ ...formData, category: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TEMPLATE_CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            <span className="flex items-center gap-2">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: cat.color }}
                              />
                              {cat.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Available variables */}
                  <div>
                    <Label className="flex items-center gap-2">
                      <Variable className="w-4 h-4" />
                      Variables disponibles
                    </Label>
                    <div className="mt-2 p-3 bg-muted rounded-lg max-h-[200px] overflow-y-auto">
                      <div className="space-y-1">
                        {TEMPLATE_VARIABLES.map(v => (
                          <button
                            key={v.name}
                            type="button"
                            onClick={() => insertVariable(v.name)}
                            className="w-full text-left px-2 py-1.5 text-sm hover:bg-background rounded flex items-center justify-between group transition-colors"
                          >
                            <span className="font-mono text-xs text-primary">
                              {`{{${v.name}}}`}
                            </span>
                            <span className="text-muted-foreground text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                              +
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              {/* Right column: Content */}
              <div className="md:col-span-2 space-y-4">
                <div>
                  <Label>Asunto *</Label>
                  <Input
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Recordatorio: {{deadline_description}}"
                  />
                </div>

                <div className="flex-1">
                  <Label>Contenido del email *</Label>
                  <Textarea
                    value={formData.body_html}
                    onChange={(e) => setFormData({ ...formData, body_html: e.target.value })}
                    placeholder="Escribe el contenido de tu email..."
                    rows={14}
                    className="font-mono text-sm"
                  />
                </div>

                {/* Detected variables */}
                {detectedVars.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Variables detectadas</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {detectedVars.map(v => {
                        const info = TEMPLATE_VARIABLES.find(av => av.name === v);
                        return (
                          <Badge
                            key={v}
                            variant={info ? 'secondary' : 'destructive'}
                            className="font-mono text-xs"
                          >
                            {`{{${v}}}`}
                            {!info && ' ⚠'}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="flex-1 overflow-y-auto mt-4">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Test data */}
              <div>
                <h3 className="font-medium mb-3">Datos de prueba</h3>
                <div className="space-y-3">
                  {detectedVars.map(v => {
                    const info = TEMPLATE_VARIABLES.find(av => av.name === v);
                    return (
                      <div key={v}>
                        <Label className="text-xs">{info?.description || v}</Label>
                        <Input
                          value={previewData[v] || ''}
                          onChange={(e) => setPreviewData({ ...previewData, [v]: e.target.value })}
                          placeholder={info?.description}
                          className="text-sm"
                        />
                      </div>
                    );
                  })}
                  {detectedVars.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No hay variables para personalizar
                    </p>
                  )}
                </div>
              </div>

              {/* Preview */}
              <div>
                <h3 className="font-medium mb-3">Vista previa</h3>
                <div className="border rounded-lg overflow-hidden bg-card">
                  <div className="px-4 py-2 bg-muted border-b font-medium text-sm">
                    {renderTemplate(formData.subject, previewData) || '(Sin asunto)'}
                  </div>
                  <div className="p-4 whitespace-pre-wrap text-sm min-h-[200px]">
                    {renderTemplate(formData.body_html, previewData) || '(Sin contenido)'}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!formData.name || !formData.code || !formData.subject || !formData.body_html || saveTemplate.isPending}
          >
            {saveTemplate.isPending ? 'Guardando...' : 'Guardar plantilla'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
