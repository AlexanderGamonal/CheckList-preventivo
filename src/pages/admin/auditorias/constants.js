export const TIPO_LABELS = { retiro: 'Retiro', deposito: 'Depósito', multifuncion: 'Multifunción' };
export const V_MIN = 220 * 0.95;
export const V_MAX = 220 * 1.05;
export const NT_MAX = 4;

export const DECISION_COLORS = {
  ACEPTAR:  { fg: '#16a34a', bg: 'rgba(22,163,74,0.12)',  border: 'rgba(22,163,74,0.3)'  },
  OBSERVAR: { fg: '#d97706', bg: 'rgba(217,119,6,0.12)',  border: 'rgba(217,119,6,0.3)'  },
  RECHAZAR: { fg: '#dc2626', bg: 'rgba(220,38,38,0.12)',  border: 'rgba(220,38,38,0.3)'  },
};
export const PIE_FILL = { ACEPTAR: '#16a34a', OBSERVAR: '#d97706', RECHAZAR: '#dc2626' };

export const DEV_LABELS = {
  lectorTarjetas:    'Lector de Tarjetas',
  impresoraRecibos:  'Impresora de Recibos',
  tecladoEPP:        'Teclado EPP',
  cpu:               'CPU',
  pantalla:          'Pantalla',
  memoriaRAM:        'Memoria RAM',
  capacidadSSD:      'SSD / HDD',
  shutterAntiFraude: 'Shutter Anti-Fraude',
  sistemaEntintado:  'Sistema Entintado',
  lectorOtro:        'Lector (otro)',
  impresoraOtro:     'Impresora (otro)',
  askTipo:           'ASK',
  tipoNose:          'Nose',
};

export const CELL = {
  padding: '10px 12px', fontSize: 13,
  color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)',
};
export const HEAD = {
  padding: '10px 12px', fontSize: 11, fontWeight: 700,
  color: 'var(--text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase',
  background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-default)',
  textAlign: 'left',
};
