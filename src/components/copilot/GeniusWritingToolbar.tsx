/**
 * GeniusWritingToolbar — Floating AI writing toolbar for text selection
 * Appears above selected text in email composers / text areas
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Check, X, RotateCcw, ChevronDown, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGeniusWriting, type WritingAction } from '@/hooks/copilot/useGeniusWriting';
import { useTextSelection } from '@/hooks/copilot/useTextSelection';

/* ── Action definitions ─────────────────────────────────────── */
const TOOLBAR_ACTIONS: { 
  id: WritingAction; 
  icon: string; 
  label: string;
  subActions?: { id: string; label: string }[];
}[] = [
  { id: 'rewrite', icon: '✦', label: 'Reescribir' },
  { id: 'correct', icon: '🔧', label: 'Corregir' },
  { id: 'improve', icon: '📈', label: 'Mejorar' },
  { id: 'simplify', icon: '📝', label: 'Simplificar' },
  { 
    id: 'translate', icon: '🌐', label: 'Traducir',
    subActions: [
      { id: 'en', label: 'ES → EN' },
      { id: 'pt', label: 'ES → PT' },
      { id: 'fr', label: 'ES → FR' },
      { id: 'es', label: 'EN → ES' },
    ]
  },
  { id: 'expand', icon: '📏', label: 'Más largo' },
  { id: 'shorten', icon: '📐', label: 'Más corto' },
  { id: 'legal_tone', icon: '⚖️', label: 'Tono legal' },
];

/* ── Props ──────────────────────────────────────────────────── */
interface GeniusWritingToolbarProps {
  containerRef: React.RefObject<HTMLElement | null>;
  onApplyText?: (newText: string) => void;
  context?: Record<string, string>;
}

/* ── Diff View ──────────────────────────────────────────────── */
function GeniusDiffView({ 
  original, result, onAccept, onDiscard, onRetry, isRetrying 
}: {
  original: string;
  result: string;
  onAccept: () => void;
  onDiscard: () => void;
  onRetry: () => void;
  isRetrying: boolean;
}) {
  return (
    <div className="w-[380px] max-h-[300px] overflow-y-auto">
      {/* Original */}
      <div className="mb-2">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Original</span>
        <div className="mt-1 p-2 rounded-md bg-red-50 text-sm text-red-800 line-through leading-relaxed">
          {original}
        </div>
      </div>
      {/* Result */}
      <div className="mb-3">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Sugerencia GENIUS</span>
        <div className="mt-1 p-2 rounded-md bg-green-50 text-sm text-green-800 leading-relaxed">
          {result}
        </div>
      </div>
      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onAccept}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
        >
          <Check className="w-3 h-3" /> Aceptar
        </button>
        <button
          onClick={onDiscard}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
        >
          <X className="w-3 h-3" /> Descartar
        </button>
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className="inline-flex items-center gap-1 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          <RotateCcw className={cn("w-3 h-3", isRetrying && "animate-spin")} /> Reintentar
        </button>
      </div>
      <p className="text-[10px] text-muted-foreground mt-2">✦ Generado por GENIUS — revisión profesional requerida</p>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────── */
export function GeniusWritingToolbar({ containerRef, onApplyText, context }: GeniusWritingToolbarProps) {
  const { text, rect, isActive, clearSelection } = useTextSelection(containerRef);
  const { processText, isProcessing, lastResult, clearResult } = useGeniusWriting();
  const [showTranslate, setShowTranslate] = useState(false);
  const [phase, setPhase] = useState<'actions' | 'loading' | 'diff'>('actions');
  const [currentAction, setCurrentAction] = useState<WritingAction | null>(null);
  const [diffResult, setDiffResult] = useState<string>('');
  const [diffOriginal, setDiffOriginal] = useState<string>('');
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  // Calculate position
  useEffect(() => {
    if (!rect || !isActive) return;
    const top = rect.top + window.scrollY - 52;
    const left = Math.max(8, Math.min(rect.left + rect.width / 2 - 200, window.innerWidth - 420));
    setPos({ top, left });
  }, [rect, isActive]);

  // Reset when selection clears
  useEffect(() => {
    if (!isActive && phase !== 'diff') {
      setPhase('actions');
      setShowTranslate(false);
      clearResult();
    }
  }, [isActive, phase, clearResult]);

  const handleAction = useCallback(async (action: WritingAction, targetLang?: string) => {
    const selectedText = text;
    if (!selectedText) return;

    setDiffOriginal(selectedText);
    setCurrentAction(action);
    setPhase('loading');
    setShowTranslate(false);

    const result = await processText(action, selectedText, {
      targetLanguage: targetLang,
      context,
    });

    if (result) {
      setDiffResult(result);
      setPhase('diff');
    } else {
      setPhase('actions');
    }
  }, [text, processText, context]);

  const handleAccept = useCallback(() => {
    if (diffResult && onApplyText) {
      onApplyText(diffResult);
    }
    setPhase('actions');
    clearSelection();
    clearResult();
  }, [diffResult, onApplyText, clearSelection, clearResult]);

  const handleDiscard = useCallback(() => {
    setPhase('actions');
    clearResult();
  }, [clearResult]);

  const handleRetry = useCallback(() => {
    if (currentAction && diffOriginal) {
      handleAction(currentAction);
    }
  }, [currentAction, diffOriginal, handleAction]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'r') {
        e.preventDefault();
        if (isActive && text) handleAction('rewrite');
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isActive, text, handleAction]);

  if (!isActive && phase !== 'diff' && phase !== 'loading') return null;

  return createPortal(
    <div
      ref={toolbarRef}
      className={cn(
        "fixed z-[10000] animate-in fade-in slide-in-from-bottom-1 duration-150",
        (phase === 'diff' || phase === 'loading') && "p-3 bg-white rounded-xl shadow-xl border border-border"
      )}
      style={{ top: pos.top, left: pos.left }}
      onMouseDown={(e) => e.preventDefault()} // prevent clearing selection
    >
      {phase === 'actions' && (
        <div className="flex items-center gap-0 bg-white rounded-full shadow-lg border border-border h-10 px-1 relative">
          {TOOLBAR_ACTIONS.map((action, i) => (
            <div key={action.id} className="relative flex items-center">
              {i > 0 && <div className="w-px h-5 bg-border" />}
              {action.subActions ? (
                <div className="relative">
                  <button
                    onClick={() => setShowTranslate(!showTranslate)}
                    className="flex items-center gap-1 px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground rounded-full transition-colors"
                  >
                    <span className="text-xs">{action.icon}</span>
                    <span className="text-xs">{action.label}</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {showTranslate && (
                    <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-border py-1 min-w-[120px] z-10">
                      {action.subActions.map(sub => (
                        <button
                          key={sub.id}
                          onClick={() => handleAction('translate', sub.id)}
                          className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted/50 transition-colors"
                        >
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => handleAction(action.id)}
                  className="flex items-center gap-1 px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground rounded-full transition-colors"
                >
                  <span className="text-xs">{action.icon}</span>
                  <span className="text-xs">{action.label}</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {phase === 'loading' && (
        <div className="flex items-center gap-2 py-2">
          <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
          <span className="text-sm text-muted-foreground">
            ✦ GENIUS está {
              currentAction === 'rewrite' ? 'reescribiendo' :
              currentAction === 'correct' ? 'corrigiendo' :
              currentAction === 'improve' ? 'mejorando' :
              currentAction === 'simplify' ? 'simplificando' :
              currentAction === 'translate' ? 'traduciendo' :
              currentAction === 'expand' ? 'expandiendo' :
              currentAction === 'shorten' ? 'condensando' :
              currentAction === 'legal_tone' ? 'ajustando el tono legal' :
              'procesando'
            }...
          </span>
        </div>
      )}

      {phase === 'diff' && (
        <GeniusDiffView
          original={diffOriginal}
          result={diffResult}
          onAccept={handleAccept}
          onDiscard={handleDiscard}
          onRetry={handleRetry}
          isRetrying={isProcessing}
        />
      )}
    </div>,
    document.body
  );
}

/* ── Full Draft Menu (for empty composers) ──────────────────── */
interface GeniusFullDraftMenuProps {
  onDraftGenerated: (subject: string, body: string) => void;
  context?: Record<string, string>;
}

const DRAFT_TYPES = [
  { id: 'deadline_reminder', label: 'Recordatorio de plazo', icon: '⏰' },
  { id: 'status_update', label: 'Actualización de estado', icon: '📋' },
  { id: 'client_briefing', label: 'Briefing al cliente', icon: '📊' },
  { id: 'reply', label: 'Respuesta', icon: '↩️' },
  { id: 'renewal_reminder', label: 'Recordatorio renovación', icon: '🔄' },
  { id: 'proof_of_use', label: 'Prueba de uso', icon: '📄' },
];

export function GeniusFullDraftMenu({ onDraftGenerated, context }: GeniusFullDraftMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'menu' | 'type' | 'freeform'>('menu');
  const [selectedType, setSelectedType] = useState('');
  const [freeformPrompt, setFreeformPrompt] = useState('');
  const { processText, isProcessing } = useGeniusWriting();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setMode('menu');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const generateDraft = async (type: string, prompt?: string) => {
    const result = await processText('full_draft', prompt || '', {
      draftType: type,
      draftPrompt: prompt,
      context,
    });
    if (result) {
      // Try to extract subject from result
      const subjectMatch = result.match(/(?:asunto|subject)[:\s]*(.+?)(?:\n|<br|<\/)/i);
      const subject = subjectMatch?.[1]?.trim() || '';
      const body = result.replace(/(?:asunto|subject)[:\s]*.+?(?:\n|<br|<\/)/i, '').trim();
      onDraftGenerated(subject, body);
      setIsOpen(false);
      setMode('menu');
    }
  };

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'g') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <div ref={menuRef} className="relative inline-block">
      <button
        onClick={() => { setIsOpen(!isOpen); setMode('menu'); }}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-dashed border-amber-400/60 text-amber-700 hover:bg-amber-50/50 transition-colors"
      >
        <Sparkles className="w-3 h-3" />
        GENIUS
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-xl border border-border min-w-[280px] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150 z-[10001]">
          {mode === 'menu' && (
            <div className="p-2">
              <button
                onClick={() => setMode('type')}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left hover:bg-muted/50 rounded-lg transition-colors"
              >
                <span>📧</span>
                <span>Redactar email completo</span>
              </button>
              <button
                onClick={() => setMode('freeform')}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left hover:bg-muted/50 rounded-lg transition-colors"
              >
                <span>💬</span>
                <span>Describir lo que quieres</span>
              </button>
            </div>
          )}

          {mode === 'type' && (
            <div className="p-2">
              <p className="text-xs font-medium text-muted-foreground px-3 py-1.5 uppercase tracking-wider">Tipo de email</p>
              {DRAFT_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => generateDraft(type.id)}
                  disabled={isProcessing}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted/50 rounded-lg transition-colors disabled:opacity-50"
                >
                  <span>{type.icon}</span>
                  <span>{type.label}</span>
                </button>
              ))}
              {isProcessing && (
                <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Generando borrador...
                </div>
              )}
              <button
                onClick={() => setMode('menu')}
                className="w-full text-xs text-muted-foreground px-3 py-1.5 hover:text-foreground transition-colors text-left"
              >
                ← Volver
              </button>
            </div>
          )}

          {mode === 'freeform' && (
            <div className="p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Describe qué email necesitas</p>
              <textarea
                value={freeformPrompt}
                onChange={(e) => setFreeformPrompt(e.target.value)}
                placeholder="Ej: Email al cliente informando que su marca fue aprobada..."
                className="w-full text-sm border border-border rounded-lg p-2 min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                autoFocus
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => generateDraft('freeform', freeformPrompt)}
                  disabled={isProcessing || !freeformPrompt.trim()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-[#00b4d8] to-[#00d4aa] text-white disabled:opacity-50 transition-opacity"
                >
                  {isProcessing ? (
                    <><Loader2 className="w-3 h-3 animate-spin" /> Generando...</>
                  ) : (
                    <><Sparkles className="w-3 h-3" /> Generar borrador</>
                  )}
                </button>
                <button
                  onClick={() => setMode('menu')}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Volver
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
