import { supabase } from '../lib/supabase.js';

function buildPayload(form) {
  return {
    fecha:                  form.fecha || null,
    id_atm:                 form.idAtm || null,
    atm_id:                 form.atmDbId || null,
    tipo_atm:               form.tipoAtm || null,
    punto_texto:            form.punto || null,
    marca_texto:            form.marcaEquipo || null,
    modelo_texto:           form.modeloEquipo || null,
    cliente_texto:          form.cliente || null,
    direccion:              form.direccion || null,
    nro_serie:              form.nroSerie || null,
    equipo_funcionando:     form.equipoFuncionando === 'si' ? true : form.equipoFuncionando === 'no' ? false : null,
    equipo_funcionando_obs: form.equipoFuncionandoObs || 'ok',
    pruebas_linea:          form.pruebas || null,
    pruebas_linea_obs:      form.pruebasObs
      ? Object.fromEntries(Object.entries(form.pruebasObs).map(([k, v]) => [k, v || 'ok']))
      : null,
    pruebas_exitosas:       form.pruebasExitosas === 'si' ? true : form.pruebasExitosas === 'no' ? false : null,
    pruebas_exitosas_obs:   form.pruebasExitosasObs || 'ok',
    info_general: {
      horaInicio:       form.horaInicio || null,
      horaFin:          form.horaFin || null,
      ipEquipo:         form.ipEquipo || null,
      mascaraRed:       form.mascaraRed || null,
      gateway:          form.gateway || null,
      dns1:             form.dns1 || null,
      dns2:             form.dns2 || null,
      sistemaOperativo: form.sistemaOperativo || null,
      software:         form.software || null,
      cassettes:        form.cassettes || null,
    },
    dispositivos: {
      lectorTarjetas:    form.lectorTarjetas || null,
      lectorOtro:        form.lectorOtro || null,
      askTipo:           form.askTipo || null,
      impresoraRecibos:  form.impresoraRecibos || null,
      impresoraOtro:     form.impresoraOtro || null,
      tecladoEPP:        form.tecladoEPP || null,
      cpu:               form.cpu || null,
      cpuOtro:           form.cpuOtro || null,
      pantalla:          form.pantalla || null,
      memoriaRAM:        form.memoriaRAM || null,
      capacidadSSD:      form.capacidadSSD || null,
      shutterAntiFraude: form.shutterAntiFraude || null,
      sistemaEntintado:  form.sistemaEntintado || null,
      tipoNose:          form.tipoNose || null,
    },
    estado_site: {
      items: form.site || null,
      obs:   form.siteObs || null,
    },
    voltajes: form.voltajes
      ? {
          atm: { lt: form.voltajes.atmLT || null, ln: form.voltajes.atmLN || null, nt: form.voltajes.atmNT || null },
          ups: { lt: form.voltajes.upsLT || null, ln: form.voltajes.upsLN || null, nt: form.voltajes.upsNT || null },
        }
      : null,
    dispositivos_estado: form.devFotos
      ? Object.fromEntries(
          Object.entries(form.devFotos).map(([k, v]) => [k, { estado: v.estado || null, obs: v.obs || null }])
        )
      : null,
    obs_generales: form.obsGenerales || null,
  };
}

export async function saveAuditoria(form) {
  const payload = buildPayload(form);
  const { error } = await supabase.from('auditorias').insert(payload);
  if (error) throw error;
  return true;
}

export async function getAuditorias({ fechaDesde, fechaHasta, idAtm, tipoAtm, limit = 100 } = {}) {
  let q = supabase
    .from('auditorias')
    .select('id, created_at, fecha, id_atm, tipo_atm, punto_texto, marca_texto, modelo_texto, cliente_texto, nro_serie, direccion, equipo_funcionando, equipo_funcionando_obs, pruebas_exitosas, pruebas_exitosas_obs, pruebas_linea, pruebas_linea_obs, info_general, voltajes, dispositivos_estado, estado_site, obs_generales')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (fechaDesde) q = q.gte('fecha', fechaDesde);
  if (fechaHasta) q = q.lte('fecha', fechaHasta);
  if (idAtm)      q = q.ilike('id_atm', `%${idAtm}%`);
  if (tipoAtm)    q = q.eq('tipo_atm', tipoAtm);

  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export function buildAuditoriaEmailSummary(form) {
  const tipoLabel = { retiro: 'Retiro', deposito: 'Depósito', multifuncion: 'Multifunción' }[form.tipoAtm] || form.tipoAtm || '—';
  const equipo = form.equipoFuncionando === 'si' ? 'Sí' : form.equipoFuncionando === 'no' ? 'No' : '—';
  const pruebas = form.pruebasExitosas === 'si' ? 'Exitosas' : form.pruebasExitosas === 'no' ? 'No exitosas' : '—';

  const estadoCounts = Object.values(form.devFotos || {}).reduce(
    (acc, d) => { if (d.estado) acc[d.estado] = (acc[d.estado] || 0) + 1; return acc; },
    {}
  );
  const estadoResumen = [
    estadoCounts.ok          ? `${estadoCounts.ok} OK`                          : '',
    estadoCounts.mantenimiento ? `${estadoCounts.mantenimiento} requieren mantenimiento` : '',
    estadoCounts.repuesto    ? `${estadoCounts.repuesto} requieren repuesto`     : '',
  ].filter(Boolean).join(' | ') || 'Sin evaluar';

  const voltStr = form.voltajes
    ? `ATM: L-T ${form.voltajes.atmLT||'—'}V / L-N ${form.voltajes.atmLN||'—'}V / N-T ${form.voltajes.atmNT||'—'}V | UPS: L-T ${form.voltajes.upsLT||'—'}V / L-N ${form.voltajes.upsLN||'—'}V / N-T ${form.voltajes.upsNT||'—'}V`
    : '—';

  return [
    `Acta de Auditoría — ${form.fecha || ''}`,
    `ATM: ${form.idAtm} | Punto: ${form.punto || '—'} | Cliente: ${form.cliente || '—'}`,
    `Equipo: ${form.marcaEquipo || '—'} ${form.modeloEquipo || ''} | Tipo: ${tipoLabel} | S/N: ${form.nroSerie || '—'}`,
    `Hora inicio: ${form.horaInicio || '—'} — Hora fin: ${form.horaFin || '—'}`,
    `Equipo funcionando: ${equipo} | Pruebas en línea: ${pruebas}`,
    `Voltajes — ${voltStr}`,
    `Dispositivos — ${estadoResumen}`,
    `Observaciones: ${form.obsGenerales || 'Sin observaciones'}`,
  ].join('\n');
}
