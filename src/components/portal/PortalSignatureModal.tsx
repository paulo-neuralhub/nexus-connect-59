/**
 * PortalSignatureModal — eIDAS-compliant simple electronic signature
 * Requires 2 checkboxes before signing
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, FileText, PenTool } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PortalSignatureModalProps {
  open: boolean;
  onClose: () => void;
  document: {
    id: string;
    name: string;
    file_path: string;
    mime_type: string;
    matter_title?: string;
  };
  signerName: string;
  userId: string;
  onSigned: () => void;
  isImpersonating?: boolean;
}

export function PortalSignatureModal({
  open,
  onClose,
  document,
  signerName,
  userId,
  onSigned,
  isImpersonating = false,
}: PortalSignatureModalProps) {
  const [readConfirmed, setReadConfirmed] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [signing, setSigning] = useState(false);

  const nameMatch = nameInput.trim().toLowerCase() === signerName.trim().toLowerCase();
  const canSign = readConfirmed && legalAccepted && nameMatch && !isImpersonating;

  const handleSign = async () => {
    if (!canSign) return;
    setSigning(true);

    try {
      const { error } = await (supabase.from('matter_documents') as any)
        .update({
          portal_signature_status: 'signed',
          portal_signed_at: new Date().toISOString(),
          portal_signed_by: userId,
          portal_signature_data: {
            signer_name: signerName,
            typed_name: nameInput.trim(),
            timestamp: new Date().toISOString(),
            signature_level: 'simple_eidas',
            disclaimer_shown: true,
            read_confirmed: true,
            legal_accepted: true,
          },
        })
        .eq('id', document.id);

      if (error) throw error;

      toast.success(`Documento firmado correctamente`, {
        description: `Firmado el ${format(new Date(), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}`,
      });
      onSigned();
      onClose();
    } catch (err) {
      console.error('Error signing document:', err);
      toast.error('Error al firmar el documento');
    } finally {
      setSigning(false);
    }
  };

  const resetState = () => {
    setReadConfirmed(false);
    setLegalAccepted(false);
    setNameInput('');
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          resetState();
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenTool className="w-5 h-5" />
            Firmar documento
          </DialogTitle>
        </DialogHeader>

        {/* Document info */}
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
          <FileText className="w-8 h-8 text-muted-foreground shrink-0" />
          <div>
            <p className="font-medium">{document.name}</p>
            {document.matter_title && (
              <p className="text-sm text-muted-foreground">{document.matter_title}</p>
            )}
          </div>
        </div>

        {/* Preview iframe */}
        {document.mime_type === 'application/pdf' && document.file_path && (
          <div className="border rounded-lg overflow-hidden bg-white">
            <iframe
              src={`${document.file_path}#toolbar=0&navpanes=0`}
              title={document.name}
              className="w-full h-[300px]"
            />
          </div>
        )}

        {/* eIDAS Disclaimer */}
        <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-4 space-y-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-800">
                ⚠️ FIRMA ELECTRÓNICA SIMPLE (eIDAS EU 910/2014 Art. 3.10)
              </p>
              <p className="text-amber-700 mt-1">
                Al firmar este documento confirmas que lo has leído y comprendido en su totalidad.
                Esta firma electrónica simple tiene validez legal conforme al Reglamento (UE) Nº 910/2014
                del Parlamento Europeo y del Consejo (eIDAS).
              </p>
            </div>
          </div>
        </div>

        {/* Impersonation block */}
        {isImpersonating && (
          <div className="rounded-lg border border-amber-400 bg-amber-50 p-3 text-sm text-amber-800">
            👁️ Firma desactivada en modo vista previa
          </div>
        )}

        {/* Checkbox 1: Read confirmation */}
        <div className="flex items-start gap-3">
          <Checkbox
            id="read-confirmed"
            checked={readConfirmed}
            onCheckedChange={(v) => setReadConfirmed(v === true)}
            disabled={isImpersonating}
          />
          <Label htmlFor="read-confirmed" className="text-sm leading-snug cursor-pointer">
            He leído y entendido este documento en su totalidad
          </Label>
        </div>

        {/* Name input */}
        <div className="space-y-2">
          <Label htmlFor="signer-name">
            Escribe tu nombre completo para confirmar: <span className="font-semibold">{signerName}</span>
          </Label>
          <Input
            id="signer-name"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder={signerName}
            disabled={isImpersonating}
          />
          {nameInput.length > 0 && !nameMatch && (
            <p className="text-xs text-destructive">El nombre no coincide</p>
          )}
        </div>

        {/* Checkbox 2: Legal acceptance */}
        <div className="flex items-start gap-3">
          <Checkbox
            id="legal-accepted"
            checked={legalAccepted}
            onCheckedChange={(v) => setLegalAccepted(v === true)}
            disabled={isImpersonating}
          />
          <Label htmlFor="legal-accepted" className="text-sm leading-snug cursor-pointer">
            He leído y acepto el aviso legal sobre firma electrónica simple (eIDAS)
          </Label>
        </div>

        {/* Sign button */}
        <Button
          onClick={handleSign}
          disabled={!canSign || signing}
          className="w-full"
          size="lg"
        >
          <PenTool className="w-4 h-4 mr-2" />
          {signing ? 'Firmando...' : 'FIRMAR DOCUMENTO'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
