-- Delete existing elegant templates to avoid duplicates
DELETE FROM document_templates 
WHERE code IN ('INVOICE_ELEGANT', 'QUOTE_ELEGANT', 'LETTER_ELEGANT', 'CONTRACT_ELEGANT')
  AND organization_id IS NULL;

-- 1. FACTURA ELEGANTE (category: billing)
INSERT INTO document_templates (
  code, name, description, document_type, style, category, 
  content_html, template_content, variables, 
  is_default, is_active, is_system_template, 
  show_logo, show_header, show_footer, layout
)
VALUES (
  'INVOICE_ELEGANT',
  'Factura Elegante',
  'Diseño elegante negro y dorado para clientes premium',
  'invoice',
  'elegant',
  'billing',
  '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Georgia,serif;background:#faf9f6;color:#1a1a1a;line-height:1.6}.invoice{max-width:800px;margin:0 auto;background:#fff}.header{background:#1a1a1a;color:#d4af37;padding:40px;display:flex;justify-content:space-between;align-items:center}.header-left h1{font-size:36px;font-weight:300;letter-spacing:6px}.header-right{text-align:right}.header-right .invoice-label{font-size:12px;letter-spacing:2px;color:#888}.header-right .invoice-number{font-size:24px;color:#d4af37}.gold-line{height:4px;background:linear-gradient(90deg,#d4af37,#f4e4bc,#d4af37)}.content{padding:40px}.info-section{display:flex;justify-content:space-between;margin-bottom:40px}.info-block h3{font-size:11px;letter-spacing:2px;color:#888;margin-bottom:10px;text-transform:uppercase}.info-block p{font-size:14px;margin:4px 0}table{width:100%;border-collapse:collapse;margin:30px 0}thead{background:#1a1a1a;color:#d4af37}th{padding:15px;text-align:left;font-size:11px;letter-spacing:2px;text-transform:uppercase}th:last-child{text-align:right}td{padding:15px;border-bottom:1px solid #eee;font-size:14px}td:last-child{text-align:right}.totals{margin-left:auto;width:300px}.totals-row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #eee}.totals-row.total{background:#1a1a1a;color:#d4af37;padding:15px;margin-top:10px;font-size:18px;font-weight:600}.footer{background:#1a1a1a;color:#fff;padding:30px 40px;display:flex;justify-content:space-between}.payment-info h4{color:#d4af37;font-size:12px;letter-spacing:2px;margin-bottom:10px}.payment-info p{font-size:13px;color:#ccc}.signature{text-align:right}.signature-line{width:200px;border-bottom:1px solid #d4af37;margin:30px 0 10px auto}.signature-name{color:#d4af37;font-style:italic;font-size:18px}</style></head><body><div class="invoice"><div class="header"><div class="header-left"><h1>{{empresa_nombre}}</h1></div><div class="header-right"><div class="invoice-label">FACTURA Nº</div><div class="invoice-number">{{factura_numero}}</div><div style="margin-top:15px;font-size:13px">{{factura_fecha}}</div></div></div><div class="gold-line"></div><div class="content"><div class="info-section"><div class="info-block"><h3>Datos del Emisor</h3><p><strong>{{empresa_nombre}}</strong></p><p>{{empresa_direccion}}</p><p>CIF: {{empresa_cif}}</p><p>{{empresa_telefono}}</p></div><div class="info-block" style="text-align:right"><h3>Facturar A</h3><p><strong>{{cliente_nombre}}</strong></p><p>{{cliente_direccion}}</p><p>CIF: {{cliente_cif}}</p></div></div><table><thead><tr><th style="width:50%">Descripción</th><th style="width:15%">Cantidad</th><th style="width:15%">Precio</th><th style="width:20%">Total</th></tr></thead><tbody>{{#items}}<tr><td>{{descripcion}}</td><td>{{cantidad}}</td><td>{{precio}}</td><td>{{total}}</td></tr>{{/items}}</tbody></table><div class="totals"><div class="totals-row"><span>Subtotal</span><span>{{subtotal}}</span></div><div class="totals-row"><span>IVA ({{iva_porcentaje}})</span><span>{{iva_importe}}</span></div><div class="totals-row total"><span>TOTAL</span><span>{{total_factura}}</span></div></div></div><div class="footer"><div class="payment-info"><h4>INFORMACIÓN DE PAGO</h4><p>Banco: {{banco_nombre}}</p><p>IBAN: {{banco_iban}}</p><p>Vencimiento: {{factura_vencimiento}}</p></div><div class="signature"><div class="signature-line"></div><div class="signature-name">{{firma_nombre}}</div><div style="font-size:12px;color:#888">{{firma_cargo}}</div></div></div></div></body></html>',
  'Factura Elegante Template',
  '{"empresa_nombre":{"label":"Nombre empresa","required":true},"factura_numero":{"label":"Número factura","required":true},"factura_fecha":{"label":"Fecha","required":true},"items":{"label":"Líneas","type":"array"}}'::jsonb,
  false, true, true,
  true, true, true, 'elegant'
);

