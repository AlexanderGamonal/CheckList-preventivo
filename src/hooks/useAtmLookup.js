import { supabase } from '../lib/supabase.js';

export async function lookupAtm(idAtm) {
  const { data, error } = await supabase
    .from('atms')
    .select(`
      id_atm, punto, atm_tipo, activo,
      marcas(nombre),
      modelos(nombre),
      clientes(nombre)
    `)
    .eq('id_atm', idAtm.toUpperCase())
    .single();

  if (error || !data) return null;
  return {
    idAtm: data.id_atm,
    punto: data.punto,
    marca: data.marcas.nombre,
    modelo: data.modelos.nombre,
    atmTipo: data.atm_tipo,
    cliente: data.clientes.nombre,
    atmDbId: data.id,
  };
}

export async function searchAtmIds(partial) {
  if (!partial || partial.length < 2) return [];
  const { data, error } = await supabase
    .from('atms')
    .select('id_atm, punto, clientes(nombre)')
    .ilike('id_atm', `%${partial}%`)
    .eq('activo', true)
    .order('id_atm')
    .limit(8);
  if (error) return [];
  return data.map(d => ({
    id_atm: d.id_atm,
    punto: d.punto,
    cliente: d.clientes.nombre,
  }));
}
