import { supabase } from '../lib/supabase.js';
import { buildEmailSummary } from './mantenimientoService.js';

export async function sendNotificationEmail(form, pdfArrayBuffer) {
  const summary = buildEmailSummary(form);
  const filename = `MP-${form.punto.replace(/\s+/g, '-')}-${form.idAtm}.pdf`;
  const storagePath = `temp/${Date.now()}-${filename}`;

  // 1. Subir PDF a Storage (evita límite de body JSON)
  const { error: uploadError } = await supabase.storage
    .from('pdf-attachments')
    .upload(storagePath, new Uint8Array(pdfArrayBuffer), {
      contentType: 'application/pdf',
      upsert: true,
    });
  if (uploadError) throw new Error('Error subiendo PDF: ' + uploadError.message);

  // 2. Llamar al Edge Function solo con la ruta (sin base64 pesado)
  const { data, error } = await supabase.functions.invoke('send-email', {
    body: {
      subject: `Mantenimiento ATM ${form.idAtm} — ${form.fecha}`,
      text: summary,
      storagePath,
      filename,
    },
  });

  if (error) {
    let msg = error.message;
    try {
      const body = await error.context?.json?.();
      if (body?.error) msg = body.error;
    } catch {}
    throw new Error(msg);
  }
  return true;
}
