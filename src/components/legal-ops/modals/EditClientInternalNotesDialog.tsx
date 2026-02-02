import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/organization-context";
import { toast } from "sonner";

export function EditClientInternalNotesDialog({
  open,
  onOpenChange,
  clientId,
  initialNotes,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  initialNotes: string;
}) {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setNotes(initialNotes);
  }, [open, initialNotes]);

  const save = async () => {
    if (!currentOrganization?.id) {
      toast.error("No hay organización activa");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("crm_accounts")
        .update({ internal_notes: notes || null })
        .eq("id", clientId)
        .eq("organization_id", currentOrganization.id);

      if (error) throw error;

      toast.success("Notas internas guardadas");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["client-detail", clientId] }),
        queryClient.invalidateQueries({ queryKey: ["crm-account", currentOrganization.id, clientId] }),
      ]);
      onOpenChange(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      toast.error("No se pudo guardar", { description: msg });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Notas internas</DialogTitle>
        </DialogHeader>

        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Escribe notas internas del cliente..."
          className="min-h-[200px]"
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={save} disabled={saving}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
