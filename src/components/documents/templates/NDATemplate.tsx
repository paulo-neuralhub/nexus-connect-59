// ============================================================
// NDA TEMPLATE - Acuerdo de Confidencialidad
// ============================================================

import { cn } from '@/lib/utils';
import type { DesignTokens } from '@/lib/document-templates/designTokens';
import type { DocumentDataContext } from '@/hooks/documents/useDocumentData';

interface TemplateProps {
  style: DesignTokens;
  data: DocumentDataContext;
  layoutClass: string;
}

export function NDATemplate({ style, data, layoutClass }: TemplateProps) {
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
          </div>
        </div>
        <div className="text-right">
          <div className="hdr-doc-type">NDA</div>
          <div className="hdr-doc-number">REF: NDA-2026-0001</div>
        </div>
      </div>

      <div className="bd">
        <div className="rp-t text-center">ACUERDO DE CONFIDENCIALIDAD</div>
        <div className="rp-su text-center">(Non-Disclosure Agreement)</div>

        <div className="mt">
          <div className="ms">
            <div className="ml">Parte Divulgadora</div>
            <div className="mv font-bold">{data.client.company || data.client.name}</div>
            <div className="mv text-sm">{data.client.cif}</div>
          </div>
          <div className="ms">
            <div className="ml">Parte Receptora</div>
            <div className="mv font-bold">[Nombre Parte Receptora]</div>
            <div className="mv text-sm">[CIF Parte Receptora]</div>
          </div>
        </div>

        <div className="rp-p text-center" style={{ marginBottom: '24px' }}>
          En {data.company.city || '[Ciudad]'}, a {data.date.todayFormal}
        </div>

        <div className="clause">
          <div className="clause-h">PRIMERA — DEFINICIÓN DE INFORMACIÓN CONFIDENCIAL</div>
          <div className="clause-p">
            A los efectos del presente Acuerdo, se entenderá por "Información Confidencial" toda 
            información técnica, comercial, financiera, estratégica o de cualquier otra naturaleza 
            que la Parte Divulgadora comunique a la Parte Receptora, ya sea de forma oral, escrita, 
            gráfica, electrónica o de cualquier otra forma.
          </div>
        </div>

        <div className="clause">
          <div className="clause-h">SEGUNDA — OBLIGACIONES DE CONFIDENCIALIDAD</div>
          <div className="clause-p">
            La Parte Receptora se compromete a:<br /><br />
            a) Mantener en estricta confidencialidad toda la Información Confidencial recibida.<br />
            b) No divulgar dicha información a terceros sin consentimiento previo por escrito.<br />
            c) Utilizar la Información Confidencial únicamente para los fines acordados.<br />
            d) Implementar medidas de seguridad adecuadas para proteger la información.
          </div>
        </div>

        <div className="clause">
          <div className="clause-h">TERCERA — EXCLUSIONES</div>
          <div className="clause-p">
            No se considerará Información Confidencial aquella que: (i) sea de dominio público; 
            (ii) la Parte Receptora conocía previamente; (iii) haya sido obtenida legalmente de 
            terceros sin restricciones de confidencialidad; (iv) haya sido desarrollada 
            independientemente por la Parte Receptora.
          </div>
        </div>

        <div className="clause">
          <div className="clause-h">CUARTA — DURACIÓN</div>
          <div className="clause-p">
            Las obligaciones de confidencialidad establecidas en este Acuerdo permanecerán vigentes 
            durante un período de cinco (5) años desde la fecha de su firma, incluso después de la 
            terminación de cualquier relación comercial entre las Partes.
          </div>
        </div>

        <div className="clause">
          <div className="clause-h">QUINTA — LEGISLACIÓN APLICABLE</div>
          <div className="clause-p">
            Este Acuerdo se regirá e interpretará de conformidad con la legislación española. 
            Para la resolución de cualquier controversia, las Partes se someten a los Juzgados 
            y Tribunales de {data.company.city || '[Ciudad]'}.
          </div>
        </div>

        <div className="lt-sg" style={{ marginTop: '60px' }}>
          <div className="lt-sg-block">
            <div className="lt-sg-line" />
            <div className="lt-sg-name">{data.client.company || data.client.name}</div>
            <div className="lt-sg-role">Parte Divulgadora</div>
          </div>
          <div className="lt-sg-block">
            <div className="lt-sg-line" />
            <div className="lt-sg-name">[Parte Receptora]</div>
            <div className="lt-sg-role">Parte Receptora</div>
          </div>
        </div>
      </div>

      <div className="ft">
        <div className="text-center">{data.date.todayFormal}</div>
      </div>
    </>
  );
}