-- 2. PRESUPUESTO ELEGANTE (category: billing)
INSERT INTO document_templates (
  code, name, description, document_type, style, category,
  content_html, template_content, variables,
  is_default, is_active, is_system_template,
  show_logo, show_header, show_footer, layout
)
VALUES (
  'QUOTE_ELEGANT',
  'Presupuesto Elegante',
  'Presupuesto premium negro y dorado',
  'quote',
  'elegant',
  'billing',
  '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Georgia,serif;background:#faf9f6;color:#1a1a1a;line-height:1.6}.quote{max-width:800px;margin:0 auto;background:#fff}.header{background:#1a1a1a;color:#d4af37;padding:40px}.header-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:30px}.header h1{font-size:32px;font-weight:300;letter-spacing:6px}.quote-info{text-align:right}.quote-info .label{font-size:11px;letter-spacing:2px;color:#888}.quote-info .value{font-size:20px;color:#d4af37}.project-title{background:rgba(212,175,55,0.1);padding:20px;border-left:4px solid #d4af37}.project-title h2{font-size:14px;color:#d4af37;letter-spacing:2px;margin-bottom:5px}.project-title p{font-size:18px;color:#fff}.gold-line{height:4px;background:linear-gradient(90deg,#d4af37,#f4e4bc,#d4af37)}.content{padding:40px}.info-section{display:flex;justify-content:space-between;margin-bottom:40px;padding-bottom:30px;border-bottom:1px solid #eee}.info-block h3{font-size:11px;letter-spacing:2px;color:#888;margin-bottom:10px;text-transform:uppercase}.info-block p{font-size:14px;margin:4px 0}table{width:100%;border-collapse:collapse;margin:30px 0}thead{background:#1a1a1a;color:#d4af37}th{padding:15px;text-align:left;font-size:11px;letter-spacing:2px;text-transform:uppercase}th:last-child{text-align:right}td{padding:15px;border-bottom:1px solid #eee;font-size:14px}td:last-child{text-align:right}.totals{margin-left:auto;width:300px;margin-bottom:40px}.totals-row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #eee}.totals-row.total{background:#1a1a1a;color:#d4af37;padding:15px;margin-top:10px;font-size:18px;font-weight:600}.validity{background:#faf9f6;padding:20px;border-left:4px solid #d4af37;margin-bottom:30px}.validity h4{font-size:12px;color:#d4af37;letter-spacing:2px;margin-bottom:10px}.terms{font-size:13px;color:#666}.terms h4{font-size:12px;letter-spacing:2px;color:#1a1a1a;margin-bottom:10px}.footer{background:#1a1a1a;color:#fff;padding:30px 40px;display:flex;justify-content:space-between}.contact p{font-size:13px;color:#888}.signature{text-align:right}.signature-line{width:200px;border-bottom:1px solid #d4af37;margin:30px 0 10px auto}.signature-name{color:#d4af37;font-style:italic;font-size:18px}</style></head><body><div class="quote"><div class="header"><div class="header-top"><h1>PRESUPUESTO</h1><div class="quote-info"><div class="label">REFERENCIA</div><div class="value">{{presupuesto_numero}}</div><div style="margin-top:10px;font-size:13px">{{presupuesto_fecha}}</div></div></div><div class="project-title"><h2>PROYECTO</h2><p>{{proyecto_nombre}}</p></div></div><div class="gold-line"></div><div class="content"><div class="info-section"><div class="info-block"><h3>De</h3><p><strong>{{empresa_nombre}}</strong></p><p>{{empresa_direccion}}</p><p>CIF: {{empresa_cif}}</p></div><div class="info-block" style="text-align:right"><h3>Para</h3><p><strong>{{cliente_nombre}}</strong></p><p>{{cliente_direccion}}</p><p>{{cliente_email}}</p></div></div><table><thead><tr><th style="width:50%">Servicio / Concepto</th><th style="width:15%">Cantidad</th><th style="width:15%">Precio</th><th style="width:20%">Importe</th></tr></thead><tbody>{{#items}}<tr><td>{{descripcion}}</td><td>{{cantidad}}</td><td>{{precio}}</td><td>{{total}}</td></tr>{{/items}}</tbody></table><div class="totals"><div class="totals-row"><span>Subtotal</span><span>{{subtotal}}</span></div><div class="totals-row"><span>IVA ({{iva_porcentaje}})</span><span>{{iva_importe}}</span></div><div class="totals-row total"><span>TOTAL</span><span>{{total_presupuesto}}</span></div></div><div class="validity"><h4>VALIDEZ</h4><p>Este presupuesto es válido durante <strong>{{validez_dias}} días</strong>.</p></div><div class="terms"><h4>CONDICIONES</h4><p>{{condiciones}}</p></div></div><div class="footer"><div class="contact"><p>{{empresa_email}} | {{empresa_telefono}}</p></div><div class="signature"><div class="signature-line"></div><div class="signature-name">{{firma_nombre}}</div></div></div></div></body></html>',
  'Presupuesto Elegante Template',
  '{"presupuesto_numero":{"label":"Número","required":true},"proyecto_nombre":{"label":"Proyecto","required":true},"items":{"label":"Líneas","type":"array"}}'::jsonb,
  false, true, true,
  true, true, true, 'elegant'
);

