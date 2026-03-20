/**
 * CRM Account Detail — Tab: Portfolio PI
 * Shows matters/IP cases linked to this account
 */

import { useNavigate } from "react-router-dom";
import { useMattersV2 } from "@/hooks/use-matters-v2";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Plus } from "lucide-react";
import { format } from "date-fns";

interface Props {
  accountId: string;
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  active: { label: "Activo", variant: "default" },
  pending: { label: "Pendiente", variant: "secondary" },
  closed: { label: "Cerrado", variant: "secondary" },
  cancelled: { label: "Cancelado", variant: "destructive" },
};

export function AccountPortfolioTab({ accountId }: Props) {
  const navigate = useNavigate();
  const { data: matters = [], isLoading } = useMattersV2({ client_id: accountId });

  if (isLoading) {
    return <div className="animate-pulse space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded-lg" />)}</div>;
  }

  if (!matters.length) {
    return (
      <div className="text-center py-12">
        <Briefcase className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
        <p className="text-muted-foreground mb-4">Sin expedientes de PI registrados</p>
        <Button size="sm" onClick={() => navigate("/app/expedientes/nuevo")}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo expediente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm text-muted-foreground">{matters.length} expediente(s)</h3>
        <Button size="sm" variant="outline" onClick={() => navigate("/app/expedientes/nuevo")}>
          <Plus className="w-4 h-4 mr-1" /> Nuevo
        </Button>
      </div>

      <Card>
        <CardContent className="p-0 divide-y">
          {matters.map((m: any) => {
            const st = STATUS_MAP[m.status] ?? { label: m.status, variant: "secondary" as const };
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => navigate(`/app/expedientes/${m.id}`)}
                className="w-full p-4 text-left hover:bg-muted/50 transition-colors flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Briefcase className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-xs text-muted-foreground">{m.reference || m.matter_number}</span>
                    <Badge variant={st.variant} className="text-[10px]">{st.label}</Badge>
                  </div>
                  <p className="font-medium truncate text-sm">{m.title}</p>
                </div>
                <div className="text-right text-xs text-muted-foreground shrink-0">
                  <p>{m.jurisdiction_primary}</p>
                  <p>{format(new Date(m.created_at), "dd/MM/yyyy")}</p>
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
