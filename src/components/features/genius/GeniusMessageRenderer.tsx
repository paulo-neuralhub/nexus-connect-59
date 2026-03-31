import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// ── TIPOS DE RESPUESTA PI ────────────────────────────────────

export interface ResponseType {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
  borderColor: string;
}

export function getResponseType(content: string): ResponseType | null {
  // Documentos legales — más específico primero
  if (/SOLICITA|Cease.*Desist|C&D letter|escrito.*oposición|contrato.*licencia|acuerdo.*coexistencia|demanda|medida.*cautelar/i.test(content))
    return {
      label: 'DOCUMENTO LEGAL',
      color: '#1E293B',
      bgColor: '#1E293B0D',
      icon: '📋',
      borderColor: 'border-l-slate-700',
    };

  // Análisis de marcas — requiere múltiples señales
  if (/similitud.*fonética|similitud.*visual|similitud.*conceptual|riesgo.*confusión|CONCLUSIÓN EJECUTIVA.*marca|test.*TJUE|consumidor.*medio/i.test(content))
    return {
      label: 'ANÁLISIS DE MARCAS',
      color: '#D97706',
      bgColor: '#F59E0B0D',
      icon: '⚖️',
      borderColor: 'border-l-amber-400',
    };

  // Estimación de costes — requiere € Y tabla
  if (content.includes('€') && (content.includes('|') || /tasa.*oficial|honorarios.*total/i.test(content)))
    return {
      label: 'ESTIMACIÓN DE COSTES',
      color: '#059669',
      bgColor: '#0596690D',
      icon: '💶',
      borderColor: 'border-l-emerald-500',
    };

  // Presupuesto completo
  if (/presupuesto.*total|total.*honorarios|desglose.*coste/i.test(content))
    return {
      label: 'PRESUPUESTO',
      color: '#14B8A6',
      bgColor: '#14B8A60D',
      icon: '📊',
      borderColor: 'border-l-teal-500',
    };

  // Plazos y fechas
  if (/plazo.*días|fecha.*límite|vencimiento|deadline|período.*oposición|renovación.*pendiente/i.test(content))
    return {
      label: 'PLAZOS Y FECHAS',
      color: '#DC2626',
      bgColor: '#DC26260D',
      icon: '📅',
      borderColor: 'border-l-red-500',
    };

  // Información jurisdiccional
  if (/EUIPO|USPTO|OEPM|CNIPA|JPO|UKIPO|requisitos.*jurisdicción|procedimiento.*registro/i.test(content))
    return {
      label: 'INFORMACIÓN JURISDICCIONAL',
      color: '#0EA5E9',
      bgColor: '#0EA5E90D',
      icon: '🏛️',
      borderColor: 'border-l-sky-500',
    };

  // Análisis de patente
  if (/reivindicaci|invención|estado.*técnica|libertad.*operación|FTO|prior art.*patent/i.test(content))
    return {
      label: 'ANÁLISIS DE PATENTE',
      color: '#6366F1',
      bgColor: '#6366F10D',
      icon: '🔬',
      borderColor: 'border-l-indigo-500',
    };

  // Búsqueda de anterioridades
  if (/anterioridad|búsqueda.*marca|clearance.*search|registros.*similares|base.*datos.*marca/i.test(content))
    return {
      label: 'BÚSQUEDA DE ANTERIORIDADES',
      color: '#8B5CF6',
      bgColor: '#8B5CF60D',
      icon: '🔍',
      borderColor: 'border-l-violet-500',
    };

  // Estrategia internacional
  if (/Sistema.*Madrid|vía.*Madrid|PCT|La Haya|estrategia.*internacional|expansión.*marca/i.test(content))
    return {
      label: 'ESTRATEGIA INTERNACIONAL',
      color: '#0369A1',
      bgColor: '#0369A10D',
      icon: '🌐',
      borderColor: 'border-l-blue-700',
    };

  // Valoración de marca
  if (/valor.*marca|valoración.*activo|royalty.*rate|método.*valoración/i.test(content))
    return {
      label: 'VALORACIÓN DE ACTIVO',
      color: '#B45309',
      bgColor: '#B453090D',
      icon: '📈',
      borderColor: 'border-l-amber-700',
    };

  // Informe de vigilancia
  if (/vigilancia|alerta.*detectada|monitorización|watch.*report/i.test(content))
    return {
      label: 'INFORME DE VIGILANCIA',
      color: '#7C3AED',
      bgColor: '#7C3AED0D',
      icon: '👁️',
      borderColor: 'border-l-purple-600',
    };

  return null;
}

