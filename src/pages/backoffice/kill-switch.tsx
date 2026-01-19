// src/pages/backoffice/kill-switch.tsx
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Power, 
  AlertTriangle, 
  Brain, 
  CreditCard, 
  Zap,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  History,
  Bell
} from 'lucide-react';
import { toast } from 'sonner';

interface EmergencyAction {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  severity: 'critical' | 'warning' | 'info';
  isActive: boolean;
}

const emergencyActions: EmergencyAction[] = [
  {
    id: 'pause_all',
    label: 'PAUSAR TODO',
    description: 'Detiene toda la plataforma. Muestra página de mantenimiento.',
    icon: Power,
    severity: 'critical',
    isActive: false
  },
  {
    id: 'pause_ai',
    label: 'PAUSAR IA',
    description: 'Desactiva todas las funciones de IA. App sigue funcionando.',
    icon: Brain,
    severity: 'warning',
    isActive: false
  },
  {
    id: 'pause_payments',
    label: 'PAUSAR PAGOS',
    description: 'Detiene cobros automáticos y renovaciones.',
    icon: CreditCard,
    severity: 'warning',
    isActive: false
  },
  {
    id: 'degraded_mode',
    label: 'MODO DEGRADADO',
    description: 'Solo funciones críticas. Sin IA, sin marketing, sin analytics.',
    icon: Zap,
    severity: 'info',
    isActive: false
  }
];

const incidentHistory = [
  {
    id: '1',
    date: '2026-01-15 14:30',
    action: 'PAUSAR IA',
    reason: 'Anthropic API outage',
    duration: '45 min',
    resolvedBy: 'Sistema automático'
  },
  {
    id: '2',
    date: '2025-12-20 09:15',
    action: 'MODO DEGRADADO',
    reason: 'Mantenimiento programado',
    duration: '2 horas',
    resolvedBy: 'Admin'
  }
];

export default function KillSwitchPage() {
  const [actions, setActions] = useState(emergencyActions);
  const [notificationSettings, setNotificationSettings] = useState({
    sendEmail: true,
    showBanner: true,
    sendSms: false
  });
  const [customMessage, setCustomMessage] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');

  const handleToggleAction = (actionId: string) => {
    const action = actions.find(a => a.id === actionId);
    if (!action) return;

    if (!action.isActive) {
      // Activating - show confirmation
      return;
    }

    // Deactivating
    setActions(prev => prev.map(a => 
      a.id === actionId ? { ...a, isActive: false } : a
    ));
    toast.success(`${action.label} desactivado`);
  };

  const confirmActivation = (actionId: string) => {
    const action = actions.find(a => a.id === actionId);
    if (!action) return;

    setActions(prev => prev.map(a => 
      a.id === actionId ? { ...a, isActive: true } : a
    ));
    toast.warning(`${action.label} ACTIVADO`, {
      description: 'Los usuarios han sido notificados'
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500 hover:bg-red-600';
      case 'warning':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'info':
        return 'bg-blue-500 hover:bg-blue-600';
      default:
        return 'bg-gray-500';
    }
  };

  const activeActions = actions.filter(a => a.isActive);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-destructive">
            <Power className="h-6 w-6" />
            Kill Switch
          </h1>
          <p className="text-muted-foreground">
            Panel de emergencia para control crítico del sistema
          </p>
        </div>
        <Badge variant={activeActions.length > 0 ? 'destructive' : 'secondary'} className="text-lg px-4 py-2">
          {activeActions.length > 0 ? (
            <>
              <AlertTriangle className="h-4 w-4 mr-2" />
              {activeActions.length} ACCIÓN(ES) ACTIVA(S)
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              TODO OPERATIVO
            </>
          )}
        </Badge>
      </div>

      {/* Active Alerts Banner */}
      {activeActions.length > 0 && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              <div>
                <p className="font-semibold text-destructive">Acciones de emergencia activas:</p>
                <div className="flex gap-2 mt-2">
                  {activeActions.map(action => (
                    <Badge key={action.id} variant="destructive">
                      {action.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Emergency Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Acciones de Emergencia
          </CardTitle>
          <CardDescription>
            Controles críticos para situaciones de emergencia
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {actions.map((action) => (
            <div 
              key={action.id} 
              className={`p-4 border rounded-lg ${action.isActive ? 'border-destructive bg-destructive/5' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                    action.isActive ? 'bg-destructive text-destructive-foreground' : 'bg-muted'
                  }`}>
                    <action.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold">{action.label}</p>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </div>
                </div>
                
                {action.isActive ? (
                  <Button 
                    variant="outline" 
                    onClick={() => handleToggleAction(action.id)}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Desactivar
                  </Button>
                ) : (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className={getSeverityColor(action.severity)}>
                        Activar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                          <AlertTriangle className="h-5 w-5" />
                          Confirmar: {action.label}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {action.description}
                          <br /><br />
                          Esta acción afectará a todos los usuarios de la plataforma.
                          ¿Estás seguro de que deseas continuar?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          className={getSeverityColor(action.severity)}
                          onClick={() => confirmActivation(action.id)}
                        >
                          Confirmar Activación
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificación a Usuarios
          </CardTitle>
          <CardDescription>
            Configuración de notificaciones cuando se activa una emergencia
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="sendEmail" 
              checked={notificationSettings.sendEmail}
              onCheckedChange={(checked) => 
                setNotificationSettings(prev => ({ ...prev, sendEmail: !!checked }))
              }
            />
            <Label htmlFor="sendEmail">Enviar email a todos los usuarios afectados</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="showBanner" 
              checked={notificationSettings.showBanner}
              onCheckedChange={(checked) => 
                setNotificationSettings(prev => ({ ...prev, showBanner: !!checked }))
              }
            />
            <Label htmlFor="showBanner">Mostrar banner en la app</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="sendSms" 
              checked={notificationSettings.sendSms}
              onCheckedChange={(checked) => 
                setNotificationSettings(prev => ({ ...prev, sendSms: !!checked }))
              }
            />
            <Label htmlFor="sendSms">Enviar SMS (solo enterprise)</Label>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="customMessage">Mensaje personalizado</Label>
            <Textarea 
              id="customMessage"
              placeholder="Estamos realizando mantenimiento para mejorar el servicio..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimatedTime">Tiempo estimado de resolución</Label>
            <Input 
              id="estimatedTime"
              placeholder="ej: 2 horas"
              value={estimatedTime}
              onChange={(e) => setEstimatedTime(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Incident History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historial de Incidencias
          </CardTitle>
          <CardDescription>
            Registro de activaciones anteriores del Kill Switch
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {incidentHistory.map((incident) => (
              <div key={incident.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{incident.action}</p>
                    <p className="text-sm text-muted-foreground">{incident.reason}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm">{incident.date}</p>
                  <p className="text-sm text-muted-foreground">
                    Duración: {incident.duration} • {incident.resolvedBy}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
