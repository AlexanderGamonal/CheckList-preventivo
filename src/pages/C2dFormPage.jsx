import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme.js';
import TecnicoNumInput from '../components/TecnicoNumInput.jsx';
import Toast from '../components/Toast.jsx';
import { useIsMobile } from '../hooks/useIsMobile.js';
import { saveC2d, computeVoltajesFueraDeRango } from '../services/c2dService.js';
import { sendC2dEmail } from '../services/emailService.js';
import C2dPdfView from './C2dPdfView.jsx';
import PhotoUploader from '../components/PhotoUploader.jsx';
import { VOLT_MIN, VOLT_MAX, NT_MAX, voltEstadoCampo } from '../constants/voltages.js';

const DRAFT_KEY = 'c2d_draft';

const PHOTOS_MIN = 1;
const PHOTOS_MAX = 3;
const VOLT_PHOTOS_MIN = 1;
const VOLT_PHOTOS_MAX = 4;

const DEVICE_KEYS = ['cashToday', 'validador', 'mecanismos', 'gabinete', 'routerTeldat'];
const DEVICE_LABELS = {
  cashToday:    'Cash Today (equipo general)',
  validador:    'Validador',
  mecanismos:   'Mecanismos y sensores',
  gabinete:     'Gabinete',
  routerTeldat: 'Router y Teldat',
  cashControl:  'Cash Control',
};

const VOLT_BLOCKS = [
  { key: 'equipo',        label: 'Equipo (obligatorio)', obligatorio: true  },
  { key: 'ups',           label: 'UPS (opcional)',        obligatorio: false },
  { key: 'transformador', label: 'Transformador de Aislamiento (opcional)', obligatorio: false },
];

const SITE_ITEMS = [
  { key: 'camaras',           label: '¿Cámaras de vigilancia?' },
  { key: 'aireAcondicionado', label: '¿Aire acondicionado?' },
  { key: 'iluminacion',       label: '¿Iluminación?' },
  { key: 'excesoPolvo',       label: '¿Exceso de polvo?' },
];

const PRUEBAS_ITEMS = [
  { key: 'depositoBilletes', label: 'Depósito de billetes' },
  { key: 'depositoMonedas',  label: 'Depósito de monedas' },
  { key: 'voucher',          label: 'Impresión de voucher' },
];

export const INITIAL = {
  fecha: '',
  horaInicio: '',
  horaFin: '',
  // Técnico
  tecnicoId: null,
  tecnicoNum: '',
  tecnicoNombre: '',
  // Identificación C2D (manual — sin lookup a BD)
  idAtm: '',
  punto: '',
  nroSerie: '',
  marcaEquipo: '',
  modeloEquipo: '',
  // Cash Control condicional
  tieneCashControl: '', // '' | 'si' | 'no'
  // Site
  site:    { camaras: '', aireAcondicionado: '', iluminacion: '', excesoPolvo: '' },
  siteObs: { camaras: '', aireAcondicionado: '', iluminacion: '', excesoPolvo: '' },
  // Pruebas de depósito
  pruebas:    { depositoBilletes: '', depositoMonedas: '', voucher: '' },
  pruebasObs: { depositoBilletes: '', depositoMonedas: '', voucher: '' },
  // Voltajes
  voltajes: {
    equipo:        { ln: '', lt: '', nt: '' },
    ups:           { ln: '', lt: '', nt: '' },
    transformador: { ln: '', lt: '', nt: '' },
  },
  voltajesPhotos: [],
  // Dispositivos con antes/después
  devFotos: {
    cashToday:    { estado: '', obs: '', fotosAntes: [], fotosDespues: [] },
    validador:    { estado: '', obs: '', fotosAntes: [], fotosDespues: [] },
    mecanismos:   { estado: '', obs: '', fotosAntes: [], fotosDespues: [] },
    gabinete:     { estado: '', obs: '', fotosAntes: [], fotosDespues: [] },
    routerTeldat: { estado: '', obs: '', fotosAntes: [], fotosDespues: [] },
    cashControl:  { estado: '', obs: '', fotosAntes: [], fotosDespues: [] },
  },
  obsGenerales: '',
};

