// ============================================================
// "Meet GENIUS" — First-login onboarding wizard (4 steps)
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";
import { GeniusAvatar } from "./GeniusAvatar";
import { GeniusLegalAcceptance } from "./GeniusLegalAcceptance";
import { useGeniusLegalGate } from "@/hooks/copilot/useGeniusLegalGate";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Sparkles, MessageSquare, Shield, Zap, Brain, Bell, ChevronRight, Check, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────
interface Preferences {
  copilot_visible: boolean;
  suggestions_enabled: boolean;
  greeting_enabled: boolean;
  learning_enabled: boolean;
  preferred_response_length: "concise" | "normal" | "detailed";
  suggestion_confidence_threshold: number;
  copilot_position: "bottom-right" | "bottom-left";
}

const DEFAULT_PREFS: Preferences = {
  copilot_visible: true,
  suggestions_enabled: true,
  greeting_enabled: true,
  learning_enabled: true,
  preferred_response_length: "normal",
  suggestion_confidence_threshold: 0.7,
  copilot_position: "bottom-right",
};

// ── CSS ───────────────────────────────────────────────────
const CSS_ID = "genius-onboarding-css";
const CSS = `
@keyframes genius-onboard-fade-in {
  from { opacity: 0; transform: scale(0.95); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes genius-onboard-slide-up {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
.genius-onboard-modal {
  animation: genius-onboard-fade-in 0.3s ease-out;
}
.genius-onboard-step {
  animation: genius-onboard-slide-up 0.25s ease-out;
}
@media (prefers-reduced-motion: reduce) {
  .genius-onboard-modal, .genius-onboard-step {
    animation: none !important;
  }
}
`;

