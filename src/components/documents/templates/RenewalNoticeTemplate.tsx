// ============================================================
// RENEWAL NOTICE TEMPLATE - Aviso de Renovación
// ============================================================

import { cn } from '@/lib/utils';
import type { DesignTokens } from '@/lib/document-templates/designTokens';
import type { DocumentDataContext } from '@/hooks/documents/useDocumentData';

interface TemplateProps {
  style: DesignTokens;
  data: DocumentDataContext;
  layoutClass: string;
}

export function RenewalNoticeTemplate({ style, data, layoutClass }: TemplateProps) {
  const daysRemaining = 45; // In real app, calculate from deadline
  const urgencyClass = daysRemaining < 30 ? 'st-urg' : daysRemaining < 60 ? 'st-warn' : 'st-ok';
  const urgencyLabel = daysRemaining < 30 ? 'Urgente' : daysRemaining < 60 ? 'Próximo' : 'Planificado';

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
            <div className="hdr-info">Sistema de Gestión de PI</div>
          </div>
        </div>
        <div className="text-right">
          <div className="hdr-doc-type">RENOVACIÓN</div>
          <div className="hdr-doc-number">REN-2026-0001</div>
        </div>
      </div>

      <div className="bd">
        <div className="mt">
          <div className="ms">
            <div className="ml">Titular</div>
            <div className="mv font-bold">{data.client.company || data.client.name}</div>
            <div className="mv text-sm">{data.client.cif}</div>
          </div>
          <div className="ms text-right">
            <div className="ml">Fecha emisión</div>
            <div className="mv">{data.date.today}</div>
          </div>
        </div>

        {/* Countdown banner */}
        <div className="renewal-banner">
          <div>
            <div className="text-sm text-muted">Vencimiento</div>
            <div className="renewal-date">15/03/2026</div>
          </div>
          <div>
            <div className="renewal-days">{daysRemaining}</div>
            <div className="renewal-days-label">días restantes</div>
          </div>
          <div>
            <span className={cn('status', urgencyClass)}>{urgencyLabel}</span>
          </div>
        </div>

        <div className="rp-h">Marcas a Renovar</div>
        <table>
          <thead>
            <tr>
              <th>Marca</th>
              <th>Nº Registro</th>
              <th>Oficina</th>
              <th>Vencimiento</th>
              <th className="td-c">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="font-bold">{data.matter?.trademarkName || 'MARCA PRINCIPAL'}</td>
              <td>{data.matter?.registrationNumber || 'M-123456'}</td>
              <td>🇪🇸 OEPM</td>
              <td>15/03/2026</td>
              <td className="td-c"><span className="status st-warn">Pendiente</span></td>
            </tr>
            <tr>
              <td className="font-bold">MARCA SECUNDARIA</td>
              <td>M-789012</td>
              <td>🇪🇺 EUIPO</td>
              <td>20/03/2026</td>
              <td className="td-c"><span className="status st-warn">Pendiente</span></td>
            </tr>
            <tr>
              <td className="font-bold">LOGO EMPRESA</td>
              <td>018123456</td>
              <td>🇪🇺 EUIPO</td>
              <td>15/04/2026</td>
              <td className="td-c"><span className="status st-ok">Planificado</span></td>
            </tr>
          </tbody>
        </table>

        <div className="rp-h">Desglose de Costes (Marca más urgente)</div>
        <table>
          <thead>
            <tr>
              <th>Concepto</th>
              <th className="td-r">Importe</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Tasa renovación OEPM (3 clases)</td>
              <td className="td-r td-num">450,00 €</td>
            </tr>
            <tr>
              <td>Honorarios de gestión</td>
              <td className="td-r td-num">150,00 €</td>
            </tr>
          </tbody>
        </table>

        <div className="tots">
          <div className="tb">
            <span>Subtotal</span>
            <span className="tt">600,00 €</span>
          </div>
          <div className="tb">
            <span>{data.tax.label} ({data.tax.rate}%)</span>
            <span className="tt">126,00 €</span>
          </div>
          <div className="tr">
            <span>TOTAL</span>
            <span className="tt">726,00 €</span>
          </div>
        </div>

        <div className="subj" style={{ marginTop: '24px' }}>
          <div className="subj-label">Acción Requerida</div>
          <div className="subj-text">
            Para proceder con la renovación, confirme su aprobación antes del <strong>01/03/2026</strong>.
            Sin su confirmación, la renovación no podrá tramitarse dentro del plazo ordinario.
          </div>
        </div>
      </div>

      <div className="ft">
        <div className="ft-grid">
          <div>
            <div className="ft-label">Contacto</div>
            <div className="ft-value">{data.company.email}</div>
          </div>
          <div>
            <div className="ft-label">Teléfono</div>
            <div className="ft-value">{data.company.phone}</div>
          </div>
          <div>
            <div className="ft-label">Web</div>
            <div className="ft-value">{data.company.website}</div>
          </div>
        </div>
      </div>
    </>
  );
}
