// ============================================================
// IP-NEXUS APP - COMPLIANCE PAGE (Settings)
// ============================================================

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ComplianceChecksDashboard, 
  GdprDashboard 
} from '@/components/features/audit';
import { Shield, UserCheck } from 'lucide-react';

export default function ComplianceSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Cumplimiento Normativo</h1>
        <p className="text-muted-foreground">
          Gestión de controles de compliance y solicitudes GDPR
        </p>
      </div>

      <Tabs defaultValue="checks" className="space-y-6">
        <TabsList>
          <TabsTrigger value="checks" className="gap-2">
            <Shield className="h-4 w-4" />
            Controles de Compliance
          </TabsTrigger>
          <TabsTrigger value="gdpr" className="gap-2">
            <UserCheck className="h-4 w-4" />
            GDPR / Privacidad
          </TabsTrigger>
        </TabsList>

        <TabsContent value="checks">
          <ComplianceChecksDashboard />
        </TabsContent>

        <TabsContent value="gdpr">
          <GdprDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
