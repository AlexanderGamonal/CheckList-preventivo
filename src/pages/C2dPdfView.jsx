import React from 'react';
import { C2D_COMPONENT_LABELS, C2D_ESTADO_LABELS, computeVoltajesFueraDeRango } from '../services/c2dService.js';
import { VOLT_MIN, VOLT_MAX, NT_MAX, voltEstadoCampo } from '../constants/voltages.js';

/* ══════════════════════════════════════════════════
   C2dPdfView — Plantilla PDF A4 (794 × 1123 px)
   Todo inline styles — html2canvas no carga CSS externo
══════════════════════════════════════════════════ */

const GOLD = '#F5A623';
const DARK = '#1A1A2E';
const BORD = '#999';
const FONT = 'Arial, sans-serif';
const FS = 12;

const ESTADO_CFG = {
  operativo:   { label: '✅ Operativo',       color: '#16a34a', bg: '#f0fdf4' },
  observacion: { label: '⚠ Observación',      color: '#d97706', bg: '#fffbeb' },
  malo:        { label: '❌ Malo / Falla',    color: '#dc2626', bg: '#fef2f2' },
};

function Val({ value, flex = 1, minW = 50 }) {
  return (
    <span style={{
      flex, borderBottom: `1px solid ${BORD}`, fontSize: FS,
      paddingBottom: 1, minWidth: minW, display: 'inline-block',
      color: value ? '#111' : '#ccc', textAlign: 'center',
    }}>
      {value || '—'}
    </span>
  );
}

function SecTitle({ title }) {
  return (
    <div style={{
      fontWeight: 700, fontSize: FS + 1, color: DARK, letterSpacing: '0.5px',
      borderBottom: `2px solid ${GOLD}`, paddingBottom: 3,
      marginBottom: 8, marginTop: 14,
    }}>
      {title}
    </div>
  );
}

function Row({ children, mb = 7 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: mb, flexWrap: 'wrap' }}>
      {children}
    </div>
  );
}

function Lbl({ children }) {
  return <span style={{ fontSize: FS, whiteSpace: 'nowrap', color: '#444' }}>{children} :</span>;
}

function FirmaBox({ label }) {
  return (
    <div style={{
      flex: 1, border: `1px solid ${BORD}`, borderRadius: 4,
      padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ fontSize: FS - 1, fontWeight: 700, color: DARK, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
        {label}
      </div>
      <div style={{ borderBottom: `1px solid ${BORD}`, height: 36 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: FS - 2, color: '#888', marginBottom: 2 }}>Nombres y Apellidos</span>
        <div style={{ borderBottom: `1px solid ${BORD}`, height: 18 }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: FS - 1, color: '#555', whiteSpace: 'nowrap' }}>DNI :</span>
        <div style={{ flex: 1, borderBottom: `1px solid ${BORD}`, height: 18 }} />
      </div>
    </div>
  );
}

function PdfFooter() {
  return (
    <div style={{ borderTop: `1px solid #ddd`, padding: '5px 18px', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 9, color: '#999' }}>Check List MP Cash Today (C2D)</span>
      <span style={{ fontSize: 9, color: '#999' }}>Generado el {new Date().toLocaleDateString('es-PE')}</span>
    </div>
  );
}

function PdfHeader() {
  return (
    <div style={{ width: 794, display: 'flex', alignItems: 'stretch', flexShrink: 0, background: GOLD, boxSizing: 'border-box' }}>
      <div style={{ padding: '8px 14px', width: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src="/logo.png" alt="Logo" style={{ maxWidth: 112, maxHeight: 52, objectFit: 'contain', background: '#fff', borderRadius: 4, padding: 2 }} />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 0' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: DARK, letterSpacing: 0.3 }}>GESTION INTEGRAL DE CANALES ELECTRONICOS</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: DARK, marginTop: 3 }}>CHECK LIST MANTENIMIENTO PREVENTIVO — CASH TODAY (C2D)</div>
      </div>
      <div style={{ width: 140 }} />
    </div>
  );
}

function PdfPhotoGrid({ photos = [] }) {
  if (!photos.length) return null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 5, marginTop: 4 }}>
      {photos.map((src, i) => (
        <div key={i} style={{
          position: 'relative', width: '100%', paddingTop: '75%',
          borderRadius: 3, overflow: 'hidden', border: `1px solid ${BORD}`,
          background: '#f0f0f0',
        }}>
          <img src={src} alt={`f${i + 1}`}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
      ))}
    </div>
  );
}

