/**
 * StageLockModal — Informative modal for blocked stage moves
 */
import { Lock, AlertTriangle, ArrowRight, ExternalLink, type LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { KanbanDeadline } from "@/lib/kanban-utils";

function formatLegalDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function ModalIcon({
  bgClassName,
  iconClassName,
  Icon,
}: {
  bgClassName: string;
  iconClassName: string;
  Icon: LucideIcon;
}) {
  return (
    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${bgClassName}`}>
      <Icon className={`w-6 h-6 ${iconClassName}`} />
    </div>
  );
}

interface StageLockModalProps {
  open: boolean;
  type: string;
  message: string;
  matterId?: string;
  deadlines?: KanbanDeadline[];
  onClose: () => void;
}

const KNOWN_TYPES = ["matter_driven", "deadline_blocked", "forward_only", "requires_matter"];

export function StageLockModal({ open, type, message, matterId, deadlines, onClose }: StageLockModalProps) {
  const navigate = useNavigate();

  function handleViewMatter() {
    if (!matterId) return;
    onClose();
    navigate(`/app/matters/${matterId}`);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md p-6">
        {type === "matter_driven" && (
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <ModalIcon bgClassName="bg-blue-50" iconClassName="text-blue-600" Icon={Lock} />
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-foreground">
                  Etapa controlada por el expediente
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">No se puede mover manualmente</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">{message}</p>
            <p className="text-xs text-muted-foreground">
              IP-NEXUS sincroniza automáticamente tu pipeline comercial con el estado legal del expediente.
            </p>
            <div className="flex gap-2 justify-end">
              {matterId && (
                <Button variant="outline" size="sm" onClick={handleViewMatter}>
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                  Ver expediente
                </Button>
              )}
              <Button size="sm" onClick={onClose}>
                Entendido
              </Button>
            </div>
          </div>
        )}

        {type === "deadline_blocked" && (
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <ModalIcon bgClassName="bg-red-50" iconClassName="text-red-600" Icon={AlertTriangle} />
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-foreground">
                  Plazos vencidos bloquean el avance
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Resuelve los siguientes plazos para continuar
                </p>
              </div>
            </div>
            <div
              className="space-y-2 max-h-64 overflow-y-auto"
              style={{ scrollbarWidth: "thin" }}
            >
              {(deadlines ?? []).map((d, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-red-50 border border-red-100 rounded-lg px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate" title={d.title}>
                      {d.title}
                    </p>
                    <p className="text-xs text-red-600">
                      Venció el {formatLegalDate(d.deadline_date)}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-red-700 bg-red-100 border border-red-200 rounded-full px-1.5 py-0.5 shrink-0 ml-2">
                    {d.priority}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Plazos del expediente vinculado a este deal.</p>
            <div className="flex gap-2 justify-end">
              {matterId && (
                <Button variant="outline" size="sm" onClick={handleViewMatter}>
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                  Ir al expediente
                </Button>
              )}
              <Button size="sm" onClick={onClose}>
                Entendido
              </Button>
            </div>
          </div>
        )}

        {type === "forward_only" && (
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <ModalIcon bgClassName="bg-amber-50" iconClassName="text-amber-600" Icon={ArrowRight} />
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-foreground">No se puede retroceder</h3>
                <p className="text-sm text-muted-foreground mt-0.5">Este proceso solo avanza</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">{message}</p>
            <Button size="sm" className="ml-auto block" onClick={onClose}>
              Entendido
            </Button>
          </div>
        )}

        {type === "requires_matter" && (
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <ModalIcon bgClassName="bg-violet-50" iconClassName="text-violet-600" Icon={Lock} />
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-foreground">Expediente requerido</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Esta etapa necesita un expediente vinculado
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">{message}</p>
            <Button size="sm" className="ml-auto block" onClick={onClose}>
              Entendido
            </Button>
          </div>
        )}

        {!KNOWN_TYPES.includes(type) && (
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <ModalIcon bgClassName="bg-muted" iconClassName="text-muted-foreground" Icon={Lock} />
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-foreground">Movimiento no permitido</h3>
              </div>
            </div>
            <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
              {message || "No se puede realizar este movimiento."}
            </p>
            <Button size="sm" className="ml-auto block" onClick={onClose}>
              Entendido
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

StageLockModal.displayName = "StageLockModal";
