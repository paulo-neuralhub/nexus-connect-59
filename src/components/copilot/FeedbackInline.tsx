// ============================================================
// Trust Architecture — Feedback Inline
// ============================================================

import { useState } from "react";
import { ThumbsUp, ThumbsDown, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fromTable } from "@/lib/supabase";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  contextId: string;
  contextType: string;
  messageId?: string;
}

export function FeedbackInline({ contextId, contextType, messageId }: Props) {
  const [feedback, setFeedback] = useState<"positive" | "negative" | "incorrect" | null>(null);
  const [showIncorrectForm, setShowIncorrectForm] = useState(false);
  const [incorrectText, setIncorrectText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submitFeedback = async (type: "positive" | "negative" | "incorrect", comment?: string) => {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (messageId) {
        await fromTable("ai_messages")
          .update({ feedback: type === "incorrect" ? "negative" : type, feedback_comment: comment || null })
          .eq("id", messageId);
      }
      setFeedback(type);
      if (type === "incorrect" && comment) {
        setShowIncorrectForm(false);
      }
      toast.success("Gracias por tu feedback");
    } catch {
      toast.error("Error al enviar feedback");
    } finally {
      setSubmitting(false);
    }
  };

  if (feedback && !showIncorrectForm) {
    return (
      <p className="text-[11px] text-neutral-400">
        {feedback === "positive" ? "👍 Gracias" : feedback === "negative" ? "👎 Gracias" : "⚠️ Reportado"}
      </p>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-1">
        <span className="text-[11px] text-neutral-400 mr-1">¿Fue útil?</span>
        <button
          onClick={() => submitFeedback("positive")}
          disabled={submitting}
          className="p-1 rounded hover:bg-green-50 text-neutral-400 hover:text-green-600 transition-colors"
        >
          <ThumbsUp className="w-3 h-3" />
        </button>
        <button
          onClick={() => submitFeedback("negative")}
          disabled={submitting}
          className="p-1 rounded hover:bg-red-50 text-neutral-400 hover:text-red-600 transition-colors"
        >
          <ThumbsDown className="w-3 h-3" />
        </button>
        <button
          onClick={() => setShowIncorrectForm(true)}
          disabled={submitting}
          className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <AlertTriangle className="w-3 h-3" />
          Incorrecto
        </button>
      </div>

      {showIncorrectForm && (
        <div className="mt-2 p-2 rounded-lg bg-neutral-50 border border-neutral-200 animate-fade-in">
          <p className="text-[12px] text-neutral-600 mb-1.5">¿Qué fue incorrecto?</p>
          <textarea
            value={incorrectText}
            onChange={(e) => setIncorrectText(e.target.value)}
            placeholder="Describe el error..."
            className="w-full text-[12px] border border-neutral-200 rounded px-2 py-1.5 resize-none focus:outline-none focus:border-blue-400"
            rows={2}
          />
          <div className="flex justify-end gap-1.5 mt-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[11px]"
              onClick={() => setShowIncorrectForm(false)}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              className="h-6 text-[11px]"
              disabled={!incorrectText.trim() || submitting}
              onClick={() => submitFeedback("incorrect", incorrectText)}
            >
              Enviar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
