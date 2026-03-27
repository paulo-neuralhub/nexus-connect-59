import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState, useCallback } from 'react';

/* ── types ── */
interface BriefingItem {
  type?: string;
  icon?: string;
  title?: string;
  priority?: string;
  action_url?: string;
  description?: string;
}

interface BriefingPDFData {
  date: string; // YYYY-MM-DD
  contentJson: { items?: BriefingItem[]; summary?: string; generated_at?: string };
  totalItems: number;
  urgentItems: number;
}

/* ── section mapping ── */
const TYPE_MAP: Record<string, { label: string; emoji: string; color: [number, number, number] }> = {
  invoice:  { label: 'Finanzas',              emoji: '💰', color: [234, 179, 8] },
  deadline: { label: 'Plazos Críticos',       emoji: '📅', color: [239, 68, 68] },
  alert:    { label: 'Alertas',               emoji: '🔔', color: [245, 158, 11] },
  message:  { label: 'Comunicaciones',        emoji: '📬', color: [59, 130, 246] },
  approval: { label: 'Aprobaciones Pendientes', emoji: '✅', color: [34, 197, 94] },
};
const FALLBACK = { label: 'Otros', emoji: '📋', color: [100, 116, 139] as [number, number, number] };

const PRIORITY_LABELS: Record<string, { text: string; color: [number, number, number] }> = {
  critical: { text: 'CRÍTICO', color: [220, 38, 38] },
  high:     { text: 'ALTO',    color: [234, 88, 12] },
  medium:   { text: 'MEDIO',   color: [202, 138, 4] },
  low:      { text: 'BAJO',    color: [100, 116, 139] },
};

function groupItemsByType(items: BriefingItem[]) {
  const groups: Record<string, BriefingItem[]> = {};
  for (const item of items) {
    const key = item.type || '_other';
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return groups;
}

function calcHealth(urgent: number, total: number) {
  return Math.max(0, 100 - urgent * 15 - total * 3);
}

/* ── PDF generation ── */
export function generateBriefingPDF(data: BriefingPDFData) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210;
  const ML = 20; // margin left
  const MR = 20;
  const CW = W - ML - MR; // content width
  let y = 0;

  const dateObj = new Date(data.date + 'T00:00:00');
  const dateStr = format(dateObj, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es });
  const health = calcHealth(data.urgentItems, data.totalItems);

  /* ── helper: new page check ── */
  const checkPage = (needed: number) => {
    if (y + needed > 277) {
      addFooter();
      doc.addPage();
      y = 15;
    }
  };

  const addFooter = () => {
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    const page = doc.getNumberOfPages();
    doc.text(
      `Generado por IP-NEXUS IP-GENIUS · ${format(new Date(), 'dd/MM/yyyy HH:mm')} · Confidencial`,
      ML, 290
    );
    doc.text(`Página ${page}`, W - MR, 290, { align: 'right' });
  };

  /* ═══ HEADER ═══ */
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, W, 38, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('IP-NEXUS', ML, 16);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Morning Briefing', ML, 24);
  doc.setFontSize(13);
  doc.text(dateStr.charAt(0).toUpperCase() + dateStr.slice(1), ML, 33);
  y = 44;

  /* ═══ METRICS BAND ═══ */
  doc.setFillColor(241, 245, 249);
  doc.rect(0, 40, W, 14, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');

  const metrics = [
    { label: 'Health', value: `${health}%` },
    { label: 'Items', value: String(data.totalItems) },
    { label: 'Urgentes', value: String(data.urgentItems) },
  ];
  if (data.contentJson.generated_at) {
    const gen = new Date(data.contentJson.generated_at);
    metrics.push({ label: 'Generado', value: format(gen, 'HH:mm') });
  }

  const colW = CW / metrics.length;
  metrics.forEach((m, i) => {
    const x = ML + i * colW;
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(m.label, x + 2, 47);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(m.value, x + 2, 52);
  });

  y = 60;

  /* ═══ GROUPED SECTIONS ═══ */
  const items = data.contentJson.items || [];
  const grouped = groupItemsByType(items);

  for (const [type, groupItems] of Object.entries(grouped)) {
    const meta = TYPE_MAP[type] || FALLBACK;

    checkPage(20);

    // Section header
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...meta.color);
    doc.text(`${meta.label}`, ML, y);
    y += 2;
    doc.setDrawColor(...meta.color);
    doc.setLineWidth(0.5);
    doc.line(ML, y, ML + CW, y);
    y += 6;

    for (const item of groupItems) {
      checkPage(18);

      // Priority badge
      if (item.priority) {
        const p = PRIORITY_LABELS[item.priority] || PRIORITY_LABELS.medium!;
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...p.color);
        const badgeW = doc.getTextWidth(p.text) + 4;
        doc.setFillColor(p.color[0], p.color[1], p.color[2]);
        doc.setGState(new (doc as any).GState({ opacity: 0.12 }));
        doc.roundedRect(ML, y - 3.2, badgeW, 4.5, 1, 1, 'F');
        doc.setGState(new (doc as any).GState({ opacity: 1 }));
        doc.text(p.text, ML + 2, y);
        y += 5;
      }

      // Title
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      const titleLines = doc.splitTextToSize(item.title || '', CW);
      doc.text(titleLines, ML, y);
      y += titleLines.length * 5;

      // Description
      if (item.description) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        const descLines = doc.splitTextToSize(item.description, CW);
        doc.text(descLines, ML, y);
        y += descLines.length * 4.5;
      }

      // Action URL
      if (item.action_url) {
        doc.setFontSize(9);
        doc.setTextColor(59, 130, 246);
        doc.text(item.action_url, ML, y);
        y += 4;
      }

      y += 4; // spacing between items
    }

    y += 4; // spacing between sections
  }

  /* ═══ SUMMARY ═══ */
  if (data.contentJson.summary) {
    checkPage(25);
    doc.setFillColor(239, 246, 255);
    const summaryLines = doc.splitTextToSize(data.contentJson.summary, CW - 8);
    const blockH = Math.max(20, summaryLines.length * 4.5 + 14);
    doc.roundedRect(ML, y, CW, blockH, 3, 3, 'F');

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175);
    doc.text('Resumen del Asistente', ML + 4, y + 7);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(summaryLines, ML + 4, y + 13);
    y += blockH + 6;
  }

  /* ═══ FOOTER ═══ */
  addFooter();

  /* ═══ SAVE ═══ */
  doc.save(`briefing-${data.date}.pdf`);
}

/* ── React hook ── */
export function useBriefingPDF() {
  const [generating, setGenerating] = useState(false);

  const download = useCallback((data: BriefingPDFData) => {
    setGenerating(true);
    try {
      generateBriefingPDF(data);
    } finally {
      setGenerating(false);
    }
  }, []);

  return { download, generating };
}
