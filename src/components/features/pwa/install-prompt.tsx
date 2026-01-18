import { useState } from 'react';
import { Download, X, Smartphone, WifiOff, RefreshCw } from 'lucide-react';
import { usePWA } from '@/hooks/use-pwa';
import { cn } from '@/lib/utils';

export function InstallPrompt() {
  const { isInstallable, isInstalled, install } = usePWA();
  const [dismissed, setDismissed] = useState(false);
  
  if (!isInstallable || isInstalled || dismissed) return null;
  
  const handleInstall = async () => {
    const success = await install();
    if (!success) {
      setDismissed(true);
    }
  };
  
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-card rounded-xl shadow-xl border p-4 z-50 animate-in slide-in-from-bottom-4">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 p-1 hover:bg-muted rounded"
      >
        <X className="w-4 h-4 text-muted-foreground" />
      </button>
      
      <div className="flex gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-primary to-pink-400 rounded-xl flex items-center justify-center shrink-0">
          <Smartphone className="w-6 h-6 text-white" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">Instalar IP-NEXUS</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Accede más rápido y recibe notificaciones
          </p>
          
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleInstall}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 flex items-center gap-1"
            >
              <Download className="w-4 h-4" /> Instalar
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-lg"
            >
              Ahora no
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function UpdatePrompt() {
  const { updateAvailable, update } = usePWA();
  
  if (!updateAvailable) return null;
  
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground rounded-lg shadow-lg px-4 py-3 z-50 flex items-center gap-3">
      <RefreshCw className="w-4 h-4" />
      <span className="text-sm">Nueva versión disponible</span>
      <button
        onClick={update}
        className="px-3 py-1 bg-primary-foreground text-primary text-sm font-medium rounded hover:bg-primary-foreground/90"
      >
        Actualizar
      </button>
    </div>
  );
}

export function OfflineIndicator() {
  const { isOnline } = usePWA();
  
  if (isOnline) return null;
  
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-destructive text-destructive-foreground rounded-lg shadow-lg px-4 py-2 z-50 flex items-center gap-2">
      <WifiOff className="w-4 h-4" />
      <span className="text-sm font-medium">Sin conexión</span>
    </div>
  );
}

export function PWAStatus() {
  const { isInstalled, isOnline, updateAvailable } = usePWA();
  
  return (
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      {isInstalled && (
        <div className="flex items-center gap-1.5">
          <Smartphone className="w-4 h-4" />
          <span>App instalada</span>
        </div>
      )}
      <div className={cn(
        "flex items-center gap-1.5",
        !isOnline && "text-destructive"
      )}>
        <div className={cn(
          "w-2 h-2 rounded-full",
          isOnline ? "bg-green-500" : "bg-destructive"
        )} />
        <span>{isOnline ? 'Conectado' : 'Sin conexión'}</span>
      </div>
      {updateAvailable && (
        <div className="flex items-center gap-1.5 text-primary">
          <RefreshCw className="w-4 h-4" />
          <span>Actualización disponible</span>
        </div>
      )}
    </div>
  );
}
