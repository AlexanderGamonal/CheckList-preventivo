import { supabase } from '../lib/supabase.js';

// Caché de módulo — se carga una sola vez por sesión
let atmCache = null;
let cachePromise = null;

function getCache() {
  if (atmCache) return Promise.resolve(atmCache);
  if (!cachePromise) {
    cachePromise = supabase
      .from('atms')
      .select(`id, id_atm, punto, atm_tipo, activo, marcas(nombre), modelos(nombre), clientes(nombre),
               nro_serie, ip_equipo, mascara_red, gateway, dns1, dns2, cpu_modelo, software_atm, direccion`)
      .eq('activo', true)
      .order('id_atm')
      .then(({ data }) => {
        atmCache = data || [];
        return atmCache;
      });
  }
  return cachePromise;
}

export async function lookupAtm(idAtm) {
  const cache = await getCache();
  const d = cache.find(a => a.id_atm === idAtm.toUpperCase());
  if (!d) return null;
  return {
    idAtm:       d.id_atm,
    punto:       d.punto,
    marca:       d.marcas?.nombre,
    modelo:      d.modelos?.nombre,
    atmTipo:     d.atm_tipo,
    cliente:     d.clientes?.nombre,
    atmDbId:     d.id,
    nroSerie:    d.nro_serie    || null,
    ipEquipo:    d.ip_equipo   || null,
    mascaraRed:  d.mascara_red || null,
    gateway:     d.gateway     || null,
    dns1:        d.dns1        || null,
    dns2:        d.dns2        || null,
    cpuModelo:   d.cpu_modelo  || null,
    softwareAtm: d.software_atm || null,
    direccion:   d.direccion   || null,
  };
}

export function clearAtmCache() {
  atmCache = null;
  cachePromise = null;
}

export async function searchAtmIds(partial) {
  if (!partial || partial.length < 1) return [];
  const cache = await getCache();
  const q = partial.toLowerCase();
  return cache
    .filter(a => a.id_atm.toLowerCase().includes(q))
    .slice(0, 8)
    .map(d => ({
      id_atm:  d.id_atm,
      punto:   d.punto,
      cliente: d.clientes?.nombre,
    }));
}
