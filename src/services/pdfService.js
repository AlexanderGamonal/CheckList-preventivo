import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/* Espera a que todas las <img> dentro de `el` terminen de cargar (o fallen)
   antes de capturar el canvas — sin esto, con mala señal en campo,
   html2canvas puede fotografiar un logo a medio descargar (rayas/artefactos
   en la cabecera). Timeout de seguridad: una imagen rota o muy lenta no debe
   colgar la generación del PDF entero. */
function waitForImages(el, timeoutMs = 4000) {
  const imgs = Array.from(el.querySelectorAll('img'));
  return Promise.all(imgs.map((img) => {
    if (img.complete && img.naturalWidth > 0) return Promise.resolve();
    return new Promise((resolve) => {
      const done = () => { clearTimeout(timer); resolve(); };
      const timer = setTimeout(done, timeoutMs);
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
    });
  }));
}

/* Detecta un canvas mayormente negro — cuando html2canvas se queda sin
   memoria/recursos a mitad de la captura, las zonas que no llega a pintar
   quedan transparentes y se exportan como negro sólido al pasar a JPEG.
   Ninguna hoja de esta app es legítimamente así de oscura. */
function isCanvasSuspiciouslyBlack(canvas) {
  const { width: w, height: h } = canvas;
  if (!w || !h) return true;
  const ctx = canvas.getContext('2d');
  const { data } = ctx.getImageData(0, 0, w, h);
  const totalPixels = w * h;
  // Muestreo (no cada píxel) para no penalizar el rendimiento en canvases grandes
  const stridePixels = Math.max(1, Math.floor(totalPixels / 2000));
  const stride = stridePixels * 4;
  let dark = 0, sampled = 0;
  for (let i = 0; i < data.length; i += stride) {
    if (data[i] < 20 && data[i + 1] < 20 && data[i + 2] < 20) dark++;
    sampled++;
  }
  return sampled > 0 && dark / sampled > 0.35;
}

async function captureWithRetry(target, opts) {
  let canvas = await html2canvas(target, opts);
  if (isCanvasSuspiciouslyBlack(canvas)) {
    // Probable falla de memoria/GPU a mitad de captura — reintentar una vez
    await new Promise((r) => setTimeout(r, 400));
    canvas = await html2canvas(target, opts);
  }
  return canvas;
}

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
    const canvas = await captureWithRetry(targets[i], {
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
  // Mover off-screen pero visible para que html2canvas pueda capturar
  element.style.position   = 'fixed';
  element.style.left       = '-9999px';
  element.style.top        = '0';
  element.style.visibility = 'visible';
  element.style.zIndex     = '-1';

  // Esperar a que las imágenes (logos de marca, etc.) terminen de cargar
  await waitForImages(element);

  // Esperar dos frames para que el navegador pinte el elemento antes de capturar
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

  let pdfBuffer;
  try {
    const pdf = await buildPDF(containerId, 1.5, 0.88);
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
