// ============================================================
// IP-NEXUS - Call In Progress Modal Component
// ============================================================

import { useState, useEffect, useRef } from "react";
import { Phone, PhoneOff, Mic, MicOff, Pause, Play, Circle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface CallInProgressModalProps {
  open: boolean;
  phone: string;
  name?: string;
  isRecording?: boolean;
  onHangUp: () => void;
  onToggleMute: () => void;
  onTogglePause: () => void;
  isMuted: boolean;
  isPaused: boolean;
  notes: string;
  onNotesChange: (notes: string) => void;
}

export function CallInProgressModal({
  open,
  phone,
  name,
  isRecording = false,
  onHangUp,
  onToggleMute,
  onTogglePause,
  isMuted,
  isPaused,
  notes,
  onNotesChange,
}: CallInProgressModalProps) {
  const [duration, setDuration] = useState(0);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (open) {
      startTimeRef.current = Date.now();
      setDuration(0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const interval = setInterval(() => {
      if (!isPaused) {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [open, isPaused]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2 text-success">
            <Phone className="h-5 w-5 animate-pulse" />
            LLAMADA EN CURSO
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Contact info */}
          <div className="text-center space-y-1">
            <p className="text-xl font-semibold">{name || "Contacto"}</p>
            <p className="text-muted-foreground">{phone}</p>
          </div>

          {/* Duration */}
          <div className="text-center">
            <p className="text-4xl font-mono font-bold tabular-nums">
              {formatDuration(duration)}
            </p>
            {isRecording && (
              <div className="flex items-center justify-center gap-1.5 mt-2 text-destructive">
                <Circle className="h-3 w-3 fill-current animate-pulse" />
                <span className="text-sm font-medium">Grabando</span>
              </div>
            )}
          </div>

          {/* Call controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={onToggleMute}
              className={cn(
                "h-14 w-14 rounded-full p-0",
                isMuted && "bg-warning/20 border-warning text-warning"
              )}
              title={isMuted ? "Activar micrófono" : "Silenciar"}
            >
              {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={onTogglePause}
              className={cn(
                "h-14 w-14 rounded-full p-0",
                isPaused && "bg-warning/20 border-warning text-warning"
              )}
              title={isPaused ? "Reanudar" : "Pausar"}
            >
              {isPaused ? <Play className="h-6 w-6" /> : <Pause className="h-6 w-6" />}
            </Button>

            <Button
              variant="destructive"
              size="lg"
              onClick={onHangUp}
              className="h-14 w-14 rounded-full p-0"
              title="Colgar"
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Notas de llamada:</Label>
            <Textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Escribe notas durante la llamada..."
              className="min-h-[100px] resize-none"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
