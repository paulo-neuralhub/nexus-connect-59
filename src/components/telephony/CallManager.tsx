// ============================================================
// IP-NEXUS - Call Manager (Global Provider Component)
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { CallInitiateModal } from "./CallInitiateModal";
import { CallInProgressModal } from "./CallInProgressModal";
import { CallCompletedModal } from "./CallCompletedModal";
import { useOrganization } from "@/contexts/organization-context";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type CallState = "idle" | "initiating" | "in-progress" | "completed";

interface CallData {
  phone: string;
  name?: string;
  company?: string;
  clientId?: string;
  contactId?: string;
  matterId?: string;
  onCallInitiated?: () => void;
  onCallCompleted?: () => void;
}

interface CallSession {
  callSid?: string;
  startTime?: number;
  duration: number;
  minutesConsumed: number;
  isRecording: boolean;
  recordingUrl?: string;
  notes: string;
  matterId?: string;
}

interface Matter {
  id: string;
  reference: string;
  title: string;
}

interface User {
  id: string;
  full_name: string;
}

export function CallManager() {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  const [callState, setCallState] = useState<CallState>("idle");
  const [callData, setCallData] = useState<CallData | null>(null);
  const [callSession, setCallSession] = useState<CallSession>({
    duration: 0,
    minutesConsumed: 0,
    isRecording: false,
    notes: "",
  });
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [matters, setMatters] = useState<Matter[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Listen for initiate-call events
  useEffect(() => {
    const handleInitiateCall = (event: CustomEvent<CallData>) => {
      setCallData(event.detail);
      setCallState("initiating");
      setCallSession({
        duration: 0,
        minutesConsumed: 0,
        isRecording: false,
        notes: "",
        matterId: event.detail.matterId,
      });
      loadMattersAndUsers();
    };

    window.addEventListener("ip-nexus:initiate-call", handleInitiateCall as EventListener);
    return () => {
      window.removeEventListener("ip-nexus:initiate-call", handleInitiateCall as EventListener);
    };
  }, []);

  const loadMattersAndUsers = useCallback(async () => {
    if (!currentOrganization?.id) return;

    // Load matters
    const mattersRes = await supabase
      .from("matters")
      .select("id, reference, title")
      .eq("organization_id", currentOrganization.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(50);

    // Load team members - simplified query
    const usersRes = await supabase
      .from("users")
      .select("id, full_name")
      .limit(50);

    if (mattersRes.data) {
      setMatters(mattersRes.data);
    }

    if (usersRes.data) {
      setUsers(usersRes.data.filter((u): u is User => !!u.full_name));
    }
  }, [currentOrganization?.id]);

  const handleStartCall = async (options: { record: boolean; matterId?: string }) => {
    if (!callData || !currentOrganization?.id || !user?.id) return;

    try {
      // In a real implementation, this would call the Twilio SDK
      // For now, we'll simulate the call

      setCallSession((prev) => ({
        ...prev,
        isRecording: options.record,
        matterId: options.matterId,
      }));

      // Make API call to initiate call
      const { data, error } = await supabase.functions.invoke("telephony-make-call", {
        body: {
          tenantId: currentOrganization.id,
          userId: user.id,
          toNumber: callData.phone,
          record: options.record,
          matterId: options.matterId,
          clientId: callData.clientId,
          contactId: callData.contactId,
        },
      });

      if (error) {
        toast.error("Error al iniciar la llamada");
        setCallState("idle");
        return;
      }

      setCallSession((prev) => ({
        ...prev,
        callSid: data?.call_sid,
        startTime: Date.now(),
      }));

      setCallState("in-progress");
      callData.onCallInitiated?.();

      toast.success("Llamada iniciada");
    } catch (err) {
      toast.error("Error al iniciar la llamada");
      setCallState("idle");
    }
  };

  const handleHangUp = async () => {
    const endTime = Date.now();
    const startTime = callSession.startTime || endTime;
    const durationSeconds = Math.floor((endTime - startTime) / 1000);

    // Estimate minutes consumed (simplified - real logic would come from backend)
    const minutesConsumed = Math.ceil(durationSeconds / 60);

    setCallSession((prev) => ({
      ...prev,
      duration: durationSeconds,
      minutesConsumed,
    }));

    setCallState("completed");
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    // In real implementation, would mute the Twilio call
  };

  const handleTogglePause = () => {
    setIsPaused(!isPaused);
    // In real implementation, would hold the call
  };

  const handleNotesChange = (notes: string) => {
    setCallSession((prev) => ({ ...prev, notes }));
  };

  const handleMatterChange = (matterId: string) => {
    setCallSession((prev) => ({ 
      ...prev, 
      matterId: matterId === "none" ? undefined : matterId 
    }));
  };

  const handleSaveCall = async (options: {
    createTask: boolean;
    taskTitle?: string;
    taskAssignee?: string;
    taskDueDate?: string;
  }) => {
    if (!currentOrganization?.id || !user?.id || !callData) return;

    try {
      // Save call activity
      await supabase.from("activities").insert({
        organization_id: currentOrganization.id,
        owner_type: "tenant",
        type: "call",
        subject: `Llamada a ${callData.name || callData.phone}`,
        content: callSession.notes,
        contact_id: callData.contactId,
        matter_id: callSession.matterId,
        call_duration: callSession.duration,
        call_outcome: "completed",
        call_recording_url: callSession.recordingUrl,
        direction: "outbound",
        created_by: user.id,
      });

      // Create follow-up task if requested - using activity_log as a workaround
      // since tasks table doesn't exist in schema yet
      if (options.createTask && options.taskTitle) {
        await supabase.from("activity_log").insert({
          organization_id: currentOrganization.id,
          entity_type: "task",
          entity_id: crypto.randomUUID(),
          action: "created",
          title: options.taskTitle,
          description: `Tarea de seguimiento: ${options.taskTitle}`,
          created_by: user.id,
          matter_id: callSession.matterId,
        });
      }

      callData.onCallCompleted?.();
      toast.success("Llamada guardada");
    } catch {
      toast.error("Error al guardar la llamada");
    }
  };

  const handleCloseInitiate = (open: boolean) => {
    if (!open) {
      setCallState("idle");
      setCallData(null);
    }
  };

  const handleCloseCompleted = (open: boolean) => {
    if (!open) {
      setCallState("idle");
      setCallData(null);
      setCallSession({
        duration: 0,
        minutesConsumed: 0,
        isRecording: false,
        notes: "",
      });
    }
  };

  return (
    <>
      <CallInitiateModal
        open={callState === "initiating"}
        onOpenChange={handleCloseInitiate}
        phone={callData?.phone || ""}
        name={callData?.name}
        company={callData?.company}
        clientId={callData?.clientId}
        contactId={callData?.contactId}
        matterId={callData?.matterId}
        onStartCall={handleStartCall}
      />

      <CallInProgressModal
        open={callState === "in-progress"}
        phone={callData?.phone || ""}
        name={callData?.name}
        isRecording={callSession.isRecording}
        onHangUp={handleHangUp}
        onToggleMute={handleToggleMute}
        onTogglePause={handleTogglePause}
        isMuted={isMuted}
        isPaused={isPaused}
        notes={callSession.notes}
        onNotesChange={handleNotesChange}
      />

      <CallCompletedModal
        open={callState === "completed"}
        onOpenChange={handleCloseCompleted}
        phone={callData?.phone || ""}
        name={callData?.name}
        duration={callSession.duration}
        minutesConsumed={callSession.minutesConsumed}
        notes={callSession.notes}
        onNotesChange={handleNotesChange}
        matterId={callSession.matterId}
        onMatterChange={handleMatterChange}
        matters={matters}
        recordingUrl={callSession.recordingUrl}
        onSave={handleSaveCall}
        users={users}
      />
    </>
  );
}
