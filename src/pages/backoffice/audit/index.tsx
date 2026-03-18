// ============================================================
// IP-NEXUS BACKOFFICE - FULL AUDIT & COMPLIANCE PAGE
// ============================================================

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AuditLogViewer, 
  SecurityAlertsDashboard, 
  ComplianceChecksDashboard,
  GdprDashboard,
  RetentionPoliciesPanel 
} from '@/components/features/audit';
import { FileText, Shield, CheckCircle2, UserCheck, Clock } from 'lucide-react';

export default function BackofficeAuditPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Auditoría y Compliance</h1>
        <p className="text-muted-foreground">
          Centro de control de auditoría, seguridad y cumplimiento normativo
        </p>
      </div>

      <Tabs defaultValue="logs" className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full max-w-3xl">
          <TabsTrigger value="logs" className="gap-2">
            <FileText className="h-4 w-4" />
            Logs
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            Seguridad
          </TabsTrigger>
          <TabsTrigger value="compliance" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Compliance
          </TabsTrigger>
          <TabsTrigger value="gdpr" className="gap-2">
            <UserCheck className="h-4 w-4" />
            GDPR
          </TabsTrigger>
          <TabsTrigger value="retention" className="gap-2">
            <Clock className="h-4 w-4" />
            Retención
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logs">
          <AuditLogViewer />
        </TabsContent>

        <TabsContent value="security">
          <SecurityAlertsDashboard />
        </TabsContent>

        <TabsContent value="compliance">
          <ComplianceChecksDashboard />
        </TabsContent>

        <TabsContent value="gdpr">
          <GdprDashboard />
        </TabsContent>

        <TabsContent value="retention">
          <RetentionPoliciesPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
