/**
 * IPSoftphone — Floating softphone widget
 * Position: fixed bottom-right, above NexusGuide (bottom-24)
 * Minimizable to circular button
 */
import { useState, useCallback, useEffect, useRef } from "react";
import {
  Phone, PhoneOff, Mic, MicOff, Pause, Play,
  Minus, X, ChevronDown, Clock, Wallet, AlertCircle,
  User, Briefcase, FileText, Delete,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useTelephony, type CallMetadata } from "@/hooks/telephony/useTelephony";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/organization-context";
import { toast } from "sonner";

// Simple event bus for opening softphone with pre-dialed number
let _openCallback: ((number?: string, meta?: CallMetadata) => void) | null = null;

export function openSoftphone(number?: string, meta?: CallMetadata) {
  _openCallback?.(number, meta);
}

// ── Dial pad digits ──
const DIAL_PAD = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["*", "0", "#"],
];

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function formatBalance(amount: number | null): string {
  if (amount === null) return "—";
  return `€${amount.toFixed(2)}`;
}

export function IPSoftphone() {
  const {
    deviceStatus, callStatus, currentCall, callDuration,
    balance, error, isMockMode,
    initialize, makeCall, hangUp, toggleMute, toggleHold, sendDigit, refreshBalance,
  } = useTelephony();

  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [dialNumber, setDialNumber] = useState("");
  const [showDialpad, setShowDialpad] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isHeld, setIsHeld] = useState(false);

  // Pre-dial metadata from CRM
  const [callMeta, setCallMeta] = useState<CallMetadata>({});

  // Post-call form
  const [showPostCall, setShowPostCall] = useState(false);
  const [callOutcome, setCallOutcome] = useState("answered");
  const [callNotes, setCallNotes] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [linkMatterId, setLinkMatterId] = useState("");

  // Register open callback
  useEffect(() => {
    _openCallback = (number?: string, meta?: CallMetadata) => {
      setIsOpen(true);
      setIsMinimized(false);
      if (number) setDialNumber(number);
      if (meta) setCallMeta(meta);
    };
    return () => { _openCallback = null; };
  }, []);

  // Initialize on first open
  useEffect(() => {
    if (isOpen && deviceStatus === "offline") {
      initialize();
    }
  }, [isOpen, deviceStatus, initialize]);

  // Show post-call form when call ends
  useEffect(() => {
    if (callStatus === "ended" && currentCall) {
      setShowPostCall(true);
    }
  }, [callStatus, currentCall]);

  // ── Handlers ──
  const handleDial = useCallback(
    async () => {
      if (!dialNumber.trim()) return;
      const number = dialNumber.startsWith("+") ? dialNumber : `+${dialNumber}`;
      await makeCall(number, callMeta);
    },
    [dialNumber, makeCall, callMeta]
  );

  const handleDigitPress = useCallback((digit: string) => {
    if (callStatus === "idle") {
      setDialNumber((n) => n + digit);
    } else {
      sendDigit(digit);
    }
  }, [callStatus, sendDigit]);

  const handleBackspace = useCallback(() => {
    setDialNumber((n) => n.slice(0, -1));
  }, []);

  const handleMute = useCallback(() => {
    toggleMute();
    setIsMuted((m) => !m);
  }, [toggleMute]);

  const handleHold = useCallback(() => {
    toggleHold();
    setIsHeld((h) => !h);
  }, [toggleHold]);

  const handleHangUp = useCallback(() => {
    hangUp();
  }, [hangUp]);

  // Save post-call activity to CRM
  const handleSaveActivity = useCallback(async () => {
    if (!currentCall || !orgId) {
      setShowPostCall(false);
      return;
    }

    try {
      const durationMins = Math.ceil(callDuration / 60);
      const outcomeLabel =
        callOutcome === "answered" ? "Contestó" :
        callOutcome === "no_answer" ? "No contestó" :
        callOutcome === "voicemail" ? "Buzón de voz" :
        callOutcome === "busy" ? "Ocupado" : callOutcome;

      await supabase.from("crm_activities").insert({
        organization_id: orgId,
        account_id: currentCall.accountId || null,
        contact_id: currentCall.contactId || null,
        deal_id: currentCall.dealId || null,
        activity_type: "call",
        subject: `📞 Llamada saliente — ${outcomeLabel}`,
        description: callNotes || `Llamada a ${currentCall.toNumber} — ${durationMins} min — ${outcomeLabel}`,
        outcome: outcomeLabel,
        next_action: nextAction || null,
        duration_minutes: durationMins,
        activity_date: currentCall.startedAt.toISOString(),
        call_id: currentCall.cdrId || null,
        created_by: (await supabase.auth.getUser()).data.user?.id || null,
      });

      // If matter linked, update CDR
      if (linkMatterId && currentCall.cdrId) {
        await supabase
          .from("telephony_cdrs")
          .update({ matter_id: linkMatterId })
          .eq("id", currentCall.cdrId);
      }

      toast.success("Actividad registrada");
    } catch (e) {
      console.error("Error saving activity:", e);
      toast.error("Error al guardar actividad");
    }

    // Reset
    setShowPostCall(false);
    setCallOutcome("answered");
    setCallNotes("");
    setNextAction("");
    setLinkMatterId("");
    setCallMeta({});
  }, [currentCall, orgId, callDuration, callOutcome, callNotes, nextAction, linkMatterId]);

  // ── Status colors ──
  const statusConfig = {
    idle: { color: "bg-muted", textColor: "text-muted-foreground", label: "Listo", dot: "bg-muted-foreground" },
    calling: { color: "bg-blue-500/10", textColor: "text-blue-600", label: "Marcando...", dot: "bg-blue-500 animate-pulse" },
    ringing: { color: "bg-amber-500/10", textColor: "text-amber-600", label: "Llamando...", dot: "bg-amber-500 animate-pulse" },
    "in-progress": { color: "bg-emerald-500/10", textColor: "text-emerald-600", label: "En llamada", dot: "bg-emerald-500" },
    ended: { color: "bg-muted", textColor: "text-muted-foreground", label: "Finalizada", dot: "bg-muted-foreground" },
    error: { color: "bg-destructive/10", textColor: "text-destructive", label: "Error", dot: "bg-destructive" },
  };

  const status = statusConfig[callStatus] || statusConfig.idle;
  const isInCall = callStatus === "in-progress" || callStatus === "calling" || callStatus === "ringing";

  // ── MINIMIZED: circular button ──
  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-24 z-40",
          "flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg",
          "transition-all hover:scale-105",
          deviceStatus === "ready"
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        )}
        title="Abrir teléfono"
      >
        <Phone className="h-5 w-5" />
        {isInCall && (
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary/70 animate-pulse" />
        )}
      </button>
    );
  }

  if (isMinimized) {
    return (
      <button
        type="button"
        onClick={() => setIsMinimized(false)}
        className={cn(
          "fixed bottom-6 right-24 z-40",
          "flex items-center gap-2 rounded-2xl px-4 py-3 shadow-lg",
          "transition-all hover:scale-105",
          isInCall ? "bg-primary text-primary-foreground" : "bg-card text-card-foreground border"
        )}
      >
        <Phone className="h-4 w-4" />
        {isInCall && (
          <>
            <span className="text-sm font-mono">{formatDuration(callDuration)}</span>
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
          </>
        )}
      </button>
    );
  }

  // ── FULL WIDGET ──
  return (
    <div className="fixed bottom-6 right-24 z-40 w-80 rounded-2xl border bg-card shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">IP-NEXUS Phone</span>
          {isMockMode && (
            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">MOCK</Badge>
          )}
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsMinimized(true)}>
            <Minus className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsOpen(false)}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Status bar */}
      <div className={cn("px-4 py-2 flex items-center justify-between text-xs", status.color)}>
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", status.dot)} />
          <span className={cn("font-medium", status.textColor)}>{status.label}</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Wallet className="h-3 w-3" />
          <span>{formatBalance(balance)}</span>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="px-4 py-2 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="h-3 w-3 shrink-0" />
          <span className="truncate">{error}</span>
        </div>
      )}

      {/* Post-call form */}
      {showPostCall && currentCall ? (
        <div className="p-4 space-y-3">
          <div className="text-sm font-medium">Resumen de llamada</div>
          <div className="text-xs text-muted-foreground">
            {currentCall.toNumber} — {formatDuration(callDuration)}
            {currentCall.accountName && ` — ${currentCall.accountName}`}
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Resultado</Label>
            <Select value={callOutcome} onValueChange={setCallOutcome}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="answered">✅ Contestó</SelectItem>
                <SelectItem value="no_answer">📵 No contestó</SelectItem>
                <SelectItem value="voicemail">📧 Buzón de voz</SelectItem>
                <SelectItem value="busy">🔴 Ocupado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Notas</Label>
            <Textarea
              className="text-xs min-h-[60px] resize-none"
              placeholder="Resumen de la conversación..."
              value={callNotes}
              onChange={(e) => setCallNotes(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Próxima acción</Label>
            <Input
              className="h-8 text-xs"
              placeholder="Ej: Enviar propuesta de renovación"
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 text-xs h-8"
              onClick={handleSaveActivity}
            >
              Guardar actividad
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs h-8"
              onClick={() => {
                setShowPostCall(false);
                setCallMeta({});
              }}
            >
              Omitir
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Number display */}
          <div className="px-4 pt-3 pb-1">
            <div className="relative">
              <Input
                value={dialNumber}
                onChange={(e) => setDialNumber(e.target.value)}
                placeholder="+34 912 345 678"
                className="text-center text-lg font-mono h-11 pr-10"
                disabled={isInCall}
              />
              {dialNumber && !isInCall && (
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                >
                  <Delete className="h-4 w-4" />
                </button>
              )}
            </div>
            {/* CRM context */}
            {(callMeta.accountName || currentCall?.accountName) && (
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground justify-center">
                <User className="h-3 w-3" />
                <span>{callMeta.accountName || currentCall?.accountName}</span>
              </div>
            )}
          </div>

          {/* In-call controls */}
          {isInCall && (
            <div className="px-4 py-3 space-y-3">
              {/* Timer */}
              <div className="flex items-center justify-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-2xl font-mono font-semibold text-primary">
                  {formatDuration(callDuration)}
                </span>
              </div>

              {/* Call controls */}
              <div className="flex justify-center gap-3">
                <Button
                  variant={isMuted ? "default" : "outline"}
                  size="icon"
                  className="h-10 w-10 rounded-full"
                  onClick={handleMute}
                  title={isMuted ? "Activar micrófono" : "Silenciar"}
                >
                  {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                <Button
                  variant={isHeld ? "default" : "outline"}
                  size="icon"
                  className="h-10 w-10 rounded-full"
                  onClick={handleHold}
                  title={isHeld ? "Reanudar" : "En espera"}
                >
                  {isHeld ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </Button>
              </div>

              {/* Hang up */}
              <Button
                variant="destructive"
                className="w-full h-10 rounded-xl"
                onClick={handleHangUp}
              >
                <PhoneOff className="h-4 w-4 mr-2" />
                Colgar
              </Button>
            </div>
          )}

          {/* Dialpad (only when idle) */}
          {!isInCall && (
            <div className="px-4 pb-3 space-y-2">
              {showDialpad && (
                <div className="grid grid-cols-3 gap-1.5 py-2">
                  {DIAL_PAD.flat().map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      onClick={() => handleDigitPress(digit)}
                      className={cn(
                        "h-11 rounded-xl text-lg font-medium",
                        "bg-muted/50 hover:bg-muted active:bg-muted/80",
                        "transition-colors"
                      )}
                    >
                      {digit}
                    </button>
                  ))}
                </div>
              )}

              {/* Call button */}
              <Button
                className="w-full h-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={handleDial}
                disabled={!dialNumber.trim() || deviceStatus !== "ready"}
              >
                <Phone className="h-4 w-4 mr-2" />
                Llamar
              </Button>

              {deviceStatus !== "ready" && deviceStatus !== "initializing" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs"
                  onClick={initialize}
                >
                  Conectar teléfono
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
