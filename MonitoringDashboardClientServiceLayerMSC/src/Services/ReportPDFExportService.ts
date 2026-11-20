import { PDFDocument } from 'pdf-lib';
import html2canvas from 'html2canvas-pro';

// A4 in PDF points (72 DPI) - same constants SignForge's PDFGeneratorService uses.
const A4_WIDTH_PT = 595.28;
const A4_HEIGHT_PT = 841.89;

export default class ReportPDFExportService {
  public static current = new ReportPDFExportService();

  // Captures the element as one tall canvas, then slices it into A4-height
  // pages (report content is an arbitrary-length page, unlike SignForge's
  // fixed 3-page offer letter, so page count isn't known up front).
  public async exportElementToPDF(elementId: string, fileName: string): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Report content not found on the page.');
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const pageHeightPx = Math.floor((canvas.width / A4_WIDTH_PT) * A4_HEIGHT_PT);
    const pdfDoc = await PDFDocument.create();

    for (let offsetY = 0; offsetY < canvas.height; offsetY += pageHeightPx) {
      const sliceHeightPx = Math.min(pageHeightPx, canvas.height - offsetY);
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = sliceHeightPx;
      const context = sliceCanvas.getContext('2d');
      if (!context) {
        throw new Error('Canvas context unavailable for PDF export.');
      }
      context.drawImage(canvas, 0, offsetY, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx);

      const embeddedImage = await pdfDoc.embedPng(sliceCanvas.toDataURL('image/png'));
      const pdfPageHeight = (sliceHeightPx / canvas.width) * A4_WIDTH_PT;
      const pdfPage = pdfDoc.addPage([A4_WIDTH_PT, pdfPageHeight]);
      pdfPage.drawImage(embeddedImage, { x: 0, y: 0, width: A4_WIDTH_PT, height: pdfPageHeight });
    }

    const pdfBytes = await pdfDoc.save();
    const blobUrl = URL.createObjectURL(new Blob([pdfBytes as BlobPart], { type: 'application/pdf' }));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = blobUrl;
    downloadAnchor.download = fileName;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
    URL.revokeObjectURL(blobUrl);
  }
}