/* ── UI primitives (mismo estilo que AuditFormPage) ── */
function Pill({ active, onClick, children, color }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: '7px 14px', borderRadius: 20, whiteSpace: 'nowrap',
      border: `1.5px solid ${active ? (color || 'var(--brand)') : 'var(--border-default)'}`,
      background: active ? (color ? color + '22' : 'var(--brand-subtle)') : 'var(--bg-secondary)',
      color: active ? (color || 'var(--brand-light)') : 'var(--text-muted)',
      fontSize: 13, fontWeight: active ? 600 : 400, cursor: 'pointer',
      transition: 'all 0.15s', fontFamily: 'var(--font-body)',
    }}>{children}</button>
  );
}

function SiNo({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <Pill active={value === 'si'} onClick={() => onChange('si')} color="var(--status-ok)">Sí</Pill>
      <Pill active={value === 'no'} onClick={() => onChange('no')} color="var(--status-critical)">No</Pill>
    </div>
  );
}

function PruebaResultado({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <Pill active={value === 'exitoso'} onClick={() => onChange('exitoso')} color="var(--status-ok)">Exitoso</Pill>
      <Pill active={value === 'fallido'} onClick={() => onChange('fallido')} color="var(--status-critical)">Fallido</Pill>
      <Pill active={value === 'na'}      onClick={() => onChange('na')}      color="var(--text-disabled)">N/A</Pill>
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = 'text' }) {
  const px = (type === 'date' || type === 'time') ? 6 : 12;
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder || ''}
      style={{
        width: '100%', minWidth: 0, padding: `10px ${px}px`, borderRadius: 8, boxSizing: 'border-box',
        border: '1.5px solid var(--border-default)', background: 'var(--bg-secondary)',
        color: 'var(--text-primary)', fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none',
      }}
      onFocus={e => e.target.style.borderColor = 'var(--brand)'}
      onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
    />
  );
}

function Label({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.3px', textTransform: 'uppercase', marginBottom: 5 }}>
      {children}
    </div>
  );
}