// ── COMPONENTES MARKDOWN PERSONALIZADOS ─────────────────────

export const geniusMarkdownComponents = {
  table: ({ children }: any) => (
    <div className="my-3 overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }: any) => (
    <thead className="bg-gradient-to-r from-slate-50 to-slate-100">{children}</thead>
  ),
  th: ({ children }: any) => (
    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
      {children}
    </th>
  ),
  tbody: ({ children }: any) => (
    <tbody className="divide-y divide-slate-100">{children}</tbody>
  ),
  tr: ({ children }: any) => (
    <tr className="hover:bg-slate-50/50 transition-colors">{children}</tr>
  ),
  td: ({ children }: any) => (
    <td className="px-3 py-2 text-slate-700">{children ?? <span className="text-slate-400">—</span>}</td>
  ),
  h2: ({ children }: any) => (
    <h2 className="text-base font-semibold text-slate-800 mt-4 mb-2 pb-1 border-b border-slate-200">
      {children}
    </h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="text-sm font-semibold text-slate-800 mt-3 mb-1.5">{children}</h3>
  ),
  ul: ({ children }: any) => (
    <ul className="my-2 space-y-1 text-slate-700">{children}</ul>
  ),
  ol: ({ children }: any) => (
    <ol className="my-2 space-y-1 text-slate-700 list-decimal list-inside">{children}</ol>
  ),
  li: ({ children }: any) => (
    <li className="flex items-start gap-1.5 text-sm leading-relaxed">
      <span className="text-amber-500 mt-0.5 shrink-0">•</span>
      <span>{children}</span>
    </li>
  ),
  strong: ({ children }: any) => (
    <strong className="font-semibold text-slate-800">{children}</strong>
  ),
  em: ({ children }: any) => (
    <em className="italic text-slate-600">{children}</em>
  ),
  blockquote: ({ children }: any) => (
    <blockquote className="my-3 border-l-3 border-amber-500 pl-3 text-slate-600 italic">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-3 border-slate-200" />,
  p: ({ children }: any) => {
    const text = typeof children === 'string' ? children : '';
    if (text.startsWith('NOTA LEGAL:') || text.startsWith('⚠️')) {
      return (
        <p className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 leading-relaxed">
          {children}
        </p>
      );
    }
    return <p className="text-sm text-slate-700 leading-relaxed my-1.5">{children}</p>;
  },
  code: ({ inline, children }: any) => {
    if (inline) {
      return (
        <code className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-xs font-mono">
          {children}
        </code>
      );
    }
    return (
      <pre className="my-3 p-3 rounded-lg bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto">
        <code>{children}</code>
      </pre>
    );
  },
  a: ({ href, children }: any) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-amber-600 hover:text-amber-700 underline underline-offset-2"
    >
      {children}
    </a>
  ),
};

// ── PARSER DE MENSAJE ────────────────────────────────────────

function parseGeniusMessage(content: string): {
  mainContent: string;
  linkingQuestion: boolean;
  legalNote: string | null;
} {
  let mainContent = content;

  const linkingRegex =
    /¿(Desea|Quiere|Le gustaría)\s+(vincular|asociar|añadir)\s+(esta consulta|esta conversación)[^?]*\?/i;
  const hasLinkingQuestion = linkingRegex.test(mainContent);
  if (hasLinkingQuestion) {
    mainContent = mainContent.replace(linkingRegex, '').trim();
  }

  const legalRegex = /NOTA LEGAL:[\s\S]*$/i;
  const legalMatch = mainContent.match(legalRegex);
  const legalNote = legalMatch
    ? legalMatch[0].replace(/^NOTA LEGAL:/i, '').trim()
    : null;
  if (legalMatch) {
    mainContent = mainContent.replace(legalRegex, '').trim();
  }

  return { mainContent, linkingQuestion: hasLinkingQuestion, legalNote };
}

