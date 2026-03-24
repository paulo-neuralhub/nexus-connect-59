// @ts-nocheck
import { useQuery } from "@tanstack/react-query";
import { fromTable } from "@/lib/supabase";
import { useOrganization } from "@/hooks/useOrganization";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardList, ChevronRight, CheckCircle2, Circle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  trademark_registration: "Marca",
  patent_application: "Patente",
  renewal: "Renovación",
  opposition: "Oposición",
  surveillance: "Vigilancia",
  assignment: "Cesión",
  design: "Diseño",
  other: "Otro",
};

interface Props {
  accountId: string;
  accountName: string;
}

export function AccountInstructionsTab({ accountId, accountName }: Props) {
  const { organizationId } = useOrganization();

  const { data: instructions = [], isLoading } = useQuery({
    queryKey: ["account-instructions", accountId],
    queryFn: async () => {
      const { data, error } = await fromTable("bulk_instructions")
        .select(`*, items:bulk_instruction_items(*)`)
        .eq("crm_account_id", accountId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!accountId && !!organizationId,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (instructions.length === 0) {
    return (
      <div className="text-center py-12">
        <ClipboardList className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
        <h3 className="text-sm font-medium text-muted-foreground">
          Sin instrucciones
        </h3>
        <p className="text-xs text-muted-foreground/70 mt-1">
          No hay instrucciones registradas para {accountName}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {instructions.map((instr: any) => {
        const executed = instr.executed_count || 0;
        const total = instr.total_targets || instr.items?.length || 0;
        const progress = total > 0 ? Math.round((executed / total) * 100) : 0;

        return (
          <div
            key={instr.id}
            className={cn(
              "border rounded-lg p-4 hover:shadow-sm transition-shadow",
              instr.is_urgent ? "border-l-4 border-l-amber-400" : "border-l-4 border-l-muted"
            )}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    {TYPE_LABELS[instr.instruction_type] || instr.instruction_type}
                  </Badge>
                  {instr.is_urgent && (
                    <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700">
                      URGENTE
                    </Badge>
                  )}
                  <span className="text-sm font-semibold">{instr.title}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>
                    {instr.created_at
                      ? formatDistanceToNow(new Date(instr.created_at), {
                          addSuffix: true,
                          locale: es,
                        })
                      : ""}
                  </span>
                  <span>·</span>
                  <span>
                    {executed}/{total} ejecutadas
                  </span>
                  <span>·</span>
                  <span className="capitalize">{instr.status || "draft"}</span>
                </div>
                {/* Progress bar */}
                {total > 0 && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="h-1.5 flex-1 max-w-[120px] bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          progress >= 100
                            ? "bg-green-500"
                            : progress > 50
                            ? "bg-amber-500"
                            : "bg-primary"
                        )}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{progress}%</span>
                  </div>
                )}
              </div>
              <Button variant="ghost" size="sm" className="text-xs gap-1">
                Ver detalle <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
