import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatArabicDate, todayISO } from './date';

// ===== Excel export =====
export function exportExcel(
  rows: Record<string, string | number>[],
  headers: { key: string; label: string }[],
  filenameBase: string,
): void {
  const data = rows.map((r) => {
    const o: Record<string, string | number> = {};
    for (const h of headers) o[h.label] = r[h.key] ?? '';
    return o;
  });
  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = headers.map((h) => ({ wch: Math.max(h.label.length + 4, 16) }));
  // RTL view
  ws['!dir'] = 'rtl';
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'البيانات');
  XLSX.writeFile(wb, `${filenameBase}-${todayISO()}.xlsx`);
}

// ===== PDF export =====
// jsPDF's default fonts don't support Arabic shaping. For a correct Arabic
// PDF we render the report HTML to canvas and embed it as an image. This
// preserves Arabic shaping and RTL layout perfectly.
export async function exportPdfFromElement(
  element: HTMLElement,
  filename: string,
): Promise<void> {
  const { default: html2canvas } = await import('html2canvas');
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
  logging: false,
  windowWidth: element.scrollWidth,
  windowHeight: element.scrollHeight,
  onclone: (doc) => {
      // Ensure the cloned document uses LTR for canvas rendering so text
      // lays out predictably; the element itself keeps its RTL content.
      doc.documentElement.dir = 'rtl';
    },
  });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const imgW = pageW;
  const imgH = (canvas.height * imgW) / canvas.width;
  if (imgH <= pageH) {
    pdf.addImage(imgData, 'PNG', 0, 0, imgW, imgH);
  } else {
    // multi-page split
    let remaining = imgH;
    let offset = 0;
    while (remaining > 0) {
      pdf.addImage(imgData, 'PNG', 0, -offset, imgW, imgH);
      remaining -= pageH;
      offset += pageH;
      if (remaining > 0) pdf.addPage();
    }
  }
  pdf.save(`${filename}-${todayISO()}.pdf`);
}

// Simple text-only PDF fallback (Latin-only). Kept for completeness but
// Arabic text won't shape correctly; prefer exportPdfFromElement.
export function exportPdfTable(
  title: string,
  subtitle: string,
  headers: string[],
  body: (string | number)[][],
  filename: string,
): void {
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  pdf.setFontSize(14);
  pdf.text(title, 14, 16);
  pdf.setFontSize(10);
  pdf.text(subtitle, 14, 22);
  pdf.text(`تاريخ الإنشاء: ${formatArabicDate(todayISO())}`, 14, 28);
  autoTable(pdf, {
    head: [headers],
    body,
    startY: 34,
    styles: { font: 'helvetica', halign: 'right' },
    headStyles: { fillColor: [15, 76, 129] },
  });
  pdf.save(`${filename}-${todayISO()}.pdf`);
}

// ===== Print =====
export function printElement(element: HTMLElement): void {
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) return;
  const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((n) => n.outerHTML)
    .join('\n');
  win.document.write(`<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>طباعة</title>${styles}<style>body{padding:24px;background:#fff;color:#000}.no-print{display:none!important}</style></head><body>${element.outerHTML}</body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
    win.close();
  }, 400);
}
