/**
 * Template preview dialog with variable input
 */

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Mail, 
  MessageCircle, 
  Copy, 
  Check, 
  Smartphone,
  Code,
  Eye,
} from 'lucide-react';
import { CommunicationTemplate, TEMPLATE_CATEGORIES, renderTemplate } from '@/hooks/communications/useCommunicationTemplates';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface CommunicationTemplatePreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: CommunicationTemplate | null;
  onUse?: (template: CommunicationTemplate, variables: Record<string, string>) => void;
}

export function CommunicationTemplatePreview({
  open,
  onOpenChange,
  template,
  onUse,
}: CommunicationTemplatePreviewProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [variables, setVariables] = useState<Record<string, string>>({});

  // Initialize variables with defaults when template changes
  useMemo(() => {
    if (template) {
      const defaults: Record<string, string> = {};
      template.variables.forEach(v => {
        defaults[v.name] = v.default || `[${v.label}]`;
      });
      setVariables(defaults);
    }
  }, [template?.id]);

  if (!template) return null;

  const isWhatsApp = template.channel === 'whatsapp';
  const isEmail = template.channel === 'email';
  const category = TEMPLATE_CATEGORIES.find(c => c.value === template.category);
  const { subject, content } = renderTemplate(template, variables);

  const handleCopy = () => {
    const textToCopy = isWhatsApp ? content : `${subject}\n\n${content.replace(/<[^>]*>/g, '')}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Copiado al portapapeles' });
  };

  const handleUse = () => {
    if (onUse) {
      onUse(template, variables);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div 
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                isWhatsApp ? "bg-green-100" : "bg-primary/10"
              )}
            >
              {isWhatsApp ? (
                <MessageCircle className="w-5 h-5 text-green-600" />
              ) : (
                <Mail className="w-5 h-5 text-primary" />
              )}
            </div>
            <div>
              <DialogTitle className="flex items-center gap-2">
                {template.name}
                {template.is_system && (
                  <Badge variant="secondary" className="text-xs">Sistema</Badge>
                )}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                <span className="font-mono text-xs">{template.code}</span>
                {category && (
                  <>
                    <span>•</span>
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{ borderColor: category.color, color: category.color }}
                    >
                      {category.icon} {category.label}
                    </Badge>
                  </>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 grid md:grid-cols-2 gap-6 overflow-hidden">
          {/* Variables panel */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Variables</h4>
              <span className="text-xs text-muted-foreground">
                {template.variables.length} campo{template.variables.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {template.variables.map((variable) => (
                  <div key={variable.name} className="space-y-2">
                    <Label htmlFor={variable.name} className="flex items-center gap-2">
                      {variable.label}
                      {variable.required && (
                        <span className="text-destructive text-xs">*</span>
                      )}
                    </Label>
                    <Input
                      id={variable.name}
                      value={variables[variable.name] || ''}
                      onChange={(e) => setVariables(prev => ({
                        ...prev,
                        [variable.name]: e.target.value,
                      }))}
                      placeholder={`{{${variable.name}}}`}
                    />
                    <p className="text-xs text-muted-foreground font-mono">
                      {'{{'}
                      {variable.name}
                      {'}}'}
                    </p>
                  </div>
                ))}

                {template.variables.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Esta plantilla no tiene variables
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Preview panel */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'preview' | 'code')}>
                <TabsList className="h-8">
                  <TabsTrigger value="preview" className="text-xs gap-1.5">
                    <Eye className="w-3 h-3" />
                    Vista previa
                  </TabsTrigger>
                  <TabsTrigger value="code" className="text-xs gap-1.5">
                    <Code className="w-3 h-3" />
                    Código
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <Button variant="ghost" size="sm" onClick={handleCopy}>
                {copied ? (
                  <Check className="w-4 h-4 mr-2 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 mr-2" />
                )}
                {copied ? 'Copiado' : 'Copiar'}
              </Button>
            </div>

            <div 
              className={cn(
                "flex-1 rounded-xl border overflow-hidden",
                isWhatsApp ? "bg-[#e5ddd5]" : "bg-muted/30"
              )}
            >
              <ScrollArea className="h-[400px]">
                {viewMode === 'preview' ? (
                  isWhatsApp ? (
                    // WhatsApp style preview
                    <div className="p-4">
                      <div className="max-w-[85%] bg-white rounded-lg shadow-sm p-3">
                        <div 
                          className="text-sm whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{ 
                            __html: content
                              .replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
                              .replace(/\n/g, '<br/>') 
                          }}
                        />
                        <div className="text-right mt-1">
                          <span className="text-[10px] text-gray-500">12:00</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Email preview
                    <div className="p-4">
                      {subject && (
                        <div className="mb-4 pb-4 border-b">
                          <p className="text-xs text-muted-foreground mb-1">Asunto:</p>
                          <p className="font-medium">{subject}</p>
                        </div>
                      )}
                      <div 
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: content }}
                      />
                    </div>
                  )
                ) : (
                  // Code view
                  <pre className="p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                    {isEmail ? template.content_html : template.content_text}
                  </pre>
                )}
              </ScrollArea>
            </div>
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {template.description}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
            {onUse && (
              <Button onClick={handleUse}>
                <Smartphone className="w-4 h-4 mr-2" />
                Usar plantilla
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
