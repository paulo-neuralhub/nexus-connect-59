// ============================================================
// IP-NEXUS - WIZARD STEPS COMPONENT (NIVEL DIOS)
// L127: Premium visual progress indicator for multi-step wizard
// Features: Ring effect, animated progress line, icons per step
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
        {/* Background line - thicker, rounded */}
        <div className="absolute top-7 left-8 right-8 h-1 bg-muted rounded-full" />
        
        {/* Animated progress line - gradient effect */}
        <motion.div
          className="absolute top-7 left-8 h-1 bg-gradient-to-r from-primary via-primary to-primary/80 rounded-full shadow-sm shadow-primary/30"
          style={{ maxWidth: 'calc(100% - 4rem)' }}
          initial={{ width: '0%' }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        />

        {steps.map((step) => {
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
              {/* Step Circle - NIVEL DIOS: w-14, ring effect, shadow */}
              <motion.div
                className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                  isCompleted
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25"
                    : isCurrent
                    ? "bg-primary text-primary-foreground border-primary ring-4 ring-primary/20 shadow-xl shadow-primary/30"
                    : "bg-card text-muted-foreground border-muted-foreground/30",
                  isClickable && "group-hover:border-primary/50 group-hover:shadow-md"
                )}
                initial={{ scale: 0.9, opacity: 0.8 }}
                animate={{ 
                  scale: isCurrent ? 1.15 : 1,
                  opacity: 1
                }}
                transition={{ duration: 0.3, type: 'spring', stiffness: 200 }}
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <Check className="h-7 w-7" strokeWidth={3} />
                  </motion.div>
                ) : (
                  <Icon className="h-6 w-6" />
                )}
              </motion.div>
              
              {/* Step Label - with animation */}
              <motion.span
                className={cn(
                  "mt-3 text-sm font-semibold transition-colors text-center max-w-[80px]",
                  isCurrent ? "text-primary" : 
                  isCompleted ? "text-foreground" : 
                  "text-muted-foreground"
                )}
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
              >
                {step.label}
              </motion.span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
