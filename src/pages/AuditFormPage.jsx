import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme.js';
import AtmIdInput from '../components/AtmIdInput.jsx';
import Toast from '../components/Toast.jsx';
import { useIsMobile } from '../hooks/useIsMobile.js';
import { saveAuditoria } from '../services/auditoriaService.js';
import { sendAuditoriaEmail } from '../services/emailService.js';
import AuditPdfView from './AuditPdfView.jsx';
import PhotoUploader from '../components/PhotoUploader.jsx';

const DRAFT_KEY = 'auditoria_draft';

export const INITIAL = {
  id: '',
  fecha: '',
  horaInicio: '',
  horaFin: '',
  idAtm: '',
  atmDbId: null,
  punto: '',
  cliente: '',
  direccion: '',
  marcaEquipo: '',
  modeloEquipo: '',
  nroSerie: '',
  tipoAtm: '',
  equipoFuncionando: '',
  equipoFuncionandoObs: '',
  pruebas: { consultaSaldos: '', retiroEfectivo: '', depositoEfectivo: '' },
  pruebasObs: { consultaSaldos: '', retiroEfectivo: '', depositoEfectivo: '' },
  pruebasExitosas: '',
  pruebasExitosasObs: '',
  ipEquipo: '',
  mascaraRed: '',
  gateway: '',
  dns1: '',
  dns2: '',
  sistemaOperativo: 'Windows 10',
  software: '',
  cassettes: { c1: '', c2: '', c3: '', c4: '', c5: '' },
  lectorTarjetas: '',
  lectorOtro: '',
  askTipo: '',
  impresoraRecibos: '',
  impresoraOtro: '',
  tecladoEPP: '',
  cpu: '',
  cpuOtro: '',
  pantalla: '',
  memoriaRAM: '',
  capacidadSSD: '',
  shutterAntiFraude: '',
  sistemaEntintado: '',
  tipoNose: '',
  site: { camaras: '', aireAcondicionado: '', iluminacion: '', excesoPolvp: '' },
  siteObs: { camaras: '', aireAcondicionado: '', iluminacion: '', excesoPolvp: '' },
  // ── Voltajes ──
  voltajes: { atmLT: '', atmLN: '', atmNT: '', upsLT: '', upsLN: '', upsNT: '' },
  voltajesPhotos: [],
  // ── Evidencias de dispositivos ──
  devFotos: {
    fasciaPanel:  { estado: '', obs: '', photos: [] },
    gabineteCom:  { estado: '', obs: '', photos: [] },
    dispensador:  { estado: '', obs: '', photos: [] },
    aceptador:    { estado: '', obs: '', photos: [] },
    cassette1:    { estado: '', obs: '', photos: [] },
    cassette2:    { estado: '', obs: '', photos: [] },
    cassette3:    { estado: '', obs: '', photos: [] },
    cassette4:    { estado: '', obs: '', photos: [] },
    cassette5:    { estado: '', obs: '', photos: [] },
    shutter:      { estado: '', obs: '', photos: [] },
    lectora:      { estado: '', obs: '', photos: [] },
    impresora:    { estado: '', obs: '', photos: [] },
    epp:          { estado: '', obs: '', photos: [] },
    cpu:          { estado: '', obs: '', photos: [] },
    powerSupply:  { estado: '', obs: '', photos: [] },
    miscelaneos:  { estado: '', obs: '', photos: [] },
    cableado:     { estado: '', obs: '', photos: [] },
  },
  obsGenerales: '',
};

/* ── Validación IP (cada octeto 0–255) ── */
function isValidIp(v) {
  if (!v) return true;
  const parts = v.split('.');
  if (parts.length !== 4) return false;
  return parts.every(p => p !== '' && !isNaN(p) && +p >= 0 && +p <= 255);
}

/* ── Input IP con validación ── */
function IpInput({ value, onChange, placeholder }) {
  const invalid = value && !isValidIp(value);
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder || '0.0.0.0'}
      style={{
        width: '100%', padding: '10px 12px', borderRadius: 8, boxSizing: 'border-box',
        border: `1.5px solid ${invalid ? 'var(--status-critical)' : 'var(--border-default)'}`,
        background: 'var(--bg-secondary)', color: 'var(--text-primary)',
        fontSize: 13, fontFamily: 'var(--font-mono)', outline: 'none',
      }}
    />
  );
}

