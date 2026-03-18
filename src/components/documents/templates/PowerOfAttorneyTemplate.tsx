// ============================================================
// POWER OF ATTORNEY TEMPLATE - Poder Notarial
// ============================================================

import { cn } from '@/lib/utils';
import type { DesignTokens } from '@/lib/document-templates/designTokens';
import type { DocumentDataContext } from '@/hooks/documents/useDocumentData';

interface TemplateProps {
  style: DesignTokens;
  data: DocumentDataContext;
  layoutClass: string;
}

export function PowerOfAttorneyTemplate({ style, data, layoutClass }: TemplateProps) {
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
          <div className="hdr-doc-type">PODER NOTARIAL</div>
          <div className="hdr-doc-number">REF: POA-2026-0001</div>
        </div>
      </div>

      <div className="bd">
        <div className="rp-t text-center">PODER DE REPRESENTACIÓN</div>
        <div className="rp-su text-center">Para actuaciones ante Oficinas de Propiedad Industrial</div>

        <div className="mt">
          <div className="ms">
            <div className="ml">Poderdante</div>
            <div className="mv font-bold">{data.client.company || data.client.name}</div>
            <div className="mv text-sm">{data.client.cif}</div>
            <div className="mv text-sm">{data.client.fullAddress}</div>
          </div>
          <div className="ms">
            <div className="ml">Apoderado</div>
            <div className="mv font-bold">{data.company.name}</div>
            <div className="mv text-sm">{data.company.cif}</div>
            <div className="mv text-sm">{data.company.fullAddress}</div>
          </div>
        </div>

        <div className="rp-h">Oficinas de Actuación</div>
        <div className="office-grid">
          <div className="office-item">
            <span className="office-flag">🇪🇺</span>
            <span className="office-name">EUIPO</span>
          </div>
          <div className="office-item">
            <span className="office-flag">🇪🇸</span>
            <span className="office-name">OEPM</span>
          </div>
          <div className="office-item">
            <span className="office-flag">🌐</span>
            <span className="office-name">WIPO</span>
          </div>
          <div className="office-item">
            <span className="office-flag">🇺🇸</span>
            <span className="office-name">USPTO</span>
          </div>
          <div className="office-item">
            <span className="office-flag">🇬🇧</span>
            <span className="office-name">UKIPO</span>
          </div>
          <div className="office-item">
            <span className="office-flag">🇩🇪</span>
            <span className="office-name">DPMA</span>
          </div>
        </div>

        <div className="clause">
          <div className="clause-h">FACULTADES CONFERIDAS</div>
          <div className="clause-p">
            El Poderdante confiere al Apoderado las más amplias facultades para actuar en su nombre 
            y representación ante las Oficinas de Propiedad Industrial indicadas, incluyendo pero 
            no limitado a:<br /><br />
            
            • Solicitar, registrar, renovar y mantener marcas, patentes y diseños.<br />
            • Presentar, contestar y defender oposiciones y recursos.<br />
            • Recibir notificaciones y comunicaciones oficiales.<br />
            • Modificar, transferir, licenciar y renunciar a derechos de PI.<br />
            • Designar representantes locales cuando sea necesario.<br />
            • Ejercer todas las acciones necesarias para la protección de los derechos del Poderdante.
          </div>
        </div>

        <div className="clause">
          <div className="clause-h">VIGENCIA</div>
          <div className="clause-p">
            El presente poder tendrá vigencia indefinida, hasta su revocación expresa por escrito 
            por parte del Poderdante. Esta revocación deberá ser comunicada formalmente a cada 
            Oficina donde se haya presentado el poder.
          </div>
        </div>

        <div className="lt-sg" style={{ marginTop: '60px' }}>
          <div className="lt-sg-block">
            <div className="lt-sg-line" />
            <div className="lt-sg-name">{data.client.company || data.client.name}</div>
            <div className="lt-sg-role">Poderdante</div>
          </div>
          <div className="lt-sg-block">
            <div className="lt-sg-line" />
            <div className="lt-sg-name">{data.company.name}</div>
            <div className="lt-sg-role">Apoderado</div>
          </div>
        </div>

        <div className="conditions" style={{ marginTop: '32px' }}>
          <div className="conditions-title">Nota Legal</div>
          <p>
            Para actuaciones ante ciertas oficinas (USPTO, OEPM) puede requerirse formalización 
            notarial y/o apostilla. Consulte con el apoderado los requisitos específicos de 
            cada jurisdicción.
          </p>
        </div>
      </div>

      <div className="ft">
        <div className="text-center">
          {data.company.city || '[Ciudad]'}, a {data.date.todayFormal}
        </div>
      </div>
    </>
  );
}
