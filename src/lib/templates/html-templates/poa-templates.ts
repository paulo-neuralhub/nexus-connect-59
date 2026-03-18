// ============================================================
// IP-NEXUS - POWER OF ATTORNEY TEMPLATES BY OFFICE
// Office-specific POA templates with legal requirements
// ============================================================

export interface POATemplateDefinition {
  code: string;
  office_code: string;
  official_form_number: string;
  name_es: string;
  name_en: string;
  description_es: string;
  description_en: string;
  content_html: string;
  variables: Record<string, VariableDefinition>;
  signature_type: 'simple' | 'electronic' | 's_signature' | 'wet_signature' | 'seal_preferred' | 'qualified';
  paper_size: 'A4' | 'letter';
}

interface VariableDefinition {
  type: 'text' | 'date' | 'email' | 'boolean' | 'textarea' | 'select';
  required: boolean;
  source?: string;
  default?: string | boolean;
  placeholder?: string;
  validation?: string;
  options?: string[];
}

// ============================================================
// EUIPO - GENERAL AUTHORIZATION
// ============================================================
export const POA_EUIPO_TEMPLATE: POATemplateDefinition = {
  code: 'poa_euipo_general',
  office_code: 'EUIPO',
  official_form_number: 'EUIPO-POA',
  name_es: 'Autorización EUIPO - General',
  name_en: 'EUIPO Authorization - General',
  description_es: 'Poder de representación general ante EUIPO',
  description_en: 'General power of attorney before EUIPO',
  paper_size: 'A4',
  signature_type: 'simple',
  variables: {
    'applicant.name': { type: 'text', required: true, source: 'client.name' },
    'applicant.tax_id': { type: 'text', required: true, source: 'client.tax_id' },
    'applicant.address': { type: 'text', required: true, source: 'client.address' },
    'applicant.city': { type: 'text', required: true, source: 'client.city' },
    'applicant.postal_code': { type: 'text', required: true, source: 'client.postal_code' },
    'applicant.country': { type: 'text', required: true, source: 'client.country' },
    'applicant.email': { type: 'email', required: false, source: 'client.email' },
    'representative.name': { type: 'text', required: true, source: 'organization.name' },
    'representative.euipo_id': { type: 'text', required: false, source: 'organization.euipo_id' },
    'representative.address': { type: 'text', required: true, source: 'organization.address' },
    'representative.city': { type: 'text', required: true, source: 'organization.city' },
    'representative.postal_code': { type: 'text', required: true, source: 'organization.postal_code' },
    'representative.country': { type: 'text', required: true, source: 'organization.country' },
    'representative.email': { type: 'email', required: false, source: 'organization.email' },
    'authorization_general': { type: 'boolean', required: false, default: true },
    'authorization_individual': { type: 'boolean', required: false, default: false },
    'representative_professional': { type: 'boolean', required: false, default: true },
    'representative_legal': { type: 'boolean', required: false, default: false },
    'sub_auth_allowed': { type: 'boolean', required: false, default: true },
    'signature_city': { type: 'text', required: true },
    'signature_date': { type: 'date', required: true, default: 'today' },
  },
  content_html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>EUIPO - General Authorisation</title>
  <style>
    @page { size: A4; margin: 2cm; }
    body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #1a1a1a; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #003399; padding-bottom: 20px; }
    .logo-section { margin-bottom: 15px; }
    .title { font-size: 18pt; font-weight: bold; color: #003399; margin: 10px 0; }
    .subtitle { font-size: 11pt; color: #666; }
    .form-section { margin: 25px 0; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background: #fafafa; }
    .section-title { font-weight: bold; color: #003399; margin-bottom: 15px; text-transform: uppercase; font-size: 10pt; letter-spacing: 0.5px; border-bottom: 2px solid #003399; padding-bottom: 8px; }
    .checkbox-row { display: flex; align-items: center; margin: 10px 0; }
    .checkbox { display: inline-block; width: 16px; height: 16px; border: 2px solid #003399; border-radius: 3px; margin-right: 10px; position: relative; }
    .checkbox.checked::after { content: "✓"; position: absolute; top: -2px; left: 2px; color: #003399; font-weight: bold; }
    .field-row { margin: 12px 0; display: flex; align-items: baseline; }
    .field-label { font-weight: 600; min-width: 180px; color: #333; font-size: 10pt; }
    .field-value { flex: 1; border-bottom: 1px solid #999; padding: 4px 8px; min-height: 20px; background: #fff; }
    .authorization-text { font-size: 12pt; text-align: center; margin: 30px 0; padding: 20px; background: #f0f4ff; border-radius: 8px; font-weight: 500; }
    .signature-section { margin-top: 50px; page-break-inside: avoid; }
    .signature-grid { display: flex; justify-content: space-between; margin-top: 40px; }
    .signature-box { width: 45%; }
    .signature-line { border-top: 1px solid #333; margin-top: 70px; padding-top: 8px; text-align: center; font-size: 10pt; }
    .footer { margin-top: 40px; font-size: 9pt; color: #666; text-align: center; border-top: 1px solid #ddd; padding-top: 15px; }
    .eu-flag { font-size: 24pt; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-section">
      <span class="eu-flag">🇪🇺</span>
    </div>
    <div class="title">EUROPEAN UNION INTELLECTUAL PROPERTY OFFICE</div>
    <div class="subtitle">OFICINA DE PROPIEDAD INTELECTUAL DE LA UNIÓN EUROPEA</div>
  </div>

  <div class="form-section">
    <div class="section-title">Type of Authorisation / Tipo de Autorización</div>
    <div class="checkbox-row">
      <span class="checkbox {{#if authorization_general}}checked{{/if}}"></span>
      <span>General Authorisation / Autorización General</span>
    </div>
    <div class="checkbox-row">
      <span class="checkbox {{#if authorization_individual}}checked{{/if}}"></span>
      <span>Individual Authorisation / Autorización Individual</span>
    </div>
  </div>

  <div class="form-section">
    <div class="section-title">I / We (Authoriser) — Yo / Nosotros (Poderdante)</div>
    <div class="field-row">
      <span class="field-label">Name(s) / Nombre(s):</span>
      <span class="field-value">{{applicant.name}}</span>
    </div>
    <div class="field-row">
      <span class="field-label">ID No. / Nº Identificación:</span>
      <span class="field-value">{{applicant.tax_id}}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Address / Dirección:</span>
      <span class="field-value">{{applicant.address}}</span>
    </div>
    <div class="field-row">
      <span class="field-label">City, Postal Code:</span>
      <span class="field-value">{{applicant.postal_code}} {{applicant.city}}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Country / País:</span>
      <span class="field-value">{{applicant.country}}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Email:</span>
      <span class="field-value">{{applicant.email}}</span>
    </div>
  </div>

  <div class="authorization-text">
    <strong>DO HEREBY AUTHORISE / POR LA PRESENTE AUTORIZO A</strong>
  </div>

  <div class="form-section">
    <div class="section-title">Representative / Representante</div>
    <div class="checkbox-row">
      <span class="checkbox {{#if representative_professional}}checked{{/if}}"></span>
      <span>Professional representative / Representante profesional</span>
    </div>
    <div class="checkbox-row">
      <span class="checkbox {{#if representative_legal}}checked{{/if}}"></span>
      <span>Legal practitioner / Abogado</span>
    </div>
    <div class="field-row">
      <span class="field-label">EUIPO List No.:</span>
      <span class="field-value">{{representative.euipo_id}}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Name / Nombre:</span>
      <span class="field-value">{{representative.name}}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Address / Dirección:</span>
      <span class="field-value">{{representative.address}}</span>
    </div>
    <div class="field-row">
      <span class="field-label">City, Postal Code:</span>
      <span class="field-value">{{representative.postal_code}} {{representative.city}}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Country / País:</span>
      <span class="field-value">{{representative.country}}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Email:</span>
      <span class="field-value">{{representative.email}}</span>
    </div>
  </div>

  <div class="form-section" style="background: #f0f4ff;">
    <p style="text-align: justify; font-size: 10pt;">
      to represent me/us before the European Union Intellectual Property Office in all proceedings 
      as applicant or proprietor in relation to all present or future European Union trade mark 
      applications or registrations.
    </p>
    <p style="text-align: justify; font-size: 10pt; font-style: italic;">
      para representarme/nos ante la Oficina de Propiedad Intelectual de la Unión Europea en todos 
      los procedimientos como solicitante o titular en relación con todas las solicitudes o registros 
      de marcas de la Unión Europea presentes o futuras.
    </p>
  </div>

  <div class="form-section">
    <div class="section-title">Sub-authorisation / Sub-autorización</div>
    <div class="checkbox-row">
      <span class="checkbox {{#if sub_auth_allowed}}checked{{/if}}"></span>
      <span>May be given / Puede otorgarse</span>
    </div>
    <div class="checkbox-row">
      <span class="checkbox {{#unless sub_auth_allowed}}checked{{/unless}}"></span>
      <span>May not be given / No puede otorgarse</span>
    </div>
  </div>

  <div class="signature-section">
    <div class="field-row">
      <span class="field-label">Place and date:</span>
      <span class="field-value">{{signature_city}}, {{signature_date}}</span>
    </div>
    <div class="signature-grid">
      <div class="signature-box">
        <div class="signature-line">
          Signature / Firma<br>
          <small>{{applicant.name}}</small>
        </div>
      </div>
    </div>
  </div>

  <div class="footer">
    <p>Avenida de Europa, 4 • E-03008 • Alicante, Spain • www.euipo.europa.eu</p>
  </div>
</body>
</html>`,
};

// ============================================================
// USPTO - POWER OF ATTORNEY (PTO/AIA/82)
// ============================================================
export const POA_USPTO_TEMPLATE: POATemplateDefinition = {
  code: 'poa_uspto_82',
  office_code: 'USPTO',
  official_form_number: 'PTO/AIA/82',
  name_es: 'Poder USPTO - PTO/AIA/82',
  name_en: 'USPTO Power of Attorney - PTO/AIA/82',
  description_es: 'Poder de representación USPTO (formulario PTO/AIA/82)',
  description_en: 'Power of Attorney before USPTO (form PTO/AIA/82)',
  paper_size: 'letter',
  signature_type: 's_signature',
  variables: {
    'application_number': { type: 'text', required: false, source: 'matter.filing_number' },
    'filing_date': { type: 'date', required: false, source: 'matter.filing_date' },
    'use_customer_number': { type: 'boolean', required: false, default: false },
    'customer_number': { type: 'text', required: false, source: 'organization.uspto_customer_number' },
    'practitioner_name': { type: 'text', required: true },
    'practitioner_registration_number': { type: 'text', required: true },
    'correspondence_name': { type: 'text', required: true, source: 'organization.name' },
    'correspondence_address': { type: 'text', required: true, source: 'organization.address' },
    'correspondence_city': { type: 'text', required: true, source: 'organization.city' },
    'correspondence_state': { type: 'text', required: true },
    'correspondence_zip': { type: 'text', required: true, source: 'organization.postal_code' },
    'correspondence_email': { type: 'email', required: true, source: 'organization.email' },
    'applicant_assignee': { type: 'boolean', required: false, default: true },
    'applicant_inventor': { type: 'boolean', required: false, default: false },
    'signature_s_format': { type: 'text', required: true, placeholder: '/John Doe/', validation: String.raw`^\/[A-Za-z .\-']+\/$` },
    'signature_date': { type: 'date', required: true, default: 'today' },
    'applicant_name': { type: 'text', required: true, source: 'client.name' },
    'applicant_title': { type: 'text', required: false, placeholder: 'CEO, President, etc.' },
    'revoke_previous': { type: 'boolean', required: false, default: true },
  },
  content_html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>USPTO - Power of Attorney PTO/AIA/82</title>
  <style>
    @page { size: letter; margin: 0.75in; }
    body { font-family: "Times New Roman", Times, serif; font-size: 10pt; line-height: 1.4; color: #000; }
    .form-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
    .form-number { font-size: 9pt; text-align: right; }
    .omb-info { font-size: 8pt; color: #666; }
    .title { font-size: 14pt; font-weight: bold; text-transform: uppercase; text-align: center; margin: 20px 0; letter-spacing: 1px; }
    .section { margin: 20px 0; padding: 15px; border: 1px solid #000; }
    .section-title { font-weight: bold; text-transform: uppercase; margin-bottom: 10px; font-size: 10pt; background: #f0f0f0; padding: 5px; margin: -15px -15px 15px -15px; }
    .checkbox-row { display: flex; align-items: center; margin: 8px 0; }
    .checkbox { display: inline-block; width: 14px; height: 14px; border: 1px solid #000; margin-right: 8px; text-align: center; line-height: 12px; font-size: 10pt; }
    .checkbox.checked::after { content: "X"; font-weight: bold; }
    .field-row { margin: 8px 0; display: flex; }
    .field-label { font-weight: bold; min-width: 150px; }
    .field-value { flex: 1; border-bottom: 1px solid #000; padding: 2px 5px; min-height: 16px; }
    .practitioner-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    .practitioner-table th, .practitioner-table td { border: 1px solid #000; padding: 8px; text-align: left; font-size: 9pt; }
    .practitioner-table th { background: #f0f0f0; font-weight: bold; }
    .signature-section { margin-top: 30px; border: 1px solid #000; padding: 20px; }
    .s-signature { font-family: "Courier New", monospace; font-size: 14pt; font-weight: bold; padding: 10px; background: #fffde7; border: 1px dashed #999; display: inline-block; min-width: 200px; text-align: center; }
    .signature-line { border-top: 1px solid #000; margin-top: 50px; padding-top: 5px; width: 300px; }
    .footer { margin-top: 30px; font-size: 8pt; color: #666; border-top: 1px solid #ccc; padding-top: 10px; }
    .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 10px; margin: 10px 0; font-size: 9pt; }
    .flag { font-size: 20pt; }
  </style>
</head>
<body>
  <div class="form-header">
    <div>
      <span class="flag">🇺🇸</span>
      <strong>U.S. Patent and Trademark Office</strong>
    </div>
    <div class="form-number">
      <strong>PTO/AIA/82B</strong> (07-17)<br>
      <span class="omb-info">Approved for use through 09/30/2025. OMB 0651-0035</span>
    </div>
  </div>

  <div class="title">Power of Attorney by Applicant</div>

  <div class="section">
    <div class="section-title">Application Information</div>
    <div class="checkbox-row">
      <span class="checkbox {{#if revoke_previous}}checked{{/if}}"></span>
      <span>I hereby revoke all previous powers of attorney given in the application identified below.</span>
    </div>
    <div class="field-row">
      <span class="field-label">Application Number:</span>
      <span class="field-value">{{application_number}}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Filing Date:</span>
      <span class="field-value">{{filing_date}}</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Appointment of Representative</div>
    
    {{#if use_customer_number}}
    <div class="checkbox-row">
      <span class="checkbox checked"></span>
      <span>I hereby appoint the Patent Practitioner(s) associated with Customer Number:</span>
    </div>
    <div class="field-row" style="margin-left: 30px;">
      <span class="field-value" style="max-width: 200px; text-align: center; font-weight: bold;">{{customer_number}}</span>
    </div>
    {{else}}
    <div class="checkbox-row">
      <span class="checkbox checked"></span>
      <span>I hereby appoint Practitioner(s) named below:</span>
    </div>
    <table class="practitioner-table">
      <thead>
        <tr>
          <th style="width: 60%;">Name</th>
          <th style="width: 40%;">Registration Number</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>{{practitioner_name}}</td>
          <td>{{practitioner_registration_number}}</td>
        </tr>
      </tbody>
    </table>
    <p style="font-size: 8pt; color: #666;">(If more than 10 practitioners, use Customer Number)</p>
    {{/if}}
    
    <p style="margin-top: 15px;">to transact all business in the United States Patent and Trademark Office connected therewith.</p>
  </div>

  <div class="section">
    <div class="section-title">Correspondence Address</div>
    <div class="field-row">
      <span class="field-label">Name:</span>
      <span class="field-value">{{correspondence_name}}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Address:</span>
      <span class="field-value">{{correspondence_address}}</span>
    </div>
    <div style="display: flex; gap: 20px;">
      <div class="field-row" style="flex: 2;">
        <span class="field-label">City:</span>
        <span class="field-value">{{correspondence_city}}</span>
      </div>
      <div class="field-row" style="flex: 1;">
        <span class="field-label">State:</span>
        <span class="field-value">{{correspondence_state}}</span>
      </div>
      <div class="field-row" style="flex: 1;">
        <span class="field-label">ZIP:</span>
        <span class="field-value">{{correspondence_zip}}</span>
      </div>
    </div>
    <div class="field-row">
      <span class="field-label">Email:</span>
      <span class="field-value">{{correspondence_email}}</span>
    </div>
  </div>

  <div class="signature-section">
    <div class="section-title">Signature of Applicant</div>
    <p>I am the applicant:</p>
    <div class="checkbox-row">
      <span class="checkbox {{#if applicant_assignee}}checked{{/if}}"></span>
      <span>Assignee</span>
    </div>
    <div class="checkbox-row">
      <span class="checkbox {{#if applicant_inventor}}checked{{/if}}"></span>
      <span>Inventor</span>
    </div>

    <div class="warning">
      <strong>⚠️ S-SIGNATURE REQUIRED:</strong> USPTO requires signatures in the format <code>/Full Legal Name/</code>
    </div>

    <div style="margin-top: 20px;">
      <p><strong>Signature (S-signature format):</strong></p>
      <div class="s-signature">{{signature_s_format}}</div>
    </div>

    <div style="display: flex; gap: 40px; margin-top: 20px;">
      <div class="field-row" style="flex: 1;">
        <span class="field-label">Date:</span>
        <span class="field-value">{{signature_date}}</span>
      </div>
    </div>
    <div style="display: flex; gap: 40px;">
      <div class="field-row" style="flex: 1;">
        <span class="field-label">Name:</span>
        <span class="field-value">{{applicant_name}}</span>
      </div>
      <div class="field-row" style="flex: 1;">
        <span class="field-label">Title:</span>
        <span class="field-value">{{applicant_title}}</span>
      </div>
    </div>
  </div>

  <div class="footer">
    <p>This collection of information is required by 37 CFR 1.31, 1.32, and 1.33.</p>
    <p>If you need assistance, call 1-800-PTO-9199 and select option 2.</p>
    <p><strong>U.S. Patent and Trademark Office</strong> • Alexandria, VA 22313 • www.uspto.gov</p>
  </div>
</body>
</html>`,
};

// ============================================================
// OEPM - PODER DE REPRESENTACIÓN (FORMULARIO 3411)
// ============================================================
export const POA_OEPM_TEMPLATE: POATemplateDefinition = {
  code: 'poa_oepm_3411',
  office_code: 'OEPM',
  official_form_number: '3411',
  name_es: 'Poder OEPM - Formulario 3411',
  name_en: 'OEPM Power of Attorney - Form 3411',
  description_es: 'Documento de representación ante la OEPM',
  description_en: 'Power of Attorney before Spanish Patent Office',
  paper_size: 'A4',
  signature_type: 'simple',
  variables: {
    'poderdante.nombre': { type: 'text', required: true, source: 'client.name' },
    'poderdante.nif': { type: 'text', required: true, source: 'client.tax_id' },
    'poderdante.direccion': { type: 'text', required: true, source: 'client.address' },
    'poderdante.codigo_postal': { type: 'text', required: true, source: 'client.postal_code' },
    'poderdante.localidad': { type: 'text', required: true, source: 'client.city' },
    'poderdante.provincia': { type: 'text', required: true, source: 'client.province' },
    'poderdante.pais': { type: 'text', required: true, source: 'client.country', default: 'España' },
    'poderdante.email': { type: 'email', required: false, source: 'client.email' },
    'representante.nombre': { type: 'text', required: true, source: 'organization.name' },
    'representante.numero_colegiado': { type: 'text', required: false, source: 'organization.api_number' },
    'representante.direccion': { type: 'text', required: true, source: 'organization.address' },
    'representante.codigo_postal': { type: 'text', required: true, source: 'organization.postal_code' },
    'representante.localidad': { type: 'text', required: true, source: 'organization.city' },
    'representante.email': { type: 'email', required: false, source: 'organization.email' },
    'representante_api': { type: 'boolean', required: false, default: true },
    'representante_abogado': { type: 'boolean', required: false, default: false },
    'representante_otro': { type: 'boolean', required: false, default: false },
    'alcance_general': { type: 'boolean', required: false, default: true },
    'alcance_limitado': { type: 'boolean', required: false, default: false },
    'alcance_limitado_detalle': { type: 'textarea', required: false },
    'revoca_anteriores': { type: 'boolean', required: false, default: true },
    'firma_lugar': { type: 'text', required: true },
    'firma_fecha': { type: 'date', required: true, default: 'today' },
  },
  content_html: `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>OEPM - Documento de Representación 3411</title>
  <style>
    @page { size: A4; margin: 1.5cm; }
    body { font-family: Arial, sans-serif; font-size: 10pt; line-height: 1.4; color: #000; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; border-bottom: 3px solid #C60B1E; padding-bottom: 15px; }
    .logo-section { display: flex; align-items: center; gap: 15px; }
    .flag { font-size: 28pt; }
    .office-name { font-size: 11pt; font-weight: bold; color: #C60B1E; }
    .form-number { font-size: 9pt; text-align: right; color: #666; }
    .title { font-size: 14pt; font-weight: bold; text-transform: uppercase; text-align: center; margin: 20px 0; color: #C60B1E; }
    .section { margin: 15px 0; }
    .section-header { display: flex; align-items: center; margin-bottom: 12px; }
    .section-number { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; background: #C60B1E; color: white; font-weight: bold; border-radius: 4px; margin-right: 12px; }
    .section-title { font-weight: bold; text-transform: uppercase; font-size: 10pt; }
    .field-group { margin-left: 40px; }
    .field-row { margin: 8px 0; display: flex; align-items: baseline; }
    .field-label { font-size: 9pt; min-width: 180px; color: #333; }
    .field-value { flex: 1; border-bottom: 1px solid #000; min-height: 18px; padding: 2px 8px; }
    .checkbox-row { display: flex; align-items: center; margin: 8px 0; }
    .checkbox { width: 14px; height: 14px; border: 1px solid #000; display: inline-block; margin-right: 10px; text-align: center; line-height: 12px; }
    .checkbox.checked::after { content: "✓"; font-weight: bold; }
    .signature-section { margin-top: 30px; border: 1px solid #ddd; padding: 20px; background: #fafafa; border-radius: 8px; }
    .signature-line { border-top: 1px solid #000; margin-top: 60px; padding-top: 5px; width: 220px; text-align: center; font-size: 9pt; }
    .note-box { background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; padding: 12px; margin: 15px 0; font-size: 9pt; }
    .footer { margin-top: 30px; font-size: 8pt; text-align: center; color: #666; border-top: 1px solid #ddd; padding-top: 15px; }
    .two-col { display: flex; gap: 20px; }
    .two-col > div { flex: 1; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-section">
      <span class="flag">🇪🇸</span>
      <div class="office-name">
        OFICINA ESPAÑOLA DE<br>PATENTES Y MARCAS, O.A.
      </div>
    </div>
    <div class="form-number">
      <strong>3411</strong> (04.17)<br>
      Documento de Representación
    </div>
  </div>

  <div class="title">Documento de Representación</div>

  <div class="section">
    <div class="section-header">
      <span class="section-number">1</span>
      <span class="section-title">Identificación del Poderdante</span>
    </div>
    <div class="field-group">
      <div class="field-row">
        <span class="field-label">(1) Apellidos y Nombre / Denominación:</span>
        <span class="field-value">{{poderdante.nombre}}</span>
      </div>
      <div class="field-row">
        <span class="field-label">(2) NIF / NIE / Pasaporte:</span>
        <span class="field-value">{{poderdante.nif}}</span>
      </div>
      <div class="field-row">
        <span class="field-label">(3) Domicilio:</span>
        <span class="field-value">{{poderdante.direccion}}</span>
      </div>
      <div class="two-col">
        <div class="field-row">
          <span class="field-label">(4) C.P. y Localidad:</span>
          <span class="field-value">{{poderdante.codigo_postal}} {{poderdante.localidad}}</span>
        </div>
        <div class="field-row">
          <span class="field-label">(5) Provincia:</span>
          <span class="field-value">{{poderdante.provincia}}</span>
        </div>
      </div>
      <div class="two-col">
        <div class="field-row">
          <span class="field-label">(6) País:</span>
          <span class="field-value">{{poderdante.pais}}</span>
        </div>
        <div class="field-row">
          <span class="field-label">(7) Email:</span>
          <span class="field-value">{{poderdante.email}}</span>
        </div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header">
      <span class="section-number">2</span>
      <span class="section-title">Identificación del Representante</span>
    </div>
    <div class="field-group">
      <div class="checkbox-row">
        <span class="checkbox {{#if representante_api}}checked{{/if}}"></span>
        <span>AGENTE DE LA PROPIEDAD INDUSTRIAL Nº <strong>{{representante.numero_colegiado}}</strong></span>
      </div>
      <div class="checkbox-row">
        <span class="checkbox {{#if representante_abogado}}checked{{/if}}"></span>
        <span>ABOGADO</span>
      </div>
      <div class="checkbox-row">
        <span class="checkbox {{#if representante_otro}}checked{{/if}}"></span>
        <span>OTRO</span>
      </div>
      <div class="field-row">
        <span class="field-label">(9) Nombre:</span>
        <span class="field-value">{{representante.nombre}}</span>
      </div>
      <div class="field-row">
        <span class="field-label">(10) Domicilio:</span>
        <span class="field-value">{{representante.direccion}}</span>
      </div>
      <div class="field-row">
        <span class="field-label">C.P. y Localidad:</span>
        <span class="field-value">{{representante.codigo_postal}} {{representante.localidad}}</span>
      </div>
      <div class="field-row">
        <span class="field-label">Email:</span>
        <span class="field-value">{{representante.email}}</span>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-header">
      <span class="section-number">3</span>
      <span class="section-title">Alcance del Poder</span>
    </div>
    <div class="field-group">
      <div class="checkbox-row">
        <span class="checkbox {{#if alcance_general}}checked{{/if}}"></span>
        <span>Facultado para todos los fines ante la Oficina</span>
      </div>
      <div class="checkbox-row">
        <span class="checkbox {{#if alcance_limitado}}checked{{/if}}"></span>
        <span>Facultado sólo para: {{alcance_limitado_detalle}}</span>
      </div>
      <div class="checkbox-row">
        <span class="checkbox {{#if revoca_anteriores}}checked{{/if}}"></span>
        <span>Revoca poderes anteriores</span>
      </div>
    </div>
  </div>

  <div class="signature-section">
    <div class="section-header">
      <span class="section-number">4</span>
      <span class="section-title">Firma del Poderdante</span>
    </div>
    <div class="field-group">
      <div class="field-row">
        <span class="field-label">Lugar y fecha:</span>
        <span class="field-value">{{firma_lugar}}, {{firma_fecha}}</span>
      </div>
      <div style="display: flex; justify-content: flex-end; margin-top: 20px;">
        <div class="signature-line">
          Firma<br>
          <small>{{poderdante.nombre}}</small>
        </div>
      </div>
    </div>
  </div>

  <div class="note-box">
    <strong>📝 NOTA:</strong> La presentación electrónica conlleva una reducción del 15% en las tasas.
    Se requiere certificado digital para la presentación electrónica.
  </div>

  <div class="footer">
    <p><strong>OFICINA ESPAÑOLA DE PATENTES Y MARCAS, O.A.</strong></p>
    <p>Pº de la Castellana, 75 • 28071 MADRID • www.oepm.es</p>
  </div>
</body>
</html>`,
};

// ============================================================
// WIPO MADRID - MM12
// ============================================================
export const POA_WIPO_TEMPLATE: POATemplateDefinition = {
  code: 'poa_wipo_mm12',
  office_code: 'WIPO',
  official_form_number: 'MM12',
  name_es: 'Poder WIPO - MM12',
  name_en: 'WIPO Power of Attorney - MM12',
  description_es: 'Nombramiento de representante ante WIPO Madrid',
  description_en: 'Appointment of representative before WIPO Madrid',
  paper_size: 'A4',
  signature_type: 'simple',
  variables: {
    'holder.name': { type: 'text', required: true, source: 'client.name' },
    'holder.address': { type: 'text', required: true, source: 'client.address' },
    'holder.city': { type: 'text', required: true, source: 'client.city' },
    'holder.country': { type: 'text', required: true, source: 'client.country' },
    'holder.email': { type: 'email', required: true, source: 'client.email' },
    'representative.name': { type: 'text', required: true, source: 'organization.name' },
    'representative.address': { type: 'text', required: true, source: 'organization.address' },
    'representative.city': { type: 'text', required: true, source: 'organization.city' },
    'representative.country': { type: 'text', required: true, source: 'organization.country' },
    'representative.email': { type: 'email', required: true, source: 'organization.email' },
    'international_registrations': { type: 'textarea', required: false, placeholder: 'List of international registration numbers' },
    'signature_date': { type: 'date', required: true, default: 'today' },
    'signature_place': { type: 'text', required: true },
  },
  content_html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>WIPO Madrid - MM12 Representative Appointment</title>
  <style>
    @page { size: A4; margin: 2cm; }
    body { font-family: Arial, sans-serif; font-size: 10pt; line-height: 1.5; color: #000; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 3px solid #009EDB; padding-bottom: 15px; }
    .logo-section { display: flex; align-items: center; gap: 15px; }
    .globe { font-size: 32pt; }
    .wipo-name { font-size: 12pt; font-weight: bold; color: #009EDB; }
    .form-number { font-size: 14pt; font-weight: bold; background: #009EDB; color: white; padding: 8px 15px; border-radius: 4px; }
    .title { font-size: 14pt; font-weight: bold; text-align: center; margin: 25px 0; color: #333; }
    .section { margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background: #fafafa; }
    .section-title { font-weight: bold; color: #009EDB; margin-bottom: 15px; text-transform: uppercase; font-size: 10pt; border-bottom: 2px solid #009EDB; padding-bottom: 8px; }
    .field-row { margin: 10px 0; display: flex; align-items: baseline; }
    .field-label { font-weight: 600; min-width: 200px; color: #333; font-size: 9pt; }
    .field-value { flex: 1; border-bottom: 1px solid #999; padding: 4px 8px; min-height: 18px; background: #fff; }
    .warning-box { background: #e3f2fd; border: 1px solid #2196f3; border-radius: 4px; padding: 15px; margin: 20px 0; }
    .warning-box strong { color: #1565c0; }
    .signature-section { margin-top: 40px; }
    .signature-grid { display: flex; justify-content: space-between; margin-top: 30px; }
    .signature-box { width: 45%; }
    .signature-line { border-top: 1px solid #000; margin-top: 60px; padding-top: 8px; text-align: center; font-size: 9pt; }
    .footer { margin-top: 40px; font-size: 8pt; color: #666; text-align: center; border-top: 1px solid #ddd; padding-top: 15px; }
    .registration-box { background: #fff; border: 1px dashed #999; padding: 15px; min-height: 60px; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-section">
      <span class="globe">🌍</span>
      <div class="wipo-name">
        WORLD INTELLECTUAL<br>PROPERTY ORGANIZATION<br>
        <small style="color: #666;">Madrid System</small>
      </div>
    </div>
    <div class="form-number">MM12</div>
  </div>

  <div class="title">Appointment or Change of Representative</div>

  <div class="warning-box">
    <strong>⚠️ IMPORTANT:</strong> Only ONE representative may be recorded at a time. 
    Recording a new representative automatically cancels the previous one.
    Use the eMadrid portal for electronic submission.
  </div>

  <div class="section">
    <div class="section-title">Holder Information</div>
    <div class="field-row">
      <span class="field-label">Name of Holder:</span>
      <span class="field-value">{{holder.name}}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Address:</span>
      <span class="field-value">{{holder.address}}</span>
    </div>
    <div class="field-row">
      <span class="field-label">City:</span>
      <span class="field-value">{{holder.city}}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Country:</span>
      <span class="field-value">{{holder.country}}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Email (mandatory):</span>
      <span class="field-value">{{holder.email}}</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Representative to be Appointed</div>
    <div class="field-row">
      <span class="field-label">Name of Representative:</span>
      <span class="field-value">{{representative.name}}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Address:</span>
      <span class="field-value">{{representative.address}}</span>
    </div>
    <div class="field-row">
      <span class="field-label">City:</span>
      <span class="field-value">{{representative.city}}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Country:</span>
      <span class="field-value">{{representative.country}}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Email (mandatory):</span>
      <span class="field-value">{{representative.email}}</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">International Registrations Concerned</div>
    <p style="font-size: 9pt; color: #666;">Leave blank if this appointment applies to all international registrations of the holder.</p>
    <div class="registration-box">
      {{international_registrations}}
    </div>
  </div>

  <div class="signature-section">
    <div class="section-title">Signature of the Holder</div>
    <div class="field-row">
      <span class="field-label">Place and Date:</span>
      <span class="field-value">{{signature_place}}, {{signature_date}}</span>
    </div>
    <div class="signature-grid">
      <div class="signature-box">
        <div class="signature-line">
          Signature of Holder<br>
          <small>{{holder.name}}</small>
        </div>
      </div>
    </div>
  </div>

  <div class="footer">
    <p><strong>World Intellectual Property Organization (WIPO)</strong></p>
    <p>34, chemin des Colombettes • CH-1211 Geneva 20, Switzerland • www.wipo.int/madrid</p>
  </div>
</body>
</html>`,
};

// ============================================================
// CNIPA CHINA - POWER OF ATTORNEY
// ============================================================
export const POA_CNIPA_TEMPLATE: POATemplateDefinition = {
  code: 'poa_cnipa',
  office_code: 'CNIPA',
  official_form_number: 'CNIPA-POA',
  name_es: 'Poder CNIPA China',
  name_en: 'CNIPA China Power of Attorney',
  description_es: 'Poder de representación ante CNIPA (China)',
  description_en: 'Power of Attorney before CNIPA (China)',
  paper_size: 'A4',
  signature_type: 'seal_preferred',
  variables: {
    'applicant.name_cn': { type: 'text', required: true },
    'applicant.name_en': { type: 'text', required: true, source: 'client.name' },
    'applicant.address': { type: 'text', required: true, source: 'client.address' },
    'applicant.country': { type: 'text', required: true, source: 'client.country' },
    'agent.name': { type: 'text', required: true },
    'agent.address': { type: 'text', required: true },
    'agent.license_number': { type: 'text', required: false },
    'trademark_name': { type: 'text', required: false, source: 'matter.title' },
    'nice_classes': { type: 'text', required: false },
    'signature_date': { type: 'date', required: true, default: 'today' },
  },
  content_html: `<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <title>CNIPA - 商标代理委托书 / Trademark Power of Attorney</title>
  <style>
    @page { size: A4; margin: 2cm; }
    body { font-family: "SimSun", "宋体", Arial, sans-serif; font-size: 11pt; line-height: 1.8; color: #000; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #DE2910; padding-bottom: 20px; }
    .flag { font-size: 32pt; }
    .title-cn { font-size: 18pt; font-weight: bold; color: #DE2910; margin: 15px 0 5px 0; }
    .title-en { font-size: 12pt; color: #666; }
    .bilingual-section { margin: 25px 0; }
    .section-title { font-weight: bold; margin-bottom: 15px; padding: 8px; background: #fff0f0; border-left: 4px solid #DE2910; }
    .section-title-cn { font-size: 12pt; }
    .section-title-en { font-size: 10pt; color: #666; font-weight: normal; }
    .field-row { margin: 12px 0; display: flex; align-items: baseline; }
    .field-label { min-width: 180px; }
    .field-label-cn { font-weight: 600; }
    .field-label-en { font-size: 9pt; color: #666; }
    .field-value { flex: 1; border-bottom: 1px solid #000; padding: 4px 8px; min-height: 22px; }
    .authorization-text { background: #fffde7; border: 1px solid #ffc107; padding: 20px; margin: 25px 0; border-radius: 4px; }
    .authorization-text p { margin: 10px 0; text-align: justify; }
    .seal-section { margin-top: 40px; text-align: center; }
    .seal-box { display: inline-block; width: 120px; height: 120px; border: 2px dashed #DE2910; border-radius: 50%; margin: 20px; position: relative; }
    .seal-label { font-size: 10pt; color: #666; margin-top: 10px; }
    .warning-box { background: #ffebee; border: 1px solid #f44336; padding: 15px; margin: 20px 0; border-radius: 4px; font-size: 10pt; }
    .footer { margin-top: 40px; font-size: 9pt; color: #666; text-align: center; border-top: 1px solid #ddd; padding-top: 15px; }
    .signature-grid { display: flex; justify-content: space-around; margin-top: 30px; }
    .signature-box { text-align: center; }
    .signature-line { border-top: 1px solid #000; width: 180px; margin-top: 80px; padding-top: 8px; font-size: 9pt; }
  </style>
</head>
<body>
  <div class="header">
    <span class="flag">🇨🇳</span>
    <div class="title-cn">商标代理委托书</div>
    <div class="title-en">TRADEMARK POWER OF ATTORNEY</div>
  </div>

  <div class="warning-box">
    <strong>⚠️ 重要提示 / IMPORTANT:</strong><br>
    <span style="color: #333;">
      公司印章（公章）比签名具有更强的法律效力。建议使用公章。<br>
      <em>Company seal (chop) has stronger legal weight than signature. Seal is recommended.</em>
    </span>
  </div>

  <div class="bilingual-section">
    <div class="section-title">
      <span class="section-title-cn">委托人信息</span><br>
      <span class="section-title-en">PRINCIPAL INFORMATION</span>
    </div>
    <div class="field-row">
      <div class="field-label">
        <div class="field-label-cn">委托人名称（中文）:</div>
        <div class="field-label-en">Name (Chinese):</div>
      </div>
      <span class="field-value">{{applicant.name_cn}}</span>
    </div>
    <div class="field-row">
      <div class="field-label">
        <div class="field-label-cn">委托人名称（英文）:</div>
        <div class="field-label-en">Name (English):</div>
      </div>
      <span class="field-value">{{applicant.name_en}}</span>
    </div>
    <div class="field-row">
      <div class="field-label">
        <div class="field-label-cn">地址:</div>
        <div class="field-label-en">Address:</div>
      </div>
      <span class="field-value">{{applicant.address}}</span>
    </div>
    <div class="field-row">
      <div class="field-label">
        <div class="field-label-cn">国家:</div>
        <div class="field-label-en">Country:</div>
      </div>
      <span class="field-value">{{applicant.country}}</span>
    </div>
  </div>

  <div class="bilingual-section">
    <div class="section-title">
      <span class="section-title-cn">代理机构信息</span><br>
      <span class="section-title-en">AGENT INFORMATION</span>
    </div>
    <div class="field-row">
      <div class="field-label">
        <div class="field-label-cn">代理机构名称:</div>
        <div class="field-label-en">Agent Name:</div>
      </div>
      <span class="field-value">{{agent.name}}</span>
    </div>
    <div class="field-row">
      <div class="field-label">
        <div class="field-label-cn">地址:</div>
        <div class="field-label-en">Address:</div>
      </div>
      <span class="field-value">{{agent.address}}</span>
    </div>
    <div class="field-row">
      <div class="field-label">
        <div class="field-label-cn">代理机构代码:</div>
        <div class="field-label-en">License Number:</div>
      </div>
      <span class="field-value">{{agent.license_number}}</span>
    </div>
  </div>

  <div class="bilingual-section">
    <div class="section-title">
      <span class="section-title-cn">商标信息（如适用）</span><br>
      <span class="section-title-en">TRADEMARK INFORMATION (if applicable)</span>
    </div>
    <div class="field-row">
      <div class="field-label">
        <div class="field-label-cn">商标名称:</div>
        <div class="field-label-en">Trademark:</div>
      </div>
      <span class="field-value">{{trademark_name}}</span>
    </div>
    <div class="field-row">
      <div class="field-label">
        <div class="field-label-cn">类别:</div>
        <div class="field-label-en">Nice Classes:</div>
      </div>
      <span class="field-value">{{nice_classes}}</span>
    </div>
  </div>

  <div class="authorization-text">
    <p><strong>兹委托上述代理机构代理以下商标事宜：</strong></p>
    <p>包括但不限于商标注册申请、续展、变更、转让、许可备案、驳回复审、异议、撤销等所有商标相关程序。</p>
    <p style="font-size: 10pt; color: #666;"><em>
      The undersigned hereby authorizes the above-mentioned agency to handle trademark matters including 
      but not limited to: trademark application, renewal, amendment, assignment, license recordal, 
      review of rejection, opposition, cancellation and all other trademark-related procedures.
    </em></p>
  </div>

  <div class="seal-section">
    <div class="field-row" style="justify-content: center;">
      <div class="field-label" style="min-width: auto;">
        <div class="field-label-cn">日期 / Date:</div>
      </div>
      <span class="field-value" style="max-width: 200px; text-align: center;">{{signature_date}}</span>
    </div>
    
    <div class="signature-grid">
      <div class="signature-box">
        <div class="seal-box"></div>
        <div class="seal-label">
          公章 / Company Seal<br>
          <small>(推荐 / Recommended)</small>
        </div>
      </div>
      <div class="signature-box">
        <div class="signature-line">
          签名 / Signature<br>
          <small>{{applicant.name_en}}</small>
        </div>
      </div>
    </div>
  </div>

  <div class="footer">
    <p><strong>中国国家知识产权局 / China National Intellectual Property Administration (CNIPA)</strong></p>
    <p>https://english.cnipa.gov.cn</p>
  </div>
</body>
</html>`,
};

// ============================================================
// INPI BRASIL - PROCURAÇÃO
// ============================================================
export const POA_INPI_BR_TEMPLATE: POATemplateDefinition = {
  code: 'poa_inpi_br',
  office_code: 'INPI_BR',
  official_form_number: 'INPI-POA',
  name_es: 'Poder INPI Brasil',
  name_en: 'INPI Brazil Power of Attorney',
  description_es: 'Procuración ante INPI Brasil',
  description_en: 'Power of Attorney before INPI Brazil',
  paper_size: 'A4',
  signature_type: 'simple',
  variables: {
    'outorgante.nome': { type: 'text', required: true, source: 'client.name' },
    'outorgante.nacionalidade': { type: 'text', required: true, source: 'client.country' },
    'outorgante.endereco': { type: 'text', required: true, source: 'client.address' },
    'outorgante.cidade': { type: 'text', required: true, source: 'client.city' },
    'outorgante.estado': { type: 'text', required: true },
    'outorgante.cep': { type: 'text', required: true, source: 'client.postal_code' },
    'outorgante.documento': { type: 'text', required: true, source: 'client.tax_id' },
    'procurador.nome': { type: 'text', required: true, source: 'organization.name' },
    'procurador.endereco': { type: 'text', required: true, source: 'organization.address' },
    'procurador.cidade': { type: 'text', required: true, source: 'organization.city' },
    'procurador.estado': { type: 'text', required: true },
    'procurador.cep': { type: 'text', required: true, source: 'organization.postal_code' },
    'procurador.cpf_cnpj': { type: 'text', required: true },
    'testemunha1.nome': { type: 'text', required: false },
    'testemunha1.documento': { type: 'text', required: false },
    'testemunha2.nome': { type: 'text', required: false },
    'testemunha2.documento': { type: 'text', required: false },
    'local': { type: 'text', required: true },
    'data': { type: 'date', required: true, default: 'today' },
  },
  content_html: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>INPI Brasil - Procuração</title>
  <style>
    @page { size: A4; margin: 2cm; }
    body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.6; color: #000; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #009B3A; padding-bottom: 20px; }
    .flag { font-size: 32pt; }
    .title { font-size: 18pt; font-weight: bold; color: #009B3A; margin: 15px 0; }
    .subtitle { font-size: 11pt; color: #666; }
    .section { margin: 25px 0; }
    .section-title { font-weight: bold; color: #009B3A; margin-bottom: 15px; text-transform: uppercase; font-size: 10pt; border-bottom: 2px solid #009B3A; padding-bottom: 8px; }
    .field-row { margin: 10px 0; display: flex; align-items: baseline; }
    .field-label { font-weight: 600; min-width: 180px; font-size: 10pt; }
    .field-value { flex: 1; border-bottom: 1px solid #000; padding: 4px 8px; min-height: 18px; }
    .authorization-text { text-align: justify; margin: 25px 0; padding: 20px; background: #f0fff4; border: 1px solid #009B3A; border-radius: 4px; }
    .note-box { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; font-size: 10pt; }
    .signature-section { margin-top: 40px; }
    .signature-grid { display: flex; justify-content: space-between; margin-top: 30px; }
    .signature-box { width: 45%; }
    .signature-line { border-top: 1px solid #000; margin-top: 60px; padding-top: 8px; text-align: center; font-size: 9pt; }
    .witness-section { margin-top: 40px; border-top: 1px dashed #999; padding-top: 20px; }
    .witness-grid { display: flex; gap: 40px; }
    .witness-box { flex: 1; }
    .footer { margin-top: 40px; font-size: 9pt; color: #666; text-align: center; border-top: 1px solid #ddd; padding-top: 15px; }
  </style>
</head>
<body>
  <div class="header">
    <span class="flag">🇧🇷</span>
    <div class="title">PROCURAÇÃO</div>
    <div class="subtitle">INSTRUMENTO PARTICULAR DE MANDATO</div>
  </div>

  <div class="note-box">
    <strong>📋 NOTA IMPORTANTE:</strong><br>
    • A procuração deve ser apresentada em até 60 dias após a data do pedido.<br>
    • Notarização NÃO é obrigatória (mudança recente 2024).<br>
    • Para estrangeiros: ICP-Brasil NÃO é obrigatório, mas recomenda-se notarização + apostila.
  </div>

  <div class="section">
    <div class="section-title">Outorgante (Constituinte)</div>
    <div class="field-row">
      <span class="field-label">Nome/Razão Social:</span>
      <span class="field-value">{{outorgante.nome}}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Nacionalidade:</span>
      <span class="field-value">{{outorgante.nacionalidade}}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Endereço:</span>
      <span class="field-value">{{outorgante.endereco}}</span>
    </div>
    <div style="display: flex; gap: 20px;">
      <div class="field-row" style="flex: 2;">
        <span class="field-label">Cidade:</span>
        <span class="field-value">{{outorgante.cidade}}</span>
      </div>
      <div class="field-row" style="flex: 1;">
        <span class="field-label">Estado:</span>
        <span class="field-value">{{outorgante.estado}}</span>
      </div>
      <div class="field-row" style="flex: 1;">
        <span class="field-label">CEP:</span>
        <span class="field-value">{{outorgante.cep}}</span>
      </div>
    </div>
    <div class="field-row">
      <span class="field-label">CPF/CNPJ/Passaporte:</span>
      <span class="field-value">{{outorgante.documento}}</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Outorgado (Procurador)</div>
    <div class="field-row">
      <span class="field-label">Nome/Razão Social:</span>
      <span class="field-value">{{procurador.nome}}</span>
    </div>
    <div class="field-row">
      <span class="field-label">Endereço:</span>
      <span class="field-value">{{procurador.endereco}}</span>
    </div>
    <div style="display: flex; gap: 20px;">
      <div class="field-row" style="flex: 2;">
        <span class="field-label">Cidade:</span>
        <span class="field-value">{{procurador.cidade}}</span>
      </div>
      <div class="field-row" style="flex: 1;">
        <span class="field-label">Estado:</span>
        <span class="field-value">{{procurador.estado}}</span>
      </div>
      <div class="field-row" style="flex: 1;">
        <span class="field-label">CEP:</span>
        <span class="field-value">{{procurador.cep}}</span>
      </div>
    </div>
    <div class="field-row">
      <span class="field-label">CPF/CNPJ:</span>
      <span class="field-value">{{procurador.cpf_cnpj}}</span>
    </div>
  </div>

  <div class="authorization-text">
    <p>
      Pelo presente instrumento particular de procuração, o OUTORGANTE acima qualificado 
      nomeia e constitui o OUTORGADO como seu bastante procurador perante o 
      <strong>INSTITUTO NACIONAL DA PROPRIEDADE INDUSTRIAL - INPI</strong>, 
      com poderes para:
    </p>
    <ul>
      <li>Requerer registros de marcas, patentes e desenhos industriais;</li>
      <li>Acompanhar e responder a exigências e notificações;</li>
      <li>Interpor e responder a recursos administrativos;</li>
      <li>Requerer renovações, transferências e averbações;</li>
      <li>Praticar todos os atos necessários ao fiel cumprimento deste mandato.</li>
    </ul>
    <p style="margin-top: 15px;">
      Esta procuração é válida para todos os processos perante o INPI, presentes e futuros.
    </p>
  </div>

  <div class="signature-section">
    <div class="field-row">
      <span class="field-label">Local e Data:</span>
      <span class="field-value">{{local}}, {{data}}</span>
    </div>
    <div class="signature-grid">
      <div class="signature-box">
        <div class="signature-line">
          Assinatura do Outorgante<br>
          <small>{{outorgante.nome}}</small>
        </div>
      </div>
    </div>
  </div>

  <div class="witness-section">
    <div class="section-title">Testemunhas (Opcional)</div>
    <div class="witness-grid">
      <div class="witness-box">
        <div class="field-row">
          <span class="field-label">Nome:</span>
          <span class="field-value">{{testemunha1.nome}}</span>
        </div>
        <div class="field-row">
          <span class="field-label">CPF/RG:</span>
          <span class="field-value">{{testemunha1.documento}}</span>
        </div>
        <div class="signature-line" style="margin-top: 40px;">Assinatura</div>
      </div>
      <div class="witness-box">
        <div class="field-row">
          <span class="field-label">Nome:</span>
          <span class="field-value">{{testemunha2.nome}}</span>
        </div>
        <div class="field-row">
          <span class="field-label">CPF/RG:</span>
          <span class="field-value">{{testemunha2.documento}}</span>
        </div>
        <div class="signature-line" style="margin-top: 40px;">Assinatura</div>
      </div>
    </div>
  </div>

  <div class="footer">
    <p><strong>INSTITUTO NACIONAL DA PROPRIEDADE INDUSTRIAL - INPI</strong></p>
    <p>www.gov.br/inpi</p>
  </div>
</body>
</html>`,
};

// ============================================================
// EXPORT ALL POA TEMPLATES
// ============================================================
export const ALL_POA_TEMPLATES: POATemplateDefinition[] = [
  POA_EUIPO_TEMPLATE,
  POA_USPTO_TEMPLATE,
  POA_OEPM_TEMPLATE,
  POA_WIPO_TEMPLATE,
  POA_CNIPA_TEMPLATE,
  POA_INPI_BR_TEMPLATE,
];

export function getPOATemplateByOffice(officeCode: string): POATemplateDefinition | undefined {
  return ALL_POA_TEMPLATES.find(t => t.office_code === officeCode);
}

export function getPOATemplateByCode(code: string): POATemplateDefinition | undefined {
  return ALL_POA_TEMPLATES.find(t => t.code === code);
}
