import React from 'react';
import { Link } from 'react-router-dom';
import PdfView from '../components/PdfView.jsx';
import '../pdf-styles.css';
import { getSections, initDevicesFor, initVoltages } from '../constants/devices.js';

/* Genera una imagen placeholder SVG → data URL (simula foto real) */
function makePlaceholderPhoto(label, bg, fg = '#fff') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
    <rect width="200" height="200" fill="${bg}"/>
    <rect x="10" y="10" width="180" height="180" fill="none" stroke="${fg}" stroke-width="2" stroke-dasharray="6,4" opacity="0.5"/>
    <text x="100" y="85" text-anchor="middle" fill="${fg}" font-family="Arial" font-size="13" font-weight="bold">${label}</text>
    <text x="100" y="108" text-anchor="middle" fill="${fg}" font-family="Arial" font-size="10" opacity="0.7">📷 Evidencia</text>
    <text x="100" y="128" text-anchor="middle" fill="${fg}" font-family="Arial" font-size="9" opacity="0.5">Foto de muestra</text>
  </svg>`;
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

/* ── Datos de muestra para la vista previa ── */
const sections = getSections('multifuncion', 'Diebold');

// Generar dispositivos con estados de ejemplo
const rawDevices = initDevicesFor(sections);
const sampleDevices = Object.fromEntries(
  Object.entries(rawDevices).map(([key], i) => {
    const estados = ['Bueno', 'Bueno', 'Bueno', 'Regular', 'Bueno', 'No Aplica', 'Bueno', 'Bueno', 'Defectuoso', 'Bueno'];
    const est = estados[i % estados.length];
    return [key, { lim: i % 3 !== 0, pru: i % 4 !== 0, est, obs: est === 'Defectuoso' ? 'Requiere reemplazo' : est === 'Regular' ? 'Desgaste leve' : '' }];
  })
);

const voltages = initVoltages();
const sampleVoltages = {
  'Cable interno ATM':         { ln: '220', lt: '219', nt: '1', obs: 'Voltaje dentro del rango normal (±5%)' },
  'UPS':                       { ln: '218', lt: '220', nt: '2', obs: 'Voltaje dentro del rango normal (±5%)' },
  'Transformador Aislamiento': { ln: '221', lt: '220', nt: '0', obs: 'Voltaje dentro del rango normal (±5%)' },
  'Toma Eléctrica':            { ln: '235', lt: '234', nt: '1', obs: '⚠ Voltaje por encima del rango (>231V)' },
};

const sampleSite = {
  0: 'Bueno', 1: 'Bueno', 2: 'Regular', 3: 'Bueno',
  4: 'Bueno', 5: 'Bueno', 6: 'Bueno',   7: 'Regular',
};

const sampleForm = {
  fecha:    '2026-03-28',
  num:      'TEC-003',
  tec:      'Jorge Luis Mendoza',
  idAtm:    'BBVA-0003',
  marca:    'Diebold',
  modelo:   'Opteva 720',
  punto:    'BBVA La Molina',
  atmTipo:  'multifuncion',
  voltages: sampleVoltages,
  devices:  sampleDevices,
  site:     sampleSite,
  obsGen:   'Se realizó limpieza general del equipo, lubricación de módulos mecánicos y verificación eléctrica completa. Se detectó voltaje elevado en toma eléctrica.',
  res:      'ATM en condiciones operativas con observación en voltaje de toma eléctrica.',
  rec:      'Coordinar revisión eléctrica del tablero de distribución con personal de mantenimiento de la agencia.',
  estFinal: 'Operativo con observaciones',
};

const sampleFotosAntes = [
  { src: makePlaceholderPhoto('Interior cajero',      '#78350f'), name: 'interior-cajero.jpg' },
  { src: makePlaceholderPhoto('Módulo dispensador',   '#7c3aed'), name: 'modulo-dispensador.jpg' },
  { src: makePlaceholderPhoto('Lectora de tarjetas',  '#1e3a8a'), name: 'lectora.jpg' },
  { src: makePlaceholderPhoto('Teclado PIN',          '#065f46'), name: 'teclado-pin.jpg' },
  { src: makePlaceholderPhoto('Impresora tickets',    '#9f1239'), name: 'impresora.jpg' },
];

const sampleFotosDespues = [
  { src: makePlaceholderPhoto('Interior limpio',      '#14532d'), name: 'interior-limpio.jpg' },
  { src: makePlaceholderPhoto('Módulo revisado',      '#312e81'), name: 'modulo-revisado.jpg' },
  { src: makePlaceholderPhoto('Lectora limpia',       '#1e40af'), name: 'lectora-limpia.jpg' },
  { src: makePlaceholderPhoto('Teclado verificado',   '#064e3b'), name: 'teclado-verificado.jpg' },
  { src: makePlaceholderPhoto('Impresora calibrada',  '#881337'), name: 'impresora-calibrada.jpg' },
];

export default function PdfPreviewPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#475569', padding: '24px 0' }}>

      {/* Barra superior */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: '#1e293b', padding: '10px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
      }}>
        <div>
          <span style={{ color: '#60a5fa', fontWeight: 700, fontSize: 14 }}>Vista previa del PDF</span>
          <span style={{ color: '#64748b', fontSize: 12, marginLeft: 12 }}>
            Así se vería el archivo generado con jsPDF — sin encabezados del browser
          </span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ background: '#16a34a22', color: '#4ade80', border: '1px solid #16a34a', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
            ✓ Sin fecha del sistema
          </span>
          <span style={{ background: '#16a34a22', color: '#4ade80', border: '1px solid #16a34a', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
            ✓ Sin URL localhost
          </span>
          <span style={{ background: '#16a34a22', color: '#4ade80', border: '1px solid #16a34a', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
            ✓ Sin nº de página del browser
          </span>
          <Link to="/" style={{ background: '#334155', color: '#e2e8f0', borderRadius: 6, padding: '6px 14px', fontSize: 12, textDecoration: 'none', fontWeight: 600 }}>
            ← Volver
          </Link>
        </div>
      </div>

      {/* Página A4 simulada */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, paddingTop: 24, paddingBottom: 40 }}>

        {/* Páginas A4 simuladas — cada .pdf-page es una hoja separada */}
        <div className="pdf-scope" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <PdfView
            form={sampleForm}
            fotosAntes={sampleFotosAntes}
            fotosDespues={sampleFotosDespues}
            sections={sections}
          />
        </div>

        <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 8 }}>
          El PDF real usará los datos que el técnico ingresó en el formulario
        </p>
      </div>
    </div>
  );
}