// ── Capability cards data ─────────────────────────────────
const CAPABILITIES = [
  {
    icon: MessageSquare,
    title: "Consultas inteligentes",
    desc: "Pregunta sobre registrabilidad, plazos, oposiciones y estrategia de PI.",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: Zap,
    title: "Acciones rápidas",
    desc: "Resúmenes, análisis de riesgo y borradores con un solo clic.",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    icon: Bell,
    title: "Alertas proactivas",
    desc: "Insights sobre plazos, conflictos y oportunidades antes de que preguntes.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: Brain,
    title: "Aprendizaje contextual",
    desc: "Aprende tu estilo y tus clientes para respuestas cada vez más precisas.",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
];

// ── Step indicator ────────────────────────────────────────
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-1 mb-6">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center">
          <div
            className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-semibold transition-all duration-200",
              i < current
                ? "bg-[#059669] text-white"
                : i === current
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            {i < current ? <Check className="w-3.5 h-3.5" /> : i + 1}
          </div>
          {i < total - 1 && (
            <div
              className={cn(
                "w-8 h-0.5 mx-0.5 transition-colors duration-200",
                i < current ? "bg-[#059669]" : "bg-muted"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Step 1: Introduction ──────────────────────────────────
function StepIntro({ variant, userName }: { variant: "nexus" | "genius"; userName: string }) {
  const name = variant === "genius" ? "GENIUS" : "NEXUS";
  return (
    <div className="genius-onboard-step text-center">
      <div className="flex justify-center mb-5">
        <GeniusAvatar variant={variant} size="xl" state="greeting" showSparkle />
      </div>
      <h2 className="text-[22px] font-semibold text-foreground mb-2">
        Hola {userName}, soy <span style={{ color: "#B8860B" }}>✦ {name}</span>
      </h2>
      <p className="text-[15px] text-muted-foreground leading-relaxed max-w-[440px] mx-auto mb-6">
        Tu nuevo compañero de despacho en propiedad intelectual. Estoy aquí para
        ayudarte a analizar, redactar y vigilar — siempre bajo tu supervisión profesional.
      </p>
      <div className="grid grid-cols-2 gap-3 max-w-[480px] mx-auto">
        {CAPABILITIES.map((cap) => (
          <div
            key={cap.title}
            className="flex gap-2.5 p-3 rounded-lg border border-border/50 bg-card text-left"
          >
            <div className={cn("p-1.5 rounded-md flex-shrink-0 self-start", cap.bg)}>
              <cap.icon className={cn("w-4 h-4", cap.color)} />
            </div>
            <div>
              <h4 className="text-[13px] font-medium text-foreground">{cap.title}</h4>
              <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{cap.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Step 2: Trust & Transparency ──────────────────────────
function StepTrust({ variant }: { variant: "nexus" | "genius" }) {
  return (
    <div className="genius-onboard-step text-center">
      <div className="flex justify-center mb-4">
        <div className="p-3 rounded-full bg-amber-50">
          <Shield className="w-8 h-8 text-amber-600" />
        </div>
      </div>
      <h2 className="text-[20px] font-semibold text-foreground mb-2">
        Transparencia y control total
      </h2>
      <p className="text-[14px] text-muted-foreground leading-relaxed max-w-[440px] mx-auto mb-6">
        Cada respuesta de {variant === "genius" ? "GENIUS" : "NEXUS"} incluye indicadores de confianza y clasificación para que
        siempre sepas qué tipo de información estás recibiendo.
      </p>

      <div className="space-y-3 max-w-[440px] mx-auto text-left">
        {[
          {
            badge: "ℹ️ INFORMACIÓN",
            bg: "bg-blue-50",
            text: "text-blue-700",
            border: "border-blue-200",
            desc: "Datos factuales y verificables",
          },
          {
            badge: "⚖️ ANÁLISIS",
            bg: "bg-amber-50",
            text: "text-amber-700",
            border: "border-amber-200",
            desc: "Análisis IA que requiere revisión profesional",
          },
          {
            badge: "⚠️ CONSEJO",
            bg: "bg-red-50",
            text: "text-red-700",
            border: "border-red-200",
            desc: "Territorio de asesoría legal — supervisión obligatoria",
          },
        ].map((item) => (
          <div key={item.badge} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card">
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-sm border text-[11px] font-semibold uppercase",
                item.bg, item.text, item.border
              )}
            >
              {item.badge}
            </span>
            <span className="text-[13px] text-muted-foreground">{item.desc}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 p-3 rounded-lg bg-muted/50 max-w-[440px] mx-auto">
        <p className="text-[12px] text-muted-foreground">
          🤖 Toda respuesta de IA incluye un descargo: <em>"Generado por IA — revisión profesional requerida"</em>.
          Tú siempre tienes la última palabra.
        </p>
      </div>
    </div>
  );
}

// ── Step 3: Preferences ───────────────────────────────────
function StepPreferences({
  prefs,
  onChange,
}: {
  prefs: Preferences;
  onChange: (p: Preferences) => void;
}) {
  const toggle = (key: keyof Preferences) => {
    onChange({ ...prefs, [key]: !prefs[key] });
  };

  return (
    <div className="genius-onboard-step">
      <div className="text-center mb-5">
        <div className="flex justify-center mb-3">
          <div className="p-3 rounded-full bg-blue-50">
            <Sparkles className="w-7 h-7 text-[#B8860B]" />
          </div>
        </div>
        <h2 className="text-[20px] font-semibold text-foreground mb-1">Personaliza tu experiencia</h2>
        <p className="text-[13px] text-muted-foreground">Puedes cambiar todo esto después en Configuración &gt; IA</p>
      </div>

      <div className="space-y-3 max-w-[440px] mx-auto">
        {/* Suggestions */}
        <PrefRow
          label="Sugerencias proactivas"
          desc="Recibir insights y alertas automáticas"
          checked={prefs.suggestions_enabled}
          onToggle={() => toggle("suggestions_enabled")}
        />
        {/* Greeting */}
        <PrefRow
          label="Saludo diario"
          desc="GENIUS te saluda al comenzar cada día"
          checked={prefs.greeting_enabled}
          onToggle={() => toggle("greeting_enabled")}
        />
        {/* Learning */}
        <PrefRow
          label="Aprendizaje contextual"
          desc="Mejorar respuestas aprendiendo de tus interacciones"
          checked={prefs.learning_enabled}
          onToggle={() => toggle("learning_enabled")}
        />
        {/* Copilot visible */}
        <PrefRow
          label="Badge visible"
          desc="Mostrar el icono flotante de GENIUS"
          checked={prefs.copilot_visible}
          onToggle={() => toggle("copilot_visible")}
        />

        {/* Response length */}
        <div className="p-3 rounded-lg border border-border/50 bg-card">
          <p className="text-[13px] font-medium text-foreground mb-2">Longitud de respuestas</p>
          <div className="flex gap-2">
            {(["concise", "normal", "detailed"] as const).map((v) => (
              <button
                key={v}
                onClick={() => onChange({ ...prefs, preferred_response_length: v })}
                className={cn(
                  "flex-1 py-1.5 rounded-md text-[12px] font-medium border transition-all duration-150",
                  prefs.preferred_response_length === v
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted"
                )}
              >
                {v === "concise" ? "Conciso" : v === "normal" ? "Normal" : "Detallado"}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PrefRow({
  label,
  desc,
  checked,
  onToggle,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card">
      <div>
        <p className="text-[13px] font-medium text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onToggle} />
    </div>
  );
}

// ── Step 4: Ready ─────────────────────────────────────────
function StepReady({ variant, userName }: { variant: "nexus" | "genius"; userName: string }) {
  const name = variant === "genius" ? "GENIUS" : "NEXUS";
  return (
    <div className="genius-onboard-step text-center">
      <div className="flex justify-center mb-4">
        <GeniusAvatar variant={variant} size="xl" state="success" showSparkle />
      </div>
      <h2 className="text-[22px] font-semibold text-foreground mb-2">
        ¡Todo listo, {userName}! ✦
      </h2>
      <p className="text-[15px] text-muted-foreground leading-relaxed max-w-[400px] mx-auto mb-5">
        {name} está preparado para trabajar contigo. Encuéntrame en el badge
        dorado <span style={{ color: "#B8860B" }}>✦</span> de la esquina inferior o presiona{" "}
        <kbd className="px-1.5 py-0.5 rounded bg-muted text-[12px] font-mono border border-border">⌘J</kbd>{" "}
        para abrir el chat.
      </p>

      <div className="grid grid-cols-3 gap-3 max-w-[400px] mx-auto">
        {[
          { icon: Sparkles, label: "Badge flotante", sub: "Esquina inferior" },
          { icon: MessageSquare, label: "Chat ⌘J", sub: "Conversaciones" },
          { icon: Zap, label: "Acciones ✦", sub: "En cada página" },
        ].map((item) => (
          <div key={item.label} className="p-3 rounded-lg bg-muted/50 text-center">
            <item.icon className="w-5 h-5 mx-auto mb-1.5 text-[#B8860B]" />
            <p className="text-[12px] font-medium text-foreground">{item.label}</p>
            <p className="text-[10px] text-muted-foreground">{item.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────
export function GeniusOnboarding({
  open,
  onClose,
  forceOpen = false,
}: {
  open?: boolean;
  onClose?: () => void;
  forceOpen?: boolean;
}) {
  const { user, profile } = useAuth();
  const { organizationId } = useOrganization();
  const { hasAccepted: legalAccepted, isLoading: legalLoading, refetch: refetchLegal } = useGeniusLegalGate();
  const [step, setStep] = useState(0);
  const [showLegal, setShowLegal] = useState(false);
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
  const [saving, setSaving] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);
  const [checked, setChecked] = useState(false);

  // Determine avatar variant based on subscription
  const variant: "nexus" | "genius" = "genius"; // TODO: derive from org tier

  const userName = profile?.full_name?.split(" ")[0] || "usuario";

  // Inject CSS
  useEffect(() => {
    if (document.getElementById(CSS_ID)) return;
    const s = document.createElement("style");
    s.id = CSS_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
  }, []);

  // Auto-detect first login
  useEffect(() => {
    if (forceOpen) {
      setShouldShow(true);
      return;
    }
    if (!user?.id || !organizationId) return;

    const check = async () => {
      const { data } = await supabase
        .from("copilot_user_preferences" as any)
        .select("id")
        .eq("user_id", user.id)
        .eq("organization_id", organizationId)
        .maybeSingle();

      if (!data) setShouldShow(true);
      setChecked(true);
    };
    check();
  }, [user?.id, organizationId, forceOpen]);

  const isOpen = open !== undefined ? open : shouldShow;
  if (!isOpen || !checked || legalLoading) return null;

  // If legal not accepted, show legal modal first
  if (!legalAccepted && !showLegal && step === 0) {
    // Show legal on first "Continuar" click, not immediately
  }

  const TOTAL_STEPS = 4;

  const handleNext = () => {
    // On step 0, check legal gate before proceeding
    if (step === 0 && !legalAccepted) {
      setShowLegal(true);
      return;
    }
    if (step < TOTAL_STEPS - 1) setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const handleSkip = async () => {
    await savePrefs(DEFAULT_PREFS);
    close();
  };

  const handleFinish = async () => {
    await savePrefs(prefs);
    close();
  };

  const close = () => {
    setShouldShow(false);
    onClose?.();
  };

  const savePrefs = async (p: Preferences) => {
    if (!user?.id || !organizationId) return;
    setSaving(true);
    try {
      await supabase.from("copilot_user_preferences" as any).upsert(
        {
          user_id: user.id,
          organization_id: organizationId,
          copilot_visible: p.copilot_visible,
          suggestions_enabled: p.suggestions_enabled,
          greeting_enabled: p.greeting_enabled,
          learning_enabled: p.learning_enabled,
          preferred_response_length: p.preferred_response_length,
          suggestion_confidence_threshold: p.suggestion_confidence_threshold,
          copilot_position: p.copilot_position,
        },
        { onConflict: "user_id,organization_id" }
      );
      toast.success("¡Preferencias guardadas!");
    } catch {
      toast.error("Error al guardar preferencias");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    {/* Legal acceptance modal */}
    <GeniusLegalAcceptance
      open={showLegal}
      onAccepted={() => {
        setShowLegal(false);
        refetchLegal();
        setStep(1);
      }}
      onDeclined={() => {
        setShowLegal(false);
      }}
    />

    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div className="genius-onboard-modal relative w-full max-w-[640px] bg-background rounded-xl border border-border shadow-xl overflow-hidden">
        {/* Skip button */}
        {step < TOTAL_STEPS - 1 && (
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 text-[12px] text-muted-foreground hover:text-foreground transition-colors z-10"
          >
            Saltar
          </button>
        )}

        {/* Content */}
        <div className="px-8 pt-6 pb-4">
          <StepIndicator current={step} total={TOTAL_STEPS} />

          <div className="min-h-[340px] flex items-start justify-center">
            {step === 0 && <StepIntro variant={variant} userName={userName} />}
            {step === 1 && <StepTrust variant={variant} />}
            {step === 2 && <StepPreferences prefs={prefs} onChange={setPrefs} />}
            {step === 3 && <StepReady variant={variant} userName={userName} />}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-8 py-4 border-t border-border bg-muted/30">
          <div>
            {step > 0 && (
              <Button variant="ghost" size="sm" onClick={handleBack} className="text-[13px]">
                Atrás
              </Button>
            )}
          </div>
          <div>
            {step < TOTAL_STEPS - 1 ? (
              <Button size="sm" onClick={handleNext} className="text-[13px] gap-1">
                Continuar
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleFinish}
                disabled={saving}
                className="text-[13px] gap-1"
                style={{ background: "#B8860B" }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                {saving ? "Guardando..." : "¡Empezar con GENIUS!"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
