import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from './hooks/useTheme.js';
import Toast from './components/Toast.jsx';
import SectionBlock from './components/SectionBlock.jsx';
import PhotoUploader from './components/PhotoUploader.jsx';
import { InstallButton } from './components/InstallPrompt.jsx';
import PdfView from './components/PdfView.jsx';
import AtmIdInput from './components/AtmIdInput.jsx';
import TecnicoNumInput from './components/TecnicoNumInput.jsx';
import { ATM_TIPOS, MARCAS_POR_TIPO, MARCA_CONFIG, BrandLogo, LOGO_MAP } from './constants/atm.jsx';
import { VOLT_ITEMS, VOLT_MIN, VOLT_MAX, NT_MAX, voltEstadoCampo, voltMensaje } from './constants/voltages.js';
import { getSections, E_COL, initDevicesFor, initForm } from './constants/devices.js';
// pdfService se carga dinámicamente al generar el PDF (ver handleEnviar)
import { saveMantenimiento } from './services/mantenimientoService.js';
import { sendNotificationEmail } from './services/emailService.js';
import './pdf-styles.css';

/* ══════════════════════════════════════
   ESTILOS BASE
══════════════════════════════════════ */
const INP = {
  width: "100%",
  padding: "10px 12px",
  minHeight: 44,
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--border-default)",
  fontSize: 14,
  background: "var(--bg-secondary)",
  color: "var(--text-primary)",
  outline: "none",
  boxSizing: "border-box",
};
const LBL = {
  display: "block",
  fontSize: 12,
  fontWeight: 700,
  color: "var(--text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: 5,
};

