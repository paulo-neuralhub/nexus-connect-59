// ============================================================
// GENIUS Legal Acceptance — Mandatory first-use legal agreement
// EU AI Act Art. 13-14 compliant · UPL protection
// ============================================================

import { useState, useRef, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Scale, Shield, FileText } from "lucide-react";

const CURRENT_VERSION = "2026-04-01-v1.0";

// ── Legal text sections ──────────────────────────────────
const LEGAL_SECTIONS = [
  {
    title: "1. Naturaleza del Servicio",
    content: `IP-NEXUS incorpora funcionalidades de inteligencia artificial ("GENIUS") que proporcionan herramientas de apoyo profesional para la gestión de propiedad intelectual. GENIUS es una herramienta de asistencia técnica, NO un servicio de asesoramiento jurídico.

Las respuestas, análisis y sugerencias generadas por GENIUS constituyen orientaciones informativas que deben ser evaluadas, verificadas y validadas por un profesional cualificado antes de cualquier uso legal, comercial o regulatorio.`,
  },
  {
    title: "2. Limitaciones y Exclusiones",
    content: `El usuario reconoce y acepta expresamente que:

a) GENIUS no sustituye el criterio profesional de un abogado o agente de propiedad intelectual colegiado.

b) Los análisis de registrabilidad, evaluaciones de riesgo y comparativas generados por IA son aproximaciones basadas en modelos estadísticos y pueden contener inexactitudes, omisiones o errores.

c) Las búsquedas de anterioridad y vigilancia de marcas realizadas por GENIUS complementan, pero no sustituyen, las búsquedas oficiales ante las oficinas de propiedad intelectual competentes (OEPM, EUIPO, WIPO, USPTO u otras).

d) Las clasificaciones de Niza y análisis de clases generados son orientativos y deben ser verificados contra las directrices oficiales vigentes.

e) Los plazos y fechas calculados por el sistema son informativos y el usuario es el único responsable de verificar y cumplir los plazos legales aplicables.`,
  },
  {
    title: "3. Clasificación de Contenido IA",
    content: `Todo contenido generado por GENIUS se clasifica automáticamente en tres niveles:

• INFORMACIÓN (ℹ️): Datos factuales verificables procedentes de fuentes públicas.
• ANÁLISIS (⚖️): Evaluaciones que requieren revisión profesional antes de su uso.
• CONSEJO (⚠️): Contenido en territorio de asesoría legal que requiere supervisión obligatoria por un profesional colegiado.

El usuario se compromete a revisar estas clasificaciones y aplicar el nivel de diligencia profesional correspondiente a cada tipo de contenido.`,
  },
  {
    title: "4. Cumplimiento Normativo — EU AI Act",
    content: `De conformidad con el Reglamento (UE) 2024/1689 (AI Act), artículos 13 y 14:

a) El usuario es informado de que interactúa con un sistema de inteligencia artificial.
b) Toda respuesta generada por IA se identifica como tal mediante indicadores visuales y textuales.
c) El usuario mantiene en todo momento la capacidad de supervisión humana sobre las decisiones y acciones sugeridas por el sistema.
d) IP-NEXUS no ejecuta acciones legales o administrativas de forma autónoma sin la aprobación expresa del usuario.`,
  },
  {
    title: "5. Responsabilidad",
    content: `IP-NEXUS, sus desarrolladores, proveedores de tecnología IA y afiliados NO serán responsables de:

a) Decisiones tomadas basándose en las respuestas de GENIUS sin la debida verificación profesional.
b) Pérdida de derechos de propiedad intelectual, vencimiento de plazos o resoluciones adversas derivadas del uso del sistema.
c) Daños directos, indirectos, incidentales, especiales o consecuentes resultantes del uso o la imposibilidad de uso del servicio de IA.
d) Inexactitudes en los datos, análisis o recomendaciones proporcionados por el sistema.

El uso de GENIUS se realiza bajo la exclusiva responsabilidad profesional del usuario.`,
  },
  {
    title: "6. Protección de Datos y Confidencialidad",
    content: `a) Las consultas realizadas a GENIUS pueden ser procesadas por proveedores de IA de terceros (incluyendo, sin limitación, Anthropic, OpenAI, Google y Mistral).

b) IP-NEXUS implementa medidas de anonimización y seguridad, pero el usuario debe abstenerse de incluir en sus consultas información confidencial protegida por el secreto profesional abogado-cliente sin las debidas precauciones.

c) Las conversaciones con GENIUS NO están cubiertas por el privilegio abogado-cliente ni por el secreto profesional.

d) El usuario es responsable de cumplir con las normativas de protección de datos aplicables (RGPD, LOPDGDD u otras) respecto a los datos personales que introduzca en el sistema.`,
  },
  {
    title: "7. Aceptación y Vigencia",
    content: `Al aceptar estos términos, el usuario declara:

a) Ser un profesional cualificado o actuar bajo la supervisión de uno.
b) Comprender las limitaciones de la inteligencia artificial aplicada al ámbito legal.
c) Asumir la responsabilidad de verificar todo contenido generado por IA antes de su uso profesional.

Estos términos se aplican a todas las funcionalidades de IA de IP-NEXUS y permanecen vigentes mientras el usuario utilice el servicio. IP-NEXUS se reserva el derecho de actualizar estos términos, notificando al usuario y requiriendo nueva aceptación cuando proceda.`,
  },
];

