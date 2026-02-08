// ============================================================
// IP-NEXUS HELP - STEP-BY-STEP VISUAL COMPONENT
// ============================================================

import { Lightbulb, AlertTriangle } from 'lucide-react';
import { ReactNode } from 'react';

interface HelpStepProps {
  number: number;
  title: string;
  description: string;
  screenshotComponent?: ReactNode;
  tip?: string;
  warning?: string;
}

export function HelpStep({ number, title, description, screenshotComponent, tip, warning }: HelpStepProps) {
  return (
    <div className="relative pl-16 pb-10 last:pb-0">
      {/* Connector line */}
      <div className="absolute left-[22px] top-12 bottom-0 w-px bg-gradient-to-b from-primary/30 to-transparent" />

      {/* Step number */}
      <div className="absolute left-0 top-0 w-11 h-11 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
        <span className="text-sm font-bold text-primary-foreground">{number}</span>
      </div>

      <div>
        <h4 className="text-base font-semibold text-foreground mb-2">{title}</h4>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">{description}</p>

        {/* Screenshot mockup with browser frame */}
        {screenshotComponent && (
          <div className="rounded-xl overflow-hidden border border-border shadow-sm mb-4">
            <div className="bg-muted px-4 py-2 flex items-center gap-2 border-b border-border">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-destructive/40" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-background rounded-md px-3 py-1 text-[10px] text-muted-foreground border border-border">
                  app.ip-nexus.com
                </div>
              </div>
            </div>
            <div className="bg-muted/30 p-6">
              {screenshotComponent}
            </div>
          </div>
        )}

        {/* Tip callout */}
        {tip && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/50">
            <Lightbulb className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Consejo</span>
              <p className="text-sm text-emerald-800 dark:text-emerald-300 mt-0.5">{tip}</p>
            </div>
          </div>
        )}

        {/* Warning callout */}
        {warning && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100 dark:bg-amber-950/30 dark:border-amber-900/50">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Importante</span>
              <p className="text-sm text-amber-800 dark:text-amber-300 mt-0.5">{warning}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