/* ══════════════════════════════════════
   APP PRINCIPAL
══════════════════════════════════════ */
export default function App() {
  const navigate = useNavigate();
  const { theme, toggle: toggleTheme } = useTheme();
  const DRAFT_KEY = 'checklist_draft';

  function loadDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch { return null; }
  }

  function clearDraft() {
    localStorage.removeItem(DRAFT_KEY);
  }

  const draft = loadDraft();
  const [form, setForm] = useState(draft?.form || initForm());
  const normPhotos = (arr) => (arr || []).map(p => (typeof p === 'string' ? p : p?.src)).filter(Boolean);
  const [fotosAntes, setFotosAntes] = useState(normPhotos(draft?.fotosAntes));
  const [fotosDespues, setFotosDespues] = useState(normPhotos(draft?.fotosDespues));
  const [tab, setTab] = useState(draft?.tab || 0);
  const [toast, setToast] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [atmNotFound, setAtmNotFound] = useState(false);
  const [hoveredTab, setHoveredTab] = useState(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [tab]);

  // Guardar borrador en cada cambio
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, fotosAntes, fotosDespues, tab }));
    } catch {
      setToast({ msg: '⚠ Sin espacio disponible: el borrador no pudo guardarse', type: 'err' });
    }
  }, [form, fotosAntes, fotosDespues, tab]);

  const upd = (f, v) => setForm((p) => ({ ...p, [f]: v }));

  /* Cuando cambia tipo, resetear marca y devices */
  function cambiarTipo(nuevoTipo) {
    setForm((p) => ({
      ...p,
      atmTipo: nuevoTipo,
      marca: "",
      devices: {},
    }));
  }

  /* Cuando cambia marca, resetear devices */
  function cambiarMarca(nuevaMarca) {
    const secs = getSections(form.atmTipo, nuevaMarca, form.modelo);
    setForm((p) => ({
      ...p,
      marca: nuevaMarca,
      devices: initDevicesFor(secs),
    }));
  }

  function handleTecnicoAutofill({ nombre, num_interno, id }) {
    setForm((p) => ({
      ...p,
      tec: nombre,
      num: num_interno,
      tecnicoId: id,
      tecnicoNum: num_interno,
    }));
  }

  function handleAtmAutofill({ punto, marca, modelo, atmTipo, atmDbId, cliente }) {
    const secs = getSections(atmTipo, marca, modelo);
    setForm((p) => ({
      ...p,
      punto,
      marca,
      modelo,
      atmTipo,
      cliente: cliente || "",
      atmDbId: atmDbId || null,
      devices: initDevicesFor(secs),
    }));
  }

  const updV = (item, f, v) =>
    setForm((p) => {
      const prev = p.voltages[item];
      const updated = { ...prev, [f]: v };
      updated.obs = voltMensaje(
        f === "ln" ? v : updated.ln,
        f === "lt" ? v : updated.lt,
        f === "nt" ? v : updated.nt,
      );
      return { ...p, voltages: { ...p.voltages, [item]: updated } };
    });
  const updD = useCallback(
    (key, f, v) =>
      setForm((p) => ({
        ...p,
        devices: { ...p.devices, [key]: { ...p.devices[key], [f]: v } },
      })),
    [],
  );

  const tipoObj = ATM_TIPOS.find((t) => t.id === form.atmTipo) || null;
  const marcaObj = form.marca ? MARCA_CONFIG[form.marca] : null;
  const sections = useMemo(
    () => getSections(form.atmTipo, form.marca, form.modelo),
    [form.atmTipo, form.marca, form.modelo],
  );
  const marcasDisp = form.atmTipo ? MARCAS_POR_TIPO[form.atmTipo] : [];

  const total = sections.reduce((a, s) => a + s.items.length, 0);
  const filled = sections.reduce(
    (a, s) =>
      a +
      s.items.filter((_, ii) => form.devices[s.id + "_" + ii]?.est !== "")
        .length,
    0,
  );
  const pct = total > 0 ? Math.round((filled / total) * 100) : 0;

  const accentBg = tipoObj?.color || "#1e3a5f";
  const TABS = [
    "🗂 Info",
    "🏢 Site",
    "⚡ Voltaje",
    "🔧 Dispositivos",
    "📋 Cierre",
    "📸 Fotos",
  ];

  // Indicadores de completitud por pestaña (solo las obligatorias)
  const tabOk = [
    // 0 Info
    !!(form.atmTipo && form.marca && form.punto && form.fecha && form.idAtm && form.tec),
    // 1 Site — 7 ítems
    [0, 1, 2, 3, 4, 5, 6].every(i => !!form.site[i]),
    // 2 Voltaje — Cable interno ATM y UPS deben tener ln o lt
    ["Cable interno ATM", "UPS"].every(k => form.voltages[k]?.ln !== "" || form.voltages[k]?.lt !== ""),
    // 3 Dispositivos — todos con estado
    sections.length > 0 && sections.every(s => s.items.every((_, ii) => !!form.devices[s.id + "_" + ii]?.est)),
    // 4 Cierre
    !!(form.estFinal && form.obsGen?.trim()),
    // 5 Fotos — mínimo 5 antes y 5 después
    fotosAntes.length >= 5 && fotosDespues.length >= 5,
  ];

  function validar() {
    // ── Info básica ─────────────────────────────────────────────────
    if (!form.atmTipo) return "Selecciona el tipo de cajero";
    if (!form.marca) return "Selecciona la marca del cajero";
    if (!form.punto) return "Ingresa el Nombre del Punto / Agencia";
    if (!form.fecha) return "Ingresa la fecha de mantenimiento";
    if (!form.idAtm) return "Ingresa el ID del ATM";
    if (!form.tec) return "Ingresa el nombre del técnico";

    // ── Site: todos los 7 ítems obligatorios ────────────────────────
    const SITE_ITEMS = [
      "Iluminación", "Ubicación / Accesibilidad", "Limpieza de Cabina",
      "Tacho de Papel / Basurero", "Aire Acondicionado / Ventilación",
      "Señalética y Adhesivos", "Estado Piso y Techo",
    ];
    for (let i = 0; i < SITE_ITEMS.length; i++) {
      if (!form.site[i]) return `Site: evalúa "${SITE_ITEMS[i]}"`;
    }

    // ── Voltajes: Cable interno ATM y UPS obligatorios ──────────────
    const VOLT_OBLIGATORIOS = ["Cable interno ATM", "UPS"];
    for (const item of VOLT_OBLIGATORIOS) {
      const v = form.voltages[item];
      if (!v || (v.ln === "" && v.lt === "")) {
        return `Voltaje: completa al menos L-N o L-T de "${item}"`;
      }
    }

    // ── Dispositivos: todos los ítems deben tener estado ────────────
    const sinEstado = sections.reduce((acc, s) => {
      const faltantes = s.items.filter((_, ii) => !form.devices[s.id + "_" + ii]?.est);
      if (faltantes.length) acc.push({ seccion: s.title, faltantes });
      return acc;
    }, []);
    if (sinEstado.length > 0) {
      const primera = sinEstado[0];
      return `Dispositivos: evalúa todos los ítems de "${primera.seccion}"`;
    }

    // ── Cierre ───────────────────────────────────────────────────────
    if (!form.estFinal) return "Cierre: selecciona el Estado Final";
    if (!form.obsGen?.trim()) return "Cierre: completa las Observaciones Generales";

    // ── Fotos ────────────────────────────────────────────────────────
    if (fotosAntes.length < 5) return `Fotos: faltan ${5 - fotosAntes.length} foto(s) de Antes (mínimo 5)`;
    if (fotosDespues.length < 5) return `Fotos: faltan ${5 - fotosDespues.length} foto(s) de Después (mínimo 5)`;

    return null;
  }

  async function handleGenerarPDF() {
    if (!form.atmDbId) {
      setToast({ msg: "El ATM no fue encontrado en la BD. Contacta al administrador para registrarl0.", type: "err" });
      return;
    }
    const error = validar();
    if (error) {
      setToast({ msg: error, type: "err" });
      return;
    }

    // Nombre del archivo PDF: MP-Punto-IDAtm
    const puntoSlug = (form.punto || "SinPunto")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
    const idSlug = (form.idAtm || "SinID").replace(/[^a-zA-Z0-9]/g, "");
    const filename = "MP-" + puntoSlug + "-" + idSlug;

    setEnviando(true);
    setToast({ msg: "Generando PDF…", type: "info" });
    try {
      const { generatePDF } = await import('./services/pdfService.js');
      const pdfBase64 = await generatePDF("pdf-root", filename);
      setToast({ msg: "Enviando correo…", type: "info" });
      saveMantenimiento(form, sections).catch((e) =>
        console.error("DB save:", e),
      );
      await sendNotificationEmail(form, pdfBase64);
      setToast({ msg: "✓ PDF generado y correo enviado", type: "ok" });
      // Limpiar borrador y restablecer formulario
      clearDraft();
      setForm(initForm());
      setFotosAntes([]);
      setFotosDespues([]);
      setTab(0);
    } catch (e) {
      console.error(e);
      setToast({
        msg: "Error: " + (e?.message || "no se pudo enviar el correo"),
        type: "err",
      });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }} role="application">
      <main id="main-content" style={{ display: "contents" }}>
        {toast && (
          <Toast
            msg={toast.msg}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        {/* Modal confirmación de salida */}
        {showLeaveModal && (
          <div onClick={() => setShowLeaveModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: 16, padding: '22px 20px', width: '100%', maxWidth: 340 }}>
              <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 15, marginBottom: 8 }}>¿Salir del formulario?</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>
                Tienes {pct}% completado. El borrador se mantendrá guardado y podrás continuar desde el inicio.
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

        {/* PDF oculto — capturado por html2canvas */}
        <div
          id="pdf-root"
          className="pdf-scope"
          style={{
            position: "absolute",
            left: "-9999px",
            top: 0,
            visibility: "hidden",
          }}
        >
          <PdfView
            form={form}
            fotosAntes={fotosAntes}
            fotosDespues={fotosDespues}
            sections={sections}
          />
        </div>

        {/* UI pantalla */}
        <div className="screen-ui no-print" style={{ display: "block" }}>
          {/* HEADER — siempre oscuro */}
          <div
            style={{
              background: "#0F172A",
              padding: "14px 14px 0",
              position: "sticky",
              top: 0,
              zIndex: "var(--z-sticky)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  <button onClick={() => pct > 0 ? setShowLeaveModal(true) : navigate('/')}
                    style={{ background: 'rgba(148,163,184,0.1)', border: '1px solid rgba(148,163,184,0.15)', color: '#94A3B8', cursor: 'pointer', padding: '5px 7px', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                  <p
                    style={{
                      color: "#F8FAFC",
                      fontWeight: 800,
                      fontSize: 14,
                      lineHeight: 1.2,
                    }}
                  >
                    Check List Preventivo ATM{form.cliente ? ` — ${form.cliente}` : ""}
                  </p>
                </div>
                <p
                  style={{
                    color: tipoObj ? tipoObj.color : "var(--text-muted)",
                    fontSize: 11,
                    fontWeight: 600,
                    marginTop: 2,
                  }}
                >
                  {tipoObj
                    ? tipoObj.emoji + " " + tipoObj.label
                    : "Selecciona tipo de cajero"}
                  {form.punto && (
                    <span style={{ color: "var(--text-muted)" }}>
                      {" "}
                      · {form.punto}
                    </span>
                  )}
                </p>
              </div>
              <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button
                    onClick={toggleTheme}
                    title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      fontSize: 18, padding: "2px 4px", lineHeight: 1, opacity: 0.75,
                    }}
                  >
                    {theme === "dark" ? "☀️" : "🌙"}
                  </button>
                  <InstallButton />
                </div>
                {form.atmTipo && form.marca && (
                  <>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        justifyContent: "flex-end",
                      }}
                    >
                      <div
                        style={{
                          background: "var(--bg-tertiary)",
                          borderRadius: 20,
                          height: 6,
                          width: 80,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: pct + "%",
                            background:
                              pct === 100
                                ? "var(--status-ok)"
                                : tipoObj?.color || "var(--brand)",
                            borderRadius: 20,
                            transition: "width .4s",
                          }}
                        />
                      </div>
                      <span
                        style={{
                          color: pct === 100 ? "var(--status-ok)" : "var(--brand-light)",
                          fontSize: 12,
                          fontWeight: 800,
                        }}
                      >
                        {pct}%
                      </span>
                    </div>
                    <p
                      style={{
                        color: "#475569",
                        fontSize: 10,
                        marginTop: 2,
                      }}
                    >
                      {filled}/{total} ítems
                    </p>
                  </>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: 2, overflowX: "auto" }}>
              {TABS.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setTab(i)}
                  onMouseEnter={() => setHoveredTab(i)}
                  onMouseLeave={() => setHoveredTab(null)}
                  style={{
                    flex: "0 0 auto",
                    padding: "8px 12px",
                    fontSize: 11,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    background: tab === i ? "#334155" : hoveredTab === i ? "rgba(255,255,255,0.06)" : "transparent",
                    color: tab === i ? "#F8FAFC" : hoveredTab === i ? "#CBD5E1" : "#94A3B8",
                    border: "none",
                    cursor: "pointer",
                    borderRadius: "8px 8px 0 0",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    transition: "background 0.15s, color 0.15s",
                  }}
                >
                  {t}
                  <span style={{
                    width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                    background: tabOk[i] ? "var(--status-ok)" : "var(--status-warn)",
                  }} />
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              background: "var(--bg-base)",
              minHeight: "calc(100vh - 88px)",
              padding: "16px 14px",
            }}
          >
            {/* ══ TAB INFO ══ */}
            {tab === 0 && (
              <div>
                {/* DATOS DEL EQUIPO */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "start" }}>

                  {/* 1. FECHA */}
                  <div>
                    <label htmlFor="fecha-input" style={{ ...LBL, whiteSpace: "nowrap" }}>Fecha</label>
                    <input
                      id="fecha-input"
                      type="date"
                      value={form.fecha}
                      onChange={(e) => upd("fecha", e.target.value)}
                      style={INP}
                    />
                  </div>

                  {/* 2. N° INTERNO TÉCNICO (autocomplete) */}
                  <div>
                    <label style={{ ...LBL, whiteSpace: "nowrap" }}>N° Interno</label>
                    <TecnicoNumInput
                      value={form.num}
                      onChange={(v) => upd("num", v)}
                      onAutofill={handleTecnicoAutofill}
                    />
                  </div>

                  {/* 3. NOMBRE TÉCNICO (auto-relleno, editable) */}
                  <div style={{ gridColumn: "1/-1" }}>
                    <label style={LBL}>Técnico Responsable</label>
                    <input
                      type="text"
                      placeholder="Se completa al seleccionar N°"
                      value={form.tec}
                      onChange={(e) => upd("tec", e.target.value)}
                      style={{
                        ...INP,
                        background: form.tec ? "var(--color-action-green-dim)" : "var(--bg-secondary)",
                        borderColor: form.tec ? "var(--status-ok)" : "var(--border-default)",
                      }}
                    />
                  </div>

                  {/* 4. ID ATM (autocomplete) */}
                  <div style={{ gridColumn: "1/-1", paddingBottom: 14 }}>
                    <label style={LBL}>ID ATM</label>
                    <AtmIdInput
                      value={form.idAtm}
                      onChange={(v) => upd("idAtm", v)}
                      onAutofill={handleAtmAutofill}
                      onNotFound={(v) => setAtmNotFound(v)}
                    />
                  </div>

                  {/* 5. PUNTO (auto-relleno, editable) */}
                  <div style={{ gridColumn: "1/-1" }}>
                    <label style={LBL}>Nombre del Punto / Agencia</label>
                    <input
                      type="text"
                      placeholder="Se completa al seleccionar ID ATM"
                      value={form.punto}
                      onChange={(e) => upd("punto", e.target.value)}
                      style={{
                        ...INP,
                        fontWeight: 700,
                        fontSize: 15,
                        borderWidth: 2,
                        borderColor: form.punto ? "var(--brand)" : "var(--border-default)",
                        background: form.punto ? "var(--brand-subtle)" : "var(--bg-secondary)",
                      }}
                    />
                  </div>

                  {/* 6. MARCA (solo lectura) + MODELO (editable) */}
                  <div>
                    <label style={LBL}>Marca</label>
                    <div style={{
                      ...INP,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      background: "var(--bg-tertiary)",
                      color: form.marca ? "var(--text-primary)" : "var(--text-muted)",
                      cursor: "default",
                      userSelect: "none",
                    }}>
                      {form.marca
                        ? <><BrandLogo marca={form.marca} height={18} />{form.marca}</>
                        : "—"}
                    </div>
                  </div>

                  <div>
                    <label style={LBL}>Modelo</label>
                    <input
                      type="text"
                      placeholder={
                        form.marca === "NCR" ? "Ej: SelfServ 6683"
                          : form.marca === "Diebold" ? "Ej: Opteva 522"
                            : form.marca === "GRG" ? "Ej: H22N"
                              : "Se completa al seleccionar ID ATM"
                      }
                      value={form.modelo}
                      onChange={(e) => upd("modelo", e.target.value)}
                      style={INP}
                    />
                  </div>
                </div>

                {/* FALLBACK: selección manual de tipo y marca (solo si ATM no encontrado en BD) */}
                {atmNotFound && (
                  <div style={{ marginTop: 16, padding: "14px", background: "var(--status-warn-dim)", borderRadius: 12, border: "1.5px solid var(--status-warn-border)" }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "var(--status-warn)", marginBottom: 12 }}>
                      ⚠ ATM no encontrado en BD — selecciona tipo y marca manualmente:
                    </p>
                    {/* Tipo */}
                    <label style={LBL}>Tipo de Cajero</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                      {ATM_TIPOS.map((t) => {
                        const sel = form.atmTipo === t.id;
                        return (
                          <button key={t.id} onClick={() => cambiarTipo(t.id)} style={{
                            padding: "10px 6px", borderRadius: 10, cursor: "pointer", textAlign: "center",
                            border: "2px solid " + (sel ? t.color : t.border),
                            background: sel ? t.bg : "var(--bg-secondary)",
                            transition: "all .2s",
                          }}>
                            <div style={{ fontSize: 20, marginBottom: 2 }}>{t.emoji}</div>
                            <div style={{ fontSize: 11, fontWeight: 800, color: sel ? t.color : "var(--text-muted)" }}>{t.label}</div>
                            {sel && <div style={{ marginTop: 4, background: t.color, color: "#fff", borderRadius: 20, fontSize: 10, fontWeight: 700, padding: "1px 8px", display: "inline-block" }}>✓</div>}
                          </button>
                        );
                      })}
                    </div>
                    {/* Marca */}
                    {form.atmTipo && (
                      <>
                        <label style={LBL}>Marca del Cajero</label>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {marcasDisp.map((m) => {
                            const mc = MARCA_CONFIG[m];
                            const sel = form.marca === m;
                            return (
                              <button key={m} onClick={() => cambiarMarca(m)} style={{
                                flex: "1 1 0", padding: "10px 8px", borderRadius: 10, cursor: "pointer",
                                border: "2px solid " + (sel ? mc.color : mc.border),
                                background: sel ? mc.bg : "var(--bg-secondary)",
                                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                                transition: "all .2s",
                              }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 36, padding: "4px 8px", background: sel ? "var(--bg-secondary)" : "var(--bg-primary)", borderRadius: 6, border: "1px solid " + (sel ? mc.border : "var(--border-default)") }}>
                                  {React.createElement(LOGO_MAP[m], { size: 24, selected: sel })}
                                </div>
                                {sel && <div style={{ background: mc.color, color: "#fff", borderRadius: 20, fontSize: 10, fontWeight: 700, padding: "1px 8px" }}>✓</div>}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* SECCIONES DEL CHECKLIST (visible cuando tipo y marca están listos) */}
                {form.atmTipo && form.marca && sections.length > 0 && (
                  <div style={{ marginTop: 16, padding: "10px 14px", background: tipoObj.bg, borderRadius: 10, border: "1px solid " + tipoObj.border }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: tipoObj.color, marginBottom: 6 }}>
                      Secciones del check list:
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {sections.map((s) => (
                        <span key={s.id + s.title} style={{
                          fontSize: 11, background: "var(--bg-secondary)",
                          border: "1px solid " + tipoObj.border,
                          color: tipoObj.color, borderRadius: 20,
                          padding: "2px 9px", fontWeight: 600,
                        }}>
                          {s.title} <span style={{ color: "var(--text-muted)" }}>({s.items.length})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* SIGUIENTE */}
                <button
                  onClick={() => {
                    if (!form.atmTipo || !form.marca) {
                      setToast({ msg: "Selecciona tipo y marca del cajero", type: 'err' });
                      return;
                    }
                    setTab(1);
                  }}
                  style={{
                    marginTop: 20, width: "100%", padding: 14,
                    background: marcaObj?.color || accentBg,
                    color: "#fff", border: "none", borderRadius: 12,
                    fontWeight: 800, fontSize: 13, cursor: "pointer",
                  }}
                >
                  Siguiente → Site 🏢
                </button>
              </div>
            )}

            {/* ══ TAB SITE ══ */}
            {tab === 1 && (
              <div>
                {/* Encabezado */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 14,
                    padding: "10px 14px",
                    borderRadius: 10,
                    background: "var(--brand-subtle)",
                    border: "1px solid var(--border-brand)",
                  }}
                >
                  <span style={{ fontSize: 22 }}>🏢</span>
                  <div>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: "var(--brand-light)",
                      }}
                    >
                      Evaluación del SITE
                    </p>
                    <p style={{ fontSize: 10, color: "var(--brand)" }}>
                      Entorno y condiciones de la cabina
                    </p>
                  </div>
                </div>

                {[
                  "Iluminación",
                  "Ubicación / Accesibilidad",
                  "Limpieza de Cabina",
                  "Tacho de Papel / Basurero",
                  "Aire Acondicionado / Ventilación",
                  "Señalética y Adhesivos",
                  "Estado Piso y Techo",
                ].map((item, i) => {
                  const val = form.site[i] || "";
                  const E_COL_SITE = {
                    Bueno: "var(--status-ok)",
                    Defectuoso: "var(--status-critical)",
                    Regular: "var(--status-warn)",
                    "No Aplica": "var(--status-offline)",
                  };
                  return (
                    <div
                      key={i}
                      style={{
                        background: "var(--bg-secondary)",
                        borderRadius: 10,
                        border:
                          "2px solid " +
                          (val ? E_COL_SITE[val] || "var(--border-default)" : "var(--border-default)"),
                        padding: "12px 14px",
                        marginBottom: 8,
                        boxShadow: "var(--shadow-sm)",
                      }}
                    >
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "var(--text-secondary)",
                          marginBottom: 8,
                        }}
                      >
                        <span
                          style={{
                            background: "var(--brand-subtle)",
                            color: "var(--brand-light)",
                            borderRadius: 20,
                            fontSize: 10,
                            fontWeight: 800,
                            padding: "1px 8px",
                            marginRight: 8,
                          }}
                        >
                          {i + 1}
                        </span>
                        {item}
                      </p>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 6,
                        }}
                      >
                        {[
                          ["Bueno",      "✓", "var(--status-ok)"],
                          ["Defectuoso", "✗", "var(--status-critical)"],
                          ["Regular",    "⚠", "var(--status-warn)"],
                          ["No Aplica",  "—", "var(--status-offline)"],
                        ].map(([e, icon, col]) => (
                          <button
                            key={e}
                            onClick={() => {
                              const s = { ...form.site };
                              s[i] = s[i] === e ? "" : e;
                              upd("site", s);
                            }}
                            style={{
                              padding: "7px 13px",
                              minHeight: 44,
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: "pointer",
                              border: "1.5px solid " + (val === e ? col : "var(--border-default)"),
                              background: val === e ? col : "var(--bg-secondary)",
                              color: val === e ? "#fff" : "var(--text-muted)",
                              transition: "all .15s",
                            }}
                          >
                            {icon} {e}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}

                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button
                    onClick={() => setTab(0)}
                    style={{
                      flex: 1,
                      padding: 12,
                      background: "var(--bg-tertiary)",
                      color: "var(--text-muted)",
                      border: "none",
                      borderRadius: 12,
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:5,verticalAlign:'middle'}}><polyline points="15 18 9 12 15 6"/></svg>Atrás
                  </button>
                  <button
                    onClick={() => setTab(2)}
                    style={{
                      flex: 2,
                      padding: 12,
                      background: "var(--brand)",
                      color: "#fff",
                      border: "none",
                      borderRadius: 12,
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    Siguiente → Voltaje ⚡
                  </button>
                </div>
              </div>
            )}

            {/* ══ TAB VOLTAJE ══ */}
            {tab === 2 && (
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                    padding: "9px 14px",
                    borderRadius: 10,
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-default)",
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: 12,
                        fontWeight: 800,
                        color: "var(--text-primary)",
                      }}
                    >
                      ⚡ Rangos de voltaje
                    </p>
                    <p
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        marginTop: 1,
                      }}
                    >
                      L–N / L–T:{" "}
                      <strong>
                        {VOLT_MIN}V – {VOLT_MAX}V
                      </strong>{" "}
                      (220V ± 5%)
                    </p>
                    <p
                      style={{
                        fontSize: 11,
                        color: "#a78bfa",
                        marginTop: 2,
                      }}
                    >
                      N–T: máx. <strong>{NT_MAX}V</strong> (toma a tierra)
                    </p>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      alignItems: "flex-end",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        background: "var(--status-ok-dim)",
                        color: "var(--status-ok)",
                        border: "1px solid var(--status-ok-border)",
                        borderRadius: 20,
                        padding: "2px 8px",
                      }}
                    >
                      ✓ En rango
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        background: "var(--status-critical-dim)",
                        color: "var(--status-critical)",
                        border: "1px solid var(--status-critical-border)",
                        borderRadius: 20,
                        padding: "2px 8px",
                      }}
                    >
                      ✗ Fuera L–N/L–T
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        background: "var(--status-info-dim)",
                        color: "#a78bfa",
                        border: "1px solid var(--status-info-border)",
                        borderRadius: 20,
                        padding: "2px 8px",
                      }}
                    >
                      ⚠ Tierra desbal.
                    </span>
                  </div>
                </div>

                {VOLT_ITEMS.map((item) => {
                  const v = form.voltages[item];
                  const estLN = voltEstadoCampo("ln", v.ln);
                  const estLT = voltEstadoCampo("lt", v.lt);
                  const estNT = voltEstadoCampo("nt", v.nt);
                  const estados = [estLN, estLT, estNT].filter(
                    (e) => e !== null,
                  );
                  const hayErr = estados.some((e) => e === "err");
                  const hayOk = estados.length > 0;
                  const borderColor = !hayOk
                    ? "var(--border-default)"
                    : hayErr
                      ? "var(--status-critical-border)"
                      : "var(--status-ok-border)";
                  const headerBg = !hayOk
                    ? "var(--bg-secondary)"
                    : hayErr
                      ? "var(--status-critical-dim)"
                      : "var(--status-ok-dim)";
                  return (
                    <div
                      key={item}
                      style={{
                        borderRadius: 12,
                        border: "2px solid " + borderColor,
                        background: headerBg,
                        marginBottom: 12,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 14px",
                          borderBottom: "1px solid " + borderColor,
                        }}
                      >
                        <p
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "var(--text-primary)",
                          }}
                        >
                          ⚡ {item}
                        </p>
                        {hayOk && (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              borderRadius: 20,
                              padding: "3px 10px",
                              background:
                                estNT === "err" &&
                                  !(estLN === "err" || estLT === "err")
                                  ? "var(--status-caution)"
                                  : hayErr
                                    ? "var(--status-critical)"
                                    : "var(--status-ok)",
                              color: "#fff",
                            }}
                          >
                            {estNT === "err" &&
                              !(estLN === "err" || estLT === "err")
                              ? "⚠ Tierra desbalanceada"
                              : hayErr
                                ? "✗ Fuera de rango"
                                : "✓ En rango"}
                          </span>
                        )}
                      </div>
                      <div style={{ padding: "10px 14px" }}>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 1fr",
                            gap: 8,
                            marginBottom: 10,
                          }}
                        >
                          {[
                            ["ln", "L – N"],
                            ["lt", "L – T"],
                            ["nt", "N – T"],
                          ].map(([f, l]) => {
                            const est = voltEstadoCampo(f, v[f]);
                            const isNT = f === "nt";
                            const cBorder =
                              est === "ok"
                                ? "var(--status-ok-border)"
                                : est === "err"
                                  ? isNT
                                    ? "var(--status-info-border)"
                                    : "var(--status-critical-border)"
                                  : "var(--border-default)";
                            const cBg =
                              est === "ok"
                                ? "var(--status-ok-dim)"
                                : est === "err"
                                  ? isNT
                                    ? "var(--status-info-dim)"
                                    : "var(--status-critical-dim)"
                                  : "var(--bg-secondary)";
                            const cText =
                              est === "ok"
                                ? "var(--status-ok)"
                                : est === "err"
                                  ? isNT
                                    ? "#a78bfa"
                                    : "var(--status-critical)"
                                  : "var(--text-primary)";
                            return (
                              <div key={f}>
                                <label
                                  style={{
                                    ...LBL,
                                    textAlign: "center",
                                    color: isNT ? "#a78bfa" : "var(--text-muted)",
                                  }}
                                >
                                  {l}
                                </label>
                                <div style={{ position: "relative" }}>
                                  <input
                                    type="number"
                                    step="0.1"
                                    placeholder={isNT ? "≤ 5V" : "0.0"}
                                    value={v[f]}
                                    onChange={(e) =>
                                      updV(item, f, e.target.value)
                                    }
                                    style={{
                                      ...INP,
                                      textAlign: "center",
                                      fontSize: 16,
                                      fontWeight: 800,
                                      padding: "10px 4px",
                                      border: "2px solid " + cBorder,
                                      background: cBg,
                                      color: cText,
                                    }}
                                  />
                                  {est ? (
                                    <p
                                      style={{
                                        textAlign: "center",
                                        fontSize: 13,
                                        fontWeight: 700,
                                        marginTop: 3,
                                        color: cText,
                                      }}
                                    >
                                      {est === "ok"
                                        ? "✓ " + v[f] + " V"
                                        : isNT
                                          ? "⚠ " + v[f] + " V"
                                          : "✗ " + v[f] + " V"}
                                    </p>
                                  ) : (
                                    <p
                                      style={{
                                        textAlign: "center",
                                        fontSize: 11,
                                        marginTop: 3,
                                        color: "var(--text-disabled)",
                                      }}
                                    >
                                      {isNT ? "≤ 5V" : "209–231V"}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div
                          style={{
                            padding: "8px 12px",
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            background: !hayOk
                              ? "var(--bg-tertiary)"
                              : hayErr
                                ? "var(--status-critical-dim)"
                                : "var(--status-ok-dim)",
                            border:
                              "1px solid " +
                              (!hayOk
                                ? "var(--border-default)"
                                : hayErr
                                  ? "var(--status-critical-border)"
                                  : "var(--status-ok-border)"),
                            color: !hayOk
                              ? "var(--text-muted)"
                              : hayErr
                                ? "var(--status-critical)"
                                : "var(--status-ok)",
                          }}
                        >
                          <span style={{ fontSize: 16 }}>
                            {!hayOk ? "📋" : hayErr ? "⚠️" : "✅"}
                          </span>
                          <span>
                            {v.obs ||
                              "Ingresa las lecturas para ver el estado"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Resumen global voltajes */}
                {(() => {
                  const errLL = VOLT_ITEMS.some((it) =>
                    [form.voltages[it].ln, form.voltages[it].lt].some(
                      (v) => voltEstadoCampo("ln", v) === "err",
                    ),
                  );
                  const errNT = VOLT_ITEMS.some(
                    (it) =>
                      voltEstadoCampo("nt", form.voltages[it].nt) === "err",
                  );
                  const hayVal = VOLT_ITEMS.some((it) => {
                    const v = form.voltages[it];
                    return v.ln || v.lt || v.nt;
                  });
                  if (!hayVal) return null;
                  return (
                    <div
                      style={{
                        marginBottom: 12,
                        padding: "12px 16px",
                        borderRadius: 12,
                        background: errLL
                          ? "var(--status-critical-dim)"
                          : errNT
                            ? "var(--status-info-dim)"
                            : "var(--status-ok-dim)",
                        border:
                          "2px solid " +
                          (errLL
                            ? "var(--status-critical-border)"
                            : errNT
                              ? "var(--status-info-border)"
                              : "var(--status-ok-border)"),
                      }}
                    >
                      {errLL && (
                        <p
                          style={{
                            fontSize: 13,
                            fontWeight: 800,
                            color: "var(--status-critical)",
                            marginBottom: 3,
                          }}
                        >
                          ✗ Voltajes fuera del rango L–N / L–T
                        </p>
                      )}
                      {errNT && (
                        <p
                          style={{
                            fontSize: 13,
                            fontWeight: 800,
                            color: "#a78bfa",
                            marginBottom: 3,
                          }}
                        >
                          ⚠ Tierra desbalanceada (N–T {">"} {NT_MAX}V) —
                          Revisar toma a tierra
                        </p>
                      )}
                      {!errLL && !errNT && (
                        <p
                          style={{
                            fontSize: 13,
                            fontWeight: 800,
                            color: "var(--status-ok)",
                          }}
                        >
                          ✅ Todos los voltajes dentro del rango
                        </p>
                      )}
                      <p
                        style={{
                          fontSize: 11,
                          color: "var(--text-muted)",
                          marginTop: 3,
                        }}
                      >
                        L–N/L–T: {VOLT_MIN}V–{VOLT_MAX}V · N–T: máx.{" "}
                        {NT_MAX}V
                      </p>
                    </div>
                  );
                })()}

                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <button
                    onClick={() => setTab(1)}
                    style={{
                      flex: 1,
                      padding: 12,
                      background: "var(--bg-tertiary)",
                      color: "var(--text-muted)",
                      border: "none",
                      borderRadius: 12,
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:5,verticalAlign:'middle'}}><polyline points="15 18 9 12 15 6"/></svg>Atrás
                  </button>
                  <button
                    onClick={() => setTab(3)}
                    style={{
                      flex: 2,
                      padding: 12,
                      background: marcaObj?.color || accentBg,
                      color: "#fff",
                      border: "none",
                      borderRadius: 12,
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    Siguiente → Dispositivos 🔧
                  </button>
                </div>
              </div>
            )}

            {/* ══ TAB DISPOSITIVOS ══ */}
            {tab === 3 && (
              <div>
                {!form.atmTipo || !form.marca ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "30px 20px",
                      color: "var(--text-muted)",
                    }}
                  >
                    <p style={{ fontSize: 32, marginBottom: 8 }}>⚠️</p>
                    <p style={{ fontWeight: 700 }}>
                      Selecciona tipo y marca en la pestaña Info
                    </p>
                  </div>
                ) : (
                  <>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 12,
                        padding: "10px 14px",
                        background: tipoObj.bg,
                        borderRadius: 10,
                        border: "1px solid " + tipoObj.border,
                      }}
                    >
                      <span style={{ fontSize: 18 }}>{tipoObj.emoji}</span>
                      <div>
                        <p
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            color: tipoObj.color,
                          }}
                        >
                          Cajero {tipoObj.label} ·{" "}
                          <span style={{ color: marcaObj?.color }}>
                            {form.marca}
                          </span>
                          {form.punto && (
                            <span
                              style={{ color: "var(--text-muted)", fontWeight: 600 }}
                            >
                              {" "}
                              · {form.punto}
                            </span>
                          )}
                        </p>
                        <p style={{ fontSize: 10, color: "var(--text-muted)" }}>
                          {filled}/{total} ítems evaluados
                        </p>
                      </div>
                    </div>
                    {sections.map((sec) => (
                      <SectionBlock
                        key={sec.id + sec.title}
                        section={sec}
                        devices={form.devices}
                        updateDevice={updD}
                        accentColor={
                          sec.tipo === "disp"
                            ? marcaObj?.color || "#1d4ed8"
                            : sec.tipo === "dep"
                              ? "#166534"
                              : marcaObj?.color || tipoObj.color
                        }
                      />
                    ))}
                  </>
                )}
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <button
                    onClick={() => setTab(2)}
                    style={{
                      flex: 1,
                      padding: 12,
                      background: "var(--bg-tertiary)",
                      color: "var(--text-muted)",
                      border: "none",
                      borderRadius: 12,
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:5,verticalAlign:'middle'}}><polyline points="15 18 9 12 15 6"/></svg>Atrás
                  </button>
                  <button
                    onClick={() => setTab(4)}
                    style={{
                      flex: 2,
                      padding: 12,
                      background: marcaObj?.color || accentBg,
                      color: "#fff",
                      border: "none",
                      borderRadius: 12,
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    Siguiente → Cierre 📋
                  </button>
                </div>
              </div>
            )}

            {/* ══ TAB CIERRE ══ */}
            {tab === 4 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                {[
                  ["obsGen", "Observaciones Generales", 3, true],
                  ["rec", "Recomendaciones", 3, false],
                ].map(([f, l, r, required]) => (
                  <div key={f}>
                    <label style={LBL}>
                      {l}
                      {required && (
                        <span style={{ color: "var(--status-critical)", marginLeft: 4 }}>*</span>
                      )}
                    </label>
                    <textarea
                      rows={r}
                      value={form[f]}
                      onChange={(e) => upd(f, e.target.value)}
                      style={{
                        ...INP,
                        resize: "none",
                        ...(required && !form[f]?.trim()
                          ? { borderColor: "var(--status-critical-border)" }
                          : {}),
                      }}
                      placeholder={required ? l + "… (obligatorio)" : l + "…"}
                    />
                  </div>
                ))}
                <div>
                  <label style={LBL}>Estado Final del Equipo</label>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 7,
                    }}
                  >
                    {[
                      ["Operativo",                    "✓", "var(--status-ok)",       "var(--status-ok-dim)"],
                      ["Inoperativo",                  "✗", "var(--status-critical)", "var(--status-critical-dim)"],
                      ["Operativo con observaciones",  "⚠", "var(--status-warn)",     "var(--status-warn-dim)"],
                    ].map(([s, icon, c, bg]) => (
                      <button
                        key={s}
                        onClick={() => upd("estFinal", s)}
                        style={{
                          padding: "13px 16px",
                          minHeight: 44,
                          borderRadius: 10,
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: "pointer",
                          border: "2px solid " + (form.estFinal === s ? c : "var(--border-default)"),
                          background: form.estFinal === s ? bg : "var(--bg-secondary)",
                          color: form.estFinal === s ? c : "var(--text-muted)",
                          textAlign: "left",
                        }}
                      >
                        {icon} {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => setTab(3)}
                    style={{
                      flex: 1,
                      padding: 12,
                      background: "var(--bg-tertiary)",
                      color: "var(--text-muted)",
                      border: "none",
                      borderRadius: 12,
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:5,verticalAlign:'middle'}}><polyline points="15 18 9 12 15 6"/></svg>Atrás
                  </button>
                  <button
                    onClick={() => setTab(5)}
                    style={{
                      flex: 2,
                      padding: 12,
                      background: marcaObj?.color || accentBg,
                      color: "#fff",
                      border: "none",
                      borderRadius: 12,
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    Siguiente → Fotos 📸
                  </button>
                </div>
              </div>
            )}

            {/* ══ TAB FOTOS ══ */}
            {tab === 5 && (
              <div>
                <PhotoUploader
                  label="📸 Antes del Mantenimiento"
                  photos={fotosAntes}
                  onChange={setFotosAntes}
                  min={5}
                  max={20}
                />
                <PhotoUploader
                  label="📸 Después del Mantenimiento"
                  photos={fotosDespues}
                  onChange={setFotosDespues}
                  min={5}
                  max={20}
                />

                {/* Resumen */}
                <div
                  style={{
                    background: "var(--bg-secondary)",
                    borderRadius: 14,
                    border: "1px solid var(--border-default)",
                    padding: "16px 14px",
                    marginTop: 4,
                    marginBottom: 16,
                  }}
                >
                  <p
                    style={{
                      fontWeight: 800,
                      fontSize: 14,
                      color: "var(--text-primary)",
                      marginBottom: 12,
                    }}
                  >
                    📊 Resumen
                  </p>
                  {tipoObj && form.marca && (
                    <div
                      style={{
                        background: tipoObj.bg,
                        border: "1px solid " + tipoObj.border,
                        borderRadius: 8,
                        padding: "8px 12px",
                        marginBottom: 12,
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <span style={{ fontSize: 18 }}>{tipoObj.emoji}</span>
                      <div>
                        <p
                          style={{
                            fontWeight: 800,
                            color: tipoObj.color,
                            fontSize: 13,
                          }}
                        >
                          Cajero {tipoObj.label}
                          <span
                            style={{
                              color: marcaObj?.color,
                              marginLeft: 8,
                            }}
                          >
                            · {form.marca}
                          </span>
                        </p>
                        {form.punto && (
                          <p
                            style={{
                              fontSize: 11,
                              color: "var(--text-muted)",
                              marginTop: 1,
                            }}
                          >
                            {form.punto}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 8,
                      marginBottom: 12,
                    }}
                  >
                    {[
                      ["Fecha", form.fecha || "—"],
                      ["ID ATM", form.idAtm || "—"],
                      ["Técnico", form.tec || "—"],
                      ["Modelo", form.modelo || "—"],
                      ["Estado", form.estFinal || "—"],
                      ["Avance", filled + "/" + total + " (" + pct + "%)"],
                    ].map(([k, v]) => (
                      <div
                        key={k}
                        style={{
                          background: "var(--bg-tertiary)",
                          borderRadius: 8,
                          padding: "9px 11px",
                          border: "1px solid var(--border-default)",
                        }}
                      >
                        <p
                          style={{
                            fontSize: 9,
                            color: "var(--text-muted)",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            marginBottom: 2,
                          }}
                        >
                          {k}
                        </p>
                        <p
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "var(--text-primary)",
                          }}
                        >
                          {v}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: 8,
                    }}
                  >
                    {["Bueno", "Defectuoso", "Regular"].map((e) => {
                      const cnt = sections.reduce(
                        (a, s) =>
                          a +
                          s.items.filter(
                            (_, ii) =>
                              form.devices[s.id + "_" + ii]?.est === e,
                          ).length,
                        0,
                      );
                      return (
                        <div
                          key={e}
                          style={{
                            textAlign: "center",
                            background: "var(--bg-tertiary)",
                            borderRadius: 10,
                            padding: "10px 4px",
                            border:
                              "2px solid " +
                              (cnt > 0 ? E_COL[e] : "var(--border-default)"),
                          }}
                        >
                          <p
                            style={{
                              fontSize: 22,
                              fontWeight: 800,
                              color: E_COL[e],
                            }}
                          >
                            {cnt}
                          </p>
                          <p
                            style={{
                              fontSize: 10,
                              color: "var(--text-muted)",
                              fontWeight: 600,
                            }}
                          >
                            {e}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={() => setTab(4)}
                  style={{
                    width: "100%",
                    padding: 12,
                    background: "var(--bg-tertiary)",
                    color: "var(--text-muted)",
                    border: "none",
                    borderRadius: 12,
                    fontWeight: 800,
                    cursor: "pointer",
                    marginBottom: 10,
                  }}
                >
                  ← Atrás
                </button>

                {(() => {
                  const formCompleto = tabOk.every(Boolean);
                  const deshabilitado = enviando || !formCompleto;
                  const pendientes = tabOk.filter(Boolean).length;
                  return (
                    <>
                      {!formCompleto && (
                        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--status-warn)', marginBottom: 8, fontWeight: 600 }}>
                          {pendientes}/6 secciones completas — revisa las pestañas con indicador amarillo
                        </div>
                      )}
                      <button
                        onClick={handleGenerarPDF}
                        disabled={deshabilitado}
                        style={{
                          width: "100%",
                          padding: 16,
                          border: "none",
                          borderRadius: 14,
                          fontWeight: 800,
                          fontSize: 16,
                          cursor: deshabilitado ? "not-allowed" : "pointer",
                          background: enviando
                            ? "#475569"
                            : !formCompleto
                              ? "#334155"
                              : marcaObj?.color || "#0f172a",
                          color: !formCompleto ? "var(--text-disabled)" : "#fff",
                          boxShadow: formCompleto ? "0 4px 15px rgba(0,0,0,.3)" : "none",
                          transition: "background .2s",
                          opacity: deshabilitado && !enviando ? 0.6 : 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 10,
                        }}
                      >
                        {enviando && (
                          <div style={{
                            width: 18, height: 18,
                            border: "2px solid rgba(255,255,255,0.3)",
                            borderTopColor: "#fff",
                            borderRadius: "50%",
                            animation: "spin 0.7s linear infinite",
                            flexShrink: 0,
                          }} />
                        )}
                        {enviando ? "Enviando…" : "Generar PDF y Enviar Correo"}
                      </button>
                    </>
                  );
                })()}

              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
