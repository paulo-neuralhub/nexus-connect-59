import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Shield, Loader2, CheckCircle, XCircle, Send, QrCode, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useFiscalConfig } from '@/hooks/finance/useFiscalConfig';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Props {
  invoiceId: string;
  verifactuStatus: string | null;
  verifactuHash: string | null;
  verifactuQr: string | null;
}

export default function VerifactuInvoiceSection({ invoiceId, verifactuStatus, verifactuHash, verifactuQr }: Props) {
  const { data: fiscalConfig } = useFiscalConfig();
  const queryClient = useQueryClient();
  const [sending, setSending] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [showResponse, setShowResponse] = useState(false);

  // Get verifactu record for this invoice
  const { data: verifactuRecord } = useQuery({
    queryKey: ['verifactu-record', invoiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('verifactu_records')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!invoiceId,
  });

  if (!fiscalConfig?.verifactu_enabled) return null;

  const handleSend = async () => {
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('finance-verifactu', {
        body: { invoice_id: invoiceId },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Factura enviada a Verifactu (Sandbox)');
        queryClient.invalidateQueries({ queryKey: ['invoice'] });
        queryClient.invalidateQueries({ queryKey: ['verifactu-record', invoiceId] });
      } else {
        toast.error(data?.error || 'Error al enviar a Verifactu');
      }
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  const status = verifactuStatus || verifactuRecord?.submission_status;
  const qrData = verifactuQr || verifactuRecord?.verifactu_qr_data;

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Verifactu (AEAT)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!status && (
          <Button
            className="w-full"
            variant="outline"
            onClick={handleSend}
            disabled={sending}
          >
            {sending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enviando…</>
            ) : (
              <><Send className="h-4 w-4 mr-2" />Enviar a Verifactu</>
            )}
          </Button>
        )}

        {status === 'accepted' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Enviada a Verifactu</span>
              <Badge className="text-[10px]">Sandbox</Badge>
            </div>
            {verifactuHash && (
              <p className="text-xs text-muted-foreground font-mono truncate">
                Hash: {verifactuHash.slice(0, 24)}…
              </p>
            )}
            <div className="flex gap-2">
              {qrData && (
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowQr(true)}>
                  <QrCode className="h-3 w-3 mr-1" />QR
                </Button>
              )}
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowResponse(true)}>
                <FileText className="h-3 w-3 mr-1" />AEAT
              </Button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">Error Verifactu</span>
            </div>
            {verifactuRecord?.error_description && (
              <p className="text-xs text-muted-foreground">{verifactuRecord.error_description}</p>
            )}
            <Button variant="outline" size="sm" className="w-full" onClick={handleSend} disabled={sending}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reintentar'}
            </Button>
          </div>
        )}

        {status === 'pending' && (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
            <span className="text-sm text-muted-foreground">Pendiente de respuesta AEAT</span>
          </div>
        )}

        {/* QR Dialog */}
        <Dialog open={showQr} onOpenChange={setShowQr}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>QR de verificación Verifactu</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-4">
              {qrData && (
                <img src={qrData} alt="QR Verifactu" className="w-48 h-48" />
              )}
              <p className="text-xs text-center text-muted-foreground">
                Factura verificable en sede.agenciatributaria.gob.es
              </p>
            </div>
          </DialogContent>
        </Dialog>

        {/* AEAT Response Dialog */}
        <Dialog open={showResponse} onOpenChange={setShowResponse}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Respuesta AEAT</DialogTitle>
            </DialogHeader>
            <div className="bg-muted rounded-lg p-4 text-xs font-mono whitespace-pre-wrap max-h-64 overflow-auto">
              {verifactuRecord?.aeat_response
                ? JSON.stringify(verifactuRecord.aeat_response, null, 2)
                : 'Sin respuesta registrada'}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
