import { supabase } from '../lib/supabase.js';
import { ATM_TIPOS } from '../constants/atm.jsx';

function buildPayload(form, sections) {
  const conteo = { Bueno: 0, Defectuoso: 0, Regular: 0, 'No Aplica': 0 };
  sections.forEach(s =>
    s.items.forEach((_, ii) => {
      const est = form.devices[s.id + '_' + ii]?.est;
      if (est && conteo[est] !== undefined) conteo[est]++;
    })
  );

  return {
    num_interno:      form.num || null,
    fecha:            form.fecha,
    atm_id:           form.atmDbId || null,
    id_atm_texto:     form.idAtm,
    punto_texto:      form.punto,
    marca_texto:      form.marca,
    modelo_texto:     form.modelo || null,
    cliente_texto:    form.cliente || null,
    atm_tipo:         form.atmTipo,
    tecnico_id:       form.tecnicoId || null,
    tecnico_nombre:   form.tec,
    tecnico_num:      form.tecnicoNum || null,
    site_eval:        form.site || null,
    voltajes:         form.voltages || null,
    dispositivos:     form.devices || null,
    disp_buenos:      conteo.Bueno,
    disp_defectuosos: conteo.Defectuoso,
    disp_regulares:   conteo.Regular,
    disp_no_aplica:   conteo['No Aplica'],
    obs_gen:          form.obsGen || null,
    resultados:       form.res || null,
    recomendaciones:  form.rec || null,
    est_final:        form.estFinal,
  };
}

export async function saveMantenimiento(form, sections) {
  const payload = buildPayload(form, sections);
  const { error } = await supabase.from('mantenimientos').insert(payload);
  if (error) throw error;
  return true;
}

export function buildEmailSummary(form) {
  const tipoLabel = ATM_TIPOS.find(t => t.id === form.atmTipo)?.label || form.atmTipo;
  return [
    `Mantenimiento Preventivo — ${form.fecha}`,
    `ATM: ${form.idAtm} | Punto: ${form.punto}`,
    `Marca: ${form.marca} ${form.modelo || ''} | Tipo: ${tipoLabel}`,
    `Tecnico: ${form.tec} | Estado Final: ${form.estFinal}`,
    `Observaciones: ${form.obsGen || 'Sin observaciones'}`,
  ].join('\n');
}
