import { supabase } from '../lib/supabase.js';
import { voltEstadoCampo } from '../constants/voltages.js';

export const C2D_DEVICE_KEYS = ['cashToday', 'validador', 'mecanismos', 'gabinete', 'routerTeldat'];

export const C2D_DEVICE_LABELS = {
  cashToday:    'Cash Today (equipo general)',
  validador:    'Validador',
  mecanismos:   'Mecanismos y sensores',
  gabinete:     'Gabinete',
  routerTeldat: 'Router y Teldat',
  cashControl:  'Cash Control',
};

export const C2D_ESTADO_LABELS = {
  operativo:   '✅ Operativo',
  observacion: '⚠ Observación',
  malo:        '❌ Malo / Falla',
};

export const C2D_SITE_ITEMS = [
  { key: 'camaras',           label: '¿Cámaras de vigilancia?' },
  { key: 'aireAcondicionado', label: '¿Aire acondicionado?' },
  { key: 'iluminacion',       label: '¿Iluminación?' },
  { key: 'excesoPolvo',       label: '¿Exceso de polvo?' },
];

export const C2D_PRUEBAS_ITEMS = [
  { key: 'depositoBilletes', label: 'Depósito de billetes' },
  { key: 'depositoMonedas',  label: 'Depósito de monedas' },
  { key: 'voucher',          label: 'Impresión de voucher' },
];

export const C2D_PRUEBA_LABELS = {
  exitoso: '✓ Exitoso',
  fallido: '✕ Fallido',
  na:      '— N/A',
};

export function c2dEstadoFinal(dispositivos) {
  const estados = Object.values(dispositivos || {}).map(c => c?.estado).filter(Boolean);
  if (!estados.length) return null;
  if (estados.some(e => e === 'malo'))        return 'malo';
  if (estados.some(e => e === 'observacion')) return 'observacion';
  return 'operativo';
}

export function c2dContarPorEstado(dispositivos) {
  const counts = { operativo: 0, observacion: 0, malo: 0 };
  Object.values(dispositivos || {}).forEach(c => {
    if (c?.estado && counts[c.estado] !== undefined) counts[c.estado]++;
  });
  return counts;
}

export function computeVoltajesFueraDeRango(voltajes) {
  if (!voltajes) return false;
  for (const bloque of Object.values(voltajes)) {
    if (!bloque) continue;
    for (const [campo, val] of Object.entries(bloque)) {
      if (val === '' || val === null || val === undefined) continue;
      if (voltEstadoCampo(campo, val) === 'err') return true;
    }
  }
  return false;
}

function buildPayload(form) {
  return {
    fecha:                form.fecha || null,
    hora_inicio:          form.horaInicio || null,
    hora_fin:             form.horaFin || null,
    atm_id:               null, // sin BD de C2D todavía; se ingresa manualmente
    id_atm_texto:         form.idAtm,
    punto_texto:          form.punto || null,
    nro_serie:            form.nroSerie || null,
    marca_texto:          form.marcaEquipo || null,
    modelo_texto:         form.modeloEquipo || null,
    tecnico_id:           form.tecnicoId || null,
    tecnico_nombre:       form.tecnicoNombre || null,
    tecnico_num:          form.tecnicoNum || null,
    tiene_cash_control:   form.tieneCashControl === 'si' ? true
                        : form.tieneCashControl === 'no' ? false : null,
    estado_site: {
      items: form.site    || null,
      obs:   form.siteObs || null,
    },
    pruebas_deposito: {
      items: form.pruebas    || null,
      obs:   form.pruebasObs || null,
    },
    voltajes:             form.voltajes || null,
    voltajes_fuera_rango: computeVoltajesFueraDeRango(form.voltajes),
    dispositivos: form.devFotos
      ? Object.fromEntries(
          [...C2D_DEVICE_KEYS, ...(form.tieneCashControl === 'si' ? ['cashControl'] : [])]
            .filter(k => form.devFotos[k])
            .map(k => {
              const v = form.devFotos[k];
              return [k, {
                estado:            v.estado || null,
                obs:               v.obs || null,
                num_fotos_antes:   v.fotosAntes?.length ?? 0,
                num_fotos_despues: v.fotosDespues?.length ?? 0,
              }];
            })
        )
      : null,
    obs_generales: form.obsGenerales || null,
  };
}

