import { formatDate } from '@/lib/utils';

interface ExpiryIndicatorProps {
  date: string | null | undefined;
}

export function ExpiryIndicator({ date }: ExpiryIndicatorProps) {
  if (!date) {
    return <span className="text-muted-foreground">—</span>;
  }
  
  const days = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  
  let colorClass = 'text-green-600';
  if (days <= 0) {
    colorClass = 'text-destructive font-semibold';
  } else if (days <= 30) {
    colorClass = 'text-destructive font-medium';
  } else if (days <= 90) {
    colorClass = 'text-yellow-600';
  }
  
  return (
    <span className={colorClass}>
      {formatDate(date)}
      {days <= 90 && days > 0 && (
        <span className="ml-1 text-xs opacity-80">({days}d)</span>
      )}
      {days <= 0 && (
        <span className="ml-1 text-xs">(vencido)</span>
      )}
    </span>
  );
}
