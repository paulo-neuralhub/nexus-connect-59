import { AlertCircle, Bot, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface AIDisclaimerProps {
  message: string;
  variant?: 'info' | 'warning' | 'error';
  dismissible?: boolean;
  onDismiss?: () => void;
}

export function AIDisclaimer({
  message,
  variant = 'info',
  dismissible = false,
  onDismiss
}: AIDisclaimerProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  const variantStyles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-200',
    warning: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200',
    error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-800 dark:text-red-200'
  };

  const Icon = variant === 'error' ? AlertCircle : variant === 'warning' ? AlertCircle : Info;

  return (
    <div className={`mb-4 p-3 border rounded-lg ${variantStyles[variant]}`}>
      <div className="flex items-start gap-2">
        <Bot className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm">{message}</p>
        </div>
        {dismissible && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0" 
            onClick={handleDismiss}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
