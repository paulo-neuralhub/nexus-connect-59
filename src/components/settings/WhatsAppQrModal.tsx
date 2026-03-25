/**
 * WhatsApp QR Connection Modal — 2 steps: GDPR warning + QR scan
 */
import { useState, useEffect, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/organization-context";
import { useAuth } from "@/contexts/auth-context";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Smartphone, ShieldCheck, AlertTriangle, QrCode, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface WhatsAppQrModalProps {
  open: boolean;
  onClose: () => void;
}

export function WhatsAppQrModal({ open, onClose }: WhatsAppQrModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Reset step when opening
  useEffect(() => {
    if (open) setStep(1);
  }, [open]);

  // Simulate connection
  const simulateMutation = useMutation({
    mutationFn: async () => {
      const client: any = supabase;
      const { error } = await client
        .from("whatsapp_sessions")
        .upsert({
          organization_id: currentOrganization?.id,
          user_id: user?.id,
          session_type: "qr",
          phone_number: "+34 666 000 000",
          display_name: "Demo WhatsApp",
          status: "connected",
          last_connected_at: new Date().toISOString(),
        }, { onConflict: "organization_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-session-status"] });
      toast.success("WhatsApp conectado");
      onClose();
    },
    onError: (e: any) => toast.error(e.message || "Error al simular conexión"),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-primary" />
            {step === 1 ? "Conectar WhatsApp" : "Escanea el código QR"}
          </DialogTitle>
        </DialogHeader>

        {step === 1 ? (
          <GdprStep onContinue={() => setStep(2)} onCancel={onClose} />
        ) : (
          <QrStep onSimulate={() => simulateMutation.mutate()} isPending={simulateMutation.isPending} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function GdprStep({ onContinue, onCancel }: { onContinue: () => void; onCancel: () => void }) {
  return (
    <div className="space-y-4">
      <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
        <AlertTriangle className="w-4 h-4 text-amber-600" />
        <AlertDescription className="text-sm">
          <strong>AVISO IMPORTANTE — Lee antes de continuar</strong>
        </AlertDescription>
      </Alert>

      <p className="text-sm text-muted-foreground">
        La conexión por QR vincula tu número de WhatsApp. Ten en cuenta:
      </p>

      <div className="space-y-3 text-sm">
        <div className="flex gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
          <span>Solo se procesarán mensajes de contactos registrados en tu CRM. Los demás serán ignorados.</span>
        </div>
        <div className="flex gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
          <span>Los mensajes se almacenan cifrados y solo tú y los admins pueden verlos.</span>
        </div>
        <div className="flex gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
          <span>Puedes desconectar en cualquier momento desde Configuración.</span>
        </div>
      </div>

      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <AlertDescription className="text-xs text-muted-foreground">
          ⚠️ Para uso en producción recomendamos la API oficial de WhatsApp Business,
          que usa un número de empresa dedicado, no tu número personal.
        </AlertDescription>
      </Alert>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button onClick={onContinue}>Entendido, continuar →</Button>
      </div>
    </div>
  );
}

function QrStep({ onSimulate, isPending }: { onSimulate: () => void; isPending: boolean }) {
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const resetTimer = useCallback(() => setTimeLeft(60), []);

  return (
    <div className="space-y-5">
      <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
        <li>Abre WhatsApp en tu móvil</li>
        <li>Ve a ⋮ → Dispositivos vinculados</li>
        <li>Toca "Vincular dispositivo"</li>
        <li>Escanea este código:</li>
      </ol>

      {/* QR placeholder */}
      <div className="flex justify-center">
        <div className="w-60 h-60 border-2 border-dashed border-muted-foreground/20 rounded-2xl flex items-center justify-center bg-muted/30 relative">
          <QrCode className="w-24 h-24 text-muted-foreground/30" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">IP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Countdown */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>⏱️ Código válido por {timeLeft} segundos</span>
          <span>{timeLeft}s</span>
        </div>
        <Progress value={(timeLeft / 60) * 100} className="h-1.5" />
      </div>

      {/* Waiting animation */}
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary/40"></span>
        </span>
        Esperando escaneo...
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="ghost" size="sm" onClick={resetTimer} disabled={timeLeft > 0}>
          <RefreshCw className="w-4 h-4 mr-1" /> Generar nuevo QR
        </Button>
        <Button variant="outline" size="sm" onClick={onSimulate} disabled={isPending}>
          {isPending ? "Conectando..." : "Simular conexión"}
        </Button>
      </div>
    </div>
  );
}
