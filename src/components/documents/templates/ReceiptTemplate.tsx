// ============================================================
// RECEIPT TEMPLATE - Recibo de Pago
// ============================================================

import { cn } from '@/lib/utils';
import type { DesignTokens } from '@/lib/document-templates/designTokens';
import type { DocumentDataContext } from '@/hooks/documents/useDocumentData';

interface TemplateProps {
  style: DesignTokens;
  data: DocumentDataContext;
  layoutClass: string;
}

export function ReceiptTemplate({ style, data, layoutClass }: TemplateProps) {
  return (
    <>
      <div className={cn('hdr', layoutClass)}>
        <div className="hdr-logo">
          {data.company.logoUrl ? (
            <img src={data.company.logoUrl} alt="Logo" />
          ) : (
            <div className="hdr-logo-placeholder">{data.company.name.charAt(0)}</div>
          )}
          <div>
            <div className="hdr-company">{data.company.name}</div>
            <div className="hdr-info">{data.company.cif}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="hdr-doc-type">RECIBO DE PAGO</div>
          <div className="hdr-doc-number">{data.numbers.receiptNumber}</div>
        </div>
      </div>

      <div className="bd">
        <div className="mt">
          <div className="ms">
            <div className="ml">Recibido de</div>
            <div className="mv font-bold">{data.client.name}</div>
            <div className="mv">{data.client.company}</div>
          </div>
          <div className="ms text-right">
            <div className="ml">Fecha</div>
            <div className="mv">{data.date.today}</div>
            <div className="ml mt-4">Método</div>
            <div className="mv">Transferencia bancaria</div>
          </div>
        </div>

        {/* Central amount */}
        <div className="receipt-amount">
          <div className="receipt-amount-label">Importe recibido</div>
          <div className="receipt-amount-value">1.633,50 €</div>
          <div className="receipt-paid-badge">
            <span>✓</span>
            <span>PAGADO</span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Factura</th>
              <th>Concepto</th>
              <th className="td-r">Importe</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{data.numbers.invoiceNumber}</td>
              <td>Servicios de asesoría PI - Enero 2026</td>
              <td className="td-r td-num">1.633,50 €</td>
            </tr>
          </tbody>
        </table>

        <div className="mt">
          <div className="ms">
            <div className="ml">Banco origen</div>
            <div className="mv">Banco Santander</div>
          </div>
          <div className="ms">
            <div className="ml">Referencia</div>
            <div className="mv">REF-{Math.random().toString(36).substring(2, 10).toUpperCase()}</div>
          </div>
        </div>
      </div>

      <div className="ft">
        <div className="ft-grid">
          <div>
            <div className="ft-label">IBAN</div>
            <div className="ft-value">{data.company.iban}</div>
          </div>
          <div>
            <div className="ft-label">Contacto</div>
            <div className="ft-value">{data.company.email}</div>
          </div>
          <div>
            <div className="ft-label">Teléfono</div>
            <div className="ft-value">{data.company.phone}</div>
          </div>
        </div>
      </div>
    </>
  );
}
