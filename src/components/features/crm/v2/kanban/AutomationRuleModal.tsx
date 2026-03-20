// ============================================================
// IP-NEXUS — Automation Rule creation modal (2-step)
// ============================================================

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateAutomationRule } from "@/hooks/crm/v2/automations";
import { ChevronLeft, ChevronRight, Zap } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  stageId: string;
  pipelineId?: string;
}

const TRIGGERS = [
  { value: "stage_entered", label: "Al entrar en esta etapa", icon: "⚡" },
  { value: "stage_time_elapsed", label: "Al llevar X días aquí sin actividad", icon: "⏱️" },
  { value: "deal_won", label: "Al marcarse como ganado (mandato firmado)", icon: "🏆" },
  { value: "deal_lost", label: "Al marcarse como perdido", icon: "❌" },
  { value: "deadline_approaching", label: "Cuando hay un plazo IP próximo", icon: "📅" },
] as const;

const ACTIONS = [
  { value: "create_task", label: "Crear tarea", icon: "📋" },
  { value: "create_activity", label: "Registrar actividad en timeline", icon: "📝" },
  { value: "send_notification", label: "Notificar al equipo", icon: "🔔" },
  { value: "generate_document", label: "Generar documento (POA / Carta mandato)", icon: "📄" },
  { value: "ai_suggest", label: "Activar IP-CoPilot", icon: "🤖" },
] as const;

