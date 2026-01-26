import { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  Eye, 
  Code,
  Variable,
  Info,
  Globe,
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
  useSaveWhatsAppTemplate,
  WhatsAppTemplate,
  TEMPLATE_VARIABLES,
  TEMPLATE_CATEGORIES,
  detectVariables,
  renderTemplate,
} from '@/hooks/communications/useTemplates';
import { cn } from '@/lib/utils';

interface WhatsAppTemplateEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: WhatsAppTemplate | null;
}

const LANGUAGES = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
  { value: 'pt', label: 'Português' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
];

export function WhatsAppTemplateEditor({ open, onOpenChange, template }: WhatsAppTemplateEditorProps) {
  const saveTemplate = useSaveWhatsAppTemplate();
  const isEditing = !!template?.id;

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    wa_template_name: '',
    category: 'notification',
    language: 'es',
    header_type: 'none',
    header_text: '',
    body_text: '',
    footer_text: '',
  });

  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [previewData, setPreviewData] = useState<Record<string, string>>({});

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || '',
        code: template.code || '',
        wa_template_name: template.wa_template_name || '',
        category: template.category || 'notification',
        language: template.language || 'es',
        header_type: template.header_type || 'none',
        header_text: template.header_text || '',
        body_text: template.body_text || '',
        footer_text: template.footer_text || '',
      });
    } else {
      setFormData({
        name: '',
        code: '',
        wa_template_name: '',
        category: 'notification',
        language: 'es',
        header_type: 'none',
        header_text: '',
        body_text: '',
        footer_text: '',
      });
    }
    setActiveTab('edit');
    setPreviewData({});
  }, [template, open]);

  const detectedVars = [
    ...detectVariables(formData.header_text),
    ...detectVariables(formData.body_text),
    ...detectVariables(formData.footer_text),
  ].filter((v, i, arr) => arr.indexOf(v) === i);

  const insertVariable = (varName: string) => {
    setFormData(prev => ({
      ...prev,
      body_text: prev.body_text + `{{${varName}}}`,
    }));
  };

  const handleSave = () => {
    if (!formData.name || !formData.code || !formData.wa_template_name || !formData.body_text) {
      return;
    }

    saveTemplate.mutate({
      id: template?.id,
      ...formData,
      status: 'pending',
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
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#25D36615' }}>
              <MessageCircle className="w-4 h-4" style={{ color: '#25D366' }} />
            </div>
            {isEditing ? 'Editar plantilla de WhatsApp' : 'Nueva plantilla de WhatsApp'}
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
              {/* Left column */}
              <ScrollArea className="h-[calc(70vh-150px)]">
                <div className="space-y-4 pr-4">
                  <div>
                    <Label>Nombre interno *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Recordatorio de cita"
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
                            Identificador para uso en automatizaciones
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <Input
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                      placeholder="appointment_reminder"
                      className="font-mono text-sm"
                    />
                  </div>

                  <div>
                    <Label className="flex items-center gap-1">
                      Nombre en Meta *
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="w-3 h-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            Nombre exacto del template en Meta Business
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <Input
                      value={formData.wa_template_name}
                      onChange={(e) => setFormData({ ...formData, wa_template_name: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                      placeholder="appointment_reminder"
                      className="font-mono text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
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
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Idioma</Label>
                      <Select
                        value={formData.language}
                        onValueChange={(v) => setFormData({ ...formData, language: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LANGUAGES.map(lang => (
                            <SelectItem key={lang.value} value={lang.value}>
                              {lang.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Available variables */}
                  <div>
                    <Label className="flex items-center gap-2">
                      <Variable className="w-4 h-4" />
                      Variables
                    </Label>
                    <div className="mt-2 p-3 bg-muted rounded-lg max-h-[180px] overflow-y-auto">
                      <div className="space-y-1">
                        {TEMPLATE_VARIABLES.slice(0, 8).map(v => (
                          <button
                            key={v.name}
                            type="button"
                            onClick={() => insertVariable(v.name)}
                            className="w-full text-left px-2 py-1.5 text-sm hover:bg-background rounded flex items-center justify-between group transition-colors"
                          >
                            <span className="font-mono text-xs" style={{ color: '#25D366' }}>
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

              {/* Right column */}
              <div className="md:col-span-2 space-y-4">
                <div>
                  <Label>Encabezado (opcional)</Label>
                  <Input
                    value={formData.header_text}
                    onChange={(e) => setFormData({ ...formData, header_text: e.target.value })}
                    placeholder="Título del mensaje"
                  />
                </div>

                <div className="flex-1">
                  <Label>Mensaje *</Label>
                  <Textarea
                    value={formData.body_text}
                    onChange={(e) => setFormData({ ...formData, body_text: e.target.value })}
                    placeholder="Hola {{client_name}}, te recordamos tu cita..."
                    rows={10}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.body_text.length}/1024 caracteres
                  </p>
                </div>

                <div>
                  <Label>Pie de mensaje (opcional)</Label>
                  <Input
                    value={formData.footer_text}
                    onChange={(e) => setFormData({ ...formData, footer_text: e.target.value })}
                    placeholder="Enviado desde IP-NEXUS"
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
                </div>
              </div>

              {/* WhatsApp style preview */}
              <div>
                <h3 className="font-medium mb-3">Vista previa</h3>
                <div className="rounded-2xl p-4" style={{ backgroundColor: '#E5DDD5' }}>
                  <div className="max-w-[280px] ml-auto">
                    <div className="bg-[#DCF8C6] rounded-lg p-3 shadow-sm">
                      {formData.header_text && (
                        <p className="font-semibold text-sm mb-1">
                          {renderTemplate(formData.header_text, previewData)}
                        </p>
                      )}
                      <p className="text-sm whitespace-pre-wrap">
                        {renderTemplate(formData.body_text, previewData) || '(Sin mensaje)'}
                      </p>
                      {formData.footer_text && (
                        <p className="text-xs text-gray-500 mt-2">
                          {renderTemplate(formData.footer_text, previewData)}
                        </p>
                      )}
                      <p className="text-[10px] text-gray-500 text-right mt-1">
                        12:34
                      </p>
                    </div>
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
            disabled={!formData.name || !formData.code || !formData.wa_template_name || !formData.body_text || saveTemplate.isPending}
            style={{ backgroundColor: '#25D366' }}
            className="text-white hover:opacity-90"
          >
            {saveTemplate.isPending ? 'Guardando...' : 'Guardar plantilla'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
