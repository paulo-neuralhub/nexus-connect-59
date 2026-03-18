// ============================================================
// CREDIT NOTE TEMPLATE - Nota de Crédito
// ============================================================

import { cn } from '@/lib/utils';
import type { DesignTokens } from '@/lib/document-templates/designTokens';
import type { DocumentDataContext } from '@/hooks/documents/useDocumentData';

interface TemplateProps {
  style: DesignTokens;
  data: DocumentDataContext;
  layoutClass: string;
}

export function CreditNoteTemplate({ style, data, layoutClass }: TemplateProps) {
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
          <div className="hdr-doc-type">NOTA DE CRÉDITO</div>
          <div className="hdr-doc-number">{data.numbers.creditNoteNumber}</div>
        </div>
      </div>

      <div className="bd">
        <div className="mt">
          <div className="ms">
            <div className="ml">Emitida a favor de</div>
            <div className="mv font-bold">{data.client.name}</div>
            <div className="mv">{data.client.company}</div>
            <div className="mv text-sm">{data.client.cif}</div>
          </div>
          <div className="ms text-right">
            <div className="ml">Fecha emisión</div>
            <div className="mv">{data.date.today}</div>
            <div className="ml mt-4">Factura ref.</div>
            <div className="mv">{data.numbers.invoiceNumber}</div>
          </div>
        </div>

        {/* Reason box */}
        <div className="subj">
          <div className="subj-label">Motivo</div>
          <div className="subj-text">Ajuste por servicios no prestados / Corrección de factura</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Concepto</th>
              <th className="td-r">Importe original</th>
              <th className="td-r">Ajuste</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Servicio de asesoría en Propiedad Intelectual</td>
              <td className="td-r td-num">500,00 €</td>
              <td className="td-r td-num text-accent">-150,00 €</td>
            </tr>
            <tr>
              <td>Gestión de registro (parcial)</td>
              <td className="td-r td-num">350,00 €</td>
              <td className="td-r td-num text-accent">-100,00 €</td>
            </tr>
          </tbody>
        </table>

        <div className="tots">
          <div className="tb">
            <span>Subtotal ajuste</span>
            <span className="tt">-250,00 €</span>
          </div>
          <div className="tb">
            <span>{data.tax.label} ({data.tax.rate}%)</span>
            <span className="tt">-52,50 €</span>
          </div>
          <div className="tr">
            <span>TOTAL A APLICAR</span>
            <span className="tt">-302,50 €</span>
          </div>
        </div>

        <div className="conditions">
          <div className="conditions-title">Nota</div>
          <p>Este crédito se aplicará a la próxima factura emitida o podrá solicitarse la devolución del importe.</p>
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
