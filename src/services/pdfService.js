import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

async function buildPDF(containerId, scale, jpegQuality) {
  const element = document.getElementById(containerId);
  if (!element) throw new Error(`Element #${containerId} not found`);

  const pages = Array.from(element.querySelectorAll('.pdf-page'));
  const targets = pages.length > 0 ? pages : [element];

  const pdf   = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < targets.length; i++) {
    const canvas = await html2canvas(targets[i], {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth:  targets[i].scrollWidth,
      windowHeight: targets[i].scrollHeight,
    });

    if (i > 0) pdf.addPage();

    const ratio = Math.min(pageW / canvas.width, pageH / canvas.height);
    const imgW  = canvas.width  * ratio;
    const imgH  = canvas.height * ratio;
    const x     = (pageW - imgW) / 2;

    pdf.addImage(canvas.toDataURL('image/jpeg', jpegQuality), 'JPEG', x, 0, imgW, imgH);
  }

  return pdf;
}

export async function generatePDF(containerId, filename) {
  const element = document.getElementById(containerId);
  if (!element) throw new Error(`Element #${containerId} not found`);

  const prev = {
    position:   element.style.position,
    left:       element.style.left,
    top:        element.style.top,
    visibility: element.style.visibility,
    zIndex:     element.style.zIndex,
  };
  element.style.position   = 'fixed';
  element.style.left       = '0';
  element.style.top        = '0';
  element.style.visibility = 'visible';
  element.style.zIndex     = '-9999';

  let pdfBase64;
  try {
    const pdf = await buildPDF(containerId, 1.5, 0.85);
    pdf.save(filename + '.pdf');
    // Retorna arraybuffer para subir a Storage sin corrupción
    pdfBase64 = pdf.output('arraybuffer');
  } finally {
    element.style.position   = prev.position;
    element.style.left       = prev.left;
    element.style.top        = prev.top;
    element.style.visibility = prev.visibility;
    element.style.zIndex     = prev.zIndex;
  }

  return pdfBase64;
}
