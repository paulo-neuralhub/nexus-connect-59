-- Seed 4 Professional Quote Templates
INSERT INTO document_templates (
  organization_id, code, name, description, document_type, category, 
  is_system_template, layout, template_content, body_sections, custom_texts, type_config
) VALUES

-- 1. Presupuesto Clásico Profesional
(NULL, 'QUOTE_CLASSIC', 'Presupuesto Profesional', 
 'Formato elegante con desglose de tasas oficiales y honorarios. Ideal para despachos que buscan imagen seria y profesional.',
 'quote', 'contract', true, 'classic',
 '# PRESUPUESTO

**Nº:** {{quote.number}}
**Fecha:** {{quote.date}}
**Válido hasta:** {{quote.valid_until}}

---

## PRESUPUESTO PARA

**{{client.name}}**
{{client.tax_id}}
{{client.address}}

---

## DESCRIPCIÓN DEL SERVICIO

{{quote.description}}

**Expediente:** {{matter.reference}}
**Marca:** {{matter.mark_name}}

---

## TASAS OFICIALES

{{official_fees_table}}

## HONORARIOS PROFESIONALES

{{professional_fees_table}}

---

## RESUMEN

| Concepto | Importe |
|----------|---------|
| Subtotal | {{quote.subtotal}} |
| IVA ({{quote.tax_rate}}%) | {{quote.tax_amount}} |
| **TOTAL** | **{{quote.total}}** |

---

## CONDICIONES

1. **Forma de pago:** 50% a la aceptación, 50% a la finalización
2. **Validez:** 30 días desde la fecha del presupuesto
3. **Alcance:** Según descripción del servicio

---

## ACEPTACIÓN

☐ Acepto las condiciones y autorizo el inicio de los trabajos

Firma: _________________________ Fecha: _____________

{{company.name}} · {{company.tax_id}}
{{company.address}}',
'{
  "sections": [
    {
      "id": "header",
      "type": "header",
      "config": {"layout": "professional", "border_bottom": true, "padding_bottom": 20}
    },
    {
      "id": "client",
      "type": "client_info",
      "config": {"title": "PRESUPUESTO PARA", "style": "boxed", "background": "#f8fafc"}
    },
    {
      "id": "validity",
      "type": "validity_banner",
      "config": {
        "background": "#fef3c7",
        "border": "#f59e0b",
        "icon": "clock",
        "text": "Válido hasta {{quote.valid_until}}"
      }
    },
    {
      "id": "description",
      "type": "service_description",
      "config": {
        "show_matter": true,
        "show_mark_preview": true,
        "background": "#f8fafc"
      }
    },
    {
      "id": "fees_official",
      "type": "fees_table",
      "config": {
        "category": "official",
        "title": "TASAS OFICIALES",
        "note": "Tasas establecidas por la oficina correspondiente",
        "header_background": "#e0f2fe",
        "icon": "landmark"
      }
    },
    {
      "id": "fees_professional",
      "type": "fees_table",
      "config": {
        "category": "professional",
        "title": "HONORARIOS PROFESIONALES",
        "header_background": "#f0fdf4",
        "icon": "briefcase"
      }
    },
    {
      "id": "totals",
      "type": "totals",
      "config": {
        "show_by_category": true,
        "style": "elegant",
        "total_highlight": true,
        "position": "right",
        "width": "300px"
      }
    },
    {
      "id": "conditions",
      "type": "conditions",
      "config": {
        "sections": ["payment_terms", "validity", "scope"],
        "style": "numbered",
        "margin_top": 30
      }
    },
    {
      "id": "acceptance",
      "type": "acceptance_section",
      "config": {
        "show_signature": true,
        "show_date": true,
        "acceptance_checkbox": true,
        "background": "#f0f9ff",
        "border_radius": 8
      }
    }
  ]
}',
'{
  "document_title": "PRESUPUESTO",
  "official_fees_title": "TASAS OFICIALES",
  "professional_fees_title": "HONORARIOS PROFESIONALES",
  "conditions_title": "CONDICIONES",
  "payment_terms": "50% a la aceptación, 50% a la finalización",
  "validity_text": "Presupuesto válido por 30 días desde su fecha de emisión",
  "scope_text": "Servicios según descripción detallada",
  "acceptance_title": "ACEPTACIÓN",
  "acceptance_text": "Acepto las condiciones y autorizo el inicio de los trabajos"
}',
'{
  "paper_size": "A4",
  "margins": {"top": 25, "right": 25, "bottom": 25, "left": 25},
  "show_validity_banner": true,
  "show_acceptance": true
}'
),