-- 3. CARTA ELEGANTE (category: correspondence)
INSERT INTO document_templates (
  code, name, description, document_type, style, category,
  content_html, template_content, variables,
  is_default, is_active, is_system_template,
  show_logo, show_header, show_footer, layout
)
VALUES (
  'LETTER_ELEGANT',
  'Carta Elegante',
  'Membrete elegante para correspondencia formal',
  'letter',
  'elegant',
  'correspondence',
  '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Georgia,serif;background:#faf9f6;color:#1a1a1a;line-height:1.8}.letter{max-width:800px;margin:0 auto;background:#fff;min-height:1000px;display:flex;flex-direction:column}.header{background:#1a1a1a;padding:30px 40px;display:flex;justify-content:space-between;align-items:center}.logo{color:#d4af37;font-size:28px;font-weight:300;letter-spacing:4px}.header-contact{text-align:right;font-size:12px;color:#888}.gold-line{height:3px;background:linear-gradient(90deg,#d4af37,#f4e4bc,#d4af37)}.content{padding:50px 60px;flex:1}.date{text-align:right;color:#888;font-size:14px;margin-bottom:40px}.recipient{margin-bottom:40px}.recipient h3{font-size:11px;letter-spacing:2px;color:#888;margin-bottom:10px;text-transform:uppercase}.recipient p{font-size:15px;margin:3px 0}.subject{background:#faf9f6;padding:15px 20px;border-left:4px solid #d4af37;margin-bottom:40px}.subject span{font-size:11px;letter-spacing:2px;color:#888}.subject p{font-size:16px;font-weight:600;margin-top:5px}.salutation{margin-bottom:25px;font-size:15px}.body-text{font-size:15px;text-align:justify}.body-text p{margin-bottom:20px}.closing{margin-top:40px}.signature-area{margin-top:50px}.signature-line{width:250px;border-bottom:1px solid #d4af37;margin-bottom:10px}.signature-name{color:#d4af37;font-style:italic;font-size:20px}.signature-title{font-size:13px;color:#888;margin-top:5px}.footer{background:#1a1a1a;padding:20px 40px;display:flex;justify-content:space-between;align-items:center}.footer-left{color:#888;font-size:12px}.footer-right{color:#d4af37;font-size:12px}</style></head><body><div class="letter"><div class="header"><div class="logo">{{empresa_nombre}}</div><div class="header-contact"><p>{{empresa_direccion}}</p><p>{{empresa_telefono}} | {{empresa_email}}</p></div></div><div class="gold-line"></div><div class="content"><div class="date">{{lugar}}, {{fecha}}</div><div class="recipient"><h3>Destinatario</h3><p><strong>{{destinatario_nombre}}</strong></p><p>{{destinatario_cargo}}</p><p>{{destinatario_empresa}}</p></div><div class="subject"><span>ASUNTO</span><p>{{asunto}}</p></div><div class="salutation">{{saludo}}</div><div class="body-text">{{cuerpo}}</div><div class="closing"><p>{{despedida}}</p></div><div class="signature-area"><div class="signature-line"></div><div class="signature-name">{{firmante_nombre}}</div><div class="signature-title">{{firmante_cargo}}</div></div></div><div class="footer"><div class="footer-left">CIF: {{empresa_cif}}</div><div class="footer-right">{{empresa_web}}</div></div></div></body></html>',
  'Carta Elegante Template',
  '{"destinatario_nombre":{"label":"Destinatario","required":true},"asunto":{"label":"Asunto","required":true},"cuerpo":{"label":"Cuerpo","required":true}}'::jsonb,
  false, true, true,
  true, true, true, 'elegant'
);

