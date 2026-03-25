/**
 * Settings > Integraciones — Gmail, WhatsApp, Outlook, SMTP cards
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/organization-context";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Mail, Lock, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { WhatsAppQrModal } from "./WhatsAppQrModal";

export function IntegrationsCardsSection() {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [waMode, setWaMode] = useState<"qr" | "api">("qr");
  const [showWaModal, setShowWaModal] = useState(false);

  const orgId = currentOrganization?.id;

  // WhatsApp session status
  const { data: waSession } = useQuery({
    queryKey: ["whatsapp-session-status", orgId],
    queryFn: async () => {
      const client: any = supabase;
      const { data } = await client
        .from("whatsapp_sessions")
        .select("id, status, phone_number, display_name, last_connected_at")
        .eq("organization_id", orgId)
        .maybeSingle();
      return data;
    },
    enabled: !!orgId,
  });

  const isWaConnected = waSession?.status === "connected";

  // Disconnect WA
  const disconnectWa = useMutation({
    mutationFn: async () => {
      const client: any = supabase;
      const { error } = await client
        .from("whatsapp_sessions")
        .update({ status: "disconnected" })
        .eq("organization_id", orgId);
      if (error) throw error;
    },
    onSuccess: () => {
      const qc = useQueryClient();
      toast.success("WhatsApp desconectado");
    },
  });

  const cards = [
    {
      id: "gmail",
      name: "Gmail / Email",
      description: "Lee y responde emails de clientes directamente desde IP-NEXUS",
      icon: <GmailIcon />,
      connected: false,
      comingSoon: false,
      action: () => toast.info("Gmail se conectará en la próxima actualización. Te notificaremos cuando esté disponible."),
      actionLabel: "Conectar con Google →",
    },
    {
      id: "whatsapp",
      name: "WhatsApp",
      description: "Gestiona mensajes de clientes desde IP-NEXUS",
      icon: <WhatsAppIcon />,
      connected: isWaConnected,
      comingSoon: false,
      custom: true,
    },
    {
      id: "outlook",
      name: "Microsoft Outlook",
      description: "Sincroniza emails y calendario con Outlook",
      icon: <OutlookIcon />,
      connected: false,
      comingSoon: true,
    },
    {
      id: "smtp",
      name: "Email corporativo (SMTP)",
      description: "Usa tu propio dominio para enviar emails",
      icon: <Mail className="w-8 h-8 text-muted-foreground" />,
      connected: false,
      comingSoon: true,
    },
  ];

  return (
    <>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Integraciones</h2>
          <p className="text-muted-foreground">Conecta IP-NEXUS con tus herramientas de comunicación</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cards.map((card) => (
            <Card
              key={card.id}
              className={card.comingSoon ? "opacity-60" : ""}
            >
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                    {card.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{card.name}</h3>
                      {card.comingSoon && (
                        <Badge variant="outline" className="text-[10px]">
                          <Lock className="w-3 h-3 mr-1" /> Próximamente
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{card.description}</p>
                  </div>
                </div>

                {/* WhatsApp custom content */}
                {card.id === "whatsapp" && !card.comingSoon && (
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Modo de conexión:</p>
                      <RadioGroup value={waMode} onValueChange={(v) => setWaMode(v as "qr" | "api")} className="flex gap-4">
                        <div className="flex items-center gap-1.5">
                          <RadioGroupItem value="qr" id="wa-qr" />
                          <Label htmlFor="wa-qr" className="text-sm cursor-pointer">QR (demo)</Label>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <RadioGroupItem value="api" id="wa-api" />
                          <Label htmlFor="wa-api" className="text-sm cursor-pointer">API Business</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Estado:</span>
                      {isWaConnected ? (
                        <Badge className="bg-emerald-500/15 text-emerald-700">● Conectado</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">○ No conectado</Badge>
                      )}
                    </div>

                    {isWaConnected && waSession && (
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>{waSession.phone_number} · {waSession.display_name}</p>
                        {waSession.last_connected_at && (
                          <p>Desde: {new Date(waSession.last_connected_at).toLocaleString("es")}</p>
                        )}
                      </div>
                    )}

                    {isWaConnected ? (
                      <Button variant="outline" size="sm" onClick={() => disconnectWa.mutate()}>
                        Desconectar
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => setShowWaModal(true)}>
                        <MessageSquare className="w-4 h-4 mr-1" /> Conectar WhatsApp →
                      </Button>
                    )}
                  </div>
                )}

                {/* Generic cards */}
                {!card.custom && !card.comingSoon && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Estado:</span>
                      {card.connected ? (
                        <Badge className="bg-emerald-500/15 text-emerald-700">● Conectado</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">○ No conectado</Badge>
                      )}
                    </div>
                    {card.action && (
                      <Button size="sm" onClick={card.action}>
                        {card.actionLabel}
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <WhatsAppQrModal
        open={showWaModal}
        onClose={() => setShowWaModal(false)}
      />
    </>
  );
}

// SVG icons
function GmailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none">
      <path d="M2 6L12 13L22 6" stroke="#EA4335" strokeWidth="2" strokeLinecap="round" />
      <rect x="2" y="4" width="20" height="16" rx="2" stroke="#4285F4" strokeWidth="1.5" fill="none" />
      <path d="M2 6L12 13" stroke="#FBBC05" strokeWidth="1.5" />
      <path d="M22 6L12 13" stroke="#34A853" strokeWidth="1.5" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-8 h-8" fill="#25D366">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.963 7.963 0 01-4.1-1.132l-.294-.176-2.87.852.852-2.87-.176-.294A7.963 7.963 0 014 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8zm4.4-5.88c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.01-.37-1.93-1.18-.71-.63-1.19-1.41-1.33-1.65-.14-.24-.01-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.59 4.12 3.63.58.25 1.03.4 1.38.51.58.18 1.1.16 1.52.1.46-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28z" />
    </svg>
  );
}

function OutlookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="#0078D4" strokeWidth="1.5" />
      <path d="M3 7l9 6 9-6" stroke="#0078D4" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
