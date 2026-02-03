// ============================================================
// WATCH REPORT TEMPLATE - Informe de Vigilancia
// ============================================================

import { cn } from '@/lib/utils';
import type { DesignTokens } from '@/lib/document-templates/designTokens';
import type { DocumentDataContext } from '@/hooks/documents/useDocumentData';

interface TemplateProps {
  style: DesignTokens;
  data: DocumentDataContext;
  layoutClass: string;
}

export function WatchReportTemplate({ style, data, layoutClass }: TemplateProps) {
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
            <div className="hdr-info">Sistema de Vigilancia de Marcas</div>
          </div>
        </div>
        <div className="text-right">
          <div className="hdr-doc-type">VIGILANCIA</div>
          <div className="hdr-doc-number">VIG-2026-0001</div>
        </div>
      </div>

      <div className="bd">
        <div className="rp-t">Informe de Vigilancia de Marcas</div>
        <div className="rp-su">
          Periodo: Enero 2026 — Cliente: {data.client.company || data.client.name}
        </div>

        {/* Stats Grid */}
        <div className="sg">
          <div className="sgi">
            <div className="sgn">856</div>
            <div className="sgl">Solicitudes Analizadas</div>
          </div>
          <div className="sgi">
            <div className="sgn">4</div>
            <div className="sgl">Alertas Detectadas</div>
          </div>
          <div className="sgi">
            <div className="sgn">1</div>
            <div className="sgl">Riesgo Alto</div>
          </div>
          <div className="sgi">
            <div className="sgn">99.2%</div>
            <div className="sgl">Precisión IA</div>
          </div>
        </div>

        <div className="rp-h">Alertas Detectadas</div>
        <table>
          <thead>
            <tr>
              <th>Marca Detectada</th>
              <th className="td-c">Similitud</th>
              <th>Jurisdicción</th>
              <th className="td-c">Riesgo</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>MARCA SIMILAR ONE</td>
              <td className="td-c td-num">87%</td>
              <td>🇪🇸 España</td>
              <td className="td-c"><span className="status st-urg">Alto</span></td>
            </tr>
            <tr>
              <td>BRANDSIMILAR</td>
              <td className="td-c td-num">72%</td>
              <td>🇪🇺 EUIPO</td>
              <td className="td-c"><span className="status st-warn">Medio</span></td>
            </tr>
            <tr>
              <td>MARCA PARECIDA</td>
              <td className="td-c td-num">65%</td>
              <td>🇫🇷 Francia</td>
              <td className="td-c"><span className="status st-warn">Medio</span></td>
            </tr>
            <tr>
              <td>SIMILAR BRAND CO</td>
              <td className="td-c td-num">58%</td>
              <td>🇩🇪 Alemania</td>
              <td className="td-c"><span className="status st-ok">Bajo</span></td>
            </tr>
          </tbody>
        </table>

        <div className="rp-h">Análisis de Alerta de Riesgo Alto</div>
        <div className="rp-p">
          <strong>MARCA SIMILAR ONE</strong> (Solicitud ES-2026-001234)<br />
          Solicitante: Empresa Competidora S.L.<br />
          Clases: 35, 42 (coincidentes con su marca)<br /><br />
          
          <em>Análisis:</em> La marca presenta una similitud visual y fonética significativa (87%) 
          con su marca protegida. La coincidencia en las clases 35 y 42 incrementa el riesgo de 
          confusión en el mercado. Recomendamos evaluar la presentación de oposición.
        </div>

        <div className="rp-h">Marcas Sin Incidencias</div>
        <div className="rp-p">
          Las siguientes marcas monitorizadas no han presentado alertas durante este periodo:
          <br />• {data.matter?.trademarkName || 'MARCA PRINCIPAL'} — 5 jurisdicciones
          <br />• LOGO SECUNDARIO — 3 jurisdicciones
          <br />• SUBMARCA PLUS — 2 jurisdicciones
        </div>

        <div className="rp-h">Cobertura de Vigilancia</div>
        <div className="office-grid">
          <div className="office-item">
            <span className="office-flag">🇪🇸</span>
            <span className="office-name">OEPM</span>
          </div>
          <div className="office-item">
            <span className="office-flag">🇪🇺</span>
            <span className="office-name">EUIPO</span>
          </div>
          <div className="office-item">
            <span className="office-flag">🌐</span>
            <span className="office-name">WIPO</span>
          </div>
          <div className="office-item">
            <span className="office-flag">🇫🇷</span>
            <span className="office-name">INPI Francia</span>
          </div>
          <div className="office-item">
            <span className="office-flag">🇩🇪</span>
            <span className="office-name">DPMA</span>
          </div>
          <div className="office-item">
            <span className="office-flag">🇬🇧</span>
            <span className="office-name">UKIPO</span>
          </div>
        </div>
      </div>

      <div className="ft">
        <div className="ft-grid">
          <div>
            <div className="ft-label">Generado por</div>
            <div className="ft-value">Sistema IP-NEXUS</div>
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
