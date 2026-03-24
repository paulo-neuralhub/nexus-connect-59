/**
 * WonDealMatterModal — When a deal is moved to a won stage,
 * prompt user to create/link a matter if none exists.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Briefcase, Link2, SkipForward } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  dealId: string;
  dealName: string;
  accountId?: string | null;
  dealType?: string | null;
}

export function WonDealMatterModal({ open, onClose, dealId, dealName, accountId, dealType }: Props) {
  const navigate = useNavigate();

  const handleCreateMatter = () => {
    onClose();
    // Navigate to new matter form with pre-filled data
    const params = new URLSearchParams();
    params.set("title", dealName);
    if (accountId) params.set("client_id", accountId);
    if (dealType) {
      // Map deal types to matter types
      const typeMap: Record<string, string> = {
        trademark_registration: "trademark",
        patent_prosecution: "patent",
        design_registration: "design",
        trademark: "trademark",
        patent: "patent",
        design: "design",
      };
      const matterType = typeMap[dealType] ?? "";
      if (matterType) params.set("type", matterType);
    }
    params.set("deal_id", dealId);
    navigate(`/app/expedientes/nuevo?${params.toString()}`);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🎉 Deal ganado
          </DialogTitle>
          <DialogDescription>
            <strong>{dealName}</strong> ha sido cerrado exitosamente.
            ¿Deseas crear un expediente de PI vinculado?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <Button
            className="w-full justify-start gap-3 h-auto py-3"
            onClick={handleCreateMatter}
          >
            <Briefcase className="w-5 h-5" />
            <div className="text-left">
              <p className="font-semibold">Crear expediente</p>
              <p className="text-xs opacity-80">
                Nuevo expediente con datos pre-rellenados del deal
              </p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-3"
            onClick={onClose}
          >
            <SkipForward className="w-5 h-5" />
            <div className="text-left">
              <p className="font-semibold">Omitir</p>
              <p className="text-xs text-muted-foreground">
                No crear expediente por ahora
              </p>
            </div>
          </Button>
        </div>

        <DialogFooter className="sm:justify-start">
          <p className="text-[11px] text-muted-foreground">
            Puedes vincular un expediente más tarde desde el detalle del deal.
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
