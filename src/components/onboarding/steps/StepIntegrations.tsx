/**
 * StepIntegrations - Optional integrations setup during onboarding
 * Email, Calendar, and future integrations
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Mail,
  Calendar,
  MessageSquare,
  Check,
  ArrowRight,
  ExternalLink,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepIntegrationsProps {
  data: Record<string, any>;
  updateData: (key: string, value: any) => void;
  organizationId: string;
  onSkip: () => void;
}

const INTEGRATIONS = [
  {
    id: 'email',
    name: 'Email',
    description: 'Conecta tu correo para enviar/recibir desde expedientes',
    icon: Mail,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    status: 'available',
    providers: [
      { id: 'gmail', name: 'Gmail / Google Workspace', icon: '📧' },
      { id: 'outlook', name: 'Outlook / Microsoft 365', icon: '📬' },
      { id: 'smtp', name: 'SMTP personalizado', icon: '⚙️' },
    ]
  },
  {
    id: 'calendar',
    name: 'Calendario',
    description: 'Sincroniza plazos y reuniones con tu calendario',
    icon: Calendar,
    color: 'text-green-500',
    bg: 'bg-green-500/10',
    status: 'available',
    providers: [
      { id: 'google', name: 'Google Calendar', icon: '📅' },
      { id: 'outlook', name: 'Outlook Calendar', icon: '📆' },
    ]
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    description: 'Envía y recibe WhatsApp vinculados a expedientes',
    icon: MessageSquare,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    status: 'coming_soon',
    providers: []
  },
];

export function StepIntegrations({ data, updateData, organizationId, onSkip }: StepIntegrationsProps) {
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);
  const [configuredIntegrations, setConfiguredIntegrations] = useState<string[]>(
    data.configuredIntegrations || []
  );

  const handleSelectProvider = (integrationId: string, providerId: string) => {
    // In a real app, this would initiate OAuth flow or show config modal
    const newConfigured = [...configuredIntegrations, integrationId];
    setConfiguredIntegrations(newConfigured);
    updateData('configuredIntegrations', newConfigured);
    updateData(`${integrationId}_provider`, providerId);
    setSelectedIntegration(null);
  };

  const integration = selectedIntegration 
    ? INTEGRATIONS.find(i => i.id === selectedIntegration) 
    : null;

  if (integration) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4", integration.bg)}>
            <integration.icon className={cn("h-8 w-8", integration.color)} />
          </div>
          <h2 className="text-xl font-semibold">Conectar {integration.name}</h2>
          <p className="text-muted-foreground text-sm">
            Selecciona tu proveedor
          </p>
        </div>

        <div className="space-y-3">
          {integration.providers.map((provider) => (
            <Card
              key={provider.id}
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => handleSelectProvider(integration.id, provider.id)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <span className="text-2xl">{provider.icon}</span>
                <div className="flex-1">
                  <p className="font-medium">{provider.name}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Button 
          variant="ghost" 
          className="w-full"
          onClick={() => setSelectedIntegration(null)}
        >
          Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold">Integraciones</h2>
        <p className="text-muted-foreground text-sm">
          Conecta tus herramientas favoritas (opcional)
        </p>
      </div>

      <div className="space-y-3">
        {INTEGRATIONS.map((int) => {
          const isConfigured = configuredIntegrations.includes(int.id);
          const isComingSoon = int.status === 'coming_soon';
          
          return (
            <Card
              key={int.id}
              className={cn(
                "transition-colors",
                isConfigured && "border-success",
                !isComingSoon && !isConfigured && "cursor-pointer hover:border-primary"
              )}
              onClick={() => {
                if (!isComingSoon && !isConfigured) {
                  setSelectedIntegration(int.id);
                }
              }}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", int.bg)}>
                  <int.icon className={cn("h-6 w-6", int.color)} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{int.name}</p>
                    {isConfigured && (
                      <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                        <Check className="h-3 w-3 mr-1" />
                        Conectado
                      </Badge>
                    )}
                    {isComingSoon && (
                      <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
                        <Clock className="h-3 w-3 mr-1" />
                        Próximamente
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{int.description}</p>
                </div>
                {!isComingSoon && !isConfigured && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Puedes configurar integraciones en cualquier momento desde Configuración
      </p>
    </div>
  );
}
