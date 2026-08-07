import React from 'react';

/* ══════════════════════════════════════════════════
   AuditPdfView — Plantilla PDF A4 (794 × 1123 px)
   Todo inline styles — html2canvas no carga CSS externo
══════════════════════════════════════════════════ */

const GOLD = '#F5A623';
const DARK = '#1A1A2E';
const BORD = '#999';
const FONT = 'Arial, sans-serif';
const FS = 12;   // +1 respecto a la versión anterior

/* ── Checkbox ── */
function CB({ checked }) {
  return (
    <span style={{
      display: 'inline-block', width: 12, height: 12, flexShrink: 0,
      border: `1.5px solid ${DARK}`, borderRadius: 2,
      background: checked ? DARK : '#fff',
      color: '#fff', fontSize: 9, textAlign: 'center', lineHeight: '11px',
      verticalAlign: 'middle',
    }}>
      {checked ? '✓' : ''}
    </span>
  );
}

function CBLabel({ checked, label }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginRight: 14, fontSize: FS }}>
      <CB checked={checked} />{label}
    </span>
  );
}

/* ── Valor subrayado ── */
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

/* ── Título de sección ── */
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

/* ── Fila de datos ── */
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

/* ── Separador de grupo en dispositivos ── */
function DevRow({ children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
      borderBottom: `1px solid #e8e8e8`,
      paddingTop: 6, paddingBottom: 7, marginBottom: 2,
    }}>
      {children}
    </div>
  );
}

/* ── Caja de firma ── */
function FirmaBox({ label }) {
  return (
    <div style={{
      flex: 1, border: `1px solid ${BORD}`, borderRadius: 4,
      padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ fontSize: FS - 1, fontWeight: 700, color: DARK, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
        {label}
      </div>
      {/* Espacio para firma */}
      <div style={{ borderBottom: `1px solid ${BORD}`, height: 36 }} />
      {/* Nombres y Apellidos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: FS - 2, color: '#888', marginBottom: 2 }}>Nombres y Apellidos</span>
        <div style={{ borderBottom: `1px solid ${BORD}`, height: 18 }} />
      </div>
      {/* DNI */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: FS - 1, color: '#555', whiteSpace: 'nowrap' }}>DNI :</span>
        <div style={{ flex: 1, borderBottom: `1px solid ${BORD}`, height: 18 }} />
      </div>
    </div>
  );
}

/* ── Pie de página ── */
function PdfFooter() {
  return (
    <div style={{ borderTop: `1px solid #ddd`, padding: '5px 18px', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 9, color: '#999' }}>Gestión Integral de Canales Electrónicos</span>
      <span style={{ fontSize: 9, color: '#999' }}>Generado el {new Date().toLocaleDateString('es-PE')}</span>
    </div>
  );
}

/* ── Encabezado común (todas las hojas) ── */
function PdfHeader() {
  return (
    <div style={{ width: 794, display: 'flex', alignItems: 'stretch', flexShrink: 0, background: GOLD, boxSizing: 'border-box' }}>
      <div style={{ padding: '8px 14px', width: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src="/logo.png" alt="Logo" style={{ maxWidth: 112, maxHeight: 52, objectFit: 'contain', background: '#fff', borderRadius: 4, padding: 2 }} />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 0' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: DARK, letterSpacing: 0.3 }}>GESTION INTEGRAL DE CANALES ELECTRONICOS</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: DARK, marginTop: 3 }}>CONSTANCIA DE RECEPCION DE EQUIPOS</div>
      </div>
      <div style={{ width: 140 }} />
    </div>
  );
}

/* ── Grid de fotos en PDF ── */
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
            style={{
              position: 'absolute', top: 0, left: 0,
              width: '100%', height: '100%',
              objectFit: 'contain',
            }} />
        </div>
      ))}
    </div>
  );
}

