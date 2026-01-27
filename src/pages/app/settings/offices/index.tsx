// ============================================================
// PÁGINA DE OFICINAS - SOLO LECTURA
// ============================================================
// Los tenants VEN las oficinas de PI y su nivel de automatización.
// Las oficinas incluidas en su plan se muestran con acceso.
// Las demás se muestran atenuadas con opción de upgrade.
// ❌ NO hay botones de "Añadir", "Configurar" ni "Cancelar".
// ============================================================

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Crown, Loader2, CheckCircle2, Lock, TrendingUp } from "lucide-react";
import { useTenantOffices, type TenantOffice } from "@/hooks/useTenantOffices";
import { useOrganization } from "@/contexts/organization-context";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { AutomationBadge } from "@/components/offices/AutomationBadge";

export default function MyOfficesPage() {
  const { currentOrganization } = useOrganization();
  const { myOffices, lockedOffices, offices, isLoading } = useTenantOffices();

  const plan = currentOrganization?.plan || 'starter';
  const planDisplayName: Record<string, string> = {
    'starter': 'Starter',
    'free': 'Free',
    'professional': 'Professional',
    'basico': 'Básico',
    'business': 'Business',
    'enterprise': 'Enterprise',
    'empresarial': 'Empresarial',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Oficinas de Propiedad Intelectual</h1>
        <p className="text-muted-foreground mt-1">
          Nivel de automatización e integración con oficinas mundiales
        </p>
      </div>

      {/* Plan Info */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Tu plan actual</p>
              <p className="font-semibold text-lg">{planDisplayName[plan] || plan}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Oficinas incluidas</p>
              <p className="font-semibold text-lg">{myOffices.length} de {offices.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Offices with Access */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            Incluidas en tu plan
          </CardTitle>
          <CardDescription>
            Estas oficinas están incluidas en tu suscripción {planDisplayName[plan] || plan}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {myOffices.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">
              Tu plan actual no incluye oficinas. Considera un upgrade para acceder.
            </p>
          ) : (
            myOffices.map((office) => (
              <OfficeCard key={office.id} office={office} />
            ))
          )}
        </CardContent>
      </Card>

      {/* Locked Offices */}
      {lockedOffices.length > 0 && (
        <Card className="border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-muted-foreground">
              <Lock className="h-5 w-5" />
              Más oficinas disponibles
            </CardTitle>
            <CardDescription>
              Upgrade tu plan para acceder a más jurisdicciones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {lockedOffices.map((office) => (
              <OfficeCard key={office.id} office={office} locked />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Enterprise Upsell */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Crown className="h-6 w-6 text-primary" />
              <div>
                <p className="font-medium">Con Enterprise todas las oficinas incluidas</p>
                <p className="text-sm text-muted-foreground">Acceso ilimitado a todas las jurisdicciones</p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link to="/app/settings/billing">
                <TrendingUp className="h-4 w-4 mr-2" />
                Comparar planes
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// OFFICE CARD COMPONENT - SOLO LECTURA
// ============================================================

interface OfficeCardProps {
  office: TenantOffice;
  locked?: boolean;
}

function OfficeCard({ office, locked = false }: OfficeCardProps) {
  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'operational': return '🟢';
      case 'degraded': return '🟡';
      case 'maintenance': return '🔵';
      case 'down': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <div 
      className={cn(
        "flex items-center justify-between p-4 border rounded-lg transition-colors",
        locked ? "bg-background opacity-60" : "bg-muted/30"
      )}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Flag */}
        <span className="text-2xl flex-shrink-0">{office.flag_emoji || '🌐'}</span>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">{office.name_short || office.code}</span>
            {office.automation_level && (
              <AutomationBadge 
                level={office.automation_level} 
                percentage={office.automation_percentage ?? 0}
                capabilities={office.capabilities}
              />
            )}
            {!locked && (
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800">
                ✓ Incluida
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate">{office.name}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
            <span>
              Estado: {getStatusIcon(office.operational_status)} {office.operational_status || 'N/A'}
            </span>
            {office.region && <span>• {office.region}</span>}
          </div>
        </div>
      </div>

      {/* Automation Progress Bar */}
      <div className="w-24 flex-shrink-0 ml-4">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-muted-foreground">Auto</span>
          <span className="font-medium">{office.automation_percentage ?? 0}%</span>
        </div>
        <Progress 
          value={office.automation_percentage ?? 0} 
          className="h-2"
        />
      </div>

      {/* NO ACTION BUTTONS - SOLO LECTURA */}
    </div>
  );
}
