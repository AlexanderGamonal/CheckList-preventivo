/* ══════════════════════════════════════════════════════
   VOLTAJE
   L-N / L-T : 220V ± 5%  →  rango 209V – 231V
   N-T       : máximo 5V  →  si > 5V: desbalanceado
══════════════════════════════════════════════════════ */
export const VOLT_IDEAL = 220;
export const VOLT_TOL_PCT = 0.05;
export const VOLT_MIN = VOLT_IDEAL * (1 - VOLT_TOL_PCT); // 209 V
export const VOLT_MAX = VOLT_IDEAL * (1 + VOLT_TOL_PCT); // 231 V
export const NT_MAX = 5; // V máximo permitido Neutro-Tierra
export const VOLT_ITEMS = [
  "Cable interno ATM",
  "UPS",
  "Transformador Aislamiento",
  "Toma Eléctrica",
];

function parseVolt(valor) {
  if (valor === "" || valor === null || valor === undefined) return null;
  const v = parseFloat(String(valor).replace(",", "."));
  return isNaN(v) ? null : v;
}

/* Un técnico sin acceso físico a la medición a veces registra 0 en
   las 3 mediciones (L-N, L-T y N-T) en vez de dejarlas vacías. Ese
   caso puntual no debe leerse como "fuera de rango": se trata como
   "sin acceso a la medición". */
export function esSinAcceso(ln, lt, nt) {
  const a = parseVolt(ln);
  const b = parseVolt(lt);
  const c = parseVolt(nt);
  return a === 0 && b === 0 && c === 0;
}

/* Valida un campo específico según su tipo.
   sinAcceso: cuando las 3 mediciones del grupo son 0, se marca el
   campo como "sinacceso" en vez de "ok"/"err". */
export function voltEstadoCampo(campo, valor, sinAcceso = false) {
  const v = parseFloat(valor);
  if (isNaN(v) || valor === "" || valor === null) return null;
  if (sinAcceso) return "sinacceso";
  if (campo === "nt") return v <= NT_MAX ? "ok" : "err";
  return v >= VOLT_MIN && v <= VOLT_MAX ? "ok" : "err";
}

/* Alias para compatibilidad con referencias existentes */
export function voltEstado(valor) {
  return voltEstadoCampo("ln", valor);
}

/* Genera el mensaje de observación automático */
export function voltMensaje(ln, lt, nt) {
  if (esSinAcceso(ln, lt, nt)) {
    return "Sin acceso a esta medición";
  }
  const partes = [];
  const llenos = [ln, lt].filter(
    (v) => v !== "" && v !== null && v !== undefined,
  );
  if (llenos.length > 0) {
    partes.push(
      llenos.some((v) => voltEstadoCampo("ln", v) === "err")
        ? "Voltajes fuera del rango permitido"
        : "Voltajes dentro del rango permitido",
    );
  }
  if (nt !== "" && nt !== null && nt !== undefined) {
    if (voltEstadoCampo("nt", nt) === "err") {
      partes.push("Voltajes desbalanceados (Revisar la toma a tierra)");
    }
  }
  return partes.join(" — ");
}
