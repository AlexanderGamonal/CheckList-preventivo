/**
 * Grupos de destinatarios de correo — separan qué contactos reciben
 * los correos de cada flujo.
 */

export const EMAIL_GRUPOS = [
  { key: 'atm_bbva',        label: 'ATM BBVA',        color: '#3b82f6', description: 'MP de cajeros BBVA y Actas de Auditoría' },
  { key: 'atm_scotiabank',  label: 'ATM Scotiabank',  color: '#dc2626', description: 'MP de cajeros Scotiabank' },
  { key: 'jv_latm',         label: 'JV LATM',         color: '#f59e0b', description: 'MP de cajeros JV LATM' },
  { key: 'c2d',             label: 'C2D',             color: '#8b5cf6', description: 'MP Cash Today (C2D)' },
];

export const EMAIL_GRUPO_KEYS = EMAIL_GRUPOS.map(g => g.key);

export const EMAIL_GRUPO_LABEL = Object.fromEntries(EMAIL_GRUPOS.map(g => [g.key, g.label]));
export const EMAIL_GRUPO_COLOR = Object.fromEntries(EMAIL_GRUPOS.map(g => [g.key, g.color]));

/**
 * Determina el grupo de destinatarios para un MP (`/checklist`) según el
 * cliente registrado en el ATM. Auditorías siempre usan 'atm_bbva' y C2D
 * siempre usa 'c2d' — no pasan por esta función.
 */
export function resolveGrupoMP(clienteTexto) {
  const c = (clienteTexto || '').trim().toLowerCase();
  if (!c) return 'atm_bbva'; // fallback conservador
  if (c === 'scotiabank' || c.includes('scotia')) return 'atm_scotiabank';
  if (c === 'jv latm' || c.includes('jv') || c.includes('latm')) return 'jv_latm';
  if (c === 'c2d' || c.includes('cash today')) return 'c2d';
  return 'atm_bbva'; // BBVA y cualquier otro cliente no reconocido
}
