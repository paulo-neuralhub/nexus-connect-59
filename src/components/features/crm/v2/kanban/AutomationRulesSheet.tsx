// ============================================================
// IP-NEXUS — Automation Rules Sheet for Kanban column
// ============================================================

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Zap, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useCRMAutomationRules,
  useCRMAutomationExecutions,
  useUpdateAutomationRule,
  useDeleteAutomationRule,
  type AutomationRule,
} from "@/hooks/crm/v2/automations";
import { AutomationRuleModal } from "./AutomationRuleModal";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const TRIGGER_LABELS: Record<string, string> = {
  stage_entered: "Al entrar en esta etapa",
  stage_time_elapsed: "Tiempo sin actividad",
  deal_won: "Deal ganado (mandato firmado)",
  deal_lost: "Deal perdido",
  deadline_approaching: "Plazo IP próximo",
  call_completed: "Llamada completada",
};

const ACTION_LABELS: Record<string, string> = {
  create_task: "Crear tarea",
  create_activity: "Registrar actividad",
  send_notification: "Notificar al equipo",
  generate_document: "Generar documento",
  ai_suggest: "Activar IP-CoPilot",
};

const TRIGGER_ICONS: Record<string, string> = {
  stage_entered: "⚡",
  stage_time_elapsed: "⏱️",
  deal_won: "🏆",
  deal_lost: "❌",
  deadline_approaching: "📅",
  call_completed: "📞",
};

interface Props {
  open: boolean;
  onClose: () => void;
  stageId: string;
  stageName: string;
  pipelineId?: string;
}

export function AutomationRulesSheet({ open, onClose, stageId, stageName, pipelineId }: Props) {
  const { data: rules = [], isLoading } = useCRMAutomationRules({ stage_id: stageId });
  const { data: globalRules = [] } = useCRMAutomationRules({ pipeline_id: pipelineId });
  const { data: executions = [] } = useCRMAutomationExecutions({ limit: 5 });
  const updateRule = useUpdateAutomationRule();
  const deleteRule = useDeleteAutomationRule();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Combine stage-specific + global rules (no duplicates)
  const stageRuleIds = new Set(rules.map((r) => r.id));
  const globalOnlyRules = globalRules.filter(
    (r) => !stageRuleIds.has(r.id) && !r.stage_id && (r.trigger_type === "deal_won" || r.trigger_type === "deal_lost")
  );
  const allRules = [...rules, ...globalOnlyRules];

  // Filter executions for this stage's rules
  const ruleIds = new Set(allRules.map((r) => r.id));
  const stageExecutions = executions.filter((e) => ruleIds.has(e.rule_id));

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent className="w-[420px] sm:max-w-[420px] p-0 flex flex-col">
          <SheetHeader className="p-6 pb-4">
            <SheetTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Automatizaciones — {stageName}
            </SheetTitle>
            <SheetDescription>
              Reglas que se ejecutan automáticamente para deals en esta etapa.
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1 px-6">
            {/* Rules list */}
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-muted/50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : allRules.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                  <Zap className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">Sin automatizaciones</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Crea una regla para automatizar acciones en esta etapa.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {allRules.map((rule) => (
                  <RuleCard
                    key={rule.id}
                    rule={rule}
                    onToggle={(active) => updateRule.mutate({ id: rule.id, data: { is_active: active } })}
                    onDelete={() => deleteRule.mutate(rule.id)}
                    isGlobal={!rule.stage_id}
                  />
                ))}
              </div>
            )}

            {/* Recent executions */}
            {stageExecutions.length > 0 && (
              <>
                <Separator className="my-5" />
                <div className="mb-4">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    Historial reciente
                  </h4>
                  <div className="space-y-2">
                    {stageExecutions.map((exec) => (
                      <div
                        key={exec.id}
                        className="flex items-start gap-2 text-xs text-muted-foreground"
                      >
                        {exec.status === "success" ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-destructive mt-0.5 flex-shrink-0" />
                        )}
                        <span>
                          {exec.rule?.name ?? "Regla"} —{" "}
                          {formatDistanceToNow(new Date(exec.executed_at), { addSuffix: true, locale: es })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t">
            <Button
              className="w-full gap-2"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="w-4 h-4" />
              Nueva automatización para esta etapa
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <AutomationRuleModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        stageId={stageId}
        pipelineId={pipelineId}
      />
    </>
  );
}

// ── Rule card ──

function RuleCard({
  rule,
  onToggle,
  onDelete,
  isGlobal,
}: {
  rule: AutomationRule;
  onToggle: (active: boolean) => void;
  onDelete: () => void;
  isGlobal: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-3 transition-colors",
        rule.is_active ? "bg-background border-border" : "bg-muted/30 border-muted opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-base">{TRIGGER_ICONS[rule.trigger_type] ?? "⚡"}</span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{rule.name}</p>
            {rule.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{rule.description}</p>
            )}
          </div>
        </div>
        <Switch
          checked={rule.is_active}
          onCheckedChange={onToggle}
          className="flex-shrink-0"
        />
      </div>

      <div className="flex items-center gap-2 mt-2.5 flex-wrap">
        <Badge variant="outline" className="text-[10px] gap-1">
          {TRIGGER_LABELS[rule.trigger_type] ?? rule.trigger_type}
        </Badge>
        <span className="text-muted-foreground text-[10px]">→</span>
        <Badge variant="secondary" className="text-[10px] gap-1">
          {ACTION_LABELS[rule.action_type] ?? rule.action_type}
        </Badge>
        {isGlobal && (
          <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">
            Global
          </Badge>
        )}
      </div>

      <div className="flex items-center justify-between mt-2.5">
        <span className="text-[10px] text-muted-foreground">
          {rule.execution_count > 0
            ? `${rule.execution_count} ejecuciones`
            : "Sin ejecuciones"}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
