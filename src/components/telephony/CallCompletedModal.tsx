// ============================================================
// IP-NEXUS - Call Completed Modal Component
// ============================================================

import { useState } from "react";
import {
  CheckCircle2,
  Download,
  Paperclip,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RecordingPlayer } from "./RecordingPlayer";

interface CallCompletedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phone: string;
  name?: string;
  duration: number;
  minutesConsumed: number;
  notes: string;
  onNotesChange: (notes: string) => void;
  matterId?: string;
  onMatterChange: (matterId: string) => void;
  matters: Array<{ id: string; reference: string; title: string }>;
  recordingUrl?: string;
  onSave: (options: {
    createTask: boolean;
    taskTitle?: string;
    taskAssignee?: string;
    taskDueDate?: string;
  }) => Promise<void>;
  users: Array<{ id: string; full_name: string }>;
}

export function CallCompletedModal({
  open,
  onOpenChange,
  phone,
  name,
  duration,
  minutesConsumed,
  notes,
  onNotesChange,
  matterId,
  onMatterChange,
  matters,
  recordingUrl,
  onSave,
  users,
}: CallCompletedModalProps) {
  const [saving, setSaving] = useState(false);
  const [createTask, setCreateTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskAssignee, setTaskAssignee] = useState<string>("");
  const [taskDueDate, setTaskDueDate] = useState<string>("");

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        createTask,
        taskTitle: createTask ? taskTitle : undefined,
        taskAssignee: createTask ? taskAssignee : undefined,
        taskDueDate: createTask ? taskDueDate : undefined,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadRecording = () => {
    if (recordingUrl) {
      window.open(recordingUrl, "_blank");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Llamada finalizada</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Success header */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/30">
            <CheckCircle2 className="h-6 w-6 text-success" />
            <div>
              <p className="font-medium text-success">Llamada completada</p>
            </div>
          </div>

          {/* Call summary */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Contacto:</span>
              <span className="font-medium">{name || phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Teléfono:</span>
              <span>{phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duración:</span>
              <span className="font-medium">{formatDuration(duration)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Minutos consumidos:</span>
              <span className="font-medium">{minutesConsumed} min</span>
            </div>
          </div>

          <hr className="border-border" />

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notas:</Label>
            <Textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Resumen de la llamada..."
              className="min-h-[80px] resize-none"
            />
          </div>

          {/* Matter selector */}
          <div className="space-y-2">
            <Label>Expediente vinculado:</Label>
            <Select value={matterId || "none"} onValueChange={onMatterChange}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar expediente..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin vincular</SelectItem>
                {matters.map((matter) => (
                  <SelectItem key={matter.id} value={matter.id}>
                    {matter.reference} - {matter.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Follow-up task */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="createTask"
                checked={createTask}
                onCheckedChange={(checked) => setCreateTask(checked === true)}
              />
              <Label htmlFor="createTask" className="cursor-pointer">
                Crear tarea de seguimiento
              </Label>
            </div>

            {createTask && (
              <div className="space-y-3 pl-6 pt-2">
                <Input
                  placeholder="Título de la tarea..."
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Select value={taskAssignee} onValueChange={setTaskAssignee}>
                    <SelectTrigger>
                      <SelectValue placeholder="Asignar a..." />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Recording */}
          {recordingUrl && (
            <>
              <hr className="border-border" />
              <div className="space-y-3">
                <Label>Grabación:</Label>
                <RecordingPlayer url={recordingUrl} duration={duration} />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleDownloadRecording}>
                    <Download className="h-4 w-4 mr-1.5" />
                    Descargar
                  </Button>
                  {matterId && matterId !== "none" && (
                    <Button variant="outline" size="sm">
                      <Paperclip className="h-4 w-4 mr-1.5" />
                      Adjuntar a expediente
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Guardar y cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
