import { supabase } from '../lib/supabase.js';
import { getSections } from '../constants/devices.js';
import { VOLT_MIN, VOLT_MAX, NT_MAX } from '../constants/voltages.js';

/* ─── Helpers ─────────────────────────────────────────────────── */
function esc(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n'))
    return '"' + str.replace(/"/g, '""') + '"';
  return str;
}

function toCSV(headers, rows) {
  const lines = [headers.join(','), ...rows.map(r => headers.map(h => esc(r[h])).join(','))];
  return '\uFEFF' + lines.join('\n'); // BOM para Excel UTF-8
}

function descargar(csv, nombre) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function calcPct(buenos, defectuosos, regulares) {
  const aplicable = buenos + defectuosos + regulares;
  return aplicable > 0 ? Math.round((buenos / aplicable) * 100) : '';
}

function calcVoltajeAlerta(voltajes) {
  if (!voltajes || typeof voltajes !== 'object') return 'NO';
  for (const item of Object.values(voltajes)) {
    const ln = parseFloat(item?.ln);
    const lt = parseFloat(item?.lt);
    const nt = parseFloat(item?.nt);
    if (!isNaN(ln) && (ln < VOLT_MIN || ln > VOLT_MAX)) return 'SI';
    if (!isNaN(lt) && (lt < VOLT_MIN || lt > VOLT_MAX)) return 'SI';
    if (!isNaN(nt) && nt > NT_MAX) return 'SI';
  }
  return 'NO';
}

/* ─── Tabla 1: Mantenimientos (una fila por mantenimiento) ────── */
const MANT_HEADERS = [
  'id', 'fecha', 'cliente', 'id_atm', 'punto', 'marca', 'modelo', 'atm_tipo',
  'tecnico', 'num_interno', 'est_final',
  'disp_buenos', 'disp_defectuosos', 'disp_regulares', 'disp_no_aplica', 'pct_cumplimiento',
  'voltaje_alerta', 'obs_gen', 'recomendaciones',
];

export async function exportarCSV(filtros = {}) {
  let query = supabase
    .from('mantenimientos')
    .select(`
      id, num_interno, fecha, id_atm_texto, punto_texto,
      marca_texto, modelo_texto, atm_tipo,
      tecnico_nombre, tecnico_num,
      est_final, disp_buenos, disp_defectuosos, disp_regulares, disp_no_aplica,
      voltajes, obs_gen, recomendaciones,
      atms(clientes(nombre))
    `)
    .order('fecha', { ascending: false });

  if (filtros.desde)      query = query.gte('fecha', filtros.desde);
  if (filtros.hasta)      query = query.lte('fecha', filtros.hasta);
  if (filtros.tecnico_id) query = query.eq('tecnico_id', filtros.tecnico_id);
  if (filtros.est_final)  query = query.eq('est_final', filtros.est_final);

  const { data, error } = await query;
  if (error) throw error;
  if (!data || data.length === 0) throw new Error('No hay datos para exportar');

  const rows = data.map(r => ({
    id:                r.id,
    fecha:             r.fecha,
    cliente:           r.atms?.clientes?.nombre || '',
    id_atm:            r.id_atm_texto,
    punto:             r.punto_texto,
    marca:             r.marca_texto,
    modelo:            r.modelo_texto || '',
    atm_tipo:          r.atm_tipo,
    tecnico:           r.tecnico_nombre,
    num_interno:       r.tecnico_num || r.num_interno || '',
    est_final:         r.est_final,
    disp_buenos:       r.disp_buenos,
    disp_defectuosos:  r.disp_defectuosos,
    disp_regulares:    r.disp_regulares,
    disp_no_aplica:    r.disp_no_aplica,
    pct_cumplimiento:  calcPct(r.disp_buenos, r.disp_defectuosos, r.disp_regulares),
    voltaje_alerta:    calcVoltajeAlerta(r.voltajes),
    obs_gen:           r.obs_gen || '',
    recomendaciones:   r.recomendaciones || '',
  }));

  const fecha = new Date().toISOString().slice(0, 10);
  descargar(toCSV(MANT_HEADERS, rows), `mantenimientos_${fecha}.csv`);
}

/* ─── Tabla 2: Dispositivos (una fila por ítem de dispositivo) ── */
const DISP_HEADERS = [
  'mantenimiento_id', 'fecha', 'cliente', 'id_atm', 'punto', 'marca', 'modelo', 'atm_tipo', 'tecnico',
  'modulo', 'item', 'estado', 'limitacion', 'prueba', 'observacion',
];

export async function exportarDispositivosCSV(filtros = {}) {
  let query = supabase
    .from('mantenimientos')
    .select(`
      id, fecha, id_atm_texto, punto_texto,
      marca_texto, modelo_texto, atm_tipo, tecnico_nombre,
      dispositivos,
      atms(clientes(nombre))
    `)
    .order('fecha', { ascending: false });

  if (filtros.desde)      query = query.gte('fecha', filtros.desde);
  if (filtros.hasta)      query = query.lte('fecha', filtros.hasta);
  if (filtros.tecnico_id) query = query.eq('tecnico_id', filtros.tecnico_id);
  if (filtros.est_final)  query = query.eq('est_final', filtros.est_final);

  const { data, error } = await query;
  if (error) throw error;
  if (!data || data.length === 0) throw new Error('No hay datos para exportar');

  const rows = [];

  for (const mant of data) {
    if (!mant.dispositivos) continue;

    // Reconstruir mapa sectionId_index → nombre del ítem
    const sections = getSections(mant.atm_tipo, mant.marca_texto, mant.modelo_texto || '');
    const itemMap = {};
    sections.forEach(sec => {
      sec.items.forEach((itemName, idx) => {
        itemMap[`${sec.id}_${idx}`] = { modulo: sec.title, item: itemName };
      });
    });

    const cliente  = mant.atms?.clientes?.nombre || '';
    const id_atm   = mant.id_atm_texto;
    const punto    = mant.punto_texto;
    const marca    = mant.marca_texto;
    const modelo   = mant.modelo_texto || '';
    const atm_tipo = mant.atm_tipo;
    const tecnico  = mant.tecnico_nombre;

    for (const [key, val] of Object.entries(mant.dispositivos)) {
      if (!val || typeof val !== 'object') continue;
      const info = itemMap[key];
      if (!info) continue; // ítem no reconocido (datos de versión anterior)

      rows.push({
        mantenimiento_id: mant.id,
        fecha:            mant.fecha,
        cliente,
        id_atm,
        punto,
        marca,
        modelo,
        atm_tipo,
        tecnico,
        modulo:           info.modulo,
        item:             info.item,
        estado:           val.est || '',
        limitacion:       val.lim ? 'SI' : 'NO',
        prueba:           val.pru ? 'SI' : 'NO',
        observacion:      val.obs || '',
      });
    }
  }

  if (rows.length === 0) throw new Error('No hay datos de dispositivos para exportar');

  const fecha = new Date().toISOString().slice(0, 10);
  descargar(toCSV(DISP_HEADERS, rows), `dispositivos_${fecha}.csv`);
}
