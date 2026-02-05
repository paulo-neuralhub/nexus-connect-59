/**
 * EnhancedEmailComposeModal - Modal mejorado para componer email desde expediente
 * Con plantillas categorizadas, referencia obligatoria bloqueada, firma automática
 */

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Mail, Send, AlertCircle, ChevronDown, ChevronUp,
  Bold, Italic, Link, List, ListOrdered, Paperclip, Save,
  FileText, Receipt, Scale, Megaphone, HandHeart, X
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useCreateCommunication } from '@/hooks/legal-ops/useCommunications';
import { useToast } from '@/hooks/use-toast';
import { useOrganization } from '@/contexts/organization-context';
import { cn } from '@/lib/utils';

const schema = z.object({
  to: z.string().email('Email inválido'),
  cc: z.string().optional(),
  bcc: z.string().optional(),
  subjectText: z.string().min(1, 'Asunto requerido').max(200, 'Asunto demasiado largo'),
  body: z.string().min(1, 'Mensaje requerido').max(50000, 'Mensaje demasiado largo'),
  isImportant: z.boolean().default(false),
  templateId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface EnhancedEmailComposeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matterId: string;
  matterReference: string;
  matterTitle?: string;
  matterType?: string;
  clientName?: string;
  clientEmail?: string;
  jurisdiction?: string;
}

// Template categories with categorized templates
const EMAIL_TEMPLATE_CATEGORIES = [
  {
    id: 'updates',
    name: '📋 Actualizaciones',
    icon: FileText,
    templates: [
      { id: 'update_status', name: 'Actualización de estado', subject: 'Actualización de estado de su expediente', body: 'Estimado/a {nombre_cliente},\n\nLe informamos sobre el estado actual de su expediente {referencia}:\n\n[Descripción del estado actual]\n\nQuedamos a su disposición para cualquier aclaración.' },
      { id: 'update_phase', name: 'Cambio de fase', subject: 'Su expediente avanza a nueva fase', body: 'Estimado/a {nombre_cliente},\n\nNos complace informarle que su expediente {referencia} ha avanzado a la siguiente fase del procedimiento.\n\n[Detalles de la nueva fase]\n\nLe mantendremos informado/a de cualquier novedad.' },
      { id: 'update_deadline', name: 'Nuevo plazo', subject: 'Nuevo plazo importante - {referencia}', body: 'Estimado/a {nombre_cliente},\n\nLe comunicamos que se ha establecido un nuevo plazo para su expediente:\n\nExpediente: {referencia}\nPlazo: [FECHA]\nAcción requerida: [DESCRIPCIÓN]\n\nEs importante cumplir con este plazo para el correcto avance de su caso.' },
    ]
  },
  {
    id: 'quotes',
    name: '💰 Presupuestos',
    icon: Receipt,
    templates: [
      { id: 'quote_send', name: 'Envío de presupuesto', subject: 'Presupuesto para sus servicios - {referencia}', body: 'Estimado/a {nombre_cliente},\n\nAdjunto encontrará el presupuesto detallado para los servicios solicitados.\n\nExpediente: {referencia}\n\nQuedamos a su disposición para resolver cualquier duda.\n\nLe rogamos confirme su aceptación para proceder.' },
      { id: 'quote_reminder', name: 'Recordatorio de pago', subject: 'Recordatorio de pago - {referencia}', body: 'Estimado/a {nombre_cliente},\n\nLe recordamos que tiene una factura pendiente de pago correspondiente al expediente {referencia}.\n\nImporte: [CANTIDAD]\nVencimiento: [FECHA]\n\nAgradecemos su pronta atención a este asunto.' },
      { id: 'quote_invoice', name: 'Envío de factura', subject: 'Factura adjunta - {referencia}', body: 'Estimado/a {nombre_cliente},\n\nAdjunto encontrará la factura correspondiente a los servicios prestados.\n\nExpediente: {referencia}\nNº Factura: [NÚMERO]\nImporte: [CANTIDAD]\n\nGracias por su confianza.' },
    ]
  },
  {
    id: 'documents',
    name: '📄 Documentos',
    icon: FileText,
    templates: [
      { id: 'doc_send', name: 'Envío de documentos', subject: 'Documentos adjuntos - {referencia}', body: 'Estimado/a {nombre_cliente},\n\nAdjunto le remitimos los siguientes documentos relativos a su expediente {referencia}:\n\n[LISTA DE DOCUMENTOS]\n\nPor favor, revíselos y no dude en contactarnos si tiene alguna pregunta.' },
      { id: 'doc_request', name: 'Solicitud de documentos', subject: 'Documentación necesaria - {referencia}', body: 'Estimado/a {nombre_cliente},\n\nPara continuar con el trámite de su expediente {referencia}, necesitamos que nos proporcione la siguiente documentación:\n\n[LISTA DE DOCUMENTOS NECESARIOS]\n\nLe rogamos nos la haga llegar a la mayor brevedad posible.' },
      { id: 'doc_signature', name: 'Solicitud de firma', subject: 'Documentos pendientes de firma - {referencia}', body: 'Estimado/a {nombre_cliente},\n\nAdjuntamos documentos que requieren su firma para el expediente {referencia}.\n\nPor favor, fírmelos y devuélvanoslos para poder continuar con el procedimiento.\n\n[INSTRUCCIONES DE FIRMA]' },
    ]
  },
  {
    id: 'legal',
    name: '⚖️ Legal',
    icon: Scale,
    templates: [
      { id: 'legal_opposition', name: 'Notificación de oposición', subject: 'URGENTE: Oposición recibida - {referencia}', body: 'Estimado/a {nombre_cliente},\n\nLe informamos que hemos recibido una oposición contra su expediente {referencia}.\n\nOponente: [NOMBRE]\nMotivos alegados: [RESUMEN]\nPlazo de respuesta: [FECHA]\n\nLe contactaremos para analizar las opciones de defensa.' },
      { id: 'legal_grant', name: 'Notificación de concesión', subject: '¡Enhorabuena! Concesión de su derecho - {referencia}', body: 'Estimado/a {nombre_cliente},\n\n¡Nos complace comunicarle que su solicitud {referencia} ha sido concedida!\n\nTipo: {tipo_expediente}\nFecha de concesión: [FECHA]\n\nAdjuntamos el certificado oficial.\n\nEnhorabuena y gracias por confiar en nosotros.' },
      { id: 'legal_requirement', name: 'Requerimiento de oficina', subject: 'Requerimiento oficial - {referencia}', body: 'Estimado/a {nombre_cliente},\n\nHemos recibido un requerimiento de la oficina para su expediente {referencia}.\n\nMotivo: [DESCRIPCIÓN]\nPlazo: [FECHA]\n\nLe contactaremos para preparar la respuesta adecuada.' },
    ]
  },
  {
    id: 'general',
    name: '👋 General',
    icon: HandHeart,
    templates: [
      { id: 'general_welcome', name: 'Bienvenida nuevo cliente', subject: 'Bienvenido/a a {organizacion}', body: 'Estimado/a {nombre_cliente},\n\nEs un placer darle la bienvenida como cliente de {organizacion}.\n\nHemos creado su expediente con referencia {referencia} y estaremos encantados de ayudarle con sus necesidades de Propiedad Intelectual.\n\nNo dude en contactarnos para cualquier consulta.' },
      { id: 'general_followup', name: 'Seguimiento', subject: 'Seguimiento de su expediente - {referencia}', body: 'Estimado/a {nombre_cliente},\n\nQueremos hacer un seguimiento del estado de su expediente {referencia}.\n\n¿Tiene alguna pregunta o necesita información adicional?\n\nEstamos a su disposición.' },
      { id: 'general_thanks', name: 'Agradecimiento', subject: 'Gracias por confiar en nosotros', body: 'Estimado/a {nombre_cliente},\n\nQueremos agradecerle su confianza al elegir nuestros servicios para su expediente {referencia}.\n\nHa sido un placer trabajar con usted.\n\nNo dude en contactarnos para futuros proyectos.' },
    ]
  },
];

export function EnhancedEmailComposeModal({
  open,
  onOpenChange,
  matterId,
  matterReference,
  matterTitle,
  matterType,
  clientName,
  clientEmail,
  jurisdiction,
}: EnhancedEmailComposeModalProps) {
  const { toast } = useToast();
  const { currentOrganization } = useOrganization();
  const createComm = useCreateCommunication();
  
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  // Organization signature
  const signature = useMemo(() => {
    const orgName = currentOrganization?.name || 'IP-NEXUS';
    return `\n\n──────────────────\nReferencia: ${matterReference}${matterTitle ? `\nExpediente: ${matterTitle}` : ''}${clientName ? `\nCliente: ${clientName}` : ''}\nGestiona: ${orgName}`;
  }, [currentOrganization?.name, matterReference, matterTitle, clientName]);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      to: clientEmail || '',
      cc: '',
      bcc: '',
      subjectText: '',
      body: '',
      isImportant: false,
      templateId: '',
    },
  });

  // Update defaults when props change
  useEffect(() => {
    if (open) {
      form.reset({
        to: clientEmail || '',
        cc: '',
        bcc: '',
        subjectText: '',
        body: '',
        isImportant: false,
        templateId: '',
      });
      setSelectedTemplate('');
      setShowCcBcc(false);
    }
  }, [open, clientEmail]);

  // Replace template variables
  const replaceVariables = (text: string): string => {
    return text
      .replace(/{nombre_cliente}/g, clientName || 'Cliente')
      .replace(/{referencia}/g, matterReference)
      .replace(/{tipo_expediente}/g, matterType || 'Expediente')
      .replace(/{organizacion}/g, currentOrganization?.name || 'IP-NEXUS')
      .replace(/{jurisdiccion}/g, jurisdiction || '');
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    form.setValue('templateId', templateId);
    
    // Find template in categories
    for (const cat of EMAIL_TEMPLATE_CATEGORIES) {
      const template = cat.templates.find(t => t.id === templateId);
      if (template) {
        form.setValue('subjectText', replaceVariables(template.subject));
        form.setValue('body', replaceVariables(template.body));
        break;
      }
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      // Build full subject with locked reference
      const fullSubject = `[REF: ${matterReference}] ${data.isImportant ? '[IMPORTANTE] ' : ''}${data.subjectText}`;
      
      // Append signature to body
      const bodyWithSignature = data.body + signature;
      
      await createComm.mutateAsync({
        channel: 'email',
        direction: 'outbound',
        matter_id: matterId,
        email_to: [data.to],
        subject: fullSubject,
        body: bodyWithSignature,
      });
      toast({ 
        title: 'Email guardado', 
        description: 'Comunicación registrada en el expediente' 
      });
      form.reset();
      onOpenChange(false);
    } catch {
      toast({ title: 'Error al guardar', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <DialogHeader className="p-4 border-b bg-gradient-to-r from-blue-50 to-cyan-50">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #0ea5e9 100%)' }}
              >
                <Mail className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">Nuevo Email</DialogTitle>
                {/* Locked reference badge */}
                <Badge 
                  variant="secondary" 
                  className="mt-1 bg-slate-200 text-slate-700 font-mono text-xs cursor-not-allowed"
                >
                  REF: {matterReference}
                </Badge>
              </div>
            </div>
            
            {/* Template selector */}
            <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
              <SelectTrigger className="w-[200px] h-9 border-blue-200 bg-white">
                <SelectValue placeholder="📋 Usar plantilla..." />
              </SelectTrigger>
              <SelectContent>
                {EMAIL_TEMPLATE_CATEGORIES.map(cat => (
                  <SelectGroup key={cat.id}>
                    <SelectLabel className="text-xs font-semibold text-muted-foreground">
                      {cat.name}
                    </SelectLabel>
                    {cat.templates.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 space-y-3">
            {/* To field */}
            <FormField
              control={form.control}
              name="to"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <FormLabel className="w-14 text-right text-muted-foreground text-sm">Para</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="email@ejemplo.com" 
                        className="flex-1"
                        {...field} 
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCcBcc(!showCcBcc)}
                      className="text-muted-foreground text-xs"
                    >
                      CC/BCC {showCcBcc ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                    </Button>
                  </div>
                  <FormMessage className="ml-16" />
                </FormItem>
              )}
            />

            {/* CC/BCC fields - collapsible */}
            {showCcBcc && (
              <>
                <FormField
                  control={form.control}
                  name="cc"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <FormLabel className="w-14 text-right text-muted-foreground text-sm">CC</FormLabel>
                        <FormControl>
                          <Input placeholder="Separar con comas" className="flex-1" {...field} />
                        </FormControl>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bcc"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <FormLabel className="w-14 text-right text-muted-foreground text-sm">BCC</FormLabel>
                        <FormControl>
                          <Input placeholder="Separar con comas" className="flex-1" {...field} />
                        </FormControl>
                      </div>
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Subject field with locked reference prefix */}
            <FormField
              control={form.control}
              name="subjectText"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <FormLabel className="w-14 text-right text-muted-foreground text-sm">Asunto</FormLabel>
                    <div className="flex-1 flex items-center gap-1 bg-background border rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                      {/* Locked reference chip */}
                      <div className="flex items-center gap-1 px-2 py-1 ml-1 bg-slate-100 rounded text-xs font-mono text-slate-600 shrink-0">
                        <span>[REF: {matterReference}]</span>
                      </div>
                      <FormControl>
                        <Input 
                          placeholder="Asunto del email" 
                          className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0" 
                          {...field} 
                        />
                      </FormControl>
                    </div>
                  </div>
                  <FormMessage className="ml-16" />
                </FormItem>
              )}
            />

            {/* Important checkbox */}
            <FormField
              control={form.control}
              name="isImportant"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 ml-16 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="text-sm font-normal flex items-center gap-1 cursor-pointer">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                    Marcar como importante
                  </FormLabel>
                </FormItem>
              )}
            />

            <Separator />

            {/* Body with format bar */}
            <div className="space-y-2">
              {/* Format toolbar */}
              <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7">
                  <Bold className="h-3.5 w-3.5" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7">
                  <Italic className="h-3.5 w-3.5" />
                </Button>
                <Separator orientation="vertical" className="h-4 mx-1" />
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7">
                  <List className="h-3.5 w-3.5" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7">
                  <ListOrdered className="h-3.5 w-3.5" />
                </Button>
                <Separator orientation="vertical" className="h-4 mx-1" />
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7">
                  <Link className="h-3.5 w-3.5" />
                </Button>
              </div>
              
              <FormField
                control={form.control}
                name="body"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea 
                        placeholder="Escribe tu mensaje..."
                        rows={10}
                        className="resize-none font-[inherit]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Locked footer preview */}
              <div className="p-3 bg-slate-50 rounded-lg border border-dashed border-slate-300 text-xs text-slate-500 whitespace-pre-line">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Pie del email (automático)</p>
                ──────────────────{'\n'}
                Referencia: {matterReference}{matterTitle ? `\nExpediente: ${matterTitle}` : ''}{clientName ? `\nCliente: ${clientName}` : ''}{'\n'}
                Gestiona: {currentOrganization?.name || 'IP-NEXUS'}
              </div>
            </div>

            {/* Footer with actions */}
            <div className="flex items-center justify-between pt-3 border-t">
              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" size="sm">
                  <Paperclip className="h-4 w-4 mr-1" />
                  Adjuntar
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => toast({ title: 'Borrador guardado' })}>
                  <Save className="h-4 w-4 mr-1" />
                  Guardar borrador
                </Button>
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createComm.isPending}
                  style={{ background: 'linear-gradient(135deg, #00b4d8 0%, #00d4aa 100%)' }}
                  className="text-white"
                >
                  <Send className="h-4 w-4 mr-1" />
                  Enviar
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
