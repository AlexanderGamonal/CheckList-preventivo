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
    const rect = targets[i].getBoundingClientRect();
    const canvas = await html2canvas(targets[i], {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width:        Math.round(rect.width)  || targets[i].offsetWidth,
      height:       Math.round(rect.height) || targets[i].offsetHeight,
      windowWidth:  Math.round(rect.width)  || targets[i].offsetWidth,
      windowHeight: Math.round(rect.height) || targets[i].offsetHeight,
      x: 0,
      y: 0,
    });

    if (i > 0) pdf.addPage();

    // Siempre escalar al ancho completo del PDF.
    // Math.min causaría que páginas con contenido alto se vuelvan más angostas.
    const ratio = pageW / canvas.width;
    const imgW  = pageW;                    // ancho completo siempre
    const imgH  = canvas.height * ratio;   // alto proporcional

    pdf.addImage(canvas.toDataURL('image/jpeg', jpegQuality), 'JPEG', 0, 0, imgW, imgH);
  }

  return pdf;
}

export async function generatePDF(containerId, filename, { download = true } = {}) {
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
  element.style.zIndex     = '99999';

  // Esperar dos frames para que el navegador pinte el elemento antes de capturar
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

  let pdfBuffer;
  try {
    const pdf = await buildPDF(containerId, 2.0, 0.92);
    if (download) pdf.save(filename + '.pdf');
    pdfBuffer = pdf.output('arraybuffer');
  } finally {
    element.style.position   = prev.position;
    element.style.left       = prev.left;
    element.style.top        = prev.top;
    element.style.visibility = prev.visibility;
    element.style.zIndex     = prev.zIndex;
  }

  return pdfBuffer;
}
