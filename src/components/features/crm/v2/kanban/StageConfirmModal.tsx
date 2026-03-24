/**
 * StageConfirmModal — shown when dragging a deal to a 'confirm' lock_type stage
 */
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
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void;
  stageName: string;
  lockMessage: string | null;
  isPending?: boolean;
};

export function StageConfirmModal({ open, onClose, onConfirm, stageName, lockMessage, isPending }: Props) {
  const [note, setNote] = useState("");

  function handleConfirm() {
    onConfirm(note.trim());
    setNote("");
  }

  function handleClose() {
    setNote("");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Confirmar cambio de etapa
          </DialogTitle>
          <DialogDescription>
            Vas a mover a: <strong>"{stageName}"</strong>
          </DialogDescription>
        </DialogHeader>

        {lockMessage && (
          <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
            {lockMessage}
          </p>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Notas <span className="text-muted-foreground">(obligatorio, mín. 10 caracteres)</span>
          </label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Añade una nota sobre este cambio..."
            rows={3}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          <Button
            onClick={handleConfirm}
            disabled={note.trim().length < 10 || isPending}
          >
            Confirmar y mover →
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
