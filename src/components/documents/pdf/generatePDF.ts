// ============================================================
// L111: Generador de PDF con jsPDF
// ============================================================

import jsPDF from 'jspdf';
import { DocumentStyle, TenantDocumentSettings } from '@/types/documents';

interface GeneratePDFOptions {
  content: string;
  title: string;
  documentNumber: string;
  documentDate: string;
  style: DocumentStyle;
  tenantSettings?: TenantDocumentSettings;
}

export async function generateDocumentPDF({
  content,
  title,
  documentNumber,
  documentDate,
  style,
  tenantSettings,
}: GeneratePDFOptions): Promise<void> {
  // Create PDF in A4 format
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = {
    top: style.layout.margins.top,
    right: style.layout.margins.right,
    bottom: style.layout.margins.bottom,
    left: style.layout.margins.left,
  };
  const contentWidth = pageWidth - margin.left - margin.right;

  let currentY = margin.top;

  // Helper to add header
  const addHeader = () => {
    const companyInfo = tenantSettings?.companyInfo;
    
    // Header background for band style
    if (style.layout.headerStyle === 'band') {
      const headerColor = hexToRgb(style.colors.headerBg || style.colors.primary);
      doc.setFillColor(headerColor[0], headerColor[1], headerColor[2]);
      doc.rect(0, 0, pageWidth, 25, 'F');
      doc.setTextColor(255, 255, 255);
    } else {
      const textColor = hexToRgb(style.colors.text);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    }

    // Company name
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    if (companyInfo?.name) {
      doc.text(companyInfo.name, margin.left, currentY);
    }

    // Document info on the right
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const rightX = pageWidth - margin.right;
    doc.text(`Nº: ${documentNumber}`, rightX, currentY, { align: 'right' });
    doc.text(`Fecha: ${documentDate}`, rightX, currentY + 5, { align: 'right' });

    // Company contact info
    if (companyInfo) {
      doc.setFontSize(8);
      let infoY = currentY + 5;
      if (companyInfo.address) {
        doc.text(companyInfo.address, margin.left, infoY);
        infoY += 3;
      }
      if (companyInfo.phone || companyInfo.email) {
        const contact = [companyInfo.phone, companyInfo.email].filter(Boolean).join(' | ');
        doc.text(contact, margin.left, infoY);
      }
    }

    currentY = style.layout.headerStyle === 'band' ? 35 : margin.top + 20;

    // Reset text color
    const resetTextColor = hexToRgb(style.colors.text);
    doc.setTextColor(resetTextColor[0], resetTextColor[1], resetTextColor[2]);

    // Document title
    if (title) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(title, pageWidth / 2, currentY, { align: 'center' });
      currentY += 15;
    }
  };

  // Helper to add footer
  const addFooter = (pageNum: number, totalPages: number) => {
    const footerY = pageHeight - margin.bottom;
    
    if (style.layout.footerStyle === 'band') {
      const footerColor = hexToRgb(style.colors.footerBg || style.colors.primary);
      doc.setFillColor(footerColor[0], footerColor[1], footerColor[2]);
      doc.rect(0, footerY - 5, pageWidth, 15, 'F');
      doc.setTextColor(255, 255, 255);
    } else {
      const borderColor = hexToRgb(style.colors.border);
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.line(margin.left, footerY - 5, pageWidth - margin.right, footerY - 5);
      const secondaryColor = hexToRgb(style.colors.secondary);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    }

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');

    // Company info
    const companyInfo = tenantSettings?.companyInfo;
    if (companyInfo?.name && style.layout.showFooterContact) {
      const footerInfo = [companyInfo.name, companyInfo.phone, companyInfo.email]
        .filter(Boolean)
        .join(' · ');
      doc.text(footerInfo, pageWidth / 2, footerY, { align: 'center' });
    }

    // Page number
    doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth - margin.right, footerY, { align: 'right' });

    // Confidentiality notice
    const notice = tenantSettings?.customTexts?.confidentialityNotice || 
      'Este documento es confidencial.';
    doc.setFontSize(6);
    doc.text(notice, pageWidth / 2, footerY + 4, { align: 'center' });
  };

  // Add header
  addHeader();

  // Parse and add content
  const plainText = htmlToPlainText(content);
  const lines = doc.splitTextToSize(plainText, contentWidth);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  const lineHeight = 5;
  const maxY = pageHeight - margin.bottom - 15; // Leave space for footer

  for (let i = 0; i < lines.length; i++) {
    if (currentY > maxY) {
      // Add footer to current page
      addFooter(doc.getNumberOfPages(), 1); // Will update total later
      
      // Add new page
      doc.addPage();
      currentY = margin.top;
      
      // Add header to new page
      const pageTextColor = hexToRgb(style.colors.text);
      doc.setTextColor(pageTextColor[0], pageTextColor[1], pageTextColor[2]);
    }
    
    doc.text(lines[i], margin.left, currentY);
    currentY += lineHeight;
  }

  // Add footer to last page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i, totalPages);
  }

  // Download the PDF
  const fileName = `${documentNumber}-${title.replace(/\s+/g, '-')}.pdf`;
  doc.save(fileName);
}

// Helper to convert hex color to RGB array
function hexToRgb(hex: string): [number, number, number] {
  // Handle gradient or invalid colors
  if (!hex || hex.includes('gradient') || !hex.startsWith('#')) {
    return [0, 0, 0];
  }
  
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16),
    ];
  }
  return [0, 0, 0];
}

// Helper to convert HTML to plain text
function htmlToPlainText(html: string): string {
  // Create a temporary element to parse HTML
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  // Handle line breaks and paragraphs
  temp.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
  temp.querySelectorAll('p').forEach(p => {
    p.insertAdjacentText('afterend', '\n\n');
  });
  temp.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(h => {
    h.insertAdjacentText('afterend', '\n\n');
  });
  temp.querySelectorAll('li').forEach(li => {
    li.insertAdjacentText('beforebegin', '• ');
    li.insertAdjacentText('afterend', '\n');
  });
  
  return temp.textContent || temp.innerText || '';
}