-- 2. Presupuesto Moderno
(NULL, 'QUOTE_MODERN', 'Presupuesto Moderno',
 'Diseño visual atractivo con proceso y timeline. Ideal para empresas innovadoras y startups.',
 'quote', 'contract', true, 'modern',
 '# PROPUESTA DE SERVICIOS

{{company.logo}}

---

## Estimado/a {{client.name}},

Gracias por confiar en nosotros. A continuación le presentamos nuestra propuesta para sus necesidades de propiedad intelectual.

---

## SERVICIOS PROPUESTOS

{{services_cards}}

---

## INVERSIÓN

| Concepto | Importe |
|----------|---------|
| Servicios | {{quote.subtotal}} |
| IVA | {{quote.tax_amount}} |
| **Total** | **{{quote.total}}** |

---

## PROCESO Y PLAZOS

{{timeline}}

---

## ¿LISTO PARA EMPEZAR?

Contacte con nosotros:
📧 {{company.email}}
📞 {{company.phone}}

*Propuesta válida hasta {{quote.valid_until}}*',
'{
  "sections": [
    {
      "id": "cover",
      "type": "cover",
      "config": {
        "background": "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)",
        "show_logo_large": true,
        "title": "Propuesta de Servicios",
        "text_color": "white"
      }
    },
    {
      "id": "intro",
      "type": "introduction",
      "config": {
        "greeting": true,
        "context": true,
        "style": "warm",
        "margin_top": 30
      }
    },
    {
      "id": "services",
      "type": "services_cards",
      "config": {
        "style": "cards",
        "show_icons": true,
        "columns": 2,
        "card_background": "#f8fafc",
        "border_radius": 12,
        "shadow": true
      }
    },
    {
      "id": "pricing",
      "type": "pricing_summary",
      "config": {
        "style": "modern",
        "highlight_total": true,
        "show_savings": true,
        "background": "gradient",
        "border_radius": 12
      }
    },
    {
      "id": "timeline",
      "type": "timeline",
      "config": {
        "title": "PROCESO Y PLAZOS",
        "show_milestones": true,
        "style": "visual",
        "connector_color": "primary"
      }
    },
    {
      "id": "cta",
      "type": "call_to_action",
      "config": {
        "title": "¿Listo para empezar?",
        "show_contact": true,
        "background": "primary",
        "text_color": "white",
        "border_radius": 12,
        "margin_top": 40
      }
    }
  ]
}',
'{
  "cover_title": "PROPUESTA DE SERVICIOS",
  "greeting": "Estimado/a {{client.name}},",
  "intro": "Gracias por confiar en nosotros. A continuación le presentamos nuestra propuesta personalizada.",
  "timeline_title": "PROCESO Y PLAZOS",
  "cta_title": "¿Listo para empezar?",
  "cta_subtitle": "Estamos aquí para ayudarle"
}',
'{
  "paper_size": "A4",
  "accent_bar_height": 8,
  "border_radius": 12,
  "shadow": true,
  "show_cover": true
}'
),

