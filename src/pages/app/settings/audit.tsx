// ============================================================
// IP-NEXUS APP - AUDIT LOGS PAGE (Settings)
// ============================================================

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AuditLogViewer, 
  SecurityAlertsDashboard, 
  RetentionPoliciesPanel 
} from '@/components/features/audit';
import { FileText, Shield, Clock } from 'lucide-react';

export default function AuditSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Auditoría y Seguridad</h1>
        <p className="text-muted-foreground">
          Logs de actividad, alertas de seguridad y políticas de retención
        </p>
      </div>

      <Tabs defaultValue="logs" className="space-y-6">
        <TabsList>
          <TabsTrigger value="logs" className="gap-2">
            <FileText className="h-4 w-4" />
            Logs de Auditoría
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            Alertas de Seguridad
          </TabsTrigger>
          <TabsTrigger value="retention" className="gap-2">
            <Clock className="h-4 w-4" />
            Retención de Datos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logs">
          <AuditLogViewer />
        </TabsContent>

        <TabsContent value="security">
          <SecurityAlertsDashboard />
        </TabsContent>

        <TabsContent value="retention">
          <RetentionPoliciesPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