function Row2({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>{children}</div>;
}

function DevGroup({ children }) {
  return (
    <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {children}
    </div>
  );
}

function Section({ icon, title, complete, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const dot = complete ? 'var(--status-ok)' : 'var(--border-strong)';
  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', marginBottom: 10, overflow: 'hidden' }}>
      <button type="button" onClick={() => setOpen(o => !o)} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
      }}>
        <span style={{
          width: 10, height: 10, borderRadius: '50%', background: dot, flexShrink: 0,
          boxShadow: complete ? '0 0 6px var(--status-ok)' : 'none',
          transition: 'background var(--transition-fast), box-shadow var(--transition-fast)',
        }} />
        <span style={{ fontSize: 15, lineHeight: 1 }}>{icon}</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>{title}</span>
        <span style={{ color: 'var(--text-disabled)', fontSize: 12, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
      </button>
      {open && (
        <div style={{ padding: '4px 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {children}
        </div>
      )}
    </div>
  );
}

/* ── Voltajes ── */
const VOLT_COLOR = { ok: 'var(--status-ok)', err: 'var(--status-critical)' };

function VoltRow({ block, values, setVoltaje }) {
  const [touched, setTouched] = useState({});
  const MEDIDAS = [
    { key: 'lt', label: 'L–T (V)', isTierra: false },
    { key: 'ln', label: 'L–N (V)', isTierra: false },
    { key: 'nt', label: 'N–T (V)', isTierra: true  },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
      {MEDIDAS.map(({ key, label, isTierra }) => {
        const val = values[key] || '';
        const st  = voltEstadoCampo(isTierra ? 'nt' : 'ln', val);
        const isT = !!touched[key];
        return (
          <div key={key}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.3px', textTransform: 'uppercase', marginBottom: 5 }}>{label}</div>
            <input
              type="text"
              inputMode="decimal"
              value={val}
              onChange={e => setVoltaje(block, key, e.target.value)}
              onBlur={()  => setTouched(t => ({ ...t, [key]: true }))}
              placeholder={isTierra ? 'Ej: 2' : '220'}
              style={{
                width: '100%', padding: '10px 8px', borderRadius: 8, boxSizing: 'border-box',
                border: `1.5px solid ${isT && st ? VOLT_COLOR[st] : 'var(--border-default)'}`,
                background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                fontSize: 13, fontFamily: 'var(--font-mono)', outline: 'none',
              }}
            />
            {isT && st && (
              <div style={{ fontSize: 10, color: VOLT_COLOR[st], marginTop: 3, fontWeight: 600 }}>
                {st === 'ok' ? '✓ OK' : isTierra ? `⚠ ≥${NT_MAX} V` : '⚠ Fuera ±5%'}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Bloque componente con Antes/Después ── */
function ComponenteBlock({ deviceKey, label, dev, setDevField }) {
  const estado = dev.estado;
  const estadoColor =
    estado === 'operativo'   ? 'var(--status-ok)'       :
    estado === 'observacion' ? 'var(--status-warn)'     :
    estado === 'malo'        ? 'var(--status-critical)' :
    'var(--text-disabled)';
  const estadoBg =
    estado === 'operativo'   ? 'var(--status-ok-dim)'       :
    estado === 'observacion' ? 'var(--status-warn-dim)'     :
    estado === 'malo'        ? 'var(--status-critical-dim)' :
    'var(--bg-secondary)';

  return (
    <DevGroup>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{label}</div>
      <select
        value={estado}
        onChange={e => setDevField(deviceKey, 'estado', e.target.value)}
        style={{
          width: '100%', padding: '10px 12px', borderRadius: 8, boxSizing: 'border-box',
          border: `1.5px solid ${estado ? estadoColor : 'var(--border-default)'}`,
          background: estadoBg,
          color: estado ? estadoColor : 'var(--text-disabled)',
          fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none', cursor: 'pointer',
          fontWeight: estado ? 600 : 400,
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2394A3B8' fill='none' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 36,
        }}
      >
        <option value="">— Seleccionar estado —</option>
        <option value="operativo">✅ Operativo</option>
        <option value="observacion">⚠ Observación</option>
        <option value="malo">❌ Malo / Falla</option>
      </select>
      <div>
        <Label>Observaciones (opcional pero recomendado)</Label>
        <TextInput
          value={dev.obs}
          onChange={v => setDevField(deviceKey, 'obs', v)}
          placeholder={`Observaciones de ${label.toLowerCase()}...`}
        />
      </div>
      <PhotoUploader
        label={`Fotos ANTES — ${label}`}
        photos={dev.fotosAntes}
        onChange={v => setDevField(deviceKey, 'fotosAntes', v)}
        min={PHOTOS_MIN} max={PHOTOS_MAX}
      />
      <PhotoUploader
        label={`Fotos DESPUÉS — ${label}`}
        photos={dev.fotosDespues}
        onChange={v => setDevField(deviceKey, 'fotosDespues', v)}
        min={PHOTOS_MIN} max={PHOTOS_MAX}
      />
    </DevGroup>
  );
}

/* ══════════════════════════════════════════════════════ */

export default function C2dFormPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { theme, toggle: toggleTheme } = useTheme();

  const [form, setForm] = useState(() => {
    try {
      const s = localStorage.getItem(DRAFT_KEY);
      if (!s) return INITIAL;
      const saved = JSON.parse(s);
      // Merge cuidadoso con INITIAL (por si se agregan campos nuevos)
      return {
        ...INITIAL,
        ...saved,
        voltajes: { ...INITIAL.voltajes, ...(saved.voltajes || {}) },
        devFotos: Object.fromEntries(
          Object.keys(INITIAL.devFotos).map(k => [k, { ...INITIAL.devFotos[k], ...(saved.devFotos?.[k] || {}) }])
        ),
      };
    } catch { return INITIAL; }
  });
  const [toast, setToast] = useState(null);
  const [sending, setSending] = useState(false);
  const [sendStep, setSendStep] = useState('');
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
      setStorageError(false);
    } catch {
      setStorageError(true);
      try {
        const lite = {
          ...form,
          voltajesPhotos: [],
          devFotos: Object.fromEntries(
            Object.entries(form.devFotos).map(([k, v]) => [k, { ...v, fotosAntes: [], fotosDespues: [] }])
          ),
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(lite));
      } catch { /* sin espacio ni para la versión lite */ }
    }
  }, [form]);

  const set = useCallback((f, v) => setForm(p => ({ ...p, [f]: v })), []);
  const setN = useCallback((parent, f, v) =>
    setForm(p => ({ ...p, [parent]: { ...p[parent], [f]: v } })), []);
  const setVoltaje = useCallback((block, campo, valor) =>
    setForm(p => ({ ...p, voltajes: { ...p.voltajes, [block]: { ...p.voltajes[block], [campo]: valor } } })), []);
  const setDevField = useCallback((device, field, value) =>
    setForm(p => ({ ...p, devFotos: { ...p.devFotos, [device]: { ...p.devFotos[device], [field]: value } } })), []);

  // Auto-fill fecha con hoy al montar
  useEffect(() => {
    setForm(p => p.fecha ? p : { ...p, fecha: new Date().toISOString().split('T')[0] });
  }, []);

  const handleTecnicoAutofill = useCallback(t => {
    setForm(p => ({
      ...p,
      tecnicoId:     t.id,
      tecnicoNum:    t.num_interno,
      tecnicoNombre: t.nombre,
      horaInicio:    p.horaInicio || new Date().toTimeString().slice(0, 5),
    }));
  }, []);

  async function handleEnviarPDF() {
    if (!form.idAtm || !form.fecha) {
      setToast({ msg: 'Complete ID C2D y Fecha antes de enviar', type: 'err' });
      return;
    }
    if (!form.tecnicoId) {
      setToast({ msg: 'Complete el técnico responsable antes de enviar', type: 'err' });
      return;
    }
    if (!form.horaFin) {
      set('horaFin', new Date().toTimeString().slice(0, 5));
      await new Promise(r => setTimeout(r, 0));
    }

    setSending(true);
    setSendStep('Generando PDF...');
    try {
      const { generatePDF } = await import('../services/pdfService.js');
      const idSafe    = (form.idAtm || 'ATM').replace(/[\\/:*?"<>|]/g, '_');
      const puntoSafe = (form.punto || '').replace(/[\\/:*?"<>|]/g, '_').slice(0, 40);
      const filename  = `C2D-${puntoSafe ? puntoSafe + '-' : ''}${idSafe}_${form.fecha || 'sin-fecha'}`;
      const pdfBuffer = await generatePDF('c2d-pdf-area', filename, { download: true });

      saveC2d(form).catch(() => {});
      await sendC2dEmail(form, pdfBuffer, setSendStep);

      setSendStep('✓ Correo enviado');
      setToast({ msg: '✓ PDF generado y correo enviado correctamente', type: 'ok' });
      localStorage.removeItem(DRAFT_KEY);
      setForm(INITIAL);
    } catch (e) {
      setToast({ msg: 'Error al enviar: ' + (e.message || 'intente nuevamente'), type: 'err' });
    } finally {
      setSending(false);
      setSendStep('');
    }
  }

  // ── Validación de secciones ──
  const sec1Complete = !!(form.tecnicoId && form.horaInicio);
  const sec2Complete = !!(form.idAtm && form.fecha && form.punto && form.nroSerie && form.marcaEquipo && form.modeloEquipo);
  const secSiteComplete = SITE_ITEMS.every(({ key }) => !!form.site[key]);

  const dispositivoCompleto = (dev) =>
    !!(dev?.estado) && (dev.fotosAntes?.length ?? 0) >= PHOTOS_MIN && (dev.fotosDespues?.length ?? 0) >= PHOTOS_MIN;

  const dispositivosFijosCompletos = DEVICE_KEYS.every(k => dispositivoCompleto(form.devFotos[k]));
  const cashControlSwitchOk = form.tieneCashControl === 'si' || form.tieneCashControl === 'no';
  const cashControlEvalOk =
    form.tieneCashControl === 'no' ? true
    : form.tieneCashControl === 'si' ? dispositivoCompleto(form.devFotos.cashControl)
    : false;
  const secDispositivosComplete = cashControlSwitchOk && dispositivosFijosCompletos && cashControlEvalOk;

  const voltajesFueraDeRango = computeVoltajesFueraDeRango(form.voltajes);
  const voltajesEquipoComplete = !!(form.voltajes.equipo.lt && form.voltajes.equipo.ln && form.voltajes.equipo.nt);
  const voltajesPhotosOk = !voltajesFueraDeRango || (form.voltajesPhotos?.length ?? 0) >= VOLT_PHOTOS_MIN;
  const secVoltajesComplete = voltajesEquipoComplete && voltajesPhotosOk;

  const secPruebasComplete = PRUEBAS_ITEMS.every(({ key }) => !!form.pruebas[key]);
  const secObsComplete = !!(form.obsGenerales && form.obsGenerales.trim());

  const allSecs = [
    sec1Complete,             // Técnico
    sec2Complete,             // Identificación C2D
    secSiteComplete,          // Estado del site
    secDispositivosComplete,  // Dispositivos
    secVoltajesComplete,      // Voltajes
    secPruebasComplete,       // Pruebas de depósito
    secObsComplete,           // Obs. generales
  ];
  const completedCount = allSecs.filter(Boolean).length;
  const progressPct = Math.round((completedCount / allSecs.length) * 100);
  const progressColor = progressPct === 100 ? 'var(--status-ok)' : 'var(--brand)';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', paddingBottom: 80 }}>

      {sending && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100000,
          background: 'var(--bg-primary)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 20,
        }}>
          <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
          <p style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 700, textAlign: 'center', maxWidth: 280 }}>
            {sendStep}
          </p>
        </div>
      )}

      {/* Topbar */}
      <div style={{
        background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-subtle)',
        padding: isMobile ? '10px 14px' : '12px 24px',
        display: 'flex', alignItems: 'center', gap: 12,
        position: 'sticky', top: 0, zIndex: 30,
      }}>
        <button onClick={() => progressPct > 0 ? setShowLeaveModal(true) : navigate('/')}
          style={{ background: 'var(--hover-overlay)', border: '1px solid var(--border-default)', color: 'var(--text-muted)', cursor: 'pointer', padding: '5px 7px', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
            Check List MP C2D
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Mantenimiento Preventivo · Cash Today</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: progressColor }}>{progressPct}%</span>
            <div style={{ width: 64, height: 5, borderRadius: 99, background: 'var(--border-strong)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: progressPct + '%', background: progressColor,
                borderRadius: 99, transition: 'width 0.3s ease, background 0.3s ease',
              }} />
            </div>
          </div>
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: '2px 4px', lineHeight: 1, opacity: 0.75 }}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      {storageError && (
        <div style={{
          background: 'var(--status-warn)', color: '#fff',
          padding: '8px 16px', fontSize: 12, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span>⚠</span>
          <span>Almacenamiento lleno — las fotos no se guardarán si recargas. Los datos del formulario sí están guardados. Puedes enviar normalmente.</span>
        </div>
      )}

      {/* Cuerpo */}
      <div style={{ maxWidth: 640, margin: '0 auto', padding: isMobile ? '12px 12px' : '20px 24px' }}>

        {/* ══ 1. TÉCNICO ══ */}
        <Section icon="👤" title="Técnico responsable" complete={sec1Complete} defaultOpen>
          <div>
            <Label>N° Interno del técnico *</Label>
            <TecnicoNumInput
              value={form.tecnicoNum}
              onChange={v => set('tecnicoNum', v)}
              onAutofill={handleTecnicoAutofill}
            />
          </div>
          {form.tecnicoNombre && (
            <div>
              <Label>Nombre</Label>
              <div style={{
                padding: '10px 12px', borderRadius: 8, background: 'var(--status-ok-dim)',
                border: '1.5px solid var(--status-ok)', color: 'var(--status-ok)',
                fontSize: 13, fontWeight: 600,
              }}>
                ✓ {form.tecnicoNombre}
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ flex: 1.1, minWidth: 0 }}>
              <Label>Fecha *</Label>
              <TextInput type="date" value={form.fecha} onChange={v => set('fecha', v)} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Label>Hora Inicio (auto)</Label>
              <TextInput type="time" value={form.horaInicio} onChange={v => set('horaInicio', v)} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Label>Hora Fin (auto)</Label>
              <TextInput type="time" value={form.horaFin} onChange={v => set('horaFin', v)} />
            </div>
          </div>
        </Section>

        {/* ══ 2. IDENTIFICACIÓN C2D ══ */}
        <Section icon="🗂" title="Identificación del C2D" complete={sec2Complete}>
          <div>
            <Label>ID C2D *</Label>
            <TextInput value={form.idAtm} onChange={v => set('idAtm', v)} placeholder="Ej: C2D-01234" />
          </div>
          <div>
            <Label>Punto / Agencia</Label>
            <TextInput value={form.punto} onChange={v => set('punto', v)} placeholder="Ej: Agencia Miraflores" />
          </div>
          <div>
            <Label>N° Serie</Label>
            <TextInput value={form.nroSerie} onChange={v => set('nroSerie', v)} placeholder="—" />
          </div>
          <Row2>
            <div>
              <Label>Marca del equipo</Label>
              <TextInput value={form.marcaEquipo} onChange={v => set('marcaEquipo', v)} placeholder="—" />
            </div>
            <div>
              <Label>Modelo del equipo</Label>
              <TextInput value={form.modeloEquipo} onChange={v => set('modeloEquipo', v)} placeholder="—" />
            </div>
          </Row2>
        </Section>

        {/* ══ 3. ESTADO DEL SITE ══ */}
        <Section icon="🏢" title="Estado del site" complete={secSiteComplete}>
          {SITE_ITEMS.map(({ key, label }) => (
            <div key={key} style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>{label}</div>
              <SiNo value={form.site[key]} onChange={v => setN('site', key, v)} />
              {form.site[key] === 'no' && (
                <div style={{ marginTop: 8 }}>
                  <TextInput value={form.siteObs[key]} onChange={v => setN('siteObs', key, v)} placeholder="Observaciones..." />
                </div>
              )}
            </div>
          ))}
        </Section>

        {/* ══ 4. DISPOSITIVOS ══ */}
        <Section icon="🔧" title="Dispositivos" complete={secDispositivosComplete}>
          {/* Switch Cash Control primero */}
          <div style={{
            padding: 12, borderRadius: 8,
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-subtle)',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <Label>¿Cash Control instalado en este equipo?</Label>
            <SiNo value={form.tieneCashControl} onChange={v => set('tieneCashControl', v)} />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Si selecciona <b>Sí</b>, se habilitará el bloque Cash Control al final de esta sección.
            </div>
          </div>

          {DEVICE_KEYS.map(k => (
            <ComponenteBlock
              key={k}
              deviceKey={k}
              label={DEVICE_LABELS[k]}
              dev={form.devFotos[k]}
              setDevField={setDevField}
            />
          ))}

          {form.tieneCashControl === 'si' && (
            <ComponenteBlock
              deviceKey="cashControl"
              label={DEVICE_LABELS.cashControl}
              dev={form.devFotos.cashControl}
              setDevField={setDevField}
            />
          )}
        </Section>

        {/* ══ 5. VOLTAJES (posición 5) ══ */}
        <Section icon="⚡" title="Voltajes (Equipo obligatorio)" complete={secVoltajesComplete}>
          {VOLT_BLOCKS.map(({ key, label, obligatorio }) => (
            <div key={key} style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                {label} {obligatorio && <span style={{ color: 'var(--status-critical)' }}>*</span>}
              </div>
              <VoltRow block={key} values={form.voltajes[key]} setVoltaje={setVoltaje} />
            </div>
          ))}
          <div style={{
            padding: '10px 12px', borderRadius: 8,
            background: voltajesFueraDeRango ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)',
            border: `1px solid ${voltajesFueraDeRango ? 'var(--status-critical)' : 'var(--status-ok)'}44`,
            fontSize: 12, color: voltajesFueraDeRango ? 'var(--status-critical)' : 'var(--status-ok)',
            fontWeight: 600,
          }}>
            {voltajesFueraDeRango
              ? '⚠ Hay medidas fuera de rango — se requiere evidencia fotográfica del multímetro'
              : '✓ Voltajes dentro del rango normal (' + VOLT_MIN + '–' + VOLT_MAX + ' V, N-T ≤ ' + NT_MAX + ' V)'}
          </div>
          {voltajesFueraDeRango && (
            <PhotoUploader
              label="Evidencia fotográfica del multímetro"
              photos={form.voltajesPhotos}
              onChange={v => set('voltajesPhotos', v)}
              min={VOLT_PHOTOS_MIN} max={VOLT_PHOTOS_MAX}
            />
          )}
        </Section>

        {/* ══ 6. PRUEBAS DE DEPÓSITO ══ */}
        <Section icon="🔌" title="Pruebas de depósito" complete={secPruebasComplete}>
          {PRUEBAS_ITEMS.map(({ key, label }) => (
            <div key={key} style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>{label}</div>
              <PruebaResultado value={form.pruebas[key]} onChange={v => setN('pruebas', key, v)} />
              {form.pruebas[key] === 'fallido' && (
                <div style={{ marginTop: 8 }}>
                  <TextInput value={form.pruebasObs[key]} onChange={v => setN('pruebasObs', key, v)} placeholder="Describir la falla..." />
                </div>
              )}
            </div>
          ))}
        </Section>

        {/* ══ 7. OBSERVACIONES GENERALES ══ */}
        <Section icon="📝" title="Observaciones Generales" complete={secObsComplete}>
          <div>
            <Label>Observaciones generales del mantenimiento *</Label>
            <textarea
              value={form.obsGenerales}
              onChange={e => set('obsGenerales', e.target.value)}
              placeholder="Escriba aquí cualquier novedad, hallazgo o comentario general del mantenimiento..."
              rows={5}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8, boxSizing: 'border-box',
                border: '1.5px solid var(--border-default)', background: 'var(--bg-secondary)',
                color: 'var(--text-primary)', fontSize: 13, fontFamily: 'var(--font-body)',
                outline: 'none', resize: 'vertical', lineHeight: 1.5,
              }}
              onFocus={e => e.target.style.borderColor='var(--brand)'}
              onBlur={e  => e.target.style.borderColor='var(--border-default)'}
            />
          </div>
        </Section>

      </div>

      {/* Barra inferior sticky */}
      <div className="no-print" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--bg-primary)', borderTop: '1px solid var(--border-default)',
        padding: isMobile ? '8px 16px 12px' : '10px 32px 14px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, zIndex: 30,
      }}>
        {form.idAtm && (
          <div style={{ fontSize: 10, color: 'var(--text-disabled)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
            {form.idAtm}{form.punto ? ` · ${form.punto}` : ''}
          </div>
        )}
        <button
          onClick={handleEnviarPDF}
          disabled={sending || progressPct < 100}
          title={progressPct < 100 ? `Completa todas las secciones (${completedCount}/${allSecs.length})` : undefined}
          style={{
            width: isMobile ? '100%' : 'auto',
            minWidth: isMobile ? undefined : 320,
            padding: '13px 32px',
            borderRadius: 10,
            border: 'none',
            background: (sending || progressPct < 100) ? 'var(--bg-tertiary)' : 'var(--color-action-green)',
            color: (sending || progressPct < 100) ? 'var(--text-disabled)' : '#fff',
            fontSize: 15,
            fontWeight: 700,
            cursor: (sending || progressPct < 100) ? 'not-allowed' : 'pointer',
            opacity: (sending || progressPct < 100) ? 0.6 : 1,
            letterSpacing: '0.2px',
            boxShadow: (sending || progressPct < 100) ? 'none' : 'var(--shadow-action-green)',
            transition: 'opacity 0.15s, box-shadow 0.15s',
          }}
        >
          {sending ? 'Generando y enviando...' : progressPct < 100 ? `✉  Completa las secciones (${completedCount}/${allSecs.length})` : '✉  Generar PDF y Enviar Correo'}
        </button>
      </div>

      <C2dPdfView form={form} />

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} aboveBar />}

      {showLeaveModal && (
        <div onClick={() => setShowLeaveModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: 16, padding: '22px 20px', width: '100%', maxWidth: 340 }}>
            <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 15, marginBottom: 8 }}>¿Salir del formulario?</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>
              Tienes {progressPct}% completado. El borrador se mantendrá guardado y podrás continuar desde el inicio.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowLeaveModal(false)} style={{ flex: 1, padding: '11px 0', background: 'var(--bg-tertiary)', border: '1px solid var(--border-default)', borderRadius: 10, color: 'var(--text-secondary)', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                Continuar editando
              </button>
              <button onClick={() => { setShowLeaveModal(false); navigate('/'); }} style={{ flex: 1, padding: '11px 0', background: 'var(--status-critical-dim)', border: '1px solid var(--status-critical-border)', borderRadius: 10, color: 'var(--status-critical)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                Salir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
