/* ══════════════════════════════════════════════════════════════
   SECCIONES BASE — iguales para toda marca/tipo
══════════════════════════════════════════════════════════════ */
export const SEC_LECTORA = {
  id: "lectora",
  tipo: "base",
  title: "Lectora",
  emoji: "💳",
  items: [
    "Rollers",
    "Cabezal",
    "Faja Transporte",
    "Shutter",
    "Boqueta",
    "Métricas de Sensores",
  ],
};
export const SEC_IMPRESORA = {
  id: "impresora",
  tipo: "base",
  title: "Impresora",
  emoji: "🖨️",
  items: [
    "Rollers",
    "Cabezal Térmico",
    "Faja de Transporte",
    "Guillotina",
  ],
};
export const SEC_MONITOR = {
  id: "monitor",
  tipo: "base",
  title: "Monitor",
  emoji: "🖥️",
  items: ["Cable Video", "Pantalla", "Touch Screen"],
};
export const SEC_TECLADO = {
  id: "teclado",
  tipo: "base",
  title: "Teclado",
  emoji: "⌨️",
  items: ["Teclado Lateral", "Teclado Encriptador"],
};
export const SEC_CPU = {
  id: "cpu",
  tipo: "base",
  title: "CPU",
  emoji: "💻",
  items: [
    "Cooler / Disipador",
    "Mainboard",
    "Memoria",
    "Fuente de Poder (CPU)",
  ],
};
export const SEC_OTROS = {
  id: "otros",
  tipo: "base",
  title: "Otros",
  emoji: "🔩",
  items: [
    "Fuente ATM (Power Supply)",
    "Power Distributor / Power Box",
    "Miscellanius / TCM / IO Board",
    "Panel Operator / SPI",
    "Cableado Interno",
  ],
};

/* ══════════════════════════════════════════════════════════════
   DISPENSADOR — por marca
══════════════════════════════════════════════════════════════ */
export const DISP_NCR_6622 = {
  id: "dispensador",
  tipo: "disp",
  title: "Dispensador de Billetes — NCR S1",
  emoji: "💵",
  items: [
    "Shutter S1",
    "Presentador S1",
    "LVDT",
    "Main PCB S1",
    "Pick Module 1 S1",
    "Pick Module 2 S1",
    "Cassette de Rechazos",
    "Cassette 1",
    "Cassette 2",
    "Cassette 3",
    "Cassette 4",
  ],
};

export const DISP_NCR_6623 = {
  id: "dispensador",
  tipo: "disp",
  title: "Dispensador de Billetes — NCR S2",
  emoji: "💵",
  items: [
    "Shutter",
    "Carriege",
    "Presenter Core",
    "Main Motor",
    "Bill Aligner Module (BAM)",
    "Single Note Transport (SNT)",
    "Double Pick Module 1",
    "Double Pick Module 2",
    "Main Control Board S2",
    "Purge Bin",
    "Cassette 1",
    "Cassette 2",
    "Cassette 3",
    "Cassette 4",
  ],
};

export const DISP_NCR = {
  id: "dispensador",
  tipo: "disp",
  title: "Dispensador de Billetes — NCR",
  emoji: "💵",
  items: [
    "Shutter",
    "Carriege",
    "Presenter Core",
    "Main Motor",
    "Bill Aligner Module (BAM)",
    "Single Note Transport (SNT)",
    "Double Pick Module 1",
    "Double Pick Module 2",
    "Main Control Board S2",
    "Purge Bin",
    "Cassette 1",
    "Cassette 2",
    "Cassette 3",
    "Cassette 4",
  ],
};

export const DISP_DIEBOLD = {
  id: "dispensador",
  tipo: "disp",
  title: "Dispensador de Billetes — Diebold",
  emoji: "💵",
  items: [
    "Shutter",
    "Presenter",
    "Stacker",
    "Fajas Verticales",
    "CCA Controller Board",
    "Feeder 1",
    "Feeder 2",
    "Feeder 3",
    "Feeder 4",
    "Feeder 5",
    "Cassette 1",
    "Cassette 2",
    "Cassette 3",
    "Cassette 4",
    "Cassette 5",
    "Cassette de Rechazo",
  ],
};

export const DISP_GRG = {
  id: "dispensador",
  tipo: "disp",
  title: "Dispensador de Billetes — GRG",
  emoji: "💵",
  items: [
    "Shutter",
    "Note Presenter (NP)",
    "Note Transport (NT)",
    "Note Stacker (NS)",
    "Main Board (MB)",
    "Reject Vault (RV)",
    "Note Feeder (NF) 1",
    "Note Feeder (NF) 2",
    "Note Feeder (NF) 3",
    "Note Feeder (NF) 4",
    "Cassette Frame (CF)",
    "Note Cassette (NC) 1",
    "Note Cassette (NC) 2",
    "Note Cassette (NC) 3",
    "Note Cassette (NC) 4",
  ],
};

