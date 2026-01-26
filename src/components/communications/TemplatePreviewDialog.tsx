import { 
  Mail, 
  MessageCircle,
  Send,
  Copy,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { EmailTemplate, WhatsAppTemplate, TEMPLATE_CATEGORIES } from '@/hooks/communications/useTemplates';

interface TemplatePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: EmailTemplate | WhatsAppTemplate | null;
  type: 'email' | 'whatsapp';
}

export function TemplatePreviewDialog({ open, onOpenChange, template, type }: TemplatePreviewDialogProps) {
  if (!template) return null;

  const category = TEMPLATE_CATEGORIES.find(c => c.value === template.category);

  const highlightVariables = (text: string) => {
    return text.replace(
      /\{\{(\w+)\}\}/g,
      '<span class="bg-primary/20 text-primary px-1 rounded font-mono text-xs">{{$1}}</span>'
    );
  };

  const copyToClipboard = () => {
    const content = type === 'email'
      ? (template as EmailTemplate).body_html
      : (template as WhatsAppTemplate).body_text;
    navigator.clipboard.writeText(content);
    toast.success('Contenido copiado al portapapeles');
  };

  const isEmailTemplate = type === 'email';
  const emailTemplate = template as EmailTemplate;
  const waTemplate = template as WhatsAppTemplate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: isEmailTemplate ? '#3B82F615' : '#25D36615' }}
            >
              {isEmailTemplate ? (
                <Mail className="w-4 h-4 text-primary" />
              ) : (
                <MessageCircle className="w-4 h-4" style={{ color: '#25D366' }} />
              )}
            </div>
            {template.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Meta info */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="font-mono text-xs">
              {template.code}
            </Badge>
            {category && (
              <Badge
                variant="outline"
                style={{ borderColor: category.color, color: category.color }}
              >
                {category.label}
              </Badge>
            )}
            {!isEmailTemplate && waTemplate.status && (
              <Badge
                variant={waTemplate.status === 'approved' ? 'default' : waTemplate.status === 'rejected' ? 'destructive' : 'secondary'}
              >
                {waTemplate.status === 'approved' ? 'Aprobado' : waTemplate.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
              </Badge>
            )}
          </div>

          {/* Message simulation */}
          <div className="border rounded-lg overflow-hidden bg-card">
            {isEmailTemplate ? (
              <>
                {/* Email header */}
                <div className="p-4 bg-muted space-y-1 border-b text-sm">
                  <div className="flex">
                    <span className="w-16 text-muted-foreground">De:</span>
                    <span className="font-medium">tu-empresa@ejemplo.com</span>
                  </div>
                  <div className="flex">
                    <span className="w-16 text-muted-foreground">Para:</span>
                    <span className="font-medium">cliente@ejemplo.com</span>
                  </div>
                  <div className="flex">
                    <span className="w-16 text-muted-foreground">Asunto:</span>
                    <span
                      className="font-medium"
                      dangerouslySetInnerHTML={{ __html: highlightVariables(emailTemplate.subject || '') }}
                    />
                  </div>
                </div>
                {/* Email body */}
                <div
                  className="p-4 whitespace-pre-wrap text-sm"
                  dangerouslySetInnerHTML={{ __html: highlightVariables(emailTemplate.body_html || '') }}
                />
              </>
            ) : (
              /* WhatsApp style */
              <div className="p-4" style={{ backgroundColor: '#E5DDD5' }}>
                <div className="max-w-[300px] ml-auto">
                  <div className="bg-[#DCF8C6] rounded-lg p-3 shadow-sm">
                    {waTemplate.header_text && (
                      <p
                        className="font-semibold text-sm mb-1"
                        dangerouslySetInnerHTML={{ __html: highlightVariables(waTemplate.header_text) }}
                      />
                    )}
                    <p
                      className="text-sm whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{ __html: highlightVariables(waTemplate.body_text) }}
                    />
                    {waTemplate.footer_text && (
                      <p className="text-xs text-gray-500 mt-2">
                        {waTemplate.footer_text}
                      </p>
                    )}
                    <p className="text-[10px] text-gray-500 text-right mt-1">
                      12:34 ✓✓
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Variables used */}
          {template.variables && (template.variables as any[]).length > 0 && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Variables utilizadas:
              </p>
              <div className="flex flex-wrap gap-2">
                {(template.variables as any[]).map((v: any) => (
                  <Badge key={v.name} variant="secondary" className="font-mono text-xs">
                    {`{{${v.name}}}`}
                    {v.description && (
                      <span className="ml-1 font-normal text-muted-foreground">
                        - {v.description}
                      </span>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t mt-4">
          <Button variant="outline" onClick={copyToClipboard}>
            <Copy className="w-4 h-4 mr-2" />
            Copiar
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
