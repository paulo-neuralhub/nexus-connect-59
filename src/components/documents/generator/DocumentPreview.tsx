// ============================================================
// DOCUMENT PREVIEW - Renderiza el documento con tokens + datos
// Imports CSS variables y muestra preview en tiempo real
// REFACTORED: Uses separate template components
// ============================================================

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import type { DesignTokens, DocumentType } from '@/lib/document-templates/designTokens';
import { tokensToCssVars } from '@/lib/document-templates/designTokens';
import type { DocumentDataContext } from '@/hooks/documents/useDocumentData';
import { Loader2 } from 'lucide-react';

// Import document template styles
import '@/styles/document-templates.css';

// Import all templates
import {
  CreditNoteTemplate,
  ReceiptTemplate,
  CeaseDesistTemplate,
  MeetingMinutesTemplate,
  PortfolioReportTemplate,
  WatchReportTemplate,
  NDATemplate,
  LicenseTemplate,
  PowerOfAttorneyTemplate,
  RenewalNoticeTemplate,
} from '../templates';

interface DocumentPreviewProps {
  style: DesignTokens | null;
  documentType: DocumentType | null;
  data: DocumentDataContext;
  className?: string;
}

export const DocumentPreview = forwardRef<HTMLDivElement, DocumentPreviewProps>(
  ({ style, documentType, data, className }, ref) => {
    if (!style || !documentType) {
      return (
        <div className={cn('bg-muted/50 rounded-lg flex items-center justify-center', className)}>
          <div className="text-center text-muted-foreground">
            <p className="mb-2">Selecciona un estilo y tipo de documento</p>
            <p className="text-sm">para ver la vista previa</p>
          </div>
        </div>
      );
    }

    if (data.isLoading) {
      return (
        <div className={cn('bg-muted/50 rounded-lg flex items-center justify-center', className)}>
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    const cssVars = tokensToCssVars(style);
    const layoutClass = getHeaderLayoutClass(style.headerLayout);

    return (
      <div className={cn('bg-muted/30 p-6 overflow-auto', className)}>
        <div
          ref={ref}
          id="document-preview"
          className={cn('doc mx-auto', style.isDark && 'dk')}
          style={{ cssText: cssVars } as React.CSSProperties}
        >
          {renderDocumentContent(documentType.id, style, data, layoutClass)}
        </div>
      </div>
    );
  }
);

DocumentPreview.displayName = 'DocumentPreview';

function getHeaderLayoutClass(layout: string): string {
  const layoutMap: Record<string, string> = {
    standard: 'h-std',
    split: 'h-spl',
    sidebar: 'h-sid',
    topbar: 'h-top',
    wave: 'h-wav',
    flat: 'h-flt',
    grid: 'h-grd',
  };
  return layoutMap[layout] || 'h-std';
}

function renderDocumentContent(
  typeId: string,
  style: DesignTokens,
  data: DocumentDataContext,
  layoutClass: string
): React.ReactNode {
  const props = { style, data, layoutClass };

  switch (typeId) {
    case 'factura':
      return <InvoiceContent {...props} />;
    case 'presupuesto':
      return <QuoteContent {...props} />;
    case 'nota-credito':
      return <CreditNoteTemplate {...props} />;
    case 'recibo':
      return <ReceiptTemplate {...props} />;
    case 'carta':
      return <LetterContent {...props} />;
    case 'cease':
      return <CeaseDesistTemplate {...props} />;
    case 'acta':
      return <MeetingMinutesTemplate {...props} />;
    case 'informe':
      return <PortfolioReportTemplate {...props} />;
    case 'vigilancia':
      return <WatchReportTemplate {...props} />;
    case 'contrato':
      return <ContractContent {...props} />;
    case 'nda':
      return <NDATemplate {...props} />;
    case 'licencia':
      return <LicenseTemplate {...props} />;
    case 'poder':
      return <PowerOfAttorneyTemplate {...props} />;
    case 'certificado':
      return <CertificateContent {...props} />;
    case 'renovacion':
      return <RenewalNoticeTemplate {...props} />;
    default:
      return <GenericContent {...props} typeId={typeId} />;
  }
}

// ============================================================
// INLINE TEMPLATES (from original file)
// ============================================================

interface TemplateProps {
  style: DesignTokens;
  data: DocumentDataContext;
  layoutClass: string;
}

// INVOICE
function InvoiceContent({ style, data, layoutClass }: TemplateProps) {
  return (
    <>
      <div className={cn('hdr', layoutClass)}>
        {style.headerLayout === 'sidebar' ? (
          <>
            <div className="hdr-strip">FACTURA</div>
            <div className="hdr-content">
              <div className="flex justify-between">
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
                  <div className="hdr-doc-number">{data.numbers.invoiceNumber}</div>
                  <div className="hdr-info">{data.date.today}</div>
                </div>
              </div>
            </div>
          </>
        ) : style.headerLayout === 'split' ? (
          <>
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
            <div className="hdr-accent">
              <div className="hdr-doc-type">FACTURA</div>
              <div className="hdr-doc-number">{data.numbers.invoiceNumber}</div>
            </div>
          </>
        ) : (
          <>
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
              <div className="hdr-doc-type">FACTURA</div>
              <div className="hdr-doc-number">{data.numbers.invoiceNumber}</div>
            </div>
          </>
        )}
      </div>

      <div className="bd">
        <div className="mt">
          <div className="ms">
            <div className="ml">Facturar a</div>
            <div className="mv font-bold">{data.client.name}</div>
            <div className="mv">{data.client.company}</div>
            <div className="mv text-sm">{data.client.fullAddress}</div>
            <div className="mv text-sm">{data.client.cif}</div>
          </div>
          <div className="ms text-right">
            <div className="ml">Fecha emisión</div>
            <div className="mv">{data.date.today}</div>
            <div className="ml mt-4">Vencimiento</div>
            <div className="mv">{data.date.dueDate}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Descripción</th>
              <th className="td-r">Precio</th>
              <th className="td-c">Ud.</th>
              <th className="td-r">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Servicio de asesoría en Propiedad Intelectual</td>
              <td className="td-r td-num">500,00 €</td>
              <td className="td-c">1</td>
              <td className="td-r td-num">500,00 €</td>
            </tr>
            <tr>
              <td>Gestión de registro de marca</td>
              <td className="td-r td-num">350,00 €</td>
              <td className="td-c">2</td>
              <td className="td-r td-num">700,00 €</td>
            </tr>
            <tr>
              <td>Vigilancia de marcas (trimestre)</td>
              <td className="td-r td-num">150,00 €</td>
              <td className="td-c">1</td>
              <td className="td-r td-num">150,00 €</td>
            </tr>
          </tbody>
        </table>

        <div className="tots">
          <div className="tb">
            <span>Subtotal</span>
            <span className="tt">1.350,00 €</span>
          </div>
          <div className="tb">
            <span>{data.tax.label} ({data.tax.rate}%)</span>
            <span className="tt">283,50 €</span>
          </div>
          <div className="tr">
            <span>TOTAL</span>
            <span className="tt">1.633,50 €</span>
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

// QUOTE
function QuoteContent({ style, data, layoutClass }: TemplateProps) {
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
          <div className="hdr-doc-type">PRESUPUESTO</div>
          <div className="hdr-doc-number">{data.numbers.quoteNumber}</div>
        </div>
      </div>

      <div className="bd">
        <div className="mt">
          <div className="ms">
            <div className="ml">Presupuesto para</div>
            <div className="mv font-bold">{data.client.name}</div>
            <div className="mv">{data.client.company}</div>
          </div>
          <div className="ms text-right">
            <div className="ml">Fecha</div>
            <div className="mv">{data.date.today}</div>
            <div className="ml mt-4">Válido hasta</div>
            <div className="mv">{data.date.dueDate}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Servicio propuesto</th>
              <th className="td-r">€/ud</th>
              <th className="td-c">Ud.</th>
              <th className="td-r">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Búsqueda de anterioridades</td>
              <td className="td-r td-num">250,00 €</td>
              <td className="td-c">1</td>
              <td className="td-r td-num">250,00 €</td>
            </tr>
            <tr>
              <td>Registro de marca nacional</td>
              <td className="td-r td-num">450,00 €</td>
              <td className="td-c">1</td>
              <td className="td-r td-num">450,00 €</td>
            </tr>
          </tbody>
        </table>

        <div className="tots">
          <div className="tb">
            <span>Subtotal</span>
            <span className="tt">700,00 €</span>
          </div>
          <div className="tb">
            <span>{data.tax.label} ({data.tax.rate}%)</span>
            <span className="tt">147,00 €</span>
          </div>
          <div className="tr">
            <span>TOTAL</span>
            <span className="tt">847,00 €</span>
          </div>
        </div>

        <div className="conditions">
          <div className="conditions-title">Condiciones</div>
          <p>Pago a 30 días desde la fecha de emisión. El presupuesto tiene validez de 30 días.</p>
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

// LETTER
function LetterContent({ style, data, layoutClass }: TemplateProps) {
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
            <div className="hdr-info">{data.company.fullAddress}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="hdr-doc-type">CARTA OFICIAL</div>
          <div className="hdr-doc-number">REF: DOC-2026-0001</div>
        </div>
      </div>

      <div className="bd">
        <div className="ms">
          <div className="ml">Destinatario</div>
          <div className="mv font-bold">{data.client.name}</div>
          <div className="mv">{data.client.company}</div>
          <div className="mv text-sm">{data.client.fullAddress}</div>
        </div>

        <div className="text-right mb-4 text-sm text-muted">{data.date.todayFormal}</div>

        <div className="subj">
          <div className="subj-label">Asunto</div>
          <div className="subj-text">Comunicación sobre servicios de Propiedad Intelectual</div>
        </div>

        <div className="lt-b">
          <p>Estimado/a {data.client.name},</p>
          <p>
            Por medio de la presente, nos dirigimos a usted para informarle sobre los servicios 
            de asesoría en Propiedad Intelectual que ofrecemos desde nuestra firma.
          </p>
          <p>
            Quedamos a su entera disposición para cualquier consulta o aclaración que precise.
            No dude en contactarnos a través de los medios indicados al pie de esta carta.
          </p>
          <p>Atentamente,</p>
        </div>

        <div className="lt-sg">
          <div className="lt-sg-block">
            <div className="lt-sg-line" />
            <div className="lt-sg-name">{data.company.name}</div>
            <div className="lt-sg-role">Dirección</div>
          </div>
        </div>
      </div>

      <div className="ft">
        <div className="ft-grid">
          <div>
            <div className="ft-label">Dirección</div>
            <div className="ft-value">{data.company.fullAddress}</div>
          </div>
          <div>
            <div className="ft-label">Email</div>
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

// CONTRACT
function ContractContent({ style, data, layoutClass }: TemplateProps) {
  return (
    <>
      <div className={cn('hdr', layoutClass)}>
        <div className="hdr-logo">
          <div className="hdr-logo-placeholder">{data.company.name.charAt(0)}</div>
          <div>
            <div className="hdr-company">{data.company.name}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="hdr-doc-type">CONTRATO</div>
          <div className="hdr-doc-number">REF: CTR-2026-0001</div>
        </div>
      </div>

      <div className="bd">
        <div className="rp-t text-center">CONTRATO DE SERVICIOS PROFESIONALES</div>
        <div className="rp-su text-center">En Propiedad Intelectual</div>

        <div className="mt">
          <div className="ms">
            <div className="ml">Prestador</div>
            <div className="mv font-bold">{data.company.name}</div>
            <div className="mv text-sm">{data.company.cif}</div>
          </div>
          <div className="ms">
            <div className="ml">Cliente</div>
            <div className="mv font-bold">{data.client.name}</div>
            <div className="mv text-sm">{data.client.cif}</div>
          </div>
        </div>

        <div className="clause">
          <div className="cl-n">PRIMERA.- OBJETO</div>
          <div className="cl-t">
            El presente contrato tiene por objeto la prestación de servicios de asesoría 
            en materia de Propiedad Intelectual e Industrial.
          </div>
        </div>

        <div className="clause">
          <div className="cl-n">SEGUNDA.- DURACIÓN</div>
          <div className="cl-t">
            El contrato tendrá una duración de doce (12) meses, prorrogables tácitamente 
            por períodos anuales salvo denuncia expresa de alguna de las partes.
          </div>
        </div>

        <div className="clause">
          <div className="cl-n">TERCERA.- CONTRAPRESTACIÓN</div>
          <div className="cl-t">
            Los honorarios se facturarán según la tarifa vigente, con pago a 30 días 
            desde la fecha de emisión de factura.
          </div>
        </div>

        <div className="lt-sg" style={{ marginTop: '60px' }}>
          <div className="lt-sg-block">
            <div className="lt-sg-line" />
            <div className="lt-sg-name">{data.company.name}</div>
            <div className="lt-sg-role">Prestador</div>
          </div>
          <div className="lt-sg-block">
            <div className="lt-sg-line" />
            <div className="lt-sg-name">{data.client.name}</div>
            <div className="lt-sg-role">Cliente</div>
          </div>
        </div>
      </div>

      <div className="ft">
        <div className="text-center">{data.date.todayFormal}</div>
      </div>
    </>
  );
}

// CERTIFICATE
function CertificateContent({ style, data, layoutClass }: TemplateProps) {
  return (
    <>
      <div className={cn('hdr', layoutClass)}>
        <div className="hdr-logo">
          <div className="hdr-logo-placeholder">{data.company.name.charAt(0)}</div>
          <div>
            <div className="hdr-company">{data.company.name}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="hdr-doc-type">CERTIFICADO</div>
          <div className="hdr-doc-number">CERT-2026-0001</div>
        </div>
      </div>

      <div className="bd cert-center">
        <div className="cert-title">Registro de Marca Completado</div>
        <div className="cert-subtitle">Certificamos que el siguiente registro ha sido completado con éxito</div>

        <div className="cert-grid">
          <div className="cert-item">
            <div className="cert-label">Denominación</div>
            <div className="cert-value">{data.matter?.trademarkName || 'MARCA EJEMPLO'}</div>
          </div>
          <div className="cert-item">
            <div className="cert-label">Nº Registro</div>
            <div className="cert-value">{data.matter?.registrationNumber || 'M-123456'}</div>
          </div>
          <div className="cert-item">
            <div className="cert-label">Oficina</div>
            <div className="cert-value">{data.matter?.office || 'OEPM'}</div>
          </div>
          <div className="cert-item">
            <div className="cert-label">Fecha Registro</div>
            <div className="cert-value">{data.matter?.registrationDate || data.date.today}</div>
          </div>
          <div className="cert-item">
            <div className="cert-label">Clases Niza</div>
            <div className="cert-value">{data.matter?.classes?.join(', ') || '35, 42'}</div>
          </div>
          <div className="cert-item">
            <div className="cert-label">Titular</div>
            <div className="cert-value">{data.client.name}</div>
          </div>
        </div>

        <div className="cert-seals">
          <div className="cert-seal">✓</div>
          <div className="cert-seal">🔐</div>
          <div className="cert-seal">📋</div>
        </div>

        <div className="cert-code">
          Código de verificación: {Math.random().toString(36).substring(2, 10).toUpperCase()}
        </div>
      </div>

      <div className="ft">
        <div className="text-center">{data.date.todayFormal}</div>
      </div>
    </>
  );
}

// GENERIC FALLBACK
function GenericContent({ style, data, layoutClass, typeId }: TemplateProps & { typeId: string }) {
  const typeName = typeId.toUpperCase().replace(/-/g, ' ');

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
          <div className="hdr-doc-type">{typeName}</div>
          <div className="hdr-doc-number">{data.numbers.documentNumber}</div>
        </div>
      </div>

      <div className="bd">
        <div className="mt">
          <div className="ms">
            <div className="ml">Para</div>
            <div className="mv font-bold">{data.client.name}</div>
            <div className="mv">{data.client.company}</div>
          </div>
          <div className="ms text-right">
            <div className="ml">Fecha</div>
            <div className="mv">{data.date.today}</div>
          </div>
        </div>

        <div className="rp-p">
          <p>Contenido del documento de tipo <strong>{typeName}</strong>.</p>
          <p>Este es un template genérico.</p>
        </div>
      </div>

      <div className="ft">
        <div className="ft-grid">
          <div>
            <div className="ft-label">Email</div>
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

export default DocumentPreview;
