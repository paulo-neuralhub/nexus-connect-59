/**
 * StageConfirmModal v2 — Confirmation modal with checklist + mandatory notes
 */
import { useState, useEffect, useRef } from "react";
import { CheckSquare, Square } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ChecklistItem } from "@/lib/kanban-utils";

interface StageConfirmModalProps {
  open: boolean;
  message: string;
  lockType: string;
  targetStageName?: string;
  checklist?: ChecklistItem[];
  onConfirm: ((notes: string) => void) | null;
  onCancel: () => void;
}

export function StageConfirmModal({
  open, message, lockType, targetStageName,
  checklist, onConfirm, onCancel,
}: StageConfirmModalProps) {
  const [notes, setNotes] = useState("");
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});
  const [isConfirming, setIsConfirming] = useState(false);

  const mountedRef = useRef(true);
  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (open) {
      setChecklistState({});
      setNotes("");
      setIsConfirming(false);
    }
  }, [open]);

  const hasChecklist = Array.isArray(checklist) && checklist.length > 0;
  const isNotesRequired = lockType === "confirm";

  const allRequiredChecked =
    !hasChecklist || checklist!.every((item) => !item.required || checklistState[item.id]);
  const notesValid = !isNotesRequired || notes.trim().length >= 10;
  const canConfirm = allRequiredChecked && notesValid && !isConfirming;

  async function handleConfirm() {
    if (!canConfirm || !onConfirm) return;
    setIsConfirming(true);
    try {
      await onConfirm(notes.trim());
    } finally {
      if (mountedRef.current) {
        setIsConfirming(false);
        setNotes("");
        setChecklistState({});
      }
    }
  }

  function toggleChecklist(id: string) {
    setChecklistState((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && !isConfirming) onCancel();
      }}
    >
      <DialogContent
        onInteractOutside={(e) => { if (isConfirming) e.preventDefault(); }}
        onEscapeKeyDown={(e) => { if (isConfirming) e.preventDefault(); }}
        className="max-w-md"
      >
        <DialogHeader>
          <DialogTitle>
            {targetStageName ? `Mover a "${targetStageName}"` : "Confirmar cambio de etapa"}
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">{message}</p>

        {hasChecklist && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Confirma los siguientes puntos:</p>
            {checklist!.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleChecklist(item.id)}
                className={`w-full flex items-start gap-2.5 text-left p-2.5 rounded-lg border transition-colors cursor-pointer ${
                  checklistState[item.id]
                    ? "bg-green-50 border-green-200"
                    : "bg-muted/30 border-border hover:bg-muted/50"
                }`}
              >
                {checklistState[item.id] ? (
                  <CheckSquare className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                )}
                <span className="text-sm text-foreground">
                  {item.label}
                  {item.required && <span className="text-red-500 ml-0.5">*</span>}
                </span>
              </button>
            ))}
          </div>
        )}

        {isNotesRequired && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Notas <span className="text-muted-foreground">(obligatorio, mín. 10 caracteres)</span>
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Añade una nota (mínimo 10 caracteres)..."
              className="text-sm resize-none"
              rows={3}
              disabled={isConfirming}
            />
            <div className="flex justify-between items-center">
              {notes.length > 0 && notes.trim().length < 10 && (
                <p className="text-xs text-destructive">Mínimo 10 caracteres</p>
              )}
              <p className="text-xs text-muted-foreground ml-auto">{notes.length}/10 mín.</p>
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isConfirming} className="flex-1">
            Cancelar
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={!canConfirm} className="flex-1">
            {isConfirming ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin inline-block" />
                Procesando...
              </span>
            ) : (
              "Confirmar y mover"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

StageConfirmModal.displayName = "StageConfirmModal";