/* ── Bloque de dispositivo en PDF ── */
const ESTADO_CFG = {
  ok: { label: '✓ Dispositivo OK', color: '#16a34a', bg: '#f0fdf4' },
  mantenimiento: { label: '⚠ Requiere mantenimiento', color: '#d97706', bg: '#fffbeb' },
  repuesto: { label: '✕ Requiere cambio de repuestos', color: '#dc2626', bg: '#fef2f2' },
};

function PdfDeviceBlock({ label, obs, photos = [], estado }) {
  if (!obs && !photos.length && !estado) return null;
  const estadoInfo = ESTADO_CFG[estado];
  return (
    <div style={{ marginBottom: 10 }}>
      {/* Cabecera: nombre + badge de estado */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: `1px solid ${GOLD}`, paddingBottom: 3, marginBottom: 5 }}>
        <span style={{ fontWeight: 700, fontSize: FS, color: DARK }}>{label}</span>
        {estadoInfo && (
          <span style={{
            fontSize: FS - 2, fontWeight: 700, color: estadoInfo.color,
            background: estadoInfo.bg, padding: '2px 7px', borderRadius: 3,
            border: `1px solid ${estadoInfo.color}55`,
          }}>
            {estadoInfo.label}
          </span>
        )}
      </div>
      {/* Observaciones con borde visible solo si hay texto */}
      {obs && (
        <div style={{
          fontSize: FS - 1, color: '#333', marginBottom: 5,
          border: '1px solid #bbb', borderRadius: 3, padding: '3px 7px',
          background: '#fafafa',
        }}>
          {obs}
        </div>
      )}
      <PdfPhotoGrid photos={photos} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Constantes de paginación — padding 80px c/lado
   Ancho contenido: 794-160 = 634px
   Col foto: (634-10) / 3 = 208px  →  Alto foto: 208×0.75 = 156px
   Fila de fotos: 156 + 4px marginTop ≈ 160px
   Disponible: 1123 - 80(hdr) - 30(ftr) - 20(pad) = 993 → 920 seguro
   ───────────────────────────────────────────────────────────────── */
const PHOTO_ROW_H    = 160;  // 1 fila de 3 fotos (156px + 4px marginTop)
const BLOCK_HEADER_H = 26;   // nombre + badge estado + borde inferior + margen
const OBS_H          = 20;   // obs texto (1 línea)
const SEC_TITLE_H    = 32;   // SecTitle
const PAGE_BODY_H    = 920;  // espacio útil por hoja (conservador)

function estimateBlockH(estado, obs, photos = []) {
  if (!estado && !obs && !photos.length) return 0;
  const rows = Math.ceil(photos.length / 3);
  return BLOCK_HEADER_H + (obs ? OBS_H : 0) + rows * PHOTO_ROW_H + 10;
}

/* ── Distribuye bloques en páginas según su altura estimada ── */
function paginateBlocks(blocks) {
  const pages = [];
  let current = [];
  let usedH = SEC_TITLE_H;

  blocks.forEach(block => {
    if (!block.estado && !block.obs && !block.photos?.length) return;
    const h = estimateBlockH(block.estado, block.obs, block.photos);
    if (usedH + h > PAGE_BODY_H && current.length > 0) {
      pages.push(current);
      current = [];
      usedH = SEC_TITLE_H;
    }
    current.push(block);
    usedH += h;
  });

  if (current.length > 0) pages.push(current);
  return pages;
}

/* ══════════════════════════════════════════════════ */

export default function AuditPdfView({ form }) {
  const f = form;

  const th = { background: DARK, color: '#fff', fontSize: FS - 1, fontWeight: 700, padding: '6px 8px', textAlign: 'center', border: `1px solid ${BORD}`, letterSpacing: '0.3px' };
  const thL = { ...th, textAlign: 'left' };
  const td = { fontSize: FS, padding: '6px 8px', border: `1px solid ${BORD}`, color: '#222', verticalAlign: 'middle' };
  const tdc = { ...td, textAlign: 'center' };

  const PRUEBAS_ITEMS = [
    { key: 'consultaSaldos', label: 'Consulta de saldos con impresión de Voucher' },
    { key: 'retiroEfectivo', label: 'Retiro de efectivo con impresión de Voucher' },
    { key: 'depositoEfectivo', label: 'Depósito de efectivo con impresión de Voucher' },
  ];
  const SITE_ITEMS = [
    { key: 'camaras', label: '¿Cuenta con cámaras de vigilancia?' },
    { key: 'aireAcondicionado', label: '¿Cuenta con aire acondicionado?' },
    { key: 'iluminacion', label: '¿Cuenta con iluminación adecuada?' },
    { key: 'excesoPolvp', label: '¿Exceso de polvo en la zona?' },
  ];

  return (
    <div id="audit-pdf-area"
      style={{ position: 'absolute', left: -9999, top: 0, visibility: 'hidden', zIndex: -1, width: 794 }}>

      {/* ╔═ HOJA 1 ═╗ */}
      <div className="pdf-page" style={{ width: 794, height: 1123, background: '#fff', fontFamily: FONT, fontSize: FS, color: '#111', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <PdfHeader />

        {/* ══ CUERPO ══ */}
        <div style={{ flex: 1, padding: '10px 80px 10px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* ── DATOS ── */}
          <SecTitle title="DATOS" />


          <Row>
            <Lbl>Fecha</Lbl><Val value={f.fecha} flex={1} />
            <Lbl>Hora de Inicio</Lbl><Val value={f.horaInicio} flex={1} />
            <Lbl>Hora de Fin</Lbl><Val value={f.horaFin} flex={1} />
          </Row>
          <Row>
            <Lbl>Cliente</Lbl><Val value={f.cliente} flex={1} />
            <Lbl>ID ATM</Lbl>
            <span style={{ fontSize: FS, fontWeight: 700, borderBottom: `1px solid ${BORD}`, minWidth: 70, paddingBottom: 1, display: 'inline-block', flex: 1, textAlign: 'center' }}>
              {f.idAtm || '—'}
            </span>
          </Row>
          <Row>
            <Lbl>Punto / Agencia</Lbl><Val value={f.punto} flex={1} />
            <Lbl>Dirección</Lbl><Val value={f.direccion} flex={1.5} />
          </Row>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 4, marginBottom: 2 }}>
            <thead>
              <tr>{['Marca', 'Modelo', 'Nº de Serie'].map(h => <th key={h} style={thL}>{h}</th>)}</tr>
            </thead>
            <tbody>
              <tr>
                {[f.marcaEquipo, f.modeloEquipo, f.nroSerie].map((v, i) => (
                  <td key={i} style={td}>{v || ''}</td>
                ))}
              </tr>
            </tbody>
          </table>

          {/* ── VERIFICACIÓN ── */}
          <SecTitle title="CAMPOS DE VERIFICACION" />
          <Row mb={4}>
            <span style={{ fontSize: FS, fontWeight: 600 }}>¿Equipo en funcionamiento?</span>
            <CBLabel checked={f.equipoFuncionando === 'si'} label="Sí" />
            <CBLabel checked={f.equipoFuncionando === 'no'} label="No" />
            {f.equipoFuncionando === 'no' && f.equipoFuncionandoObs && (
              <span style={{ fontSize: FS, borderBottom: `1px solid ${BORD}`, flex: 1, textAlign: 'center' }}>{f.equipoFuncionandoObs}</span>
            )}
          </Row>

          {/* ── PRUEBAS EN LÍNEA ── */}
          <SecTitle title="PRUEBAS EN LINEA" />
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 5 }}>
            <thead>
              <tr>
                <th style={{ ...thL, width: '44%' }}></th>
                {['Sí', 'No', 'N.A.', 'Observaciones'].map(h => <th key={h} style={th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {PRUEBAS_ITEMS.map(({ key, label }) => (
                <tr key={key}>
                  <td style={td}>{label}</td>
                  {['si', 'no', 'na'].map(opt => (
                    <td key={opt} style={tdc}><CB checked={f.pruebas[key] === opt} /></td>
                  ))}
                  <td style={{ ...td, fontSize: FS - 1 }}>{(f.pruebasObs || {})[key] || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Row mb={4}>
            <span style={{ fontSize: FS, fontWeight: 600 }}>¿El resultado de las pruebas ha sido exitoso?</span>
            <CBLabel checked={f.pruebasExitosas === 'si'} label="Sí" />
            <CBLabel checked={f.pruebasExitosas === 'no'} label="No" />
          </Row>

          {/* ── INFORMACIÓN GENERAL ── */}
          <SecTitle title="INFORMACION GENERAL" />
          <Row>
            <Lbl>IP Equipo</Lbl><Val value={f.ipEquipo} minW={90} />
            <Lbl>Máscara</Lbl><Val value={f.mascaraRed} minW={90} />
            <Lbl>Gateway</Lbl><Val value={f.gateway} minW={90} />
          </Row>
          <Row>
            <Lbl>DNS 1</Lbl><Val value={f.dns1} minW={90} />
            <Lbl>DNS 2</Lbl><Val value={f.dns2} minW={90} />
          </Row>
          <Row>
            <Lbl>Sistema Operativo</Lbl><Val value={f.sistemaOperativo || 'Windows 10'} minW={100} />
            <Lbl>Software</Lbl><Val value={f.software} />
          </Row>
          <Row mb={4}>
            <span style={{ fontSize: FS, fontWeight: 600 }}>Cassettes (Denominaciones S/. o $) :</span>
            {(() => {
              const marca = (f.marcaEquipo || '').toLowerCase();
              const is4 = ['ncr', 'grg', 'hyosung'].some(m => marca.includes(m));
              const count = is4 ? 4 : 5;
              return Array.from({ length: count }, (_, i) => i + 1).map(n => (
                <span key={n} style={{ display: 'inline-flex', alignItems: 'baseline', gap: 3, fontSize: FS }}>
                  C{n}:
                  <span style={{ borderBottom: `1px solid ${BORD}`, minWidth: 46, display: 'inline-block', paddingBottom: 1, textAlign: 'center' }}>
                    {(f.cassettes || {})[`c${n}`] || ''}
                  </span>
                </span>
              ));
            })()}
          </Row>

          {/* ── DATOS DE DISPOSITIVOS ── */}
          <SecTitle title="DATOS DE DISPOSITIVOS" />

          <DevRow>
            <span style={{ fontSize: FS, fontWeight: 600, minWidth: 130 }}>Lector de Tarjetas :</span>
            {[['sankio', 'Sankio'], ['hitachi', 'Hitachi'], ['otro', 'Otro']].map(([v, l]) => (
              <CBLabel key={v} checked={f.lectorTarjetas === v}
                label={v === 'otro' && f.lectorOtro ? `Otro: ${f.lectorOtro}` : l} />
            ))}
            <span style={{ marginLeft: 'auto', display: 'flex' }}>
              <CBLabel checked={f.askTipo === 'integrado'} label="ASK Integrado" />
              <CBLabel checked={f.askTipo === 'externo'} label="ASK Externo" />
            </span>
          </DevRow>

          <DevRow>
            <span style={{ fontSize: FS, fontWeight: 600, minWidth: 130 }}>Impresora Recibos :</span>
            {[['toshiba', 'Toshiba'], ['epson', 'Epson'], ['otro', 'Otro']].map(([v, l]) => (
              <CBLabel key={v} checked={f.impresoraRecibos === v}
                label={v === 'otro' && f.impresoraOtro ? `Otro: ${f.impresoraOtro}` : l} />
            ))}
          </DevRow>

          <DevRow>
            <span style={{ fontSize: FS, fontWeight: 600, minWidth: 130 }}>Teclado EPP :</span>
            {[['v2', 'V2'], ['v3', 'V3'], ['v4', 'V4'], ['v5', 'V5'], ['v7bsc', 'V7 BSC'], ['v7pci', 'V7 PCI']].map(([v, l]) => (
              <CBLabel key={v} checked={f.tecladoEPP === v} label={l} />
            ))}
          </DevRow>

          <DevRow>
            <span style={{ fontSize: FS, fontWeight: 600, minWidth: 130 }}>CPU :</span>
            {[['misano', 'Misano'], ['canyon', 'Canyon'], ['estoril', 'Estoril'], ['voyaguer', 'Voyaguer'], ['otro', 'Otro']].map(([v, l]) => (
              <CBLabel key={v} checked={f.cpu === v}
                label={v === 'otro' && f.cpuOtro ? `Otro: ${f.cpuOtro}` : l} />
            ))}
          </DevRow>

          <DevRow>
            <span style={{ fontSize: FS, fontWeight: 600, minWidth: 130 }}>Pantalla :</span>
            <CBLabel checked={f.pantalla === 'touch'} label="Touch" />
            <CBLabel checked={f.pantalla === 'teclado'} label="Teclado" />
            <span style={{ marginLeft: 16, display: 'inline-flex', alignItems: 'baseline', gap: 5 }}>
              <span style={{ fontSize: FS, fontWeight: 600 }}>Memoria RAM :</span>
              <Val value={f.memoriaRAM ? f.memoriaRAM + ' GB' : ''} minW={50} />
            </span>
            <span style={{ marginLeft: 12, display: 'inline-flex', alignItems: 'baseline', gap: 5 }}>
              <span style={{ fontSize: FS, fontWeight: 600 }}>SSD :</span>
              <Val value={f.capacidadSSD ? f.capacidadSSD + ' GB' : ''} minW={50} />
            </span>
          </DevRow>

          <DevRow>
            <span style={{ fontSize: FS }}>¿Dispensador con Shutter Anti-Fraude?</span>
            <CBLabel checked={f.shutterAntiFraude === 'si'} label="Sí" />
            <CBLabel checked={f.shutterAntiFraude === 'no'} label="No" />
            <span style={{ marginLeft: 14, fontSize: FS }}>¿Sistema de entintado?</span>
            <CBLabel checked={f.sistemaEntintado === 'si'} label="Sí" />
            <CBLabel checked={f.sistemaEntintado === 'no'} label="No" />
          </DevRow>

          {(() => {
            const marcaL  = (f.marcaEquipo || '').toLowerCase();
            const modeloL = (f.modeloEquipo || '').toLowerCase();
            const isNcr   = marcaL.includes('ncr');
            if (isNcr && (modeloL.includes('ss23') || modeloL.includes('ss27'))) return (
              <DevRow>
                <span style={{ fontSize: FS, fontWeight: 600, minWidth: 130 }}>Tipo de Nose :</span>
                <CBLabel checked={f.tipoNose === 'short'} label="Short" />
                <CBLabel checked={f.tipoNose === 'middle'} label="Middle" />
                <CBLabel checked={f.tipoNose === 'long'} label="Long" />
              </DevRow>
            );
            if (isNcr && (modeloL.includes('ss22') || modeloL.includes('ss26'))) return (
              <DevRow>
                <span style={{ fontSize: FS, fontWeight: 600, minWidth: 130 }}>Tipo de Presentador :</span>
                <CBLabel checked={f.tipoPresentador === 'canon_corto'} label="Cañón Corto" />
                <CBLabel checked={f.tipoPresentador === 'canon_largo'} label="Cañón Largo" />
              </DevRow>
            );
            return null;
          })()}

          {/* ── ESTADO DEL SITE ── */}
          <SecTitle title="ESTADO DEL SITE" />
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8 }}>
            <thead>
              <tr>
                <th style={{ ...thL, width: '52%' }}></th>
                {['Sí', 'No', 'Observaciones'].map(h => <th key={h} style={th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {SITE_ITEMS.map(({ key, label }) => (
                <tr key={key}>
                  <td style={td}>{label}</td>
                  {['si', 'no'].map(opt => (
                    <td key={opt} style={tdc}><CB checked={(f.site || {})[key] === opt} /></td>
                  ))}
                  <td style={{ ...td, fontSize: FS - 1 }}>{(f.siteObs || {})[key] || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>



        </div>{/* fin cuerpo */}
        <PdfFooter />
      </div>{/* fin hoja 1 */}

      {/* ╔═ HOJAS DINÁMICAS: Voltajes + Evidencias de Dispositivos ═╗ */}
      {(() => {
        // — 1. Lista de bloques de dispositivos con datos —
        const marca = (f.marcaEquipo || '').toLowerCase();
        const tipoAtm = (f.tipoAtm || '').toLowerCase();
        const isDeposito = tipoAtm === 'deposito';
        const isMulti = tipoAtm === 'multifuncion';

        // Cassettes: 4 para NCR/GRG/Hyosung, 5 para Diebold/otros
        const is4Cas = ['ncr', 'grg', 'hyosung'].some(m => marca.includes(m));
        const casCount = is4Cas ? 4 : 5;
        const CASSETTES_DEV = Array.from({ length: casCount }, (_, i) => ({
          key: `cassette${i + 1}`, label: `Cassette ${i + 1}`,
        }));

        const esOficina = (f.punto || '').toLowerCase().includes('oficina');
        const ALL_DEVICES = [
          { key: 'fasciaPanel', label: 'Fascia y Pantalla' },
          !esOficina && { key: 'gabineteCom', label: 'Gabinete de Comunicación' },
          !isDeposito && { key: 'dispensador', label: 'Dispensador' },
          (isDeposito || isMulti) && { key: 'aceptador', label: 'Aceptador' },
          ...CASSETTES_DEV,
          { key: 'shutter', label: 'Shutter' },
          { key: 'lectora', label: 'Lectora' },
          { key: 'impresora', label: 'Impresora' },
          { key: 'epp', label: 'EPP (Teclado)' },
          { key: 'cpu', label: 'CPU' },
          { key: 'powerSupply', label: 'Power Supply' },
          { key: 'miscelaneos', label: 'Misceláneos' },
          { key: 'cableado', label: 'Cableado' },
        ].filter(Boolean);

        const deviceBlocks = ALL_DEVICES
          .map(({ key, label }) => ({
            label,
            estado: f.devFotos?.[key]?.estado || '',
            obs: f.devFotos?.[key]?.obs || '',
            photos: f.devFotos?.[key]?.photos || [],
          }))
          .filter(b => b.estado || b.obs || b.photos.length);

        // — 2. Construir la primera hoja (Voltajes) —
        const VOLT_SECTION_H =
          SEC_TITLE_H +          // título VOLTAJES
          70 +                   // tabla 2 filas (con FS=12 más alto)
          36 +                   // obs banner
          (f.voltajesPhotos?.length > 0
            ? SEC_TITLE_H + Math.ceil(f.voltajesPhotos.length / 3) * PHOTO_ROW_H
            : 0);
        // Espacio disponible en hoja 2 después de la sección de voltajes
        const availableInPage2 = PAGE_BODY_H - VOLT_SECTION_H - SEC_TITLE_H;

        // Tomar los bloques que caben en la misma hoja de voltajes
        const page2DevBlocks = [];
        let page2Used = 0;
        const remaining = [...deviceBlocks];
        while (remaining.length > 0) {
          const h = estimateBlockH(remaining[0].estado, remaining[0].obs, remaining[0].photos);
          if (page2Used + h > availableInPage2) break;
          page2DevBlocks.push(remaining.shift());
          page2Used += h;
        }

        // — 3. Paginar el resto dinámicamente —
        const extraPages = paginateBlocks(remaining);

        // — 4. Última página tiene Observaciones Generales —
        // Se añade al final de la última página de dispositivos (o en solitario)
        const hasObs = !!f.obsGenerales;
        const obsBlock = hasObs ? (
          <>
            <SecTitle title="OBSERVACIONES GENERALES" />
            <div style={{ fontSize: FS, color: '#222', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{f.obsGenerales}</div>
          </>
        ) : null;

        const PAGE_STYLE = { width: 794, minHeight: 1123, background: '#fff', fontFamily: FONT, fontSize: FS, color: '#111', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' };
        const BODY_STYLE = { flex: 1, padding: '10px 80px', display: 'flex', flexDirection: 'column' };

        return (
          <>
            {/* Hoja 2: Voltajes + primeros dispositivos */}
            <div className="pdf-page" style={PAGE_STYLE}>
              <PdfHeader />
              <div style={BODY_STYLE}>
                <SecTitle title="VOLTAJES" />
                {(() => {
                  const V_MIN = 220 * 0.95, V_MAX = 220 * 1.05, NT_MAX = 5;
                  function parseV(val) {
                    if (val === '' || val === null || val === undefined) return null;
                    const v = parseFloat(String(val).replace(',', '.'));
                    return isNaN(v) ? null : v;
                  }
                  function esSinAcceso(lt, ln, nt) {
                    return parseV(lt) === 0 && parseV(ln) === 0 && parseV(nt) === 0;
                  }
                  function vSt(val, isTierra, sinAcceso) {
                    const v = parseFloat(String(val || '').replace(',', '.'));
                    if (!val || isNaN(v)) return null;
                    if (sinAcceso) return 'sinacceso';
                    if (isTierra) return v >= NT_MAX ? 'tierra' : 'ok';
                    return (v >= V_MIN && v <= V_MAX) ? 'ok' : 'fuera';
                  }
                  function eqSt(lt, ln, nt) {
                    if (esSinAcceso(lt, ln, nt)) return 'sinacceso';
                    const slt = vSt(lt); const sln = vSt(ln); const snt = vSt(nt, true);
                    if (slt === 'fuera' || sln === 'fuera') return 'fuera';
                    if (snt === 'tierra') return 'tierra';
                    if (slt === 'ok' || sln === 'ok' || snt === 'ok') return 'ok';
                    return null;
                  }
                  const SCOL = { ok: '#16a34a', fuera: '#dc2626', tierra: '#d97706', sinacceso: '#64748b' };
                  const SLBL = { ok: 'OK', fuera: 'FUERA DE RANGO', tierra: 'TIERRA DEFICIENTE', sinacceso: 'SIN ACCESO' };
                  const rows = [
                    { label: 'ATM', lt: f.voltajes?.atmLT, ln: f.voltajes?.atmLN, nt: f.voltajes?.atmNT },
                    { label: 'UPS', lt: f.voltajes?.upsLT, ln: f.voltajes?.upsLN, nt: f.voltajes?.upsNT },
                  ];
                  const atmSt = eqSt(f.voltajes?.atmLT, f.voltajes?.atmLN, f.voltajes?.atmNT);
                  const upsSt = eqSt(f.voltajes?.upsLT, f.voltajes?.upsLN, f.voltajes?.upsNT);
                  const hasIssue = atmSt === 'fuera' || atmSt === 'tierra' || upsSt === 'fuera' || upsSt === 'tierra';
                  const sinAccesoAlgo = atmSt === 'sinacceso' || upsSt === 'sinacceso';
                  const anyFilled = [f.voltajes?.atmLT, f.voltajes?.atmLN, f.voltajes?.atmNT,
                  f.voltajes?.upsLT, f.voltajes?.upsLN, f.voltajes?.upsNT].some(v => v);
                  const obsText = !anyFilled ? '' : hasIssue ? 'Voltajes incorrectos, reportar al proveedor' : sinAccesoAlgo ? 'Sin acceso a la medición de voltajes' : 'Voltajes correctos';
                  return (
                    <>
                      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 6 }}>
                        <thead>
                          <tr>
                            <th style={{ background: DARK, color: '#fff', fontSize: FS - 1, fontWeight: 700, padding: '5px 8px', textAlign: 'left', border: `1px solid ${BORD}`, width: '15%' }}></th>
                            {['L–T (V)', 'L–N (V)', 'N–T / Tierra (V)', 'Estado'].map(h => (
                              <th key={h} style={{ background: DARK, color: '#fff', fontSize: FS - 1, fontWeight: 700, padding: '5px 8px', textAlign: 'center', border: `1px solid ${BORD}` }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map(({ label, lt, ln, nt }) => {
                            const st = eqSt(lt, ln, nt);
                            const sinAcceso = esSinAcceso(lt, ln, nt);
                            const ntSt = vSt(nt, true, sinAcceso);
                            return (
                              <tr key={label}>
                                <td style={{ fontSize: FS, padding: '5px 8px', border: `1px solid ${BORD}`, fontWeight: 700 }}>{label}</td>
                                <td style={{ fontSize: FS, padding: '5px 8px', border: `1px solid ${BORD}`, textAlign: 'center', color: vSt(lt, false, sinAcceso) === 'fuera' ? '#dc2626' : '#222' }}>{lt || '—'}</td>
                                <td style={{ fontSize: FS, padding: '5px 8px', border: `1px solid ${BORD}`, textAlign: 'center', color: vSt(ln, false, sinAcceso) === 'fuera' ? '#dc2626' : '#222' }}>{ln || '—'}</td>
                                <td style={{ fontSize: FS, padding: '5px 8px', border: `1px solid ${BORD}`, textAlign: 'center', color: ntSt === 'tierra' ? '#d97706' : '#222' }}>{nt || '—'}{ntSt === 'tierra' ? ' ⚠' : ''}</td>
                                <td style={{ fontSize: FS, padding: '5px 8px', border: `1px solid ${BORD}`, textAlign: 'center', fontWeight: 700, color: st ? SCOL[st] : '#999' }}>{st ? SLBL[st] : '—'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      {obsText && (
                        <div style={{ fontSize: FS, fontWeight: 700, padding: '5px 10px', borderRadius: 4, marginBottom: 6, background: hasIssue ? '#fef2f2' : sinAccesoAlgo ? '#f1f5f9' : '#f0fdf4', border: `1px solid ${hasIssue ? '#fca5a5' : sinAccesoAlgo ? '#cbd5e1' : '#86efac'}`, color: hasIssue ? '#dc2626' : sinAccesoAlgo ? '#64748b' : '#16a34a' }}>
                          Observaciones: {obsText}
                        </div>
                      )}
                    </>
                  );
                })()}
                {f.voltajesPhotos?.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: FS - 1, fontWeight: 600, color: '#555', marginBottom: 4 }}>Evidencia fotográfica de voltaje:</div>
                    <PdfPhotoGrid photos={f.voltajesPhotos} />
                  </div>
                )}
                {/* Dispositivos que caben en esta hoja */}
                {page2DevBlocks.length > 0 && (
                  <>
                    <SecTitle title="EVIDENCIAS DE DISPOSITIVOS" />
                    {page2DevBlocks.map(b => <PdfDeviceBlock key={b.label} {...b} />)}
                  </>
                )}
                {/* Si no hay más páginas de dispositivos, obs generales aquí */}
                {extraPages.length === 0 && obsBlock}
              </div>
              <PdfFooter />
            </div>

            {/* Hojas dinámicas adicionales de dispositivos */}
            {extraPages.map((blocks, idx) => (
              <div key={idx} className="pdf-page" style={PAGE_STYLE}>
                <PdfHeader />
                <div style={BODY_STYLE}>
                  <SecTitle title={idx === 0 && page2DevBlocks.length === 0 ? 'EVIDENCIAS DE DISPOSITIVOS' : 'EVIDENCIAS DE DISPOSITIVOS (cont.)'} />
                  {blocks.map(b => <PdfDeviceBlock key={b.label} {...b} />)}
                  {/* Obs generales en la última hoja */}
                  {idx === extraPages.length - 1 && obsBlock}
                </div>
                <PdfFooter />
              </div>
            ))}
          </>
        );
      })()}

    </div>
  );
}
