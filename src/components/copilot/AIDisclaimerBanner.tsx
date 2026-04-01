// ============================================================
// Trust Architecture — AI Disclaimer Banner
// ============================================================

import { useState, useEffect } from "react";
import { X, Sparkles } from "lucide-react";

interface Props {
  hasAdviceContent?: boolean;
}

const SESSION_KEY = "genius-disclaimer-dismissed";

export function AIDisclaimerBanner({ hasAdviceContent = false }: Props) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === "1") {
      setDismissed(true);
    }
  }, []);

  if (dismissed) return null;

  const handleDismiss = () => {
    sessionStorage.setItem(SESSION_KEY, "1");
    setDismissed(true);
  };

  return (
    <div
      className="w-full flex items-center justify-between px-4"
      style={{
        height: 40,
        background: "rgba(184,134,11,0.05)",
        borderBottom: `1px solid ${hasAdviceContent ? "#DC2626" : "#E7E5E4"}`,
      }}
    >
      <div className="flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-[#B8860B] flex-shrink-0" />
        <p
          className={`text-[12px] ${hasAdviceContent ? "font-medium text-neutral-700" : "text-neutral-600"}`}
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          Este contenido incluye elementos generados por IA que requieren revisión profesional antes de su uso legal.
        </p>
      </div>
      <button
        onClick={handleDismiss}
        className="p-1 rounded hover:bg-neutral-200/50 text-neutral-400 hover:text-neutral-600 transition-colors flex-shrink-0"
        aria-label="Descartar aviso"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
