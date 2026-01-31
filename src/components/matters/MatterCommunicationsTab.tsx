/**
 * MatterCommunicationsTab - Pestaña de comunicaciones del expediente
 * Includes WhatsApp chat panel, email list, and communication actions
 */

import { useState } from 'react';
import { MatterCommunications } from './MatterCommunications';
import { WhatsAppChatPanel } from './WhatsAppChatPanel';
import { EmailComposeModal } from './EmailComposeModal';
import { LogCallModal } from './LogCallModal';
import { SendWhatsAppModal } from '@/components/features/crm/v2/SendWhatsAppModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, Mail, Phone, Plus } from 'lucide-react';

interface MatterCommunicationsTabProps {
  matterId: string;
  matterReference?: string;
  matterTitle?: string;
  clientId?: string | null;
  clientName?: string | null;
  clientEmail?: string | null;
  clientPhone?: string | null;
}

export function MatterCommunicationsTab({
  matterId,
  matterReference,
  matterTitle,
  clientId,
  clientName,
  clientEmail,
  clientPhone,
}: MatterCommunicationsTabProps) {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<{
    id: string;
    name: string;
    email?: string;
    phone?: string;
  } | undefined>();

  // Build contacts array from client info
  const contacts = clientId && clientName ? [
    {
      id: clientId,
      name: clientName,
      email: clientEmail || undefined,
      phone: clientPhone || undefined,
    }
  ] : [];

  const handleComposeEmail = (contact?: typeof selectedContact) => {
    setSelectedContact(contact);
    setShowEmailModal(true);
  };

  const handleCall = (contact?: typeof selectedContact) => {
    setSelectedContact(contact);
    setShowCallModal(true);
  };

  const handleWhatsApp = (contact?: typeof selectedContact) => {
    setSelectedContact(contact);
    setShowWhatsAppModal(true);
  };

  return (
    <>
      <Tabs defaultValue="whatsapp" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="whatsapp" className="gap-1.5">
              <MessageCircle className="h-4 w-4 text-[#25D366]" />
              WhatsApp
            </TabsTrigger>
            <TabsTrigger value="email" className="gap-1.5">
              <Mail className="h-4 w-4" />
              Emails
            </TabsTrigger>
            <TabsTrigger value="calls" className="gap-1.5">
              <Phone className="h-4 w-4" />
              Llamadas
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => handleWhatsApp()}>
              <MessageCircle className="h-4 w-4 mr-1.5 text-[#25D366]" />
              Nuevo WhatsApp
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleComposeEmail()}>
              <Mail className="h-4 w-4 mr-1.5" />
              Nuevo Email
            </Button>
          </div>
        </div>

        {/* WhatsApp Chat Panel */}
        <TabsContent value="whatsapp">
          <WhatsAppChatPanel
            matterId={matterId}
            matterReference={matterReference || matterTitle || matterId}
            clientId={clientId}
            clientName={clientName}
            clientPhone={clientPhone}
          />
        </TabsContent>

        {/* Email List */}
        <TabsContent value="email">
          <MatterCommunications
            matterId={matterId}
            matterTitle={matterTitle}
            contacts={contacts}
            onComposeEmail={handleComposeEmail}
            onCall={handleCall}
            onComposeWhatsApp={handleWhatsApp}
          />
        </TabsContent>

        {/* Calls */}
        <TabsContent value="calls">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Registro de Llamadas
                </CardTitle>
                <Button size="sm" onClick={() => handleCall()}>
                  <Plus className="h-4 w-4 mr-1" />
                  Registrar llamada
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <MatterCommunications
                matterId={matterId}
                matterTitle={matterTitle}
                contacts={contacts}
                onComposeEmail={handleComposeEmail}
                onCall={handleCall}
                onComposeWhatsApp={handleWhatsApp}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <EmailComposeModal
        open={showEmailModal}
        onOpenChange={setShowEmailModal}
        matterId={matterId}
        matterReference={matterReference}
        matterTitle={matterTitle}
        recipientEmail={selectedContact?.email || clientEmail || undefined}
        recipientName={selectedContact?.name || clientName || undefined}
      />

      <LogCallModal
        open={showCallModal}
        onOpenChange={setShowCallModal}
        matterId={matterId}
        contactName={selectedContact?.name || clientName || undefined}
      />

      <SendWhatsAppModal
        open={showWhatsAppModal}
        onOpenChange={setShowWhatsAppModal}
        contact={clientId && clientName ? {
          id: clientId,
          full_name: clientName,
          phone: clientPhone,
          whatsapp_phone: clientPhone,
        } : undefined}
        matterId={matterId}
        matterReference={matterReference}
      />
    </>
  );
}
