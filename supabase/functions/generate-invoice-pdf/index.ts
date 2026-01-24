/**
 * Generate Invoice PDF Edge Function
 * Generates a professional PDF invoice and stores it in Supabase Storage
 */

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// @ts-ignore - jsPDF for Deno
import { jsPDF } from 'https://esm.sh/jspdf@2.5.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  tax_rate?: number;
  tax_amount?: number;
}

interface Invoice {
  id: string;
  organization_id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  client_name: string;
  client_tax_id?: string;
  client_address?: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount?: number;
  total: number;
  currency: string;
  status: string;
  notes?: string;
  footer_text?: string;
  items: InvoiceItem[];
}

interface Organization {
  id: string;
  name: string;
  tax_id?: string;
  address?: string;
  email?: string;
  phone?: string;
  logo_url?: string;
  bank_iban?: string;
  bank_name?: string;
}

interface RequestBody {
  invoiceId: string;
  sendEmail?: boolean;
  emailTo?: string;
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { invoiceId, sendEmail, emailTo }: RequestBody = await req.json();

    if (!invoiceId) {
      return new Response(
        JSON.stringify({ error: 'invoiceId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch invoice with items
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      console.error('Invoice fetch error:', invoiceError);
      return new Response(
        JSON.stringify({ error: 'Invoice not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch invoice items
    const { data: items, error: itemsError } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('line_number', { ascending: true });

    if (itemsError) {
      console.error('Items fetch error:', itemsError);
    }

    // Fetch organization
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', invoice.organization_id)
      .single();

    // Fetch billing settings for organization
    const { data: billingSettings } = await supabase
      .from('organization_settings')
      .select('setting_value')
      .eq('organization_id', invoice.organization_id)
      .eq('setting_key', 'billing')
      .single();

    const billing = billingSettings?.setting_value || {};

    // Generate PDF
    const pdfBytes = await generateInvoicePDF(
      { ...invoice, items: items || [] } as Invoice,
      { 
        ...org, 
        tax_id: billing.tax_id,
        address: billing.address,
        email: billing.email,
        phone: billing.phone,
        bank_iban: billing.bank_iban,
        bank_name: billing.bank_name,
        logo_url: billing.logo_url
      } as Organization
    );

    // Upload to storage
    const year = new Date(invoice.invoice_date).getFullYear();
    const filePath = `${invoice.organization_id}/${year}/${invoice.invoice_number.replace(/\//g, '-')}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from('invoices')
      .upload(filePath, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to upload PDF' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('invoices')
      .getPublicUrl(filePath);

    const pdfUrl = urlData.publicUrl;

    // Update invoice with PDF URL
    await supabase
      .from('invoices')
      .update({ pdf_url: pdfUrl })
      .eq('id', invoiceId);

    // Optionally send email
    if (sendEmail && emailTo) {
      try {
        const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            to: emailTo,
            subject: `Factura ${invoice.invoice_number}`,
            html: `
              <h2>Factura ${invoice.invoice_number}</h2>
              <p>Estimado/a ${invoice.client_name},</p>
              <p>Adjuntamos la factura correspondiente a nuestros servicios.</p>
              <p><strong>Importe total:</strong> ${formatCurrency(invoice.total, invoice.currency)}</p>
              <p><strong>Fecha de vencimiento:</strong> ${formatDate(invoice.due_date)}</p>
              <p><a href="${pdfUrl}" target="_blank">Descargar PDF</a></p>
              <hr/>
              <p style="color: #666; font-size: 12px;">Este email ha sido enviado automáticamente desde IP-NEXUS.</p>
            `,
            organization_id: invoice.organization_id,
          }),
        });

        if (!emailResponse.ok) {
          console.error('Email send failed:', await emailResponse.text());
        }
      } catch (emailError) {
        console.error('Email error:', emailError);
      }
    }

    console.log('PDF generated successfully:', filePath);

    return new Response(
      JSON.stringify({ 
        success: true, 
        pdfUrl,
        filePath,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ============================================
// PDF GENERATION
// ============================================

async function generateInvoicePDF(invoice: Invoice, org: Organization): Promise<Uint8Array> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Colors
  const primaryColor = [59, 130, 246]; // Blue
  const textColor = [30, 41, 59]; // Slate 800
  const mutedColor = [100, 116, 139]; // Slate 500

  // ===== HEADER =====
  
  // Company name
  doc.setFontSize(22);
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');
  doc.text(org.name || 'IP-NEXUS', margin, y);
  
  // FACTURA badge
  doc.setFillColor(...primaryColor);
  doc.roundedRect(pageWidth - margin - 40, y - 8, 40, 12, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURA', pageWidth - margin - 20, y - 1, { align: 'center' });

  y += 10;

  // Company details
  doc.setTextColor(...mutedColor);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  if (org.tax_id) {
    doc.text(`NIF/CIF: ${org.tax_id}`, margin, y);
    y += 4;
  }
  if (org.address) {
    const addressLines = doc.splitTextToSize(org.address, 80);
    doc.text(addressLines, margin, y);
    y += addressLines.length * 4;
  }
  if (org.email) {
    doc.text(org.email, margin, y);
    y += 4;
  }
  if (org.phone) {
    doc.text(org.phone, margin, y);
  }

  // Invoice details (right side)
  const detailsX = pageWidth - margin;
  let detailsY = margin + 12;
  
  doc.setTextColor(...textColor);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.invoice_number, detailsX, detailsY, { align: 'right' });
  detailsY += 6;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...mutedColor);
  doc.text(`Fecha: ${formatDate(invoice.invoice_date)}`, detailsX, detailsY, { align: 'right' });
  detailsY += 4;
  doc.text(`Vencimiento: ${formatDate(invoice.due_date)}`, detailsX, detailsY, { align: 'right' });

  y = Math.max(y, detailsY) + 15;

  // ===== CLIENT SECTION =====
  
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.roundedRect(margin, y, contentWidth, 30, 3, 3, 'F');
  
  y += 8;
  doc.setTextColor(...mutedColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURAR A:', margin + 5, y);
  
  y += 5;
  doc.setTextColor(...textColor);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.client_name || 'Cliente', margin + 5, y);
  
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...mutedColor);
  
  if (invoice.client_tax_id) {
    doc.text(`NIF/CIF: ${invoice.client_tax_id}`, margin + 5, y);
    y += 4;
  }
  if (invoice.client_address) {
    const clientAddr = doc.splitTextToSize(invoice.client_address, contentWidth - 10);
    doc.text(clientAddr, margin + 5, y);
  }

  y += 20;

  // ===== ITEMS TABLE =====
  
  // Table header
  const colWidths = [80, 25, 30, 35]; // Description, Qty, Price, Amount
  const tableStart = margin;
  
  doc.setFillColor(...primaryColor);
  doc.rect(tableStart, y, contentWidth, 8, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  
  let colX = tableStart + 3;
  doc.text('Descripción', colX, y + 5.5);
  colX += colWidths[0];
  doc.text('Cant.', colX, y + 5.5, { align: 'right' });
  colX += colWidths[1];
  doc.text('Precio', colX, y + 5.5, { align: 'right' });
  colX += colWidths[2];
  doc.text('Importe', colX, y + 5.5, { align: 'right' });
  
  y += 10;

  // Table rows
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'normal');
  
  for (const item of invoice.items) {
    // Check page break
    if (y > 250) {
      doc.addPage();
      y = margin;
    }
    
    const rowHeight = 8;
    
    // Alternate row background
    if (invoice.items.indexOf(item) % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(tableStart, y - 1, contentWidth, rowHeight, 'F');
    }
    
    colX = tableStart + 3;
    
    // Description (with wrapping)
    const descLines = doc.splitTextToSize(item.description || '-', colWidths[0] - 5);
    doc.text(descLines[0], colX, y + 4);
    
    colX += colWidths[0];
    doc.text(String(item.quantity || 1), colX, y + 4, { align: 'right' });
    
    colX += colWidths[1];
    doc.text(formatCurrency(item.unit_price, invoice.currency), colX, y + 4, { align: 'right' });
    
    colX += colWidths[2];
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(item.subtotal || item.quantity * item.unit_price, invoice.currency), colX, y + 4, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    
    y += rowHeight;
  }

  y += 5;

  // ===== TOTALS =====
  
  const totalsX = pageWidth - margin - 60;
  const totalsWidth = 60;
  
  // Subtotal
  doc.setTextColor(...mutedColor);
  doc.setFontSize(9);
  doc.text('Base imponible:', totalsX, y);
  doc.setTextColor(...textColor);
  doc.text(formatCurrency(invoice.subtotal, invoice.currency), pageWidth - margin, y, { align: 'right' });
  y += 5;

  // Discount (if any)
  if (invoice.discount_amount && invoice.discount_amount > 0) {
    doc.setTextColor(...mutedColor);
    doc.text('Descuento:', totalsX, y);
    doc.setTextColor(239, 68, 68); // Red
    doc.text(`-${formatCurrency(invoice.discount_amount, invoice.currency)}`, pageWidth - margin, y, { align: 'right' });
    y += 5;
  }

  // Tax
  doc.setTextColor(...mutedColor);
  doc.text(`IVA (${invoice.tax_rate || 21}%):`, totalsX, y);
  doc.setTextColor(...textColor);
  doc.text(formatCurrency(invoice.tax_amount, invoice.currency), pageWidth - margin, y, { align: 'right' });
  y += 7;

  // Total
  doc.setFillColor(...primaryColor);
  doc.roundedRect(totalsX - 5, y - 4, totalsWidth + 10, 12, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', totalsX, y + 4);
  doc.text(formatCurrency(invoice.total, invoice.currency), pageWidth - margin, y + 4, { align: 'right' });

  y += 20;

  // ===== FOOTER =====
  
  // Bank details
  if (org.bank_iban) {
    doc.setTextColor(...textColor);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Datos bancarios:', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedColor);
    if (org.bank_name) {
      doc.text(`Banco: ${org.bank_name}`, margin, y);
      y += 4;
    }
    doc.text(`IBAN: ${org.bank_iban}`, margin, y);
    y += 10;
  }

  // Notes
  if (invoice.notes) {
    doc.setTextColor(...textColor);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Notas:', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedColor);
    const notesLines = doc.splitTextToSize(invoice.notes, contentWidth);
    doc.text(notesLines, margin, y);
    y += notesLines.length * 4 + 5;
  }

  // Footer text
  if (invoice.footer_text) {
    doc.setTextColor(...mutedColor);
    doc.setFontSize(8);
    const footerLines = doc.splitTextToSize(invoice.footer_text, contentWidth);
    doc.text(footerLines, margin, y);
  }

  // Page footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setTextColor(...mutedColor);
  doc.setFontSize(8);
  doc.text(
    `Generado por IP-NEXUS • ${new Date().toLocaleDateString('es-ES')}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  // Return as Uint8Array
  return doc.output('arraybuffer');
}

function formatCurrency(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency || 'EUR',
  }).format(amount || 0);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
