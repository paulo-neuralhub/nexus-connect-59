// ============================================================
// BriefingCard — Dashboard card showing today's CoPilot briefing
// ============================================================

import { X, ChevronRight, Compass, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useCopilot } from '@/hooks/use-copilot';
import { useAuth } from '@/contexts/auth-context';
import { useState } from 'react';

function PriorityIcon({ type, priority }: { type: string; priority: string }) {
  const iconMap: Record<string, string> = {
    fatal: '🚨', high: '⚠️', spider: '⚠️',
    invoice: '💰', chat: '💬', task: '📌', deadline: '⏰',
  };
  return <span className="text-sm">{iconMap[priority] || iconMap[type] || '📋'}</span>;
}

export function BriefingCard() {
  const {
    briefing, hasBriefing, isPro, name, urgentCount,
    markBriefingRead, dismissBriefing, setPanelState,
  } = useCopilot();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  if (!hasBriefing || dismissed || !briefing?.content_json) return null;

  const items = briefing.content_json.items || [];
  const displayItems = items.slice(0, 3);
  const firstName = profile?.full_name?.split(' ')[0] || 'usuario';

  // Determine greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={cn(
          'rounded-xl border-2 p-4 mb-4',
          isPro
            ? 'border-amber-400/50 bg-[#FFFBF5] dark:bg-amber-900/5'
            : 'border-[#1E293B]/20 bg-blue-50/50 dark:bg-blue-900/5'
        )}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              'h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0',
              isPro
                ? 'bg-gradient-to-br from-amber-500 to-orange-500'
                : 'bg-[#1E293B]'
            )}>
              {isPro ? (
                <Sparkles className="h-5 w-5 text-white" />
              ) : (
                <Compass className="h-5 w-5 text-white" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {greeting}, {firstName}.
              </p>
              <p className="text-xs text-muted-foreground">
                📋 Tienes {urgentCount} items que necesitan atención hoy.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              dismissBriefing();
              setDismissed(true);
            }}
            className="p-1 rounded hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Items */}
        <div className="space-y-1.5 mb-3">
          {displayItems.map((item: any, i: number) => (
            <button
              key={i}
              onClick={() => item.action_url && navigate(item.action_url)}
              className={cn(
                'flex items-center gap-2 w-full text-left text-sm py-1 px-2 rounded-md hover:bg-muted/50 transition-colors',
                item.priority === 'fatal' ? 'text-destructive font-medium' :
                item.priority === 'high' ? 'text-amber-700 dark:text-amber-400' :
                'text-foreground/80'
              )}
            >
              <PriorityIcon type={item.type} priority={item.priority} />
              <span className="truncate">{item.title}</span>
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPanelState('expanded')}
            className={cn(
              'flex items-center gap-1 text-xs font-medium transition-colors',
              isPro
                ? 'text-amber-700 hover:text-amber-900 dark:text-amber-400'
                : 'text-[#1E293B] hover:text-[#0F172A] dark:text-blue-400'
            )}
          >
            Ver análisis completo <ChevronRight className="h-3 w-3" />
          </button>
          <button
            onClick={() => {
              markBriefingRead();
              setDismissed(true);
            }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Marcar como leído
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
