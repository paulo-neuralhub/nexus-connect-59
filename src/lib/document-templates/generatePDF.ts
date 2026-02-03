// ============================================================
// PDF GENERATION UTILITY
// Uses jsPDF with html rendering
// ============================================================

import jsPDF from 'jspdf';

export interface PDFGenerationOptions {
  filename?: string;
  format?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
  scale?: number;
}

/**
 * Generates a PDF from an HTML element using jsPDF
 * Returns the PDF blob URL for download/preview
 */
export async function generatePDFFromElement(
  element: HTMLElement,
  options: PDFGenerationOptions = {}
): Promise<{ url: string; blob: Blob }> {
  const {
    filename = 'document.pdf',
    format = 'a4',
    orientation = 'portrait',
    scale = 2,
  } = options;

  // Clone the element to avoid modifying the original
  const clonedElement = element.cloneNode(true) as HTMLElement;
  
  // Create a temporary container
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.appendChild(clonedElement);
  document.body.appendChild(container);

  try {
    // Use jsPDF html method for better rendering
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format,
    });

    // Get page dimensions
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Calculate scale to fit width
    const elementWidth = clonedElement.offsetWidth;
    const scaleFactor = (pageWidth / elementWidth) * 0.95; // 95% of page width

    await pdf.html(clonedElement, {
      callback: () => {},
      x: pageWidth * 0.025, // 2.5% margin
      y: 10,
      width: pageWidth * 0.95,
      windowWidth: elementWidth,
      html2canvas: {
        scale,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      },
    });

    // Generate blob
    const blob = pdf.output('blob');
    const url = URL.createObjectURL(blob);

    return { url, blob };
  } finally {
    // Cleanup
    document.body.removeChild(container);
  }
}

/**
 * Downloads a PDF from an HTML element
 */
export async function downloadPDF(
  element: HTMLElement,
  filename: string = 'document.pdf',
  options: Omit<PDFGenerationOptions, 'filename'> = {}
): Promise<void> {
  const { url, blob } = await generatePDFFromElement(element, { ...options, filename });
  
  // Create download link
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  
  // Cleanup
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Opens PDF in a new tab for preview
 */
export async function previewPDF(
  element: HTMLElement,
  options: PDFGenerationOptions = {}
): Promise<void> {
  const { url } = await generatePDFFromElement(element, options);
  window.open(url, '_blank');
}
