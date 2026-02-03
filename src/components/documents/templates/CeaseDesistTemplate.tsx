// ============================================================
// CEASE & DESIST TEMPLATE
// ============================================================

import { cn } from '@/lib/utils';
import type { DesignTokens } from '@/lib/document-templates/designTokens';
import type { DocumentDataContext } from '@/hooks/documents/useDocumentData';

interface TemplateProps {
  style: DesignTokens;
  data: DocumentDataContext;
  layoutClass: string;
}

export function CeaseDesistTemplate({ style, data, layoutClass }: TemplateProps) {
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
          <div className="hdr-doc-type">CEASE & DESIST</div>
          <div className="hdr-doc-number">REF: C&D-2026-0001</div>
        </div>
      </div>

      <div className="bd">
        <div className="mt">
          <div className="ms">
            <div className="ml">Dirigido a</div>
            <div className="mv font-bold">[Nombre del infractor]</div>
            <div className="mv">[Empresa infractora]</div>
            <div className="mv text-sm">[Dirección del infractor]</div>
          </div>
          <div className="ms">
            <div className="ml">En nombre de</div>
            <div className="mv font-bold">{data.client.name}</div>
            <div className="mv">{data.client.company}</div>
          </div>
        </div>

        <div className="text-right mb-4 text-sm text-muted">
          {data.date.todayFormal}
        </div>

        <div className="subj">
          <div className="subj-label">Asunto</div>
          <div className="subj-text">
            Requerimiento formal de cese inmediato por infracción de derechos de marca
            <br />
            <span className="text-sm text-muted">
              Ref. Marca: {data.matter?.trademarkName || '[Nombre de marca]'} — 
              Reg. {data.matter?.registrationNumber || '[Nº Registro]'}
            </span>
          </div>
        </div>

        <div className="lt-b">
          <p>Estimados señores,</p>
          <p>
            Por medio de la presente, actuando en nombre y representación de nuestro cliente,
            <strong> {data.client.company || data.client.name}</strong>, titular de los derechos 
            exclusivos sobre la marca <strong>{data.matter?.trademarkName || '[MARCA]'}</strong>,
            registrada bajo el número {data.matter?.registrationNumber || '[Nº REGISTRO]'},
            les comunicamos formalmente que:
          </p>
        </div>

        <div className="clause">
          <div className="clause-h">1. HECHOS CONSTATADOS</div>
          <div className="clause-p">
            Hemos tenido conocimiento de que su empresa está utilizando signos distintivos 
            idénticos o confusamente similares a la marca de nuestro cliente, lo cual constituye 
            una infracción de los derechos de propiedad industrial conforme al artículo 34 de la 
            Ley de Marcas y al artículo 9 del Reglamento (UE) 2017/1001.
          </div>
        </div>

        <div className="clause">
          <div className="clause-h">2. REQUERIMIENTO</div>
          <div className="clause-p">
            Por la presente, les requerimos formal y fehacientemente para que, en el plazo 
            improrrogable de <strong>quince (15) días hábiles</strong> desde la recepción de 
            este escrito, procedan a:
            <br /><br />
            a) Cesar inmediata y definitivamente en el uso del signo infractor.<br />
            b) Retirar del mercado todos los productos o servicios que incorporen dicho signo.<br />
            c) Destruir todo material publicitario o comercial que contenga el signo infractor.
          </div>
        </div>

        <div className="clause">
          <div className="clause-h">3. ADVERTENCIA LEGAL</div>
          <div className="clause-p">
            En caso de incumplimiento del presente requerimiento, nos veremos obligados a iniciar 
            las acciones judiciales correspondientes, sin perjuicio de reclamar la indemnización 
            por daños y perjuicios que en derecho corresponda.
          </div>
        </div>

        <div className="lt-sg" style={{ marginTop: '48px' }}>
          <div className="lt-sg-block">
            <div className="lt-sg-line" />
            <div className="lt-sg-name">{data.company.name}</div>
            <div className="lt-sg-role">Abogado / Agente</div>
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
