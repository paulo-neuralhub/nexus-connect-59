/**
 * useTelephony — Core softphone hook
 * Manages WebRTC device, mock/real calls, balance, timer
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/organization-context";
import { useQueryClient } from "@tanstack/react-query";

export type DeviceStatus = "offline" | "initializing" | "ready" | "busy" | "error";
export type CallStatus = "idle" | "calling" | "ringing" | "in-progress" | "ended" | "error";

export interface ActiveCallInfo {
  callSid: string;
  cdrId?: string;
  fromNumber: string;
  toNumber: string;
  direction: "outbound" | "inbound";
  provider: string;
  isMock: boolean;
  startedAt: Date;
  // CRM linking
  accountId?: string;
  accountName?: string;
  contactId?: string;
  contactName?: string;
  dealId?: string;
  matterId?: string;
}

export interface TelephonyState {
  deviceStatus: DeviceStatus;
  callStatus: CallStatus;
  currentCall: ActiveCallInfo | null;
  callDuration: number;
  balance: number | null;
  error: string | null;
  isMockMode: boolean;
}

export interface TelephonyActions {
  initialize: () => Promise<void>;
  makeCall: (toNumber: string, meta?: CallMetadata) => Promise<void>;
  hangUp: () => void;
  toggleMute: () => void;
  toggleHold: () => void;
  sendDigit: (digit: string) => void;
  refreshBalance: () => Promise<void>;
}

export interface CallMetadata {
  accountId?: string;
  accountName?: string;
  contactId?: string;
  contactName?: string;
  dealId?: string;
  matterId?: string;
}

export function useTelephony(): TelephonyState & TelephonyActions {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;
  const queryClient = useQueryClient();

  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>("offline");
  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [currentCall, setCurrentCall] = useState<ActiveCallInfo | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [balance, setBalance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMockMode, setIsMockMode] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Timer management ──
  const startTimer = useCallback(() => {
    setCallDuration(0);
    timerRef.current = setInterval(() => {
      setCallDuration((d) => d + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopTimer();
      if (mockTimerRef.current) clearTimeout(mockTimerRef.current);
    };
  }, [stopTimer]);

  // ── Fetch balance ──
  const refreshBalance = useCallback(async () => {
    if (!orgId) return;
    const { data } = await supabase
      .from("telephony_wallets")
      .select("current_balance")
      .eq("organization_id", orgId)
      .maybeSingle();
    setBalance(data?.current_balance ?? null);
  }, [orgId]);

  // ── Initialize device ──
  const initialize = useCallback(async () => {
    if (!orgId) {
      setError("Selecciona una organización");
      return;
    }

    setDeviceStatus("initializing");
    setError(null);

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        setError("Sesión no activa");
        setDeviceStatus("error");
        return;
      }

      const { data, error: fnErr } = await supabase.functions.invoke("telephony-token", {
        body: { organization_id: orgId },
      });

      if (fnErr) {
        const msg = fnErr.message || String(fnErr);
        // Handle expected non-configured states gracefully
        if (msg.includes("402") || msg.includes("403") || msg.includes("telephony_not_active")) {
          setDeviceStatus("offline");
          setError(null);
          return;
        }
        setError(msg);
        setDeviceStatus("error");
        return;
      }

      if (data?.error) {
        if (data.error === "telephony_not_active" || data.error === "insufficient_balance") {
          setDeviceStatus("offline");
          setError(null);
          return;
        }
        setError(data.message || data.error);
        setDeviceStatus("error");
        return;
      }

      setIsMockMode(!!data.is_mock);

      if (data.is_mock) {
        // MOCK MODE — device is always ready
        setDeviceStatus("ready");
        await refreshBalance();
        return;
      }

      // REAL MODE — would initialize provider SDK here
      // For now, mark as ready (SDK integration in future phase)
      setDeviceStatus("ready");
      await refreshBalance();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al inicializar");
      setDeviceStatus("error");
    }
  }, [orgId, refreshBalance]);

  // ── Make call ──
  const makeCall = useCallback(
    async (toNumber: string, meta?: CallMetadata) => {
      if (!orgId) {
        setError("Sin organización");
        return;
      }
      if (callStatus !== "idle") {
        setError("Ya hay una llamada en curso");
        return;
      }

      setCallStatus("calling");
      setError(null);

      try {
        const { data, error: fnErr } = await supabase.functions.invoke("telephony-outbound", {
          body: {
            organization_id: orgId,
            to_number: toNumber,
            crm_account_id: meta?.accountId,
            crm_contact_id: meta?.contactId,
            crm_deal_id: meta?.dealId,
            matter_id: meta?.matterId,
          },
        });

        if (fnErr) {
          setError(fnErr.message || "Error al iniciar llamada");
          setCallStatus("idle");
          return;
        }

        if (!data?.success) {
          setError(data?.message || "No se pudo iniciar la llamada");
          setCallStatus("idle");
          return;
        }

        const callInfo: ActiveCallInfo = {
          callSid: data.call_sid,
          cdrId: data.cdr_id,
          fromNumber: data.from_number,
          toNumber: data.to_number,
          direction: "outbound",
          provider: data.provider,
          isMock: data.is_mock,
          startedAt: new Date(),
          accountId: meta?.accountId,
          accountName: meta?.accountName,
          contactId: meta?.contactId,
          contactName: meta?.contactName,
          dealId: meta?.dealId,
          matterId: meta?.matterId,
        };

        setCurrentCall(callInfo);

        if (data.is_mock) {
          // MOCK: simulate calling → in-progress → auto-end after 10s
          setCallStatus("calling");
          mockTimerRef.current = setTimeout(() => {
            setCallStatus("in-progress");
            startTimer();

            // Auto-end after 10 seconds for testing
            mockTimerRef.current = setTimeout(() => {
              // Don't auto-end, let user hang up manually
              // but set status to in-progress so UI works
            }, 10000);
          }, 1500); // 1.5s ringing simulation
        } else {
          // REAL: status updates would come from WebRTC events
          setCallStatus("calling");
          // The WebRTC SDK events would transition to in-progress
          // For now, simulate transition
          mockTimerRef.current = setTimeout(() => {
            setCallStatus("in-progress");
            startTimer();
          }, 2000);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error inesperado");
        setCallStatus("idle");
      }
    },
    [orgId, callStatus, startTimer]
  );

  // ── Hang up ──
  const hangUp = useCallback(() => {
    stopTimer();
    setCallStatus("ended");

    if (mockTimerRef.current) {
      clearTimeout(mockTimerRef.current);
      mockTimerRef.current = null;
    }

    // After a brief "ended" display, return to idle
    setTimeout(() => {
      setCurrentCall(null);
      setCallStatus("idle");
      setCallDuration(0);
      setIsMuted(false);
      refreshBalance();
    }, 2000);
  }, [stopTimer, refreshBalance]);

  // ── Mute ──
  const toggleMute = useCallback(() => {
    setIsMuted((m) => !m);
    // In real mode, would call device.mute/unmute
  }, []);

  // ── Hold ──
  const toggleHold = useCallback(() => {
    // Hold = mute in MVP (same as legacy)
    toggleMute();
  }, [toggleMute]);

  // ── DTMF ──
  const sendDigit = useCallback((_digit: string) => {
    // In real mode, would send DTMF tone
    // In mock mode, no-op
  }, []);

  return {
    deviceStatus,
    callStatus,
    currentCall,
    callDuration,
    balance,
    error,
    isMockMode,
    initialize,
    makeCall,
    hangUp,
    toggleMute,
    toggleHold,
    sendDigit,
    refreshBalance,
  };
}