-- 4. CONTRATO ELEGANTE (category: contract)
INSERT INTO document_templates (
  code, name, description, document_type, style, category,
  content_html, template_content, variables,
  is_default, is_active, is_system_template,
  show_logo, show_header, show_footer, layout
)
VALUES (
  'CONTRACT_ELEGANT',
  'Contrato Elegante',
  'Contrato premium negro y dorado',
  'contract',
  'elegant',
  'contract',
  '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Georgia,serif;background:#faf9f6;color:#1a1a1a;line-height:1.7}.contract{max-width:800px;margin:0 auto;background:#fff}.header{background:#1a1a1a;padding:40px;text-align:center}.header h1{color:#d4af37;font-size:32px;font-weight:300;letter-spacing:8px;margin-bottom:10px}.header p{color:#888;font-size:14px;letter-spacing:2px}.gold-line{height:4px;background:linear-gradient(90deg,#d4af37,#f4e4bc,#d4af37)}.content{padding:50px}.intro{text-align:center;margin-bottom:40px;padding-bottom:30px;border-bottom:1px solid #eee}.intro p{font-size:14px;color:#666}.intro .date{font-size:16px;color:#1a1a1a;font-weight:600;margin-top:10px}.parties{display:flex;justify-content:space-between;margin-bottom:40px;padding:30px;background:#faf9f6}.party{width:45%}.party h3{font-size:11px;letter-spacing:2px;color:#d4af37;margin-bottom:15px;text-transform:uppercase}.party p{font-size:14px;margin:5px 0}.party .name{font-weight:600;font-size:16px}.clause{margin-bottom:30px}.clause h4{font-size:13px;letter-spacing:2px;color:#1a1a1a;margin-bottom:15px;padding-bottom:10px;border-bottom:2px solid #d4af37;display:inline-block}.clause p{font-size:14px;text-align:justify}.clause ul{margin-left:20px;margin-top:10px}.clause li{font-size:14px;margin-bottom:8px}.signatures{display:flex;justify-content:space-between;margin-top:60px;padding-top:40px;border-top:1px solid #eee}.sig-block{width:45%;text-align:center}.sig-block h4{font-size:11px;letter-spacing:2px;color:#888;margin-bottom:60px}.sig-line{border-bottom:1px solid #d4af37;margin-bottom:10px}.sig-name{font-style:italic;color:#d4af37;font-size:16px}.sig-role{font-size:12px;color:#888;margin-top:5px}.footer{background:#1a1a1a;padding:20px 40px;text-align:center}.footer p{color:#888;font-size:11px}</style></head><body><div class="contract"><div class="header"><h1>CONTRATO</h1><p>{{contrato_tipo}}</p></div><div class="gold-line"></div><div class="content"><div class="intro"><p>Contrato celebrado en</p><div class="date">{{lugar}}, a {{fecha}}</div></div><div class="parties"><div class="party"><h3>Primera Parte</h3><p class="name">{{empresa_nombre}}</p><p>CIF: {{empresa_cif}}</p><p>{{empresa_direccion}}</p></div><div class="party"><h3>Segunda Parte</h3><p class="name">{{cliente_nombre}}</p><p>CIF: {{cliente_cif}}</p><p>{{cliente_direccion}}</p></div></div><div class="clause"><h4>PRIMERO - OBJETO</h4><p>{{clausula_objeto}}</p></div><div class="clause"><h4>SEGUNDO - SERVICIOS</h4><ul>{{#servicios}}<li>{{descripcion}}</li>{{/servicios}}</ul></div><div class="clause"><h4>TERCERO - HONORARIOS</h4><p>{{clausula_honorarios}}</p></div><div class="clause"><h4>CUARTO - DURACIÓN</h4><p>{{clausula_duracion}}</p></div><div class="clause"><h4>QUINTO - CONFIDENCIALIDAD</h4><p>{{clausula_confidencialidad}}</p></div><div class="signatures"><div class="sig-block"><h4>POR {{empresa_nombre}}</h4><div class="sig-line"></div><div class="sig-name">{{representante_empresa}}</div><div class="sig-role">{{cargo_representante}}</div></div><div class="sig-block"><h4>POR EL CLIENTE</h4><div class="sig-line"></div><div class="sig-name">{{cliente_nombre}}</div></div></div></div><div class="footer"><p>{{empresa_nombre}} | {{empresa_telefono}} | {{empresa_email}}</p></div></div></body></html>',
  'Contrato Elegante Template',
  '{"contrato_tipo":{"label":"Tipo contrato","required":true},"clausula_objeto":{"label":"Objeto","required":true},"servicios":{"label":"Servicios","type":"array"}}'::jsonb,
  false, true, true,
  true, true, true, 'elegant'
);