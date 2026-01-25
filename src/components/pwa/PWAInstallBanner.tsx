import { X, Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWA, usePWAInstallVisits } from '@/hooks/usePWA';
import { cn } from '@/lib/utils';

export function PWAInstallBanner() {
  const { canInstall, isInstalled, isIOS, install } = usePWA();
  const { shouldShowPrompt, dismissInstall } = usePWAInstallVisits();

  if (isInstalled || (!canInstall && !isIOS) || !shouldShowPrompt) {
    return null;
  }

  const handleInstall = async () => {
    if (isIOS) {
      // Can't programmatically install on iOS, show instructions
      return;
    }
    await install();
  };

  return (
    <div className={cn(
      "fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm",
      "bg-card border rounded-xl shadow-xl p-4 animate-in slide-in-from-bottom-4"
    )}>
      <button
        onClick={dismissInstall}
        className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-muted transition-colors"
        aria-label="Cerrar"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>

      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Smartphone className="h-6 w-6 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground">Instala IP-NEXUS</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isIOS 
              ? 'Toca "Compartir" y luego "Añadir a pantalla de inicio"'
              : 'Accede más rápido y recibe notificaciones'
            }
          </p>

          {!isIOS && (
            <Button 
              size="sm" 
              className="mt-3 gap-2"
              onClick={handleInstall}
            >
              <Download className="h-4 w-4" />
              Instalar ahora
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
