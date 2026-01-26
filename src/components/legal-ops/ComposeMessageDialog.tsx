// =============================================
// COMPONENTE: ComposeMessageDialog
// Dialog para componer nuevos mensajes (Email, SMS, WhatsApp)
// =============================================

import { useState } from 'react';
import { 
  Mail, 
  Phone, 
  MessageSquare, 
  Send,
  X,
  Clock,
  Loader2,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { 
  useSendEmail, 
  useSendSMS, 
  useSendWhatsApp, 
  useMakeCall 
} from '@/hooks/legal-ops/useCommunications';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CommChannel } from '@/types/legal-ops';

interface ComposeMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channelType: CommChannel;
  defaultTo?: string;
  defaultContactId?: string;
  defaultClientId?: string;
  defaultMatterId?: string;
}

const CHANNEL_CONFIG: Record<CommChannel, { 
  icon: typeof Mail; 
  color: string; 
  label: string;
  placeholder: string;
  hasSubject: boolean;
}> = {
  email: { 
    icon: Mail, 
    color: 'hsl(var(--primary))', 
    label: 'Email',
    placeholder: 'email@ejemplo.com',
    hasSubject: true,
  },
  whatsapp: { 
    icon: MessageSquare, 
    color: '#25D366', 
    label: 'WhatsApp',
    placeholder: '+34 612 345 678',
    hasSubject: false,
  },
  phone: { 
    icon: Phone, 
    color: 'hsl(var(--primary))', 
    label: 'Llamada',
    placeholder: '+34 612 345 678',
    hasSubject: false,
  },
  sms: { 
    icon: MessageSquare, 
    color: 'hsl(var(--warning))', 
    label: 'SMS',
    placeholder: '+34 612 345 678',
    hasSubject: false,
  },
  portal: {
    icon: Mail,
    color: 'hsl(var(--primary))',
    label: 'Portal',
    placeholder: '',
    hasSubject: true,
  },
  in_person: {
    icon: Phone,
    color: 'hsl(var(--primary))',
    label: 'Presencial',
    placeholder: '',
    hasSubject: false,
  },
  other: {
    icon: MessageSquare,
    color: 'hsl(var(--muted-foreground))',
    label: 'Otro',
    placeholder: '',
    hasSubject: false,
  },
};

export function ComposeMessageDialog({
  open,
  onOpenChange,
  channelType,
  defaultTo = '',
  defaultContactId,
  defaultClientId,
  defaultMatterId,
}: ComposeMessageDialogProps) {
  const sendEmail = useSendEmail();
  const sendSMS = useSendSMS();
  const sendWhatsApp = useSendWhatsApp();
  const makeCall = useMakeCall();

  const [to, setTo] = useState(defaultTo);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);
  const [isSending, setIsSending] = useState(false);

  const config = CHANNEL_CONFIG[channelType] || CHANNEL_CONFIG.email;
  const ChannelIcon = config.icon;

  const resetForm = () => {
    setTo(defaultTo);
    setSubject('');
    setBody('');
    setScheduledAt(null);
  };

  const handleSend = async () => {
    if (!to) {
      toast.error('Introduce un destinatario');
      return;
    }
    if (channelType !== 'phone' && !body) {
      toast.error('Introduce un mensaje');
      return;
    }

    setIsSending(true);

    try {
      const commonParams = {
        contact_id: defaultContactId,
        client_id: defaultClientId,
        matter_id: defaultMatterId,
      };

      switch (channelType) {
        case 'email':
          await sendEmail.mutateAsync({
            to,
            subject,
            body,
            scheduled_at: scheduledAt?.toISOString(),
            ...commonParams,
          });
          toast.success('Email enviado correctamente');
          break;
        case 'sms':
          await sendSMS.mutateAsync({
            to,
            message: body,
            ...commonParams,
          });
          toast.success('SMS enviado correctamente');
          break;
        case 'whatsapp':
          await sendWhatsApp.mutateAsync({
            to,
            message: body,
            ...commonParams,
          });
          toast.success('WhatsApp enviado correctamente');
          break;
        case 'phone':
          await makeCall.mutateAsync({
            to,
            record: true,
            ...commonParams,
          });
          toast.success('Llamada iniciada');
          break;
        default:
          toast.error('Canal no soportado');
          return;
      }

      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast.error(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${config.color}20` }}
            >
              <ChannelIcon className="w-4 h-4" style={{ color: config.color }} />
            </div>
            {channelType === 'phone' ? 'Nueva llamada' : `Nuevo ${config.label}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Destinatario */}
          <div className="space-y-2">
            <Label htmlFor="to">Para</Label>
            <Input
              id="to"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder={config.placeholder}
            />
          </div>

          {/* Subject (solo email) */}
          {config.hasSubject && (
            <div className="space-y-2">
              <Label htmlFor="subject">Asunto</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Asunto del email"
              />
            </div>
          )}

          {/* Cuerpo (no para llamadas) */}
          {channelType !== 'phone' && (
            <div className="space-y-2">
              <Label htmlFor="body">Mensaje</Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={
                  channelType === 'sms' 
                    ? 'Máximo 160 caracteres' 
                    : 'Escribe tu mensaje...'
                }
                rows={channelType === 'email' ? 8 : 4}
              />
              {channelType === 'sms' && (
                <p className="text-xs text-muted-foreground">
                  {body.length}/160 caracteres
                </p>
              )}
            </div>
          )}

          {/* Programar (solo email) */}
          {channelType === 'email' && (
            <div className="flex items-center gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Clock className="w-4 h-4 mr-2" />
                    {scheduledAt 
                      ? format(scheduledAt, "d MMM 'a las' HH:mm", { locale: es })
                      : 'Programar envío'
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={scheduledAt || undefined}
                    onSelect={(date) => setScheduledAt(date || null)}
                    disabled={(date) => date < new Date()}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
              {scheduledAt && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setScheduledAt(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSend}
            disabled={isSending}
            style={{ backgroundColor: config.color }}
            className="text-white hover:opacity-90"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : channelType === 'phone' ? (
              <>
                <Phone className="w-4 h-4 mr-2" />
                Llamar
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Enviar
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ComposeMessageDialog;
