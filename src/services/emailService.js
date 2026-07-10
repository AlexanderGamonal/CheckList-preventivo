import { supabase } from '../lib/supabase.js';
import { buildEmailSummary } from './mantenimientoService.js';
import { buildAuditoriaEmailSummary } from './auditoriaService.js';
import { buildC2dEmailSummary } from './c2dService.js';
import { resolveGrupoMP } from '../constants/emailGrupos.js';

export async function sendNotificationEmail(form, pdfArrayBuffer, onStep) {
  const summary = buildEmailSummary(form);
  const sanitize = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9\-_]/g, '-').replace(/-+/g, '-');
  const filename = `MP-${sanitize(form.punto)}-${form.idAtm}.pdf`;
  const storagePath = `temp/${Date.now()}-${filename}`;
  const grupo = resolveGrupoMP(form.cliente);
  console.log('[email MP] cliente:', form.cliente, '→ grupo:', grupo);

  onStep?.('Subiendo PDF…');
  const { error: uploadError } = await supabase.storage
    .from('pdf-attachments')
    .upload(storagePath, new Uint8Array(pdfArrayBuffer), {
      contentType: 'application/pdf',
      upsert: true,
    });
  if (uploadError) throw new Error('Error subiendo PDF: ' + uploadError.message);

  onStep?.('Enviando correo…');
  const { data, error } = await supabase.functions.invoke('send-email', {
    body: {
      subject: `Mantenimiento ATM ${form.idAtm} — ${form.fecha}`,
      text: summary,
      storagePath,
      filename,
      grupo,
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

export async function sendC2dEmail(form, pdfArrayBuffer, onStep) {
  const summary = buildC2dEmailSummary(form);
  const sanitize = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9\-_]/g, '-').replace(/-+/g, '-');
  const puntoSlug = sanitize(form.punto).slice(0, 40);
  const filename = `C2D-${puntoSlug ? puntoSlug + '-' : ''}${sanitize(form.idAtm || 'ATM')}-${form.fecha || 'sin-fecha'}.pdf`;
  const storagePath = `temp/${Date.now()}-${filename}`;
  console.log('[email C2D] grupo: c2d');

  onStep?.('Subiendo PDF...');
  const { error: uploadError } = await supabase.storage
    .from('pdf-attachments')
    .upload(storagePath, new Uint8Array(pdfArrayBuffer), {
      contentType: 'application/pdf',
      upsert: true,
    });
  if (uploadError) throw new Error('Error subiendo PDF: ' + uploadError.message);

  onStep?.('Enviando correo...');
  const { error } = await supabase.functions.invoke('send-email', {
    body: {
      subject: `Check List C2D ${form.idAtm} — ${form.fecha || ''}`,
      text: summary,
      storagePath,
      filename,
      grupo: 'c2d',
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

export async function sendAuditoriaEmail(form, pdfArrayBuffer, onStep) {
  const summary = buildAuditoriaEmailSummary(form);
  const sanitize = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9\-_]/g, '-').replace(/-+/g, '-');
  const filename = `Auditoria-${sanitize(form.idAtm || 'ATM')}-${form.fecha || 'sin-fecha'}.pdf`;
  const storagePath = `temp/${Date.now()}-${filename}`;
  console.log('[email Auditoria] grupo: atm_bbva');

  onStep?.('Subiendo PDF...');
  const { error: uploadError } = await supabase.storage
    .from('pdf-attachments')
    .upload(storagePath, new Uint8Array(pdfArrayBuffer), {
      contentType: 'application/pdf',
      upsert: true,
    });
  if (uploadError) throw new Error('Error subiendo PDF: ' + uploadError.message);

  onStep?.('Enviando correo...');
  const { error } = await supabase.functions.invoke('send-email', {
    body: {
      subject: `Acta de Auditoria ${form.idAtm} — ${form.fecha || ''}`,
      text: summary,
      storagePath,
      filename,
      grupo: 'atm_bbva',
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
