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

/* Valida un campo específico según su tipo */
export function voltEstadoCampo(campo, valor) {
  const v = parseFloat(valor);
  if (isNaN(v) || valor === "" || valor === null) return null;
  if (campo === "nt") return v <= NT_MAX ? "ok" : "err";
  return v >= VOLT_MIN && v <= VOLT_MAX ? "ok" : "err";
}

/* Alias para compatibilidad con referencias existentes */
export function voltEstado(valor) {
  return voltEstadoCampo("ln", valor);
}

/* Genera el mensaje de observación automático */
export function voltMensaje(ln, lt, nt) {
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
