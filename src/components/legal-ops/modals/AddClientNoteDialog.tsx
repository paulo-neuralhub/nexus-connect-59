import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { useLogActivity } from "@/hooks/legal-ops/useActivityLog";

export function AddClientNoteDialog({
  open,
  onOpenChange,
  clientId,
  clientDisplayName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientDisplayName: string;
}) {
  const queryClient = useQueryClient();
  const logActivity = useLogActivity();
  const [title, setTitle] = useState("Nota");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle("Nota");
    setContent("");
  }, [open]);

  const submit = async () => {
    if (!content.trim()) return;

    try {
      await logActivity.mutateAsync({
        entityType: "client",
        entityId: clientId,
        clientId,
        action: "note",
        actionCategory: "note",
        title: title.trim() || "Nota",
        description: content.trim(),
        isInternal: true,
        metadata: { source: "client_360" },
      });

      // Refrescar timeline (la queryKey incluye filters variables, así que invalidamos por prefijo)
      queryClient.invalidateQueries({ queryKey: ["client-timeline", clientId] });

      toast.success(`Nota guardada en ${clientDisplayName}`);
      onOpenChange(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      toast.error("No se pudo guardar la nota", { description: msg });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nueva nota</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" />
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escribe la nota..."
            className="min-h-[180px]"
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={submit} disabled={!content.trim() || logActivity.isPending}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