/* ── Pill button ── */
function Pill({ active, onClick, children, color }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: '7px 14px', borderRadius: 20, whiteSpace: 'nowrap',
      border: `1.5px solid ${active ? (color || 'var(--brand)') : 'var(--border-default)'}`,
      background: active ? (color ? color + '22' : 'var(--brand-subtle)') : 'var(--bg-secondary)',
      color: active ? (color || 'var(--brand-light)') : 'var(--text-muted)',
      fontSize: 13, fontWeight: active ? 600 : 400, cursor: 'pointer',
      transition: 'all 0.15s', fontFamily: 'var(--font-body)',
    }}>
      {children}
    </button>
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

function SiNoNa({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <Pill active={value === 'si'} onClick={() => onChange('si')} color="var(--status-ok)">Sí</Pill>
      <Pill active={value === 'no'} onClick={() => onChange('no')} color="var(--status-critical)">No</Pill>
      <Pill active={value === 'na'} onClick={() => onChange('na')} color="var(--text-disabled)">N/A</Pill>
    </div>
  );
}

function StyledSelect({ value, onChange, options, placeholder }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{
      width: '100%', padding: '10px 12px', borderRadius: 8,
      border: '1.5px solid var(--border-default)', background: 'var(--bg-secondary)',
      color: value ? 'var(--text-primary)' : 'var(--text-disabled)',
      fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none', cursor: 'pointer',
      appearance: 'none',
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2394A3B8' fill='none' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 36,
    }}>
      <option value="">{placeholder || 'Seleccionar...'}</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
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

/* ── Separador visual entre grupos de dispositivos ── */
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

/* ── Lógica de voltaje (fuera del componente para evitar remount) ── */
const V_MIN = 220 * 0.95; // 209 V
const V_MAX = 220 * 1.05; // 231 V
const NT_MAX = 5;          // Tierra: máx 5 V (>= 5V = deficiente)

function voltLineStatus(val, isTierra = false) {
  const v = parseFloat(String(val).replace(',', '.'));
  if (val === '' || val === null || val === undefined || isNaN(v)) return null;
  if (isTierra) return v >= NT_MAX ? 'tierra' : 'ok';
  return (v >= V_MIN && v <= V_MAX) ? 'ok' : 'fuera';
}

function equipoStatus(lt, ln, nt) {
  const slt = voltLineStatus(lt);
  const sln = voltLineStatus(ln);
  const snt = voltLineStatus(nt, true);
  if (slt === 'fuera' || sln === 'fuera') return 'fuera';
  if (snt === 'tierra') return 'tierra';
  if (slt === 'ok' || sln === 'ok' || snt === 'ok') return 'ok';
  return null;
}

const VOLT_COLOR = { ok: 'var(--status-ok)', fuera: 'var(--status-critical)', tierra: '#F59E0B' };

