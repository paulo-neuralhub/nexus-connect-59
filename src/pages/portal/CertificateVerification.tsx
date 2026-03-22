/**
 * Certificate Verification Page
 * Public page — no auth required
 */

import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fromTable } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShieldCheck, XCircle, CheckCircle2, Calendar, MapPin, Hash } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function CertificateVerification() {
  const { certificate_number } = useParams<{ certificate_number: string }>();

  const { data: cert, isLoading, error } = useQuery({
    queryKey: ['verify-certificate', certificate_number],
    queryFn: async () => {
      if (!certificate_number) return null;

      const { data, error } = await fromTable('portal_certificates')
        .select('*')
        .eq('certificate_number', certificate_number)
        .eq('is_revoked', false)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!certificate_number,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!cert) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-8 pb-8 text-center">
            <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">Certificado no encontrado</h1>
            <p className="text-muted-foreground">
              El número de certificado <code className="bg-muted px-2 py-1 rounded">{certificate_number}</code> no existe o ha sido revocado.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-lg border-green-200">
        <CardHeader className="text-center border-b bg-green-50/50">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-3">
            <ShieldCheck className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-green-700">Certificado Verificado</CardTitle>
          <Badge className="mx-auto bg-green-100 text-green-700 border-green-300">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Válido
          </Badge>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Certificado</p>
              <p className="font-mono font-medium flex items-center gap-1">
                <Hash className="w-3 h-3" />
                {cert.certificate_number}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Tipo</p>
              <p className="font-medium capitalize">{cert.certificate_type?.replace(/_/g, ' ')}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Marca</p>
              <p className="font-semibold text-lg">{cert.mark_name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Titular</p>
              <p className="font-medium">{cert.owner_name}</p>
            </div>
            {cert.registration_number && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Nº Registro</p>
                <p className="font-medium">{cert.registration_number}</p>
              </div>
            )}
            {cert.registration_date && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Fecha Registro</p>
                <p className="font-medium flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(cert.registration_date), 'd MMM yyyy', { locale: es })}
                </p>
              </div>
            )}
            {cert.jurisdiction_code && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Jurisdicción</p>
                <p className="font-medium flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {cert.jurisdiction_code}
                </p>
              </div>
            )}
            {cert.nice_classes?.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Clases Niza</p>
                <p className="font-medium">{cert.nice_classes.join(', ')}</p>
              </div>
            )}
          </div>

          <div className="border-t pt-4 mt-4">
            <p className="text-xs text-muted-foreground">
              Emitido por <strong>{cert.despacho_name}</strong>
              {cert.generated_at && ` el ${format(new Date(cert.generated_at), 'd MMM yyyy', { locale: es })}`}
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
            ⚠️ Este certificado tiene carácter informativo. No constituye un título oficial de registro de marca.
            Consulte el registro oficial de la oficina de PI correspondiente.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
