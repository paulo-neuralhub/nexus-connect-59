// ============================================================
// MEETING MINUTES TEMPLATE - Acta de Reunión
// ============================================================

import { cn } from '@/lib/utils';
import type { DesignTokens } from '@/lib/document-templates/designTokens';
import type { DocumentDataContext } from '@/hooks/documents/useDocumentData';

interface TemplateProps {
  style: DesignTokens;
  data: DocumentDataContext;
  layoutClass: string;
}

export function MeetingMinutesTemplate({ style, data, layoutClass }: TemplateProps) {
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
            <div className="hdr-info">Asesoría en Propiedad Intelectual</div>
          </div>
        </div>
        <div className="text-right">
          <div className="hdr-doc-type">ACTA DE REUNIÓN</div>
          <div className="hdr-doc-number">ACTA-2026-0001</div>
        </div>
      </div>

      <div className="bd">
        <div className="mt">
          <div className="ms">
            <div className="ml">Cliente</div>
            <div className="mv font-bold">{data.client.company || data.client.name}</div>
          </div>
          <div className="ms text-right">
            <div className="ml">Fecha</div>
            <div className="mv">{data.date.today}</div>
            <div className="ml mt-4">Duración</div>
            <div className="mv">1h 30min</div>
          </div>
        </div>

        {/* Attendees grid */}
        <div className="mt">
          <div className="ms">
            <div className="ml">Asistentes {data.company.name}</div>
            <div className="mv">• Director de PI</div>
            <div className="mv">• Abogado especialista</div>
          </div>
          <div className="ms">
            <div className="ml">Asistentes {data.client.company || 'Cliente'}</div>
            <div className="mv">• {data.client.name}</div>
            <div className="mv">• Director Legal</div>
          </div>
        </div>

        {/* Sections */}
        <div className="rp-h">1. Revisión de Portfolio</div>
        <div className="rp-p">
          Se ha revisado el estado actual del portfolio de marcas del cliente, identificando 
          3 marcas próximas a renovación y 2 posibles extensiones territoriales.
        </div>

        <div className="rp-h">2. Plazos Críticos</div>
        <table>
          <thead>
            <tr>
              <th>Marca</th>
              <th>Acción</th>
              <th>Plazo</th>
              <th className="td-c">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>MARCA EJEMPLO</td>
              <td>Renovación</td>
              <td>15/03/2026</td>
              <td className="td-c"><span className="status st-warn">Pendiente</span></td>
            </tr>
            <tr>
              <td>BRAND PLUS</td>
              <td>Respuesta a examen</td>
              <td>28/02/2026</td>
              <td className="td-c"><span className="status st-urg">Urgente</span></td>
            </tr>
            <tr>
              <td>LOGO CO</td>
              <td>Extensión UE</td>
              <td>30/04/2026</td>
              <td className="td-c"><span className="status st-ok">OK</span></td>
            </tr>
          </tbody>
        </table>

        <div className="rp-h">3. Acuerdos Alcanzados</div>
        <div className="rp-p">
          <strong>1.</strong> Proceder con la renovación de MARCA EJEMPLO antes del 15/03/2026.<br />
          <strong>2.</strong> Preparar respuesta al examen de BRAND PLUS — borrador para revisión el 20/02.<br />
          <strong>3.</strong> Evaluar presupuesto para extensión de LOGO CO a la UE.<br />
          <strong>4.</strong> Programar reunión de seguimiento para el 15/02/2026.
        </div>

        <div className="conditions">
          <div className="conditions-title">Próxima reunión</div>
          <p>15 de febrero de 2026 a las 10:00h — Videoconferencia</p>
        </div>
      </div>

      <div className="ft">
        <div className="ft-grid">
          <div>
            <div className="ft-label">Elaborado por</div>
            <div className="ft-value">{data.company.name}</div>
          </div>
          <div>
            <div className="ft-label">Email</div>
            <div className="ft-value">{data.company.email}</div>
          </div>
          <div>
            <div className="ft-label">Fecha acta</div>
            <div className="ft-value">{data.date.today}</div>
          </div>
        </div>
      </div>
    </>
  );
}