function EstadoBadge({ estado }) {
  const info = ESTADO_CFG[estado];
  if (!info) return null;
  return (
    <span style={{
      fontSize: FS - 1, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
      background: info.bg, color: info.color, border: `1px solid ${info.color}`,
    }}>
      {info.label}
    </span>
  );
}

function VoltRow({ label, values, showStar }) {
  const { lt, ln, nt } = values || {};
  const stLT = voltEstadoCampo('lt', lt);
  const stLN = voltEstadoCampo('ln', ln);
  const stNT = voltEstadoCampo('nt', nt);
  const color = st => st === 'err' ? '#dc2626' : st === 'ok' ? '#16a34a' : '#666';
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 4, alignItems: 'baseline' }}>
      <span style={{ fontSize: FS, fontWeight: 600, color: DARK, minWidth: 150 }}>
        {label} {showStar && <span style={{ color: '#dc2626' }}>*</span>}
      </span>
      <span style={{ fontSize: FS, color: color(stLT) }}>L-T: {lt || '—'} V</span>
      <span style={{ fontSize: FS, color: color(stLN) }}>L-N: {ln || '—'} V</span>
      <span style={{ fontSize: FS, color: color(stNT) }}>N-T: {nt || '—'} V</span>
    </div>
  );
}

function ComponentBlock({ keyId, label, dev, showPhotos }) {
  const hasContent = dev.estado || dev.obs || (dev.fotosAntes?.length ?? 0) > 0 || (dev.fotosDespues?.length ?? 0) > 0;
  if (!hasContent) return null;
  return (
    <div style={{ marginBottom: 10, breakInside: 'avoid' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: `1px solid ${GOLD}`, paddingBottom: 3, marginBottom: 5 }}>
        <span style={{ fontWeight: 700, fontSize: FS, color: DARK }}>{label}</span>
        <EstadoBadge estado={dev.estado} />
      </div>
      {dev.obs && (
        <div style={{ fontSize: FS, color: '#333', marginBottom: 5, fontStyle: 'italic' }}>
          Obs.: {dev.obs}
        </div>
      )}
      {showPhotos && dev.fotosAntes?.length > 0 && (
        <>
          <div style={{ fontSize: FS - 1, fontWeight: 700, color: '#555', marginTop: 5 }}>ANTES</div>
          <PdfPhotoGrid photos={dev.fotosAntes} />
        </>
      )}
      {showPhotos && dev.fotosDespues?.length > 0 && (
        <>
          <div style={{ fontSize: FS - 1, fontWeight: 700, color: '#555', marginTop: 5 }}>DESPUÉS</div>
          <PdfPhotoGrid photos={dev.fotosDespues} />
        </>
      )}
    </div>
  );
}