function VoltRow({ prefix, voltajes, setVoltaje }) {
  const [touched, setTouched] = React.useState({});
  const lt  = voltajes[`${prefix}LT`];
  const ln  = voltajes[`${prefix}LN`];
  const nt  = voltajes[`${prefix}NT`];
  const MEDIDAS = [
    { key: `${prefix}LT`, label: 'L–T (V)',          isTierra: false, val: lt },
    { key: `${prefix}LN`, label: 'L–N (V)',          isTierra: false, val: ln },
    { key: `${prefix}NT`, label: 'N–T (V)', isTierra: true,  val: nt },
  ];
  const overall    = equipoStatus(lt, ln, nt);
  const anyTouched = Object.values(touched).some(Boolean);
  const STATUS_MSG = {
    ok:     '✓ OK',
    fuera:  '⚠ Fuera de rango — reportar al proveedor eléctrico',
    tierra: '⚠ Tierra deficiente (≥5 V) — reportar al proveedor',
  };
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {MEDIDAS.map(({ key, label, isTierra, val }) => {
          const st  = voltLineStatus(val, isTierra);
          const isT = !!touched[key];
          return (
            <div key={key}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.3px', textTransform: 'uppercase', marginBottom: 5 }}>{label}</div>
              <input
                type="text"
                inputMode="decimal"
                value={val}
                onChange={e => setVoltaje(key, e.target.value)}
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
                  {st === 'ok' ? '✓ OK' : isTierra ? '⚠ ≥5 V' : '⚠ Fuera ±5%'}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {anyTouched && overall && (
        <div style={{
          padding: '8px 12px', borderRadius: 8, marginTop: 2,
          background: overall === 'ok' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
          border: `1px solid ${VOLT_COLOR[overall]}44`,
          fontSize: 12, color: VOLT_COLOR[overall], fontWeight: 600,
        }}>
          {STATUS_MSG[overall]}
        </div>
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════ */


export default function AuditFormPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { theme, toggle: toggleTheme } = useTheme();
  const [form, setForm] = useState(() => {
    try {
      const s = localStorage.getItem(DRAFT_KEY);
      if (!s) return INITIAL;
      const saved = JSON.parse(s);
      // Migrate old drafts: hora → horaInicio, capacidadHDD → capacidadSSD
      if ('hora' in saved && !('horaInicio' in saved)) {
        saved.horaInicio = saved.hora || '';
        saved.horaFin = '';
        delete saved.hora;
      }
      if ('capacidadHDD' in saved && !('capacidadSSD' in saved)) {
        saved.capacidadSSD = saved.capacidadHDD || '';
        delete saved.capacidadHDD;
      }
      if (!saved.sistemaOperativo) saved.sistemaOperativo = 'Windows 10';
      if (!('tipoAtm' in saved)) saved.tipoAtm = '';
      // Migrar campos de voltaje viejos (Fase1/2/3 → LT/LN/NT)
      if (saved.voltajes?.atmFase1 !== undefined) {
        saved.voltajes = {
          atmLT: saved.voltajes.atmFase1 || '',
          atmLN: saved.voltajes.atmFase2 || '',
          atmNT: saved.voltajes.atmFase3 || '',
          upsLT: saved.voltajes.upsFase1 || '',
          upsLN: saved.voltajes.upsFase2 || '',
          upsNT: saved.voltajes.upsFase3 || '',
        };
      }
      if (!saved.devFotos?.aceptador) saved.devFotos = { ...INITIAL.devFotos, ...(saved.devFotos || {}) };
      // Migrar: añadir campo estado si no existe
      if (saved.devFotos) {
        Object.keys(INITIAL.devFotos).forEach(k => {
          if (saved.devFotos[k] && !('estado' in saved.devFotos[k])) {
            saved.devFotos[k] = { estado: '', ...saved.devFotos[k] };
          }
          // Agregar cassettes si no existen
          if (!saved.devFotos[k]) {
            saved.devFotos[k] = { ...INITIAL.devFotos[k] };
          }
        });
      }
      return { ...INITIAL, ...saved };
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
      // Fallback: guardar sin fotos para preservar al menos los campos de texto
      try {
        const lite = {
          ...form,
          voltajesPhotos: [],
          devFotos: Object.fromEntries(
            Object.entries(form.devFotos).map(([k, v]) => [k, { ...v, photos: [] }])
          ),
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(lite));
      } catch { /* sin espacio ni para la versión lite */ }
    }
  }, [form]);

  const set = useCallback((f, v) => setForm(p => ({ ...p, [f]: v })), []);
  const setN = useCallback((parent, f, v) =>
    setForm(p => ({ ...p, [parent]: { ...p[parent], [f]: v } })), []);
  const setVoltaje = useCallback((f, v) =>
    setForm(p => ({ ...p, voltajes: { ...p.voltajes, [f]: v } })), []);
  const setDevFoto = useCallback((device, field, value) =>
    setForm(p => ({ ...p, devFotos: { ...p.devFotos, [device]: { ...p.devFotos[device], [field]: value } } })), []);

  const handleAtmAutofill = useCallback(atm => {
    // Normaliza el tipo de ATM desde la BD a los valores de los pills
    const tipoMap = {
      dispensador:  'retiro',
      retiro:       'retiro',
      deposito:     'deposito',
      depositos:    'deposito',
      multifuncion: 'multifuncion',
      multifunci:   'multifuncion',
    };
    const rawTipo = (atm.atmTipo || '').toLowerCase().replace(/[óo]/g, 'o').replace(/\s+/g, '');
    const tipoAtm = tipoMap[rawTipo] || '';

    setForm(p => ({
      ...p,
      atmDbId:      atm.atmDbId || p.atmDbId,
      punto:        atm.punto        || p.punto,
      cliente:      atm.cliente      || p.cliente,
      marcaEquipo:  atm.marca        || p.marcaEquipo,
      modeloEquipo: atm.modelo       || p.modeloEquipo,
      tipoAtm:      tipoAtm          || p.tipoAtm,
    }));
  }, []);

  async function handleEnviarPDF() {
    if (!form.idAtm || !form.fecha) {
      setToast({ msg: 'Complete ID ATM y Fecha antes de enviar', type: 'err' });
      return;
    }
    if (!form.atmDbId) {
      setToast({ msg: 'El ATM debe estar registrado en la base de datos', type: 'err' });
      return;
    }
    setSending(true);
    setSendStep('Generando PDF...');
    try {
      const { generatePDF } = await import('../services/pdfService.js');
      const idSafe   = (form.idAtm || 'ATM').replace(/[\\/:*?"<>|]/g, '_');
      const filename = `Auditoria_${idSafe}_${form.fecha || 'sin-fecha'}`;
      const pdfBuffer = await generatePDF('audit-pdf-area', filename, { download: true });

      saveAuditoria(form).catch(() => {});
      await sendAuditoriaEmail(form, pdfBuffer, setSendStep);

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

  const sec1Complete = !!(form.idAtm && form.fecha && form.punto);
  const sec2Complete = !!form.equipoFuncionando;
  const sec3Complete = !!(form.pruebas.consultaSaldos && form.pruebas.retiroEfectivo && form.pruebas.depositoEfectivo);
  const sec4Complete = !!(form.ipEquipo && form.sistemaOperativo);
  const sec5Complete = !!(form.lectorTarjetas && form.cpu);
  const sec6Complete = !!(form.site.camaras && form.site.iluminacion);
  const sec7Complete = !!(form.voltajes.atmLT || form.voltajes.atmLN || form.voltajes.atmNT);
  const sec8Complete = Object.values(form.devFotos).some(d => d.photos.length > 0);

  const allSecs = [sec1Complete, sec2Complete, sec3Complete, sec4Complete, sec5Complete, sec6Complete, sec7Complete, sec8Complete];
  const completedCount = allSecs.filter(Boolean).length;
  const progressPct = Math.round((completedCount / allSecs.length) * 100);
  const progressColor = progressPct === 100 ? 'var(--status-ok)' : 'var(--brand)';

  const BASE_DEVICES = [
    { key: 'shutter',     label: 'Shutter',        min: 2, max: 3 },
    { key: 'lectora',     label: 'Lectora',         min: 2, max: 6 },
    { key: 'impresora',   label: 'Impresora',       min: 2, max: 6 },
    { key: 'epp',         label: 'EPP (Teclado)',   min: 2, max: 6 },
    { key: 'cpu',         label: 'CPU',             min: 2, max: 6 },
    { key: 'powerSupply', label: 'Power Supply',    min: 2, max: 3 },
    { key: 'miscelaneos', label: 'Misceláneos',     min: 1, max: 3 },
    { key: 'cableado',    label: 'Cableado',        min: 3, max: 6 },
  ];
  const DISP         = { key: 'dispensador',  label: 'Dispensador',              min: 3, max: 6 };
  const ACEPT        = { key: 'aceptador',    label: 'Aceptador',                min: 3, max: 6 };
  const FASCIA       = { key: 'fasciaPanel',  label: 'Fascia y Pantalla',        min: 1, max: 2 };
  const GABINETE_COM = { key: 'gabineteCom',  label: 'Gabinete de Comunicación', min: 1, max: 3 };

  // Cassettes dinámicos según marca (4 para NCR/GRG/Hyosung, 5 para Diebold/otros)
  const marcaLower  = (form.marcaEquipo || '').toLowerCase();
  const is4Cassette = ['ncr', 'grg', 'hyosung'].some(m => marcaLower.includes(m));
  const cassetteCount = is4Cassette ? 4 : 5;
  const CASSETTES = Array.from({ length: cassetteCount }, (_, i) => ({
    key:   `cassette${i + 1}`,
    label: `Cassette ${i + 1}`,
    min: 1, max: 2,
  }));

  // Gabinete de comunicación solo aplica cuando el punto NO es una oficina
  const esOficina = (form.punto || '').toLowerCase().includes('oficina');
  const EXTERIOR  = [FASCIA, ...(esOficina ? [] : [GABINETE_COM])];

  const DEVICE_CFG =
    form.tipoAtm === 'deposito'     ? [...EXTERIOR, ACEPT,       ...CASSETTES, ...BASE_DEVICES] :
    form.tipoAtm === 'multifuncion' ? [...EXTERIOR, DISP, ACEPT, ...CASSETTES, ...BASE_DEVICES] :
                                      [...EXTERIOR, DISP,        ...CASSETTES, ...BASE_DEVICES];

  const OPT_LECTOR = [{ value: 'sankio', label: 'Sankio' }, { value: 'hitachi', label: 'Hitachi' }, { value: 'otro', label: 'Otro' }];
  const OPT_IMP = [{ value: 'toshiba', label: 'Toshiba' }, { value: 'epson', label: 'Epson' }, { value: 'otro', label: 'Otro' }];
  const OPT_EPP = [{ value: 'v2', label: 'V2' }, { value: 'v3', label: 'V3' }, { value: 'v4', label: 'V4' }, { value: 'v5', label: 'V5' }, { value: 'v7bsc', label: 'V7 BSC' }, { value: 'v7pci', label: 'V7 PCI' }];
  const OPT_CPU = [{ value: 'misano', label: 'Misano' }, { value: 'canyon', label: 'Canyon' }, { value: 'estoril', label: 'Estoril' }, { value: 'voyaguer', label: 'Voyaguer' }, { value: 'otro', label: 'Otro' }];
  const OPT_NOSE = [{ value: 'short', label: 'Short' }, { value: 'middle', label: 'Middle' }, { value: 'long', label: 'Long' }];

  const PRUEBAS_ITEMS = [
    { key: 'consultaSaldos', label: 'Consulta de saldos con voucher' },
    { key: 'retiroEfectivo', label: 'Retiro de efectivo con voucher' },
    { key: 'depositoEfectivo', label: 'Depósito de efectivo con voucher' },
  ];
  const SITE_ITEMS = [
    { key: 'camaras', label: '¿Cámaras de vigilancia?' },
    { key: 'aireAcondicionado', label: '¿Aire acondicionado?' },
    { key: 'iluminacion', label: '¿Iluminación?' },
    { key: 'excesoPolvp', label: '¿Exceso de polvo?' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', paddingBottom: 80 }}>

      {/* Overlay pantalla completa durante el envío — cubre el PDF renderizado */}
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

      {/* ── Topbar ── siempre oscuro */}
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
            Acta de Auditoría
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Recepción de equipos ATM</div>
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

      {/* Banner de almacenamiento lleno */}
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

      {/* ── Cuerpo ── */}
      <div style={{ maxWidth: 640, margin: '0 auto', padding: isMobile ? '12px 12px' : '20px 24px' }}>

        {/* ══ 1. IDENTIFICACIÓN ══ */}
        <Section icon="🗂" title="Identificación" complete={sec1Complete} defaultOpen>
          <Row2>
            <div>
              <Label>Cliente</Label>
              <TextInput value={form.cliente} onChange={v => set('cliente', v)} placeholder="—" />
            </div>
            <div>
              <Label>ID ATM *</Label>
              <AtmIdInput value={form.idAtm} onChange={v => set('idAtm', v)} onAutofill={handleAtmAutofill} />
            </div>
          </Row2>

          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ flex: 1.1, minWidth: 0 }}>
              <Label>Fecha *</Label>
              <TextInput type="date" value={form.fecha} onChange={v => set('fecha', v)} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Label>Hora Inicio</Label>
              <TextInput type="time" value={form.horaInicio} onChange={v => set('horaInicio', v)} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Label>Hora Fin</Label>
              <TextInput type="time" value={form.horaFin} onChange={v => set('horaFin', v)} />
            </div>
          </div>

          <div>
            <Label>Punto / Agencia</Label>
            <TextInput value={form.punto} onChange={v => set('punto', v)} placeholder="Auto-completa desde ID ATM" />
          </div>

          <div>
            <Label>Dirección / Referencia</Label>
            <TextInput value={form.direccion} onChange={v => set('direccion', v)} placeholder="Dirección del establecimiento" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '0.4fr 1fr', gap: 12 }}>
            <div>
              <Label>Marca</Label>
              <TextInput value={form.marcaEquipo} onChange={v => set('marcaEquipo', v)} placeholder="—" />
            </div>
            <div>
              <Label>Modelo</Label>
              <TextInput value={form.modeloEquipo} onChange={v => set('modeloEquipo', v)} placeholder="—" />
            </div>
          </div>

          <div>
            <Label>Nº Serie</Label>
            <TextInput value={form.nroSerie} onChange={v => set('nroSerie', v)} placeholder="—" />
          </div>

          <div>
            <Label>Tipo de ATM</Label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
              <Pill active={form.tipoAtm === 'retiro'}       onClick={() => set('tipoAtm', 'retiro')}>       Retiro</Pill>
              <Pill active={form.tipoAtm === 'deposito'}     onClick={() => set('tipoAtm', 'deposito')}>    Depósito</Pill>
              <Pill active={form.tipoAtm === 'multifuncion'} onClick={() => set('tipoAtm', 'multifuncion')}>Multifunción</Pill>
            </div>
          </div>
        </Section>

        {/* ══ 2. VERIFICACIÓN ══ */}
        <Section icon="✅" title="Verificación" complete={sec2Complete}>
          <div>
            <Label>¿Equipo en funcionamiento?</Label>
            <SiNo value={form.equipoFuncionando} onChange={v => set('equipoFuncionando', v)} />
          </div>
          {form.equipoFuncionando === 'no' && (
            <div>
              <Label>Observaciones</Label>
              <TextInput value={form.equipoFuncionandoObs} onChange={v => set('equipoFuncionandoObs', v)} placeholder="Describir falla o novedad..." />
            </div>
          )}
        </Section>

        {/* ══ 3. PRUEBAS EN LÍNEA ══ */}
        <Section icon="🔌" title="Pruebas en Línea" complete={sec3Complete}>
          {PRUEBAS_ITEMS.map(({ key, label }) => (
            <div key={key} style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>{label}</div>
              <SiNoNa value={form.pruebas[key]} onChange={v => setN('pruebas', key, v)} />
              {form.pruebas[key] && form.pruebas[key] !== 'na' && (
                <div style={{ marginTop: 8 }}>
                  <TextInput value={form.pruebasObs[key]} onChange={v => setN('pruebasObs', key, v)} placeholder="Observaciones..." />
                </div>
              )}
            </div>
          ))}
          <div>
            <Label>¿Resultado general exitoso?</Label>
            <SiNo value={form.pruebasExitosas} onChange={v => set('pruebasExitosas', v)} />
          </div>
          {form.pruebasExitosas === 'no' && (
            <div>
              <Label>Observaciones generales</Label>
              <TextInput value={form.pruebasExitosasObs} onChange={v => set('pruebasExitosasObs', v)} placeholder="Describir resultado..." />
            </div>
          )}
        </Section>

        {/* ══ 4. INFORMACIÓN GENERAL ══ */}
        <Section icon="🌐" title="Software y Comunicación" complete={sec4Complete}>
          {/* Fila 1: IP + Máscara */}
          <Row2>
            <div>
              <Label>IP Equipo</Label>
              <IpInput value={form.ipEquipo} onChange={v => set('ipEquipo', v)} placeholder="Ej: 192.168.1.10" />
            </div>
            <div>
              <Label>Máscara de Red</Label>
              <IpInput value={form.mascaraRed} onChange={v => set('mascaraRed', v)} placeholder="255.255.255.0" />
            </div>
          </Row2>
          {/* Fila 2: Gateway (full width) */}
          <div>
            <Label>Gateway</Label>
            <IpInput value={form.gateway} onChange={v => set('gateway', v)} placeholder="Ej: 192.168.1.1" />
          </div>
          {/* Fila 3: DNS 1 + DNS 2 */}
          <Row2>
            <div>
              <Label>DNS 1</Label>
              <IpInput value={form.dns1} onChange={v => set('dns1', v)} placeholder="Ej: 8.8.8.8" />
            </div>
            <div>
              <Label>DNS 2</Label>
              <IpInput value={form.dns2} onChange={v => set('dns2', v)} placeholder="Ej: 8.8.4.4" />
            </div>
          </Row2>
          {/* Fila 4: SO + Software */}
          <Row2>
            <div>
              <Label>Sistema Operativo</Label>
              <TextInput value={form.sistemaOperativo} onChange={v => set('sistemaOperativo', v)} placeholder="Windows 10" />
            </div>
            <div>
              <Label>Software ATM</Label>
              <TextInput value={form.software} onChange={v => set('software', v)} placeholder="Ej: Dinasty 3.x" />
            </div>
          </Row2>
          {/* Cassettes: 4 para NCR/GRG/Hyosung, 5 para Diebold */}
          {(() => {
            const marca = (form.marcaEquipo || '').toLowerCase();
            const is4 = ['ncr', 'grg', 'hyosung'].some(m => marca.includes(m));
            const count = is4 ? 4 : 5;
            return (
              <div>
                <Label>Cassettes (Denominaciones S/. o $)</Label>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${count}, 1fr)`, gap: 8 }}>
                  {Array.from({ length: count }, (_, i) => i + 1).map(n => (
                    <div key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                      <span style={{ fontSize: 10, color: 'var(--text-disabled)' }}>C{n}</span>
                      <input
                        type="text"
                        value={form.cassettes[`c${n}`]}
                        onChange={e => setN('cassettes', `c${n}`, e.target.value)}
                        style={{
                          width: '100%', padding: '8px 4px', borderRadius: 8,
                          border: '1.5px solid var(--border-default)',
                          background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                          fontSize: 13, textAlign: 'center', outline: 'none',
                          fontFamily: 'var(--font-mono)',
                        }}
                        placeholder="—"
                      />
                    </div>
                  ))}
                </div>
                {is4 && (
                  <div style={{ fontSize: 10, color: 'var(--text-disabled)', marginTop: 4 }}>
                    4 cassettes — {form.marcaEquipo}
                  </div>
                )}
              </div>
            );
          })()}
        </Section>

        {/* ══ 5. DISPOSITIVOS ══ */}
        <Section icon="🔧" title="Datos de Dispositivos" complete={sec5Complete}>

          <DevGroup>
            <Row2>
              <div>
                <Label>Lector de Tarjetas</Label>
                <StyledSelect value={form.lectorTarjetas} onChange={v => set('lectorTarjetas', v)} options={OPT_LECTOR} />
              </div>
              <div>
                <Label>ASK</Label>
                <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                  <Pill active={form.askTipo === 'integrado'} onClick={() => set('askTipo', 'integrado')}>Integrado</Pill>
                  <Pill active={form.askTipo === 'externo'} onClick={() => set('askTipo', 'externo')}>Externo</Pill>
                </div>
              </div>
            </Row2>
            {form.lectorTarjetas === 'otro' && (
              <div>
                <Label>Lector — Especificar</Label>
                <TextInput value={form.lectorOtro} onChange={v => set('lectorOtro', v)} placeholder="Marca / modelo..." />
              </div>
            )}
          </DevGroup>

          <DevGroup>
            <Row2>
              <div>
                <Label>Impresora Recibos</Label>
                <StyledSelect value={form.impresoraRecibos} onChange={v => set('impresoraRecibos', v)} options={OPT_IMP} />
              </div>
              <div>
                <Label>Teclado EPP</Label>
                <StyledSelect value={form.tecladoEPP} onChange={v => set('tecladoEPP', v)} options={OPT_EPP} />
              </div>
            </Row2>
            {form.impresoraRecibos === 'otro' && (
              <div>
                <Label>Impresora — Especificar</Label>
                <TextInput value={form.impresoraOtro} onChange={v => set('impresoraOtro', v)} placeholder="Marca / modelo..." />
              </div>
            )}
          </DevGroup>

          <DevGroup>
            <Row2>
              <div>
                <Label>CPU</Label>
                <StyledSelect value={form.cpu} onChange={v => set('cpu', v)} options={OPT_CPU} />
              </div>
              <div>
                <Label>Pantalla</Label>
                <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                  <Pill active={form.pantalla === 'touch'} onClick={() => set('pantalla', 'touch')}>Touch</Pill>
                  <Pill active={form.pantalla === 'teclado'} onClick={() => set('pantalla', 'teclado')}>Teclado</Pill>
                </div>
              </div>
            </Row2>
            {form.cpu === 'otro' && (
              <div>
                <Label>CPU — Especificar</Label>
                <TextInput value={form.cpuOtro} onChange={v => set('cpuOtro', v)} placeholder="Modelo CPU..." />
              </div>
            )}
          </DevGroup>

          <DevGroup>
            <Row2>
              <div>
                <Label>Memoria RAM (GB)</Label>
                <TextInput value={form.memoriaRAM} onChange={v => set('memoriaRAM', v)} placeholder="Ej: 8" />
              </div>
              <div>
                <Label>Capacidad SSD (GB)</Label>
                <TextInput value={form.capacidadSSD} onChange={v => set('capacidadSSD', v)} placeholder="Ej: 256" />
              </div>
            </Row2>
          </DevGroup>

          <DevGroup>
            <div>
              <Label>Shutter Anti-Fraude</Label>
              <SiNo value={form.shutterAntiFraude} onChange={v => set('shutterAntiFraude', v)} />
            </div>
            <div>
              <Label>Sistema de Entintado de Billetes</Label>
              <SiNo value={form.sistemaEntintado} onChange={v => set('sistemaEntintado', v)} />
            </div>
          </DevGroup>

          <div>
            <Label>Tipo de Nose</Label>
            <StyledSelect value={form.tipoNose} onChange={v => set('tipoNose', v)} options={OPT_NOSE} />
          </div>
        </Section>

        {/* ══ 6. ESTADO DEL SITE ══ */}
        <Section icon="🏢" title="Estado del Site" complete={sec6Complete}>
          {SITE_ITEMS.map(({ key, label }) => (
            <div key={key} style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>{label}</div>
              <SiNo value={form.site[key]} onChange={v => setN('site', key, v)} />
              {form.site[key] && (
                <div style={{ marginTop: 8 }}>
                  <TextInput value={form.siteObs[key]} onChange={v => setN('siteObs', key, v)} placeholder="Observaciones..." />
                </div>
              )}
            </div>
          ))}
        </Section>

        {/* ══ 7. VOLTAJES ══ */}
        <Section icon="⚡" title="Voltajes" complete={sec7Complete}>
          <div style={{ fontSize: 11, color: 'var(--text-disabled)', marginBottom: 4 }}>
            Rango normal: 209–231 V (220 V ±5%) · Tierra: máx 4 V
          </div>
          {/* ATM */}
          <div style={{ background: 'var(--bg-tertiary)', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>ATM / Red Eléctrica</div>
            <VoltRow prefix="atm" voltajes={form.voltajes} setVoltaje={setVoltaje} />
          </div>
          {/* UPS */}
          <div style={{ background: 'var(--bg-tertiary)', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>UPS</div>
            <VoltRow prefix="ups" voltajes={form.voltajes} setVoltaje={setVoltaje} />
          </div>
          {/* Observaciones auto-calculadas */}
          {(() => {
            const { atmLT, atmLN, atmNT, upsLT, upsLN, upsNT } = form.voltajes;
            const anyFilled = [atmLT, atmLN, atmNT, upsLT, upsLN, upsNT].some(v => v !== '');
            if (!anyFilled) return null;
            const atmSt = equipoStatus(atmLT, atmLN, atmNT);
            const upsSt = equipoStatus(upsLT, upsLN, upsNT);
            const hasIssue = atmSt === 'fuera' || atmSt === 'tierra' || upsSt === 'fuera' || upsSt === 'tierra';
            const obsText = hasIssue
              ? 'Voltajes incorrectos, reportar al proveedor'
              : 'Voltajes correctos';
            const obsColor = hasIssue ? 'var(--status-critical)' : 'var(--status-ok)';
            return (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.3px', textTransform: 'uppercase', marginBottom: 5 }}>Observaciones</div>
                <div style={{
                  padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${obsColor}44`,
                  background: hasIssue ? 'rgba(239,68,68,0.06)' : 'rgba(34,197,94,0.06)',
                  fontSize: 13, color: obsColor, fontWeight: 600,
                }}>
                  {obsText}
                </div>
              </div>
            );
          })()}
          {/* Fotos — si alguna medición está fuera de rango */}
          {(() => {
            const { atmLT, atmLN, atmNT, upsLT, upsLN, upsNT } = form.voltajes;
            const hasIssue =
              equipoStatus(atmLT, atmLN, atmNT) !== 'ok' && equipoStatus(atmLT, atmLN, atmNT) !== null ||
              equipoStatus(upsLT, upsLN, upsNT) !== 'ok' && equipoStatus(upsLT, upsLN, upsNT) !== null;
            return hasIssue ? (
              <PhotoUploader
                label="Evidencia fotográfica de voltaje"
                photos={form.voltajesPhotos}
                onChange={v => set('voltajesPhotos', v)}
                min={3} max={10}
              />
            ) : null;
          })()}
        </Section>

        {/* ══ 8. EVIDENCIAS DE DISPOSITIVOS ══ */}
        <Section icon="📸" title="Evidencias de Dispositivos" complete={sec8Complete}>
          {DEVICE_CFG.map(({ key, label, min, max }) => {
            const estado = form.devFotos[key].estado;
            const estadoColor = estado === 'ok' ? 'var(--status-ok)' : estado === 'mantenimiento' ? 'var(--status-warn)' : estado === 'repuesto' ? 'var(--status-critical)' : 'var(--text-disabled)';
            const estadoBg    = estado === 'ok' ? 'var(--status-ok-dim)' : estado === 'mantenimiento' ? 'var(--status-warn-dim)' : estado === 'repuesto' ? 'var(--status-critical-dim)' : 'var(--bg-secondary)';
            return (
            <DevGroup key={key}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{label}</div>
              {/* Estado del dispositivo — desplegable */}
              <select
                value={estado}
                onChange={e => setDevFoto(key, 'estado', e.target.value)}
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
                <option value="ok">✓ Dispositivo OK</option>
                <option value="mantenimiento">⚠ Requiere mantenimiento</option>
                <option value="repuesto">✕ Requiere cambio de repuestos</option>
              </select>
              <div>
                <Label>Observaciones</Label>
                <TextInput
                  value={form.devFotos[key].obs}
                  onChange={v => setDevFoto(key, 'obs', v)}
                  placeholder={`Observaciones de ${label.toLowerCase()}...`}
                />
              </div>
              <PhotoUploader
                photos={form.devFotos[key].photos}
                onChange={v => setDevFoto(key, 'photos', v)}
                min={min} max={max}
              />
            </DevGroup>
          ); })}
        </Section>

        {/* ══ 9. OBSERVACIONES GENERALES ══ */}
        <Section icon="📝" title="Observaciones Generales" complete={!!form.obsGenerales}>
          <div>
            <Label>Observaciones generales de la auditoría</Label>
            <textarea
              value={form.obsGenerales}
              onChange={e => set('obsGenerales', e.target.value)}
              placeholder="Escriba aquí cualquier novedad, observación o comentario general..."
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

      {/* ── Barra inferior sticky ── */}
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

      <AuditPdfView form={form} />

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} aboveBar />}

      {/* Modal confirmación de salida */}
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