-- 3. Presupuesto Detallado PI
(NULL, 'QUOTE_DETAILED_IP', 'Presupuesto Detallado PI',
 'Específico para propiedad intelectual con todos los detalles del expediente, marca, clases y proceso.',
 'quote', 'trademark', true, 'classic',
 '# PRESUPUESTO DETALLADO

**Nº:** {{quote.number}} | **Fecha:** {{quote.date}} | **Válido hasta:** {{quote.valid_until}}

---

## INFORMACIÓN DEL EXPEDIENTE

| Campo | Valor |
|-------|-------|
| Referencia | {{matter.reference}} |
| Marca | {{matter.mark_name}} |
| Clases | {{matter.classes}} |
| Jurisdicción | {{matter.jurisdiction}} |
| Tipo | {{matter.type}} |

{{matter.mark_image}}

---

## ALCANCE DEL SERVICIO

### ✓ Incluye:
{{scope.included}}

### ✗ No incluye:
{{scope.excluded}}

### 📋 Entregables:
{{scope.deliverables}}

---

## TASAS OFICIALES

{{official_fees_table}}

*Tasas según tarifa oficial vigente*

## HONORARIOS PROFESIONALES

{{professional_fees_table}}

---

## RESUMEN ECONÓMICO

| Concepto | Importe |
|----------|---------|
| Tasas Oficiales | {{quote.official_total}} |
| Honorarios | {{quote.professional_total}} |
| Subtotal | {{quote.subtotal}} |
| IVA ({{quote.tax_rate}}%) | {{quote.tax_amount}} |
| **TOTAL** | **{{quote.total}}** |

---

## PROCESO DE REGISTRO

{{process_steps}}

---

## CONDICIONES GENERALES

1. **Pago:** 50% a la aceptación, 50% a la presentación
2. **Validez:** 30 días
3. **Plazos:** Sujetos a la oficina correspondiente
4. **Alcance:** Según descripción anterior

---

## ACEPTACIÓN

Yo, _________________________, en representación de {{client.name}}, acepto las condiciones.

Firma: _________________________ Fecha: _____________

DNI/NIF: _________________________',
'{
  "sections": [
    {
      "id": "header",
      "type": "header",
      "config": {"professional": true, "show_reference": true}
    },
    {
      "id": "matter_info",
      "type": "matter_card",
      "config": {
        "show_mark_image": true,
        "show_classes": true,
        "show_jurisdiction": true,
        "background": "#f8fafc",
        "border": "primary",
        "border_radius": 8
      }
    },
    {
      "id": "scope",
      "type": "scope_section",
      "config": {
        "show_included": true,
        "show_excluded": true,
        "show_deliverables": true,
        "icon_included": "check-circle",
        "icon_excluded": "x-circle",
        "icon_deliverables": "file-text"
      }
    },
    {
      "id": "fees_official",
      "type": "fees_table",
      "config": {
        "category": "official",
        "title": "TASAS OFICIALES",
        "show_note": true,
        "header_background": "#e0f2fe"
      }
    },
    {
      "id": "fees_professional",
      "type": "fees_table",
      "config": {
        "category": "professional",
        "title": "HONORARIOS PROFESIONALES",
        "header_background": "#f0fdf4"
      }
    },
    {
      "id": "totals",
      "type": "totals",
      "config": {
        "detailed": true,
        "show_by_category": true,
        "style": "elegant"
      }
    },
    {
      "id": "process",
      "type": "process_steps",
      "config": {
        "title": "PROCESO DE REGISTRO",
        "show_duration": true,
        "numbered": true,
        "style": "timeline"
      }
    },
    {
      "id": "conditions",
      "type": "conditions",
      "config": {
        "detailed": true,
        "numbered": true,
        "sections": ["payment", "validity", "timeline", "scope"]
      }
    },
    {
      "id": "acceptance",
      "type": "acceptance_section",
      "config": {
        "full": true,
        "show_name_field": true,
        "show_signature": true,
        "show_date": true,
        "show_id": true,
        "background": "#f0f9ff"
      }
    }
  ]
}',
'{
  "document_title": "PRESUPUESTO DETALLADO",
  "matter_title": "INFORMACIÓN DEL EXPEDIENTE",
  "scope_title": "ALCANCE DEL SERVICIO",
  "included_title": "Incluye:",
  "excluded_title": "No incluye:",
  "deliverables_title": "Entregables:",
  "process_title": "PROCESO DE REGISTRO",
  "conditions_title": "CONDICIONES GENERALES",
  "acceptance_title": "ACEPTACIÓN",
  "acceptance_intro": "Yo, _________________________, en representación de"
}',
'{
  "paper_size": "A4",
  "show_mark_image": true,
  "show_process_timeline": true,
  "show_scope_details": true
}'
),

-- 4. Presupuesto Simple
(NULL, 'QUOTE_SIMPLE', 'Presupuesto Simple',
 'Formato básico y directo. Mínimos elementos, máxima claridad.',
 'quote', 'other', true, 'minimal',
 '# Presupuesto

**Nº {{quote.number}}** · {{quote.date}}

---

**Para:** {{client.name}}
{{client.tax_id}}

---

## Servicios

{{line_items_simple}}

---

| | |
|---|---:|
| Subtotal | {{quote.subtotal}} |
| IVA | {{quote.tax_amount}} |
| **Total** | **{{quote.total}}** |

---

*Válido hasta {{quote.valid_until}}*

{{company.name}} · {{company.phone}} · {{company.email}}',
'{
  "sections": [
    {
      "id": "header",
      "type": "header",
      "config": {"minimal": true, "show_logo": true, "compact": true}
    },
    {
      "id": "client",
      "type": "client_info",
      "config": {"compact": true, "inline": true}
    },
    {
      "id": "items",
      "type": "line_items",
      "config": {
        "simple": true,
        "columns": ["description", "amount"],
        "no_borders": true,
        "divider": "dotted"
      }
    },
    {
      "id": "totals",
      "type": "totals",
      "config": {
        "minimal": true,
        "align": "right",
        "compact": true
      }
    },
    {
      "id": "footer",
      "type": "footer",
      "config": {
        "show_validity": true,
        "minimal": true,
        "inline_contact": true
      }
    }
  ]
}',
'{
  "document_title": "Presupuesto",
  "valid_text": "Válido hasta"
}',
'{
  "paper_size": "A4",
  "minimal": true,
  "compact": true
}'
);