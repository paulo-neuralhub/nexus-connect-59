// ============================================================
// AI Disclaimer Persistent — Non-dismissible legal notice
// Appears on all pages with AI content
// ============================================================

import { Shield } from "lucide-react";

interface Props {
  hasAdviceContent?: boolean;
  className?: string;
}

export function AIDisclaimerPersistent({ hasAdviceContent = false, className = "" }: Props) {
  return (
    <div
      className={`w-full flex items-center gap-2 px-4 py-2 ${className}`}
      style={{
        background: hasAdviceContent ? "rgba(220,38,38,0.04)" : "rgba(184,134,11,0.04)",
        borderBottom: `1px solid ${hasAdviceContent ? "hsl(var(--destructive))" : "hsl(var(--border))"}`,
      }}
    >
      <Shield
        className={`w-3.5 h-3.5 flex-shrink-0 ${
          hasAdviceContent ? "text-destructive" : "text-muted-foreground"
        }`}
      />
      <p className="text-[11px] text-muted-foreground leading-snug">
        <span className="font-medium">Aviso legal:</span> El contenido generado por IA es orientativo
        y no constituye asesoramiento jurídico. Requiere revisión profesional antes de cualquier uso
        legal.
        {hasAdviceContent && (
          <span className="text-destructive font-medium">
            {" "}
            Esta página contiene sugerencias en territorio de asesoría — supervisión obligatoria.
          </span>
        )}
      </p>
    </div>
  );
}
