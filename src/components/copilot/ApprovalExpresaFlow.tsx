// ============================================================
// Trust Architecture — Approval Expresa Flow (Phase 2 — UI only)
// ============================================================

import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Lock } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  actionTitle: string;
  actionDescription: string;
  userEmail?: string;
}

export function ApprovalExpresaFlow({
  open,
  onClose,
  actionTitle,
  actionDescription,
  userEmail,
}: Props) {
  const [checked, setChecked] = useState(false);
  const [name, setName] = useState("");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[640px] relative overflow-hidden">
        {/* Phase 2 overlay */}
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-100 border border-neutral-300 mb-2">
            <Lock className="w-4 h-4 text-neutral-500" />
            <span className="text-[13px] font-semibold text-neutral-600">Próximamente</span>
          </div>
          <p className="text-[12px] text-neutral-500 max-w-[280px] text-center">
            La aprobación expresa estará disponible en la próxima versión de IP-NEXUS.
          </p>
        </div>

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[18px]">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Aprobación Expresa Requerida
          </DialogTitle>
          <DialogDescription className="text-[13px] text-neutral-600 mt-1">
            GENIUS ha preparado una acción que requiere tu aprobación explícita antes de ejecutarse.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Action summary */}
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
            <h4 className="text-[14px] font-semibold text-[#0F1729] mb-1">{actionTitle}</h4>
            <p className="text-[13px] text-neutral-700">{actionDescription}</p>
          </div>

          {/* Approval form */}
          <div className="space-y-3">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
                className="mt-0.5 rounded border-neutral-300"
              />
              <span className="text-[13px] text-neutral-700">
                Yo he revisado y apruebo esta acción
              </span>
            </label>

            <div>
              <label className="text-[12px] font-medium text-neutral-600 block mb-1">
                📝 Nombre y nº colegiado
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: María García López — Col. 12345"
                className="w-full text-[13px] border border-neutral-200 rounded-md px-3 py-2 focus:outline-none focus:border-blue-400"
              />
            </div>

            <div className="flex items-center gap-2 text-[12px] text-neutral-500">
              <span>⏰ {new Date().toLocaleString("es-ES")}</span>
            </div>

            {userEmail && (
              <p className="text-[12px] text-neutral-400">
                📧 Se enviará confirmación a {userEmail}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button disabled={!checked || !name.trim()}>
            Aprobar y Ejecutar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