// ── COMPONENTE PRINCIPAL ─────────────────────────────────────

interface GeniusMessageRendererProps {
  content: string;
  conversationId?: string;
  currentMatterId?: string | null;
  currentMatterRef?: string | null;
  matters?: Array<{ id: string; reference: string; title: string }>;
  onLinkToMatter?: (matterId: string, matterRef: string) => void;
}

export function GeniusMessageRenderer({
  content,
  conversationId,
  currentMatterId,
  currentMatterRef,
  matters = [],
  onLinkToMatter,
}: GeniusMessageRendererProps) {
  const [selectedMatterIdLocal, setSelectedMatterIdLocal] = useState('');
  const [dismissed, setDismissed] = useState(false);
  const [linked, setLinked] = useState(false);

  const responseType = getResponseType(content);
  const { mainContent, linkingQuestion, legalNote } = parseGeniusMessage(content);

  const handleLinkConfirm = async () => {
    if (!selectedMatterIdLocal || !onLinkToMatter) return;
    const matter = matters.find((m) => m.id === selectedMatterIdLocal);
    if (!matter) return;
    await onLinkToMatter(matter.id, matter.reference);
    setLinked(true);
  };

  return (
    <div
      className={`space-y-3 ${
        responseType ? `border-l-4 ${responseType.borderColor} pl-3` : ''
      }`}
    >
      {/* Header tipo de respuesta */}
      {responseType && (
        <div
          className="flex items-center gap-2 mb-3 pb-2 px-2 py-1.5 rounded-md"
          style={{ backgroundColor: responseType.bgColor }}
        >
          <span className="text-sm">{responseType.icon}</span>
          <span
            className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: responseType.color }}
          >
            {responseType.label}
          </span>
        </div>
      )}

      {/* Contenido principal */}
      <div className="text-sm leading-relaxed">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={geniusMarkdownComponents}
        >
          {mainContent}
        </ReactMarkdown>
      </div>

      {/* TIPO B — Vinculación a expediente */}
      {linkingQuestion &&
        !currentMatterId &&
        !dismissed &&
        !linked &&
        onLinkToMatter && (
          <div className="mt-4 border border-amber-200 rounded-lg bg-amber-50 p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-amber-600 text-sm">📁</span>
              <span className="text-xs font-semibold text-amber-800 uppercase tracking-wide">
                Vincular al historial del expediente
              </span>
            </div>
            <p className="text-xs text-amber-700 mb-3">
              ¿Desea registrar esta consulta en el expediente correspondiente?
            </p>
            <div className="flex gap-2">
              {matters.length > 0 ? (
                <select
                  value={selectedMatterIdLocal}
                  onChange={(e) => setSelectedMatterIdLocal(e.target.value)}
                  className="flex-1 text-xs border border-amber-300 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="">Seleccionar expediente...</option>
                  {matters.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.reference} — {m.title}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={selectedMatterIdLocal}
                  onChange={(e) => setSelectedMatterIdLocal(e.target.value)}
                  placeholder="Referencia del expediente"
                  className="flex-1 text-xs border border-amber-300 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              )}
              <button
                onClick={handleLinkConfirm}
                disabled={!selectedMatterIdLocal}
                className="text-xs bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-md font-medium transition-colors"
              >
                Vincular
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="text-xs text-amber-600 hover:text-amber-700 px-2 py-1.5 font-medium transition-colors"
              >
                Ahora no
              </button>
            </div>
          </div>
        )}

      {/* Badge expediente vinculado */}
      {(linked || currentMatterId) && (
        <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
          <span className="text-emerald-600 text-sm">✓</span>
          <span className="text-xs text-emerald-700 font-medium">
            Consulta indexada al expediente{' '}
            <strong>{currentMatterRef ?? currentMatterId}</strong>
            {' '}— forma parte del historial del expediente.
          </span>
        </div>
      )}

      {/* TIPO C — Nota legal */}
      {legalNote && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-[11px] text-slate-400 italic leading-relaxed">
            ⓘ {legalNote} Análisis generado por IA con carácter informativo. No constituye
            asesoramiento jurídico ni sustituye la actuación de abogado colegiado.
          </p>
        </div>
      )}
    </div>
  );
}