export function AutomationRuleModal({ open, onClose, stageId, pipelineId }: Props) {
  const createRule = useCreateAutomationRule();
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 state
  const [triggerType, setTriggerType] = useState("stage_entered");
  const [triggerDays, setTriggerDays] = useState("7");
  const [deadlineDays, setDeadlineDays] = useState("60");
  const [deadlineType, setDeadlineType] = useState("renewal");

  // Step 2 state
  const [actionType, setActionType] = useState("create_task");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDaysDue, setTaskDaysDue] = useState("3");
  const [activityDescription, setActivityDescription] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [docTemplate, setDocTemplate] = useState("power_of_attorney");
  const [aiSuggestionType, setAiSuggestionType] = useState("follow_up");
  const [aiPriority, setAiPriority] = useState("high");
  const [ruleName, setRuleName] = useState("");

  function reset() {
    setStep(1);
    setTriggerType("stage_entered");
    setTriggerDays("7");
    setDeadlineDays("60");
    setDeadlineType("renewal");
    setActionType("create_task");
    setTaskTitle("");
    setTaskDaysDue("3");
    setActivityDescription("");
    setNotificationMessage("");
    setDocTemplate("power_of_attorney");
    setAiSuggestionType("follow_up");
    setAiPriority("high");
    setRuleName("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  function buildTriggerConfig(): Record<string, unknown> {
    if (triggerType === "stage_time_elapsed") return { days: parseInt(triggerDays) || 7 };
    if (triggerType === "deadline_approaching") return { days_before: parseInt(deadlineDays) || 60, deadline_type: deadlineType };
    return {};
  }

  function buildActionConfig(): Record<string, unknown> {
    switch (actionType) {
      case "create_task":
        return { title: taskTitle || "Tarea automática", assignee: "responsible", days_due: parseInt(taskDaysDue) || 3 };
      case "create_activity":
        return { description: activityDescription, activity_type: "note" };
      case "send_notification":
        return { message: notificationMessage };
      case "generate_document":
        return { template: docTemplate, notify_responsible: true };
      case "ai_suggest":
        return { suggestion_type: aiSuggestionType, priority: aiPriority };
      default:
        return {};
    }
  }

  function generateName(): string {
    if (ruleName) return ruleName;
    const triggerLabel = TRIGGERS.find((t) => t.value === triggerType)?.label ?? triggerType;
    const actionLabel = ACTIONS.find((a) => a.value === actionType)?.label ?? actionType;
    return `${triggerLabel} → ${actionLabel}`;
  }

  async function handleSave() {
    await createRule.mutateAsync({
      name: generateName(),
      stage_id: stageId,
      pipeline_id: pipelineId ?? null,
      trigger_type: triggerType,
      trigger_config: buildTriggerConfig(),
      action_type: actionType,
      action_config: buildActionConfig(),
      is_active: true,
    });
    handleClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Nueva automatización
          </DialogTitle>
          <DialogDescription>
            Paso {step} de 2 — {step === 1 ? "¿Cuándo ocurre?" : "¿Qué hacer?"}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-4 py-2">
            <RadioGroup value={triggerType} onValueChange={setTriggerType} className="space-y-2">
              {TRIGGERS.map((t) => (
                <label
                  key={t.value}
                  className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:bg-muted/50 transition-colors data-[state=checked]:border-primary"
                >
                  <RadioGroupItem value={t.value} />
                  <span className="text-lg">{t.icon}</span>
                  <span className="text-sm">{t.label}</span>
                </label>
              ))}
            </RadioGroup>

            {triggerType === "stage_time_elapsed" && (
              <div className="flex items-center gap-2 pl-10">
                <Label className="text-sm text-muted-foreground">Días sin actividad:</Label>
                <Input
                  type="number"
                  min="1"
                  max="365"
                  value={triggerDays}
                  onChange={(e) => setTriggerDays(e.target.value)}
                  className="w-20"
                />
              </div>
            )}

            {triggerType === "deadline_approaching" && (
              <div className="space-y-2 pl-10">
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-muted-foreground">Días antes:</Label>
                  <Input
                    type="number"
                    min="1"
                    max="365"
                    value={deadlineDays}
                    onChange={(e) => setDeadlineDays(e.target.value)}
                    className="w-20"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-muted-foreground">Tipo plazo:</Label>
                  <Select value={deadlineType} onValueChange={setDeadlineType}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="renewal">Renovación</SelectItem>
                      <SelectItem value="opposition">Oposición</SelectItem>
                      <SelectItem value="annuity">Anualidad</SelectItem>
                      <SelectItem value="office_action">Oficio de examen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <RadioGroup value={actionType} onValueChange={setActionType} className="space-y-2">
              {ACTIONS.map((a) => (
                <label
                  key={a.value}
                  className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <RadioGroupItem value={a.value} />
                  <span className="text-lg">{a.icon}</span>
                  <span className="text-sm">{a.label}</span>
                </label>
              ))}
            </RadioGroup>

            {/* Action-specific config */}
            {actionType === "create_task" && (
              <div className="space-y-3 pl-10">
                <div>
                  <Label className="text-xs">Título de la tarea</Label>
                  <Input
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="Ej: Preparar POA para {{account_name}}"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Plazo:</Label>
                  <Input
                    type="number"
                    min="1"
                    value={taskDaysDue}
                    onChange={(e) => setTaskDaysDue(e.target.value)}
                    className="w-20"
                  />
                  <span className="text-xs text-muted-foreground">días</span>
                </div>
              </div>
            )}

            {actionType === "create_activity" && (
              <div className="pl-10">
                <Label className="text-xs">Descripción</Label>
                <Textarea
                  value={activityDescription}
                  onChange={(e) => setActivityDescription(e.target.value)}
                  placeholder="Descripción de la actividad a registrar"
                  rows={2}
                />
              </div>
            )}

            {actionType === "send_notification" && (
              <div className="pl-10">
                <Label className="text-xs">Mensaje de notificación</Label>
                <Textarea
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  placeholder="Ej: Deal requiere atención urgente"
                  rows={2}
                />
              </div>
            )}

            {actionType === "generate_document" && (
              <div className="pl-10">
                <Label className="text-xs">Template de documento</Label>
                <Select value={docTemplate} onValueChange={setDocTemplate}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="power_of_attorney">Power of Attorney (POA)</SelectItem>
                    <SelectItem value="engagement_letter">Carta de mandato</SelectItem>
                    <SelectItem value="cease_desist">Cese y desistimiento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {actionType === "ai_suggest" && (
              <div className="space-y-3 pl-10">
                <div>
                  <Label className="text-xs">Tipo de sugerencia</Label>
                  <Select value={aiSuggestionType} onValueChange={setAiSuggestionType}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="follow_up">Seguimiento de propuesta</SelectItem>
                      <SelectItem value="reengagement">Reactivación de cliente</SelectItem>
                      <SelectItem value="renewal_opportunity">Oportunidad de renovación</SelectItem>
                      <SelectItem value="upsell">Upsell de servicios</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Prioridad</Label>
                  <Select value={aiPriority} onValueChange={setAiPriority}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="low">Baja</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Rule name override */}
            <div className="pl-10 pt-2">
              <Label className="text-xs">Nombre de la regla (opcional)</Label>
              <Input
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                placeholder={generateName()}
              />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === 2 && (
            <Button variant="outline" onClick={() => setStep(1)} className="gap-1">
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          {step === 1 ? (
            <Button onClick={() => setStep(2)} className="gap-1">
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={createRule.isPending} className="gap-1">
              <Zap className="w-4 h-4" />
              Guardar automatización
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
