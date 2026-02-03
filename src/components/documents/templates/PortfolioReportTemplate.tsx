// ============================================================
// PORTFOLIO REPORT TEMPLATE - Informe de Portfolio
// ============================================================

import { cn } from '@/lib/utils';
import type { DesignTokens } from '@/lib/document-templates/designTokens';
import type { DocumentDataContext } from '@/hooks/documents/useDocumentData';

interface TemplateProps {
  style: DesignTokens;
  data: DocumentDataContext;
  layoutClass: string;
}

export function PortfolioReportTemplate({ style, data, layoutClass }: TemplateProps) {
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
          <div className="hdr-doc-type">INFORME</div>
          <div className="hdr-doc-number">RPT-2026-0001</div>
        </div>
      </div>

      <div className="bd">
        <div className="rp-t">Informe de Portfolio de Propiedad Intelectual</div>
        <div className="rp-su">
          Cliente: {data.client.company || data.client.name} — Periodo: Enero 2026
        </div>

        {/* Stats Grid */}
        <div className="sg">
          <div className="sgi">
            <div className="sgn">12</div>
            <div className="sgl">Marcas Activas</div>
          </div>
          <div className="sgi">
            <div className="sgn">3</div>
            <div className="sgl">Patentes</div>
          </div>
          <div className="sgi">
            <div className="sgn">5</div>
            <div className="sgl">Acciones Pendientes</div>
          </div>
          <div className="sgi">
            <div className="sgn">8</div>
            <div className="sgl">Jurisdicciones</div>
          </div>
        </div>

        <div className="rp-h">Resumen Ejecutivo</div>
        <div className="rp-p">
          El portfolio de propiedad intelectual de {data.client.company || data.client.name} se 
          encuentra en buen estado general. Se identifican 3 acciones prioritarias a realizar 
          en el próximo trimestre para mantener la protección óptima de los activos.
        </div>

        <div className="rp-h">Plazos Críticos</div>
        <table>
          <thead>
            <tr>
              <th>Activo</th>
              <th>Acción</th>
              <th>Fecha límite</th>
              <th className="td-c">Prioridad</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>MARCA PRINCIPAL</td>
              <td>Renovación</td>
              <td>15/03/2026</td>
              <td className="td-c"><span className="status st-urg">Alta</span></td>
            </tr>
            <tr>
              <td>LOGO CORPORATIVO</td>
              <td>Extensión territorial</td>
              <td>30/04/2026</td>
              <td className="td-c"><span className="status st-warn">Media</span></td>
            </tr>
            <tr>
              <td>PATENTE ES-2024001</td>
              <td>Anualidad</td>
              <td>15/05/2026</td>
              <td className="td-c"><span className="status st-ok">Normal</span></td>
            </tr>
          </tbody>
        </table>

        <div className="rp-h">Vigilancia IA</div>
        <div className="rp-p">
          El sistema de vigilancia automática ha analizado 1,234 solicitudes de marca en las 
          jurisdicciones monitorizadas durante este periodo. Se han identificado 2 alertas 
          de similitud que requieren evaluación.
        </div>

        <div className="sg">
          <div className="sgi">
            <div className="sgn">1,234</div>
            <div className="sgl">Marcas Analizadas</div>
          </div>
          <div className="sgi">
            <div className="sgn">2</div>
            <div className="sgl">Alertas</div>
          </div>
          <div className="sgi">
            <div className="sgn">0</div>
            <div className="sgl">Riesgo Alto</div>
          </div>
          <div className="sgi">
            <div className="sgn">98.5%</div>
            <div className="sgl">Precisión IA</div>
          </div>
        </div>

        <div className="rp-h">Recomendaciones</div>
        <div className="rp-p">
          <strong>1.</strong> Priorizar la renovación de MARCA PRINCIPAL antes del 15/03/2026.<br />
          <strong>2.</strong> Evaluar la extensión de LOGO CORPORATIVO a mercados de Latinoamérica.<br />
          <strong>3.</strong> Revisar las 2 alertas de vigilancia para determinar acciones preventivas.
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
            <div className="ft-label">Fecha</div>
            <div className="ft-value">{data.date.today}</div>
          </div>
        </div>
      </div>
    </>
  );
}
