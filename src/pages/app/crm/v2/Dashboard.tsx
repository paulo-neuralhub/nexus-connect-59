import { useMemo } from "react";
import { usePageTitle } from "@/contexts/page-context";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Users, Building2, CheckSquare, Percent } from "lucide-react";
import { useCRMDashboardKPIs } from "@/hooks/crm/v2/dashboard";

export default function CRMV2Dashboard() {
  usePageTitle("CRM");

  const { data, isLoading } = useCRMDashboardKPIs();

  const cards = useMemo(() => {
    const kpis = data;
    if (!kpis) return [];
    return [
      {
        label: "Cuentas",
        value: kpis.total_accounts,
        icon: Building2,
      },
      {
        label: "Contactos",
        value: kpis.total_contacts,
        icon: Users,
      },
      {
        label: "Pipeline (€)",
        value: Math.round(kpis.total_pipeline_value).toLocaleString("es-ES"),
        icon: TrendingUp,
      },
      {
        label: "Tareas pendientes",
        value: kpis.pending_tasks,
        icon: CheckSquare,
      },
      {
        label: "Win rate",
        value: `${kpis.win_rate}%`,
        icon: Percent,
      },
    ];
  }, [data]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">CRM V2</h1>
        <p className="text-muted-foreground">Visión global (Accounts · Contacts · Deals · Interactions · Tasks)</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <c.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold truncate">{c.value}</p>
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