export default function C2dPdfView({ form }) {
  const componentKeys = ['cashToday', 'validador', 'mecanismos', 'tomasElectricas', 'gabinete', 'routerTeldat'];
  const showCashControl = form.tieneCashControl === 'si';
  const allKeys = showCashControl ? [...componentKeys, 'cashControl'] : componentKeys;
  const voltFueraDeRango = computeVoltajesFueraDeRango(form.voltajes);

  return (
    <div id="c2d-pdf-area" style={{
      position: 'fixed', top: -99999, left: -99999,
      width: 794, background: '#fff', color: DARK, fontFamily: FONT,
    }}>

      {/* ── Página 1: Datos + Voltajes + Resumen componentes ── */}
      <div className="pdf-page" style={{
        width: 794, height: 1123, background: '#fff', color: DARK, fontFamily: FONT,
        display: 'flex', flexDirection: 'column',
      }}>
        <PdfHeader />

        <div style={{ flex: 1, padding: '14px 22px', overflow: 'hidden' }}>
          <SecTitle title="1 · Datos generales" />
          <Row><Lbl>Fecha</Lbl><Val value={form.fecha} minW={90} /><Lbl>Hora Inicio</Lbl><Val value={form.horaInicio} minW={60} /><Lbl>Hora Fin</Lbl><Val value={form.horaFin} minW={60} /></Row>
          <Row><Lbl>ID ATM</Lbl><Val value={form.idAtm} minW={110} /><Lbl>Punto</Lbl><Val value={form.punto} flex={2} /></Row>
          <Row><Lbl>N° Serie</Lbl><Val value={form.nroSerie} /><Lbl>Marca</Lbl><Val value={form.marcaEquipo} /><Lbl>Modelo</Lbl><Val value={form.modeloEquipo} /></Row>
          <Row><Lbl>Técnico responsable</Lbl><Val value={form.tecnicoNombre} flex={2} /><Lbl>N° Interno</Lbl><Val value={form.tecnicoNum} minW={80} /></Row>
          <Row><Lbl>Cash Control instalado</Lbl><Val value={form.tieneCashControl === 'si' ? 'Sí' : form.tieneCashControl === 'no' ? 'No' : '—'} minW={40} /></Row>

          <SecTitle title="2 · Voltajes" />
          <VoltRow label="Equipo"        values={form.voltajes.equipo}        showStar />
          <VoltRow label="UPS"           values={form.voltajes.ups} />
          <VoltRow label="Transformador" values={form.voltajes.transformador} />
          <div style={{
            marginTop: 6, padding: '5px 8px', borderRadius: 4, fontSize: FS - 1, fontWeight: 700,
            background: voltFueraDeRango ? '#fef2f2' : '#f0fdf4',
            color:      voltFueraDeRango ? '#dc2626' : '#16a34a',
            border: `1px solid ${voltFueraDeRango ? '#dc2626' : '#16a34a'}`,
          }}>
            {voltFueraDeRango
              ? '⚠ Medidas fuera de rango — ver evidencia fotográfica en la página siguiente'
              : `✓ Voltajes dentro del rango (${VOLT_MIN}–${VOLT_MAX} V; N-T ≤ ${NT_MAX} V)`}
          </div>

          <SecTitle title="3 · Resumen de componentes evaluados" />
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: FS }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '4px 6px', borderBottom: `1px solid ${BORD}`, fontSize: FS - 1, color: '#666' }}>Componente</th>
                <th style={{ textAlign: 'left', padding: '4px 6px', borderBottom: `1px solid ${BORD}`, fontSize: FS - 1, color: '#666' }}>Estado</th>
                <th style={{ textAlign: 'left', padding: '4px 6px', borderBottom: `1px solid ${BORD}`, fontSize: FS - 1, color: '#666' }}>Fotos A/D</th>
                <th style={{ textAlign: 'left', padding: '4px 6px', borderBottom: `1px solid ${BORD}`, fontSize: FS - 1, color: '#666' }}>Observación</th>
              </tr>
            </thead>
            <tbody>
              {allKeys.map(k => {
                const dev = form.devFotos[k];
                const info = ESTADO_CFG[dev.estado];
                return (
                  <tr key={k}>
                    <td style={{ padding: '4px 6px', borderBottom: '1px solid #eee' }}>{C2D_COMPONENT_LABELS[k]}</td>
                    <td style={{ padding: '4px 6px', borderBottom: '1px solid #eee', color: info?.color || '#999' }}>{info?.label || '—'}</td>
                    <td style={{ padding: '4px 6px', borderBottom: '1px solid #eee', fontFamily: 'monospace' }}>
                      {(dev.fotosAntes?.length ?? 0)}/{(dev.fotosDespues?.length ?? 0)}
                    </td>
                    <td style={{ padding: '4px 6px', borderBottom: '1px solid #eee', color: '#333' }}>{dev.obs || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <SecTitle title="4 · Observaciones generales" />
          <div style={{ fontSize: FS, color: '#111', lineHeight: 1.5, whiteSpace: 'pre-wrap', minHeight: 40, border: '1px solid #ddd', borderRadius: 4, padding: '6px 10px', background: '#fafafa' }}>
            {form.obsGenerales || '—'}
          </div>
        </div>

        <PdfFooter />
      </div>

      {/* ── Página 2: Evidencias fotográficas (voltajes + componentes) ── */}
      <div className="pdf-page" style={{
        width: 794, minHeight: 1123, background: '#fff', color: DARK, fontFamily: FONT,
        display: 'flex', flexDirection: 'column',
      }}>
        <PdfHeader />

        <div style={{ flex: 1, padding: '14px 22px' }}>
          {voltFueraDeRango && form.voltajesPhotos?.length > 0 && (
            <>
              <SecTitle title="Evidencia — Voltajes fuera de rango" />
              <PdfPhotoGrid photos={form.voltajesPhotos} />
            </>
          )}

          <SecTitle title="Evidencia fotográfica por componente" />
          {allKeys.map(k => (
            <ComponentBlock key={k} keyId={k} label={C2D_COMPONENT_LABELS[k]} dev={form.devFotos[k]} showPhotos />
          ))}

          <SecTitle title="Firmas" />
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <FirmaBox label="Técnico responsable" />
            <FirmaBox label="Encargado del punto" />
          </div>
        </div>

        <PdfFooter />
      </div>
    </div>
  );
}