export const DISP_HYOSUNG = {
  id: "dispensador",
  tipo: "disp",
  title: "Dispensador de Billetes — Hyosung MX5700",
  emoji: "💵",
  items: [
    "Main Body (MB)",
    "Throat (THR)",
    "Separator Feeder 1 (SF1)",
    "Separator Feeder 2 (SF2)",
    "Feed Frame (FF)",
    "Cassette Reject/Retract (RJ/RT BOX)",
    "Cassette 1 (CST)",
    "Cassette 2 (CST)",
    "Cassette 3 (CST)",
    "Cassette 4 (CST)",
  ],
};

export const LECTORA_HYOSUNG = {
  id: "lectora",
  tipo: "base",
  title: "Card Reader DIP",
  emoji: "💳",
  items: [
    "Tarjeta electrónica",
    "Cabezal de lectura",
    "Boqueta",
    "Sensor de proximidad",
    "Cable de conexión a tierra",
    "Smart Card",
  ],
};

export const DISP_MAP = { NCR: DISP_NCR, Diebold: DISP_DIEBOLD, GRG: DISP_GRG, Hyosung: DISP_HYOSUNG };

const NCR_6622_MODELOS = ["ss22", "ss26", "6622"];
const NCR_6623_MODELOS = ["ss23", "ss27", "6623"];

function getDisp(marca, modelo) {
  if (marca === "NCR" && modelo) {
    const m = modelo.toLowerCase();
    if (NCR_6622_MODELOS.some(k => m.includes(k))) return DISP_NCR_6622;
    if (NCR_6623_MODELOS.some(k => m.includes(k))) return DISP_NCR_6623;
  }
  return DISP_MAP[marca] || null;
}

/* ══════════════════════════════════════════════════════════════
   ACEPTADOR — por marca
══════════════════════════════════════════════════════════════ */
export const ACEPT_NCR = {
  id: "aceptador",
  tipo: "dep",
  title: "Aceptador de Billetes — NCR",
  emoji: "📥",
  items: [
    "Pocket",
    "Upper Exception Bin",
    "Upper Transport (Front Side)",
    "Centralisation Transport",
    "Bill Validator",
    "Upper Transport (Rear Side)",
    "Escrow",
    "Intermedial Transport",
    "Lower Horizontal Transport",
    "Vertical Transport",
    "Lower Exception Cassette",
    "Recycler Cassette 1",
    "Recycler Cassette 2",
    "Recycler Cassette 3",
    "Recycler Cassette 4",
  ],
};

export const ACEPT_DIEBOLD = {
  id: "aceptador",
  tipo: "dep",
  title: "Aceptador de Billetes — Diebold",
  emoji: "📥",
  items: [
    "Cash Slot Shutter",
    "Cash Slot",
    "Upper Transport Front (UTF)",
    "Upper Transport Rear (UTR)",
    "Bill Validator",
    "Temporary Stacker",
    "External Transport",
    "Lower Top",
    "Cassette 1",
    "Cassette 2",
    "Cassette 3",
    "Cassette 4",
    "Cassette 5",
  ],
};

export const ACEPT_MAP = { NCR: ACEPT_NCR, Diebold: ACEPT_DIEBOLD };

/* ══════════════════════════════════════════════════════════════
   getSections — retorna secciones según tipo + marca
══════════════════════════════════════════════════════════════ */
export function getSections(atmTipo, marca, modelo = "") {
  if (!atmTipo) return [];
  const lectora = marca === "Hyosung" ? LECTORA_HYOSUNG : SEC_LECTORA;
  const secs = [lectora, SEC_IMPRESORA];

  if (
    (atmTipo === "dispensador" || atmTipo === "multifuncion") &&
    marca
  ) {
    const disp = getDisp(marca, modelo);
    if (disp) secs.push(disp);
  }
  if (
    (atmTipo === "depositos" || atmTipo === "multifuncion") &&
    marca &&
    ACEPT_MAP[marca]
  ) {
    secs.push(ACEPT_MAP[marca]);
  }

  secs.push(SEC_MONITOR, SEC_TECLADO, SEC_CPU, SEC_OTROS);
  return secs;
}

/* ══════════════════════════════════════
   ESTADO INICIAL
══════════════════════════════════════ */
export const ESTADOS = ["Bueno", "Defectuoso", "Regular", "No Aplica"];
export const E_COL = {
  Bueno: "#16a34a",
  Defectuoso: "#dc2626",
  Regular: "#d97706",
  "No Aplica": "#64748b",
};

export function initVoltages() {
  const v = {};
  const VOLT_ITEMS = [
    "Cable interno ATM",
    "UPS",
    "Transformador Aislamiento",
    "Toma Eléctrica",
  ];
  VOLT_ITEMS.forEach((k) => {
    v[k] = { ln: "", lt: "", nt: "", obs: "" };
  });
  return v;
}

export function initDevicesFor(sections) {
  const d = {};
  sections.forEach((s) =>
    s.items.forEach((_, ii) => {
      d[s.id + "_" + ii] = { lim: false, pru: false, est: "", obs: "" };
    }),
  );
  return d;
}

export function initForm() {
  return {
    fecha: "",
    num: "",
    tec: "",
    idAtm: "",
    marca: "",
    modelo: "",
    punto: "",
    cliente: "",
    atmTipo: "",
    voltages: initVoltages(),
    devices: {},
    site: {},
    obsGen: "",
    res: "",
    rec: "",
    estFinal: "",
  };
}