// ── Component ────────────────────────────────────────────
export function GeniusLegalAcceptance({
  open,
  onAccepted,
  onDeclined,
}: {
  open: boolean;
  onAccepted: () => void;
  onDeclined: () => void;
}) {
  const { user } = useAuth();
  const { organizationId } = useOrganization();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [fullName, setFullName] = useState("");
  const [professionalId, setProfessionalId] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");
  const [saving, setSaving] = useState(false);

  // Track scroll completion
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    if (atBottom) setScrolledToBottom(true);
  }, []);

  const canAccept = scrolledToBottom && fullName.trim().length >= 3 && jurisdiction.trim().length >= 2;

  const handleAccept = async () => {
    if (!canAccept || !user?.id || !organizationId) return;
    setSaving(true);

    try {
      const { error } = await supabase.from("genius_legal_acceptances" as any).insert({
        organization_id: organizationId,
        user_id: user.id,
        acceptance_version: CURRENT_VERSION,
        full_name_typed: fullName.trim(),
        professional_id: professionalId.trim() || null,
        jurisdiction: jurisdiction.trim(),
        ip_address: null, // Server would capture this
        user_agent: navigator.userAgent,
        scroll_completed: true,
      });

      if (error) throw error;
      toast.success("Términos aceptados correctamente");
      onAccepted();
    } catch (e: any) {
      toast.error("Error al guardar la aceptación");
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Dark backdrop */}
      <div className="absolute inset-0 bg-[rgba(15,23,41,0.7)] backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-[720px] bg-background rounded-xl border border-border shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="px-8 pt-6 pb-4 border-b" style={{ borderBottomColor: "#B8860B" }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[#0F1729]">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-[20px] font-semibold text-foreground">
                Términos de Uso de Inteligencia Artificial
              </h1>
              <p
                className="text-[11px] text-muted-foreground mt-0.5"
                style={{ fontFamily: "'Geist Mono', monospace" }}
              >
                Versión {CURRENT_VERSION.replace("2026-04-01-", "")} — Abril 2026
              </p>
            </div>
          </div>
        </div>

        {/* Legal document */}
        <div className="px-8 py-4">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="max-h-[360px] overflow-y-auto rounded-lg border border-border bg-[hsl(var(--background-warm,40_20%_98%))] p-6"
            style={{ scrollbarWidth: "thin" }}
          >
            {LEGAL_SECTIONS.map((section, i) => (
              <div key={i} className={cn("mb-6 last:mb-0", i > 0 && "pt-4 border-t border-border/30")}>
                <h3 className="text-[15px] font-semibold text-foreground mb-2">{section.title}</h3>
                <div className="text-[13px] leading-[1.7] text-foreground/80 whitespace-pre-line">
                  {section.content}
                </div>
              </div>
            ))}

            {/* End marker */}
            <div className="mt-6 pt-4 border-t border-border/50 text-center">
              <p className="text-[11px] text-muted-foreground">
                — Fin del documento · {CURRENT_VERSION} —
              </p>
            </div>
          </div>

          {/* Scroll prompt */}
          {!scrolledToBottom && (
            <div className="flex items-center justify-center gap-2 mt-2">
              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-[12px] text-muted-foreground">
                Desplázate hasta el final del documento para continuar
              </p>
            </div>
          )}
        </div>

        {/* Signature area */}
        <div className={cn(
          "px-8 py-4 border-t border-border transition-opacity duration-200",
          !scrolledToBottom && "opacity-50 pointer-events-none"
        )}>
          <h3 className="text-[14px] font-semibold text-foreground mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#B8860B]" />
            Firma Electrónica
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[12px] font-medium text-muted-foreground block mb-1">
                Nombre completo *
              </label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nombre y apellidos"
                className="text-[13px] h-9"
                disabled={!scrolledToBottom}
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-muted-foreground block mb-1">
                Nº colegiado (opcional)
              </label>
              <Input
                value={professionalId}
                onChange={(e) => setProfessionalId(e.target.value)}
                placeholder="Ej: ICAM 12345"
                className="text-[13px] h-9"
                disabled={!scrolledToBottom}
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-muted-foreground block mb-1">
                Jurisdicción *
              </label>
              <Input
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                placeholder="Ej: España, UE"
                className="text-[13px] h-9"
                disabled={!scrolledToBottom}
              />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Al firmar, declaro ser un profesional cualificado o actuar bajo supervisión de uno, y acepto los términos anteriores.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-8 py-4 border-t border-border bg-muted/30">
          <Button
            variant="ghost"
            size="sm"
            onClick={onDeclined}
            className="text-[13px] text-muted-foreground"
          >
            Ahora no
          </Button>
          <Button
            size="sm"
            onClick={handleAccept}
            disabled={!canAccept || saving}
            className="text-[13px] gap-1.5"
          >
            <Scale className="w-3.5 h-3.5" />
            {saving ? "Guardando..." : "Acepto los términos"}
          </Button>
        </div>
      </div>
    </div>
  );
}
