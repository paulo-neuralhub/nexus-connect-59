import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Landmark, Loader2, CheckCircle, Info } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  bankAccountId?: string;
  onConnected?: () => void;
}

export default function FintocConnect({ bankAccountId, onConnected }: Props) {
  const [open, setOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    // Simulate Fintoc widget connection in sandbox mode
    await new Promise(r => setTimeout(r, 2000));
    setConnecting(false);
    setConnected(true);
    toast.info('Fintoc en modo sandbox. Configura tu API key para conectar tu banco real.', {
      duration: 6000,
    });
    onConnected?.();
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Landmark className="w-4 h-4 mr-2" />
        Conectar banco (Fintoc)
        <Badge variant="outline" className="ml-2 text-[10px]">Sandbox</Badge>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Landmark className="w-5 h-5" />
              Conexión bancaria — Fintoc
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10">
              <CardContent className="pt-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">Modo Sandbox</p>
                  <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                    No hay API key de Fintoc configurada. Se simularán los datos bancarios para demostración.
                  </p>
                </div>
              </CardContent>
            </Card>

            {!connected ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Fintoc permite conectar tu cuenta bancaria para sincronizar movimientos automáticamente.
                  Compatible con bancos españoles y latinoamericanos.
                </p>
                <div className="space-y-2 text-sm">
                  <p>✓ Sincronización automática diaria</p>
                  <p>✓ Conciliación inteligente con facturas</p>
                  <p>✓ Encriptación de extremo a extremo</p>
                </div>
                <Button className="w-full" onClick={handleConnect} disabled={connecting}>
                  {connecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Conectando…
                    </>
                  ) : (
                    <>
                      <Landmark className="w-4 h-4 mr-2" />
                      Simular conexión (Sandbox)
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center py-6 gap-3">
                <CheckCircle className="w-10 h-10 text-green-500" />
                <p className="font-medium">Conexión simulada exitosa</p>
                <p className="text-sm text-muted-foreground text-center">
                  En producción, tus movimientos se sincronizarán automáticamente.
                </p>
                <Button variant="outline" onClick={() => setOpen(false)}>Cerrar</Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