export async function saveC2d(form) {
  const payload = buildPayload(form);
  const { error } = await supabase.from('mantenimientos_c2d').insert(payload);
  if (error) throw error;
  return true;
}

export async function getC2d({ fechaDesde, fechaHasta, idAtm, tecnicoId, limit = 100 } = {}) {
  let q = supabase
    .from('mantenimientos_c2d')
    .select('id, created_at, fecha, hora_inicio, hora_fin, id_atm_texto, punto_texto, nro_serie, marca_texto, modelo_texto, tecnico_id, tecnico_nombre, tecnico_num, tiene_cash_control, estado_site, pruebas_deposito, voltajes, voltajes_fuera_rango, dispositivos, obs_generales')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (fechaDesde) q = q.gte('fecha', fechaDesde);
  if (fechaHasta) q = q.lte('fecha', fechaHasta);
  if (idAtm)      q = q.ilike('id_atm_texto', `%${idAtm}%`);
  if (tecnicoId)  q = q.eq('tecnico_id', tecnicoId);

  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export function buildC2dEmailSummary(form) {
  const estadoLabel = e => C2D_ESTADO_LABELS[e] || e || '—';
  const keys = [...C2D_DEVICE_KEYS, ...(form.tieneCashControl === 'si' ? ['cashControl'] : [])];
  const dispositivos = keys
    .filter(k => form.devFotos?.[k])
    .map(k => `- ${C2D_DEVICE_LABELS[k] || k}: ${estadoLabel(form.devFotos[k].estado)}${form.devFotos[k].obs ? ` — ${form.devFotos[k].obs}` : ''}`);

  const siteLines = C2D_SITE_ITEMS.map(({ key, label }) => {
    const val = form.site?.[key];
    const obs = form.siteObs?.[key];
    const mark = val === 'si' ? '✓' : val === 'no' ? '⚠' : '—';
    return `- ${label} ${mark}${obs ? ` — ${obs}` : ''}`;
  });

  const pruebaLines = C2D_PRUEBAS_ITEMS.map(({ key, label }) => {
    const val = form.pruebas?.[key];
    const obs = form.pruebasObs?.[key];
    return `- ${label}: ${C2D_PRUEBA_LABELS[val] || '—'}${obs ? ` — ${obs}` : ''}`;
  });

  const v = form.voltajes || {};
  const voltStr = v.equipo
    ? `Equipo: L-T ${v.equipo.lt || '—'}V / L-N ${v.equipo.ln || '—'}V / N-T ${v.equipo.nt || '—'}V`
    : '—';

  return [
    `Check List C2D — ${form.fecha || ''}`,
    `C2D: ${form.idAtm} | Punto: ${form.punto || '—'} | S/N: ${form.nroSerie || '—'}`,
    `Equipo: ${form.marcaEquipo || '—'} ${form.modeloEquipo || ''}`,
    `Técnico: ${form.tecnicoNombre || '—'} (N° ${form.tecnicoNum || '—'})`,
    `Hora inicio: ${form.horaInicio || '—'} — Hora fin: ${form.horaFin || '—'}`,
    `Cash Control instalado: ${form.tieneCashControl === 'si' ? 'Sí' : form.tieneCashControl === 'no' ? 'No' : '—'}`,
    `Voltajes — ${voltStr}${computeVoltajesFueraDeRango(v) ? ' ⚠ FUERA DE RANGO' : ''}`,
    '',
    'Estado del site:',
    ...siteLines,
    '',
    'Pruebas de depósito:',
    ...pruebaLines,
    '',
    'Dispositivos evaluados:',
    ...dispositivos,
    '',
    `Observaciones: ${form.obsGenerales || 'Sin observaciones'}`,
  ].join('\n');
}
