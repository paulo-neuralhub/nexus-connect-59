import * as React from "react";
import ReactMarkdown from "react-markdown";
import { Bot, Send, Trash2, Wrench, Sparkles, TrendingUp, AlertTriangle, Search, BarChart3, Building2, Loader2 } from "lucide-react";
import { useLocation } from "react-router-dom";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useBackofficeAiAgent } from "@/hooks/backoffice/useBackofficeAiAgent";

// Contextual suggestions based on current route
function getContextualSuggestions(pathname: string) {
  const baseSuggestions = [
    { label: "Resumen ejecutivo", q: "Dame un resumen ejecutivo de hoy (alertas, MRR, nuevos registros).", icon: Sparkles },
    { label: "Alertas críticas", q: "¿Qué alertas críticas hay activas ahora?", icon: AlertTriangle },
  ];

  if (pathname.includes("/analytics")) {
    return [
      { label: "¿Cómo va el MRR?", q: "¿Cómo va el MRR este mes? Dame el desglose por plan.", icon: TrendingUp },
      { label: "Comparar con mes anterior", q: "Compara las métricas de este mes con el mes anterior.", icon: BarChart3 },
      { label: "Tenants en riesgo", q: "¿Qué tenants están en riesgo de cancelar?", icon: AlertTriangle },
      ...baseSuggestions,
    ];
  }

  if (pathname.includes("/stripe") || pathname.includes("/suscripciones")) {
    return [
      { label: "Estado suscripciones", q: "Dame un resumen del estado de las suscripciones activas.", icon: BarChart3 },
      { label: "Pagos fallidos", q: "¿Hay pagos fallidos o suscripciones con problemas?", icon: AlertTriangle },
      { label: "MRR actual", q: "¿Cuál es el MRR actual y su desglose?", icon: TrendingUp },
      ...baseSuggestions,
    ];
  }

  if (pathname.includes("/oficinas")) {
    return [
      { label: "Estado oficinas PI", q: "¿Cómo están las conexiones con las oficinas de PI?", icon: Building2 },
      { label: "Errores de sync", q: "¿Hay errores recientes en la sincronización con oficinas?", icon: AlertTriangle },
      ...baseSuggestions,
    ];
  }

  if (pathname.includes("/tenants") || pathname.includes("/usuarios")) {
    return [
      { label: "Buscar tenant", q: "Busca tenants con nombre que contenga '...'", icon: Search },
      { label: "Registros recientes", q: "¿Cuántos nuevos registros hubo en las últimas 24 horas?", icon: TrendingUp },
      { label: "Tenants en riesgo", q: "¿Qué tenants tienen bajo health score?", icon: AlertTriangle },
      ...baseSuggestions,
    ];
  }

  // Default suggestions
  return [
    { label: "¿Cómo va el MRR?", q: "¿Cómo va el MRR este mes?", icon: TrendingUp },
    { label: "Tenants en riesgo", q: "¿Qué tenants están en riesgo de cancelar?", icon: AlertTriangle },
    { label: "Buscar tenant", q: "Busca tenants con nombre que contenga '...'", icon: Search },
    ...baseSuggestions,
  ];
}

export function AiAgentDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [input, setInput] = React.useState("");
  const { messages, isSending, send, clear } = useBackofficeAiAgent();
  const location = useLocation();

  const endRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, open]);

  const suggestions = getContextualSuggestions(location.pathname);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isSending) return;
    send(trimmed);
    setInput("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[85vh] max-h-[700px] flex flex-col p-0">
        <DialogHeader className="px-4 py-3 border-b shrink-0">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Bot className="h-5 w-5" />
              </span>
              <div>
                <span className="block">Nexus Assistant</span>
                <span className="text-xs font-normal text-muted-foreground">Backoffice AI</span>
              </div>
            </DialogTitle>
            <Button type="button" variant="outline" size="sm" onClick={clear}>
              <Trash2 className="h-4 w-4 mr-2" />
              Limpiar
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 px-4 py-4">
          {messages.length === 0 ? (
            <div className="space-y-4">
              <div className="rounded-xl border bg-card p-4">
                <p className="font-medium text-foreground">¡Hola! Soy tu asistente de backoffice.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Puedo ayudarte a consultar métricas, buscar tenants, analizar tendencias y más.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Sugerencias rápidas
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {suggestions.slice(0, 4).map((s) => (
                    <Button
                      key={s.label}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => send(s.q)}
                      disabled={isSending}
                      className="justify-start h-auto py-2 px-3 text-left"
                    >
                      <s.icon className="h-4 w-4 mr-2 shrink-0 text-muted-foreground" />
                      <span className="text-sm truncate">{s.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((m, idx) => (
                <div
                  key={`${m.createdAt}-${idx}`}
                  className={cn(
                    "rounded-xl border p-3",
                    m.role === "user" ? "bg-muted/40 ml-8" : "bg-card mr-4"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {m.role === "assistant" && (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                          <Bot className="h-3.5 w-3.5" />
                        </span>
                      )}
                      <p className="text-xs font-medium text-muted-foreground">
                        {m.role === "user" ? "Tú" : "Nexus"}
                      </p>
                    </div>
                    {m.toolsUsed?.length ? (
                      <div className="flex flex-wrap gap-1 justify-end">
                        {m.toolsUsed.slice(0, 4).map((t, i) => (
                          <Badge key={`${t}-${i}`} variant="secondary" className="gap-1 text-[10px]">
                            <Wrench className="h-2.5 w-2.5" />
                            {t.replace(/_/g, " ")}
                          </Badge>
                        ))}
                        {m.toolsUsed.length > 4 && (
                          <Badge variant="secondary" className="text-[10px]">
                            +{m.toolsUsed.length - 4}
                          </Badge>
                        )}
                      </div>
                    ) : null}
                  </div>

                  {m.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert mt-2 prose-p:my-1 prose-ul:my-1 prose-li:my-0">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm text-foreground mt-2 whitespace-pre-wrap">{m.content}</p>
                  )}
                </div>
              ))}
              
              {isSending && (
                <div className="rounded-xl border bg-card p-3 mr-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                      <Bot className="h-3.5 w-3.5" />
                    </span>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Pensando...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={endRef} />
            </div>
          )}
        </ScrollArea>

        {/* Quick suggestions when there are messages */}
        {messages.length > 0 && !isSending && (
          <div className="px-4 py-2 border-t bg-muted/30 shrink-0">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {suggestions.slice(0, 3).map((s) => (
                <Button
                  key={s.label}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => send(s.q)}
                  className="whitespace-nowrap text-xs h-7"
                >
                  <s.icon className="h-3 w-3 mr-1" />
                  {s.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={onSubmit} className="p-4 border-t flex gap-2 shrink-0">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pregunta sobre métricas, tenants, alertas..."
            disabled={isSending}
            className="flex-1"
          />
          <Button type="submit" disabled={isSending || !input.trim()} size="icon">
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="sr-only">Enviar</span>
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
