// ============================================================
// LICENSE TEMPLATE - Acuerdo de Licencia de Marca
// ============================================================

import { cn } from '@/lib/utils';
import type { DesignTokens } from '@/lib/document-templates/designTokens';
import type { DocumentDataContext } from '@/hooks/documents/useDocumentData';

interface TemplateProps {
  style: DesignTokens;
  data: DocumentDataContext;
  layoutClass: string;
}

export function LicenseTemplate({ style, data, layoutClass }: TemplateProps) {
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
          <div className="hdr-doc-type">LICENCIA</div>
          <div className="hdr-doc-number">REF: LIC-2026-0001</div>
        </div>
      </div>

      <div className="bd">
        <div className="rp-t text-center">CONTRATO DE LICENCIA DE MARCA</div>
        <div className="rp-su text-center">Acuerdo de cesión de uso de derechos de marca</div>

        <div className="mt">
          <div className="ms">
            <div className="ml">Licenciante (Titular)</div>
            <div className="mv font-bold">{data.client.company || data.client.name}</div>
            <div className="mv text-sm">{data.client.cif}</div>
          </div>
          <div className="ms">
            <div className="ml">Licenciatario</div>
            <div className="mv font-bold">[Nombre Licenciatario]</div>
            <div className="mv text-sm">[CIF Licenciatario]</div>
          </div>
        </div>

        {/* Trademark details table */}
        <div className="rp-h">Detalle de la Marca</div>
        <table>
          <thead>
            <tr>
              <th>Campo</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Denominación</td>
              <td className="font-bold">{data.matter?.trademarkName || 'MARCA LICENCIADA'}</td>
            </tr>
            <tr>
              <td>Nº Registro</td>
              <td>{data.matter?.registrationNumber || 'M-123456'}</td>
            </tr>
            <tr>
              <td>Clases Niza</td>
              <td>{data.matter?.classes?.join(', ') || '35, 42'}</td>
            </tr>
            <tr>
              <td>Territorio</td>
              <td>España y Unión Europea</td>
            </tr>
            <tr>
              <td>Tipo de Licencia</td>
              <td>Exclusiva / No exclusiva</td>
            </tr>
            <tr>
              <td>Duración</td>
              <td>5 años (renovable)</td>
            </tr>
          </tbody>
        </table>

        <div className="clause">
          <div className="clause-h">PRIMERA — ALCANCE DE LA LICENCIA</div>
          <div className="clause-p">
            El Licenciante concede al Licenciatario una licencia [exclusiva/no exclusiva] para el 
            uso de la marca descrita anteriormente en el territorio especificado, para los productos 
            y servicios comprendidos en las clases indicadas.
          </div>
        </div>

        <div className="clause">
          <div className="clause-h">SEGUNDA — ROYALTIES</div>
          <div className="clause-p">
            Como contraprestación por la licencia concedida, el Licenciatario abonará al Licenciante 
            un royalty del [X]% sobre las ventas netas de los productos o servicios comercializados 
            bajo la marca, pagadero trimestralmente.
          </div>
        </div>

        <div className="clause">
          <div className="clause-h">TERCERA — CONTROL DE CALIDAD</div>
          <div className="clause-p">
            El Licenciatario se compromete a mantener los estándares de calidad establecidos por el 
            Licenciante para los productos o servicios comercializados bajo la marca. El Licenciante 
            se reserva el derecho de realizar inspecciones periódicas.
          </div>
        </div>

        <div className="clause">
          <div className="clause-h">CUARTA — REGISTRO DE LA LICENCIA</div>
          <div className="clause-p">
            Las partes acuerdan inscribir la presente licencia en los registros de marcas correspondientes, 
            corriendo los gastos de inscripción por cuenta del Licenciatario.
          </div>
        </div>

        <div className="lt-sg" style={{ marginTop: '60px' }}>
          <div className="lt-sg-block">
            <div className="lt-sg-line" />
            <div className="lt-sg-name">{data.client.company || data.client.name}</div>
            <div className="lt-sg-role">Licenciante</div>
          </div>
          <div className="lt-sg-block">
            <div className="lt-sg-line" />
            <div className="lt-sg-name">[Licenciatario]</div>
            <div className="lt-sg-role">Licenciatario</div>
          </div>
        </div>
      </div>

      <div className="ft">
        <div className="text-center">{data.date.todayFormal}</div>
      </div>
    </>
  );
}
