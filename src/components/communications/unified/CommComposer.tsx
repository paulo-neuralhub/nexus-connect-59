// ============================================================
// IP-NEXUS — Composer with Email / WhatsApp / SMS tabs
// ============================================================

import { useState } from 'react';
import { Mail, MessageCircle, MessageSquare, Send, Paperclip, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useSendEmail, useSendWhatsApp, useWhatsAppWindow } from '@/hooks/communications';
import type { CommThread, CommTenantConfig } from '@/types/communications';

type Tab = 'email' | 'whatsapp' | 'sms';

interface Props {
  thread: CommThread;
  config: CommTenantConfig | null | undefined;
}

export function CommComposer({ thread, config }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>(thread.channel === 'whatsapp' ? 'whatsapp' : 'email');
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState(thread.subject || '');
  const [emailBody, setEmailBody] = useState('');
  const [isLegallyCritical, setIsLegallyCritical] = useState(false);
  const [waText, setWaText] = useState('');
  const [smsText, setSmsText] = useState('');

  const sendEmail = useSendEmail();
  const sendWhatsApp = useSendWhatsApp();

  // Get WA phone from thread participants
  const waPhone = thread.participants?.find(p => p.phone)?.phone || null;
  const { data: waWindow } = useWhatsAppWindow(activeTab === 'whatsapp' ? waPhone : null);

  const tabs: { key: Tab; icon: React.ElementType; label: string; enabled: boolean }[] = [
    { key: 'email', icon: Mail, label: 'Email', enabled: true },
    { key: 'whatsapp', icon: MessageCircle, label: 'WhatsApp', enabled: config?.whatsapp_enabled ?? false },
    { key: 'sms', icon: MessageSquare, label: 'SMS', enabled: config?.sms_enabled ?? false },
  ];

  const handleSendEmail = () => {
    if (!emailTo || !emailBody) return;
    sendEmail.mutate({
      thread_id: thread.id,
      matter_id: thread.matter_id || undefined,
      to: emailTo.split(',').map(s => s.trim()),
      subject: emailSubject,
      body_html: `<p>${emailBody.replace(/\n/g, '<br/>')}</p>`,
      is_legally_critical: isLegallyCritical,
    }, {
      onSuccess: () => {
        setEmailBody('');
      }
    });
  };

  const handleSendWhatsApp = () => {
    if (!waPhone || !waText) return;
    sendWhatsApp.mutate({
      thread_id: thread.id,
      matter_id: thread.matter_id || undefined,
      to_phone: waPhone,
      message_type: 'text',
      text: waText,
    }, {
      onSuccess: () => setWaText(''),
    });
  };

  return (
    <div className="border-t bg-card">
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-4 pt-2">
        {tabs.filter(t => t.enabled).map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-t-md text-xs font-medium transition-colors',
              activeTab === key
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Email composer */}
      {activeTab === 'email' && (
        <div className="p-4 space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Para: email@ejemplo.com"
              value={emailTo}
              onChange={e => setEmailTo(e.target.value)}
              className="h-8 text-sm flex-1"
            />
            <Input
              placeholder="Asunto"
              value={emailSubject}
              onChange={e => setEmailSubject(e.target.value)}
              className="h-8 text-sm flex-1"
            />
          </div>
          <Textarea
            placeholder="Escribe tu mensaje..."
            value={emailBody}
            onChange={e => setEmailBody(e.target.value)}
            className="min-h-[80px] text-sm resize-none"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Paperclip className="h-4 w-4" />
              </Button>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                <Switch
                  checked={isLegallyCritical}
                  onCheckedChange={setIsLegallyCritical}
                  className="scale-75"
                />
                <Shield className="h-3 w-3" />
                Legalmente crítico
              </label>
            </div>
            <Button
              size="sm"
              onClick={handleSendEmail}
              disabled={!emailTo || !emailBody || sendEmail.isPending}
            >
              <Send className="h-3.5 w-3.5 mr-1.5" />
              Enviar
            </Button>
          </div>
        </div>
      )}

      {/* WhatsApp composer */}
      {activeTab === 'whatsapp' && (
        <div className="p-4 space-y-2">
          {/* Window status banner */}
          {waWindow?.open ? (
            <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 dark:bg-green-900/20 px-2.5 py-1.5 rounded-md">
              ✅ Ventana activa — puedes enviar texto libre
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1.5 rounded-md">
              ⚠️ Ventana expirada — solo templates HSM disponibles
            </div>
          )}

          {waWindow?.open ? (
            <div className="flex gap-2">
              <Textarea
                placeholder="Mensaje WhatsApp..."
                value={waText}
                onChange={e => setWaText(e.target.value)}
                className="min-h-[60px] text-sm resize-none flex-1"
                maxLength={4096}
              />
              <Button
                size="icon"
                className="self-end h-9 w-9"
                onClick={handleSendWhatsApp}
                disabled={!waText || sendWhatsApp.isPending}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="text-center py-4 text-sm text-muted-foreground">
              Selecciona un template aprobado para reabrir la conversación
            </div>
          )}

          {waText.length > 0 && (
            <p className="text-[10px] text-muted-foreground text-right">
              {waText.length}/4096
            </p>
          )}
        </div>
      )}

      {/* SMS composer */}
      {activeTab === 'sms' && (
        <div className="p-4 space-y-2">
          <div className="flex gap-2">
            <Textarea
              placeholder="Mensaje SMS (max 160 chars)..."
              value={smsText}
              onChange={e => setSmsText(e.target.value)}
              className="min-h-[60px] text-sm resize-none flex-1"
              maxLength={480}
            />
            <Button size="icon" className="self-end h-9 w-9" disabled={!smsText}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground text-right">
            {smsText.length}/160 chars ({Math.ceil(smsText.length / 160) || 0} SMS)
          </p>
        </div>
      )}
    </div>
  );
}
