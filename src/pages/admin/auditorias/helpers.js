import { V_MIN, V_MAX, NT_MAX } from './constants.js';

export function voltajesEnRango(voltajes) {
  if (!voltajes) return false;
  const atm = voltajes.atm || {};
  const ups = voltajes.ups || {};
  const parseV = v => {
    if (v === null || v === undefined || v === '') return null;
    const n = parseFloat(String(v).replace(',', '.'));
    return isNaN(n) ? null : n;
  };
  const readings = [
    [parseV(atm.lt), false], [parseV(atm.ln), false], [parseV(atm.nt), true],
    [parseV(ups.lt), false], [parseV(ups.ln), false], [parseV(ups.nt), true],
  ].filter(([v]) => v !== null);
  if (!readings.length) return false;
  return readings.every(([v, tierra]) => tierra ? v <= NT_MAX : (v >= V_MIN && v <= V_MAX));
}

export function calcularScore(a) {
  let score = 0;
  if (a.equipo_funcionando) score += 25;
  if (a.pruebas_exitosas)   score += 25;
  const devs      = Object.values(a.dispositivos_estado || {});
  const repuestos = devs.filter(d => d.estado === 'repuesto').length;
  const manto     = devs.filter(d => d.estado === 'mantenimiento').length;
  score += (40 - Math.min(40, repuestos * 8 + manto * 3));
  if (voltajesEnRango(a.voltajes)) score += 10;
  return Math.max(0, Math.min(100, score));
}

export function calcularDecision(a) {
  const score     = calcularScore(a);
  const devs      = Object.values(a.dispositivos_estado || {});
  const repuestos = devs.filter(d => d.estado === 'repuesto').length;
  if (score >= 75 && repuestos >= 1) return { decision: 'OBSERVAR', score };
  if (score >= 75)                   return { decision: 'ACEPTAR',  score };
  if (score >= 50)                   return { decision: 'OBSERVAR', score };
  return                                    { decision: 'RECHAZAR', score };
}
