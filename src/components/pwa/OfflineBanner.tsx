import { WifiOff, Wifi } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

export function OfflineBanner() {
  const { isOnline } = useOnlineStatus();
  const [show, setShow] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShow(true);
      setWasOffline(true);
    } else if (wasOffline) {
      // Show "back online" briefly
      const timeout = setTimeout(() => {
        setShow(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [isOnline, wasOffline]);

  if (!show) return null;

  return (
    <div className={cn(
      "fixed top-0 left-0 right-0 z-[100] px-4 py-2 text-center text-sm font-medium transition-all",
      isOnline 
        ? "bg-success text-success-foreground" 
        : "bg-destructive text-destructive-foreground"
    )}>
      <div className="flex items-center justify-center gap-2">
        {isOnline ? (
          <>
            <Wifi className="h-4 w-4" />
            <span>Conexión restaurada</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <span>Sin conexión - Mostrando datos guardados</span>
          </>
        )}
      </div>
    </div>
  );
}
