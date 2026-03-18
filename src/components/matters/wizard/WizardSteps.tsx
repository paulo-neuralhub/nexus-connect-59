// ============================================================
// IP-NEXUS - WIZARD STEPS COMPONENT (SILK Design System)
// L135: Premium stepper with SILK neumorphic design
// ============================================================

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export interface WizardStep {
  number: number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface WizardStepsProps {
  steps: WizardStep[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export function WizardSteps({ steps, currentStep, onStepClick }: WizardStepsProps) {
  const progressPercent = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="relative px-4 py-8">
      <div className="flex items-center justify-between relative">
        {/* Background connector line */}
        <div 
          className="absolute top-7 left-16 right-16 h-1 rounded-full"
          style={{ background: 'hsl(var(--muted))' }}
        />
        
        {/* Animated progress line */}
        <motion.div
          className="absolute top-7 left-16 h-1 rounded-full overflow-hidden"
          style={{ 
            maxWidth: 'calc(100% - 8rem)',
            background: 'linear-gradient(90deg, #10b981 0%, #00b4d8 100%)',
            boxShadow: '0 0 8px rgba(16, 185, 129, 0.4)',
          }}
          initial={{ width: '0%' }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
        </motion.div>

        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;
          const isClickable = onStepClick && step.number < currentStep;

          return (
            <div
              key={step.number}
              className={cn(
                "flex flex-col items-center relative z-10",
                isClickable && "cursor-pointer group"
              )}
              onClick={() => isClickable && onStepClick?.(step.number)}
            >
              {/* Step Circle - SILK Design */}
              <motion.div
                className={cn(
                  "relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300"
                )}
                style={{
                  background: isCompleted 
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : isCurrent
                    ? 'linear-gradient(135deg, #00b4d8 0%, #0891b2 100%)'
                    : 'hsl(var(--muted))',
                  boxShadow: isCompleted
                    ? '0 8px 24px rgba(16, 185, 129, 0.35)'
                    : isCurrent
                    ? '0 8px 24px rgba(0, 180, 216, 0.4), 0 0 0 4px rgba(0, 180, 216, 0.15)'
                    : 'inset 2px 2px 4px rgba(255, 255, 255, 0.8), inset -2px -2px 4px rgba(0, 0, 0, 0.05)',
                }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ 
                  scale: isCurrent ? 1.1 : 1,
                  opacity: 1
                }}
                transition={{ duration: 0.3, type: 'spring', stiffness: 200 }}
                whileHover={isClickable ? { scale: 1.08 } : undefined}
                whileTap={isClickable ? { scale: 0.95 } : undefined}
              >
                {/* Inner highlight for 3D effect */}
                {(isCompleted || isCurrent) && (
                  <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
                )}
                
                {/* Pulse animation for current step */}
                {isCurrent && (
                  <motion.div 
                    className="absolute inset-0 rounded-full"
                    style={{ background: 'rgba(0, 180, 216, 0.3)' }}
                    animate={{ 
                      scale: [1, 1.15, 1],
                      opacity: [0.5, 0.2, 0.5]
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}

                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.4, delay: 0.1, type: 'spring' }}
                  >
                    <Check className="h-6 w-6 text-white relative z-10" strokeWidth={3} />
                  </motion.div>
                ) : (
                  <Icon className={cn(
                    "h-5 w-5 relative z-10 transition-colors",
                    isCurrent || isCompleted ? "text-white" : "text-muted-foreground"
                  )} />
                )}
              </motion.div>
              
              {/* Step Label */}
              <motion.div
                className="mt-3 text-center max-w-[100px]"
                initial={{ opacity: 0.5, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <span
                  className={cn(
                    "text-sm font-semibold block transition-colors",
                    isCurrent 
                      ? "text-cyan-700" 
                      : isCompleted 
                      ? "text-foreground" 
                      : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
                {/* Step number subtitle */}
                <span className="text-xs text-muted-foreground">
                  Paso {step.number}
                </span>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
