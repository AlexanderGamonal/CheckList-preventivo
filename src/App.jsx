import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Toast from './components/Toast.jsx';
import SectionBlock from './components/SectionBlock.jsx';
import PhotoUpload from './components/PhotoUpload.jsx';
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
  padding: "9px 12px",
  borderRadius: 8,
  border: "1px solid #e2e8f0",
  fontSize: 14,
  background: "#fff",
  color: "#1e293b",
  outline: "none",
};
const LBL = {
  display: "block",
  fontSize: 10,
  fontWeight: 700,
  color: "#94a3b8",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: 5,
};

/* ══════════════════════════════════════
   APP PRINCIPAL
══════════════════════════════════════ */
export default function App() {
  const DRAFT_KEY = 'checklist_draft';

  function loadDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch { return null; }
  }

  function saveDraft(form, fotosAntes, fotosDespues, tab) {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, fotosAntes, fotosDespues, tab }));
    } catch {
      // localStorage lleno (fotos muy pesadas) — ignorar silenciosamente
    }
  }

  function clearDraft() {
    localStorage.removeItem(DRAFT_KEY);
  }

  const draft = loadDraft();
  const [form, setForm] = useState(draft?.form || initForm());
  const [fotosAntes, setFotosAntes] = useState(draft?.fotosAntes || []);
  const [fotosDespues, setFotosDespues] = useState(draft?.fotosDespues || []);
  const [tab, setTab] = useState(draft?.tab || 0);
  const [toast, setToast] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [atmNotFound, setAtmNotFound] = useState(false);
  const [hoveredTab, setHoveredTab] = useState(null);

  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [tab]);

  // Guardar borrador en cada cambio
  useEffect(() => { saveDraft(form, fotosAntes, fotosDespues, tab); }, [form, fotosAntes, fotosDespues, tab]);

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
    [0,1,2,3,4,5,6].every(i => !!form.site[i]),
    // 2 Voltaje — Cable interno ATM y UPS deben tener ln o lt
    ["Cable interno ATM","UPS"].every(k => form.voltages[k]?.ln !== "" || form.voltages[k]?.lt !== ""),
    // 3 Dispositivos — todos con estado
    sections.length > 0 && sections.every(s => s.items.every((_, ii) => !!form.devices[s.id + "_" + ii]?.est)),
    // 4 Cierre
    !!(form.estFinal && form.obsGen?.trim() && form.rec?.trim()),
    // 5 Fotos — al menos 1 antes y 1 después
    fotosAntes.length > 0 && fotosDespues.length > 0,
  ];

  function validar() {
    // ── Info básica ─────────────────────────────────────────────────
    if (!form.atmTipo) return "Selecciona el tipo de cajero";
    if (!form.marca)   return "Selecciona la marca del cajero";
    if (!form.punto)   return "Ingresa el Nombre del Punto / Agencia";
    if (!form.fecha)   return "Ingresa la fecha de mantenimiento";
    if (!form.idAtm)   return "Ingresa el ID del ATM";
    if (!form.tec)     return "Ingresa el nombre del técnico";

    // ── Site: todos los 7 ítems obligatorios ────────────────────────
    const SITE_ITEMS = [
      "Iluminación","Ubicación / Accesibilidad","Limpieza de Cabina",
      "Tacho de Papel / Basurero","Aire Acondicionado / Ventilación",
      "Señalética y Adhesivos","Estado Piso y Techo",
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
    if (!form.estFinal)          return "Cierre: selecciona el Estado Final";
    if (!form.obsGen?.trim())    return "Cierre: completa las Observaciones Generales";
    if (!form.rec?.trim())       return "Cierre: completa las Recomendaciones";

    // ── Fotos ────────────────────────────────────────────────────────
    if (fotosAntes.length === 0)   return "Fotos: agrega al menos 1 foto de Antes";
    if (fotosDespues.length === 0) return "Fotos: agrega al menos 1 foto de Después";

    return null;
  }

  async function handleGenerarPDF() {
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
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {toast && (
        <Toast
          msg={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
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
        {/* HEADER */}
        <div
          style={{
            background: "var(--bg-primary)",
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
                <p
                  style={{
                    color: "#fff",
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
                  color: tipoObj ? tipoObj.color : "#64748b",
                  fontSize: 11,
                  fontWeight: 600,
                  marginTop: 2,
                }}
              >
                {tipoObj
                  ? tipoObj.emoji + " " + tipoObj.label
                  : "Selecciona tipo de cajero"}
                {form.punto && (
                  <span style={{ color: "#64748b" }}>
                    {" "}
                    · {form.punto}
                  </span>
                )}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
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
                  background: tab === i ? "#fff" : hoveredTab === i ? "rgba(255,255,255,0.1)" : "transparent",
                  color: tab === i ? "#0f172a" : hoveredTab === i ? "#cbd5e1" : "#64748b",
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
            background: "#fff",
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
                  <label style={{ ...LBL, whiteSpace: "nowrap" }}>Fecha</label>
                  <input
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
                      background: form.tec ? "#f0fdf4" : "#f8fafc",
                      borderColor: form.tec ? "#16a34a" : "#e2e8f0",
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
                      borderColor: form.punto ? "#004A97" : "#e2e8f0",
                      background: form.punto ? "#e8f0fb" : "#fff",
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
                    background: "#f1f5f9",
                    color: form.marca ? "#1e293b" : "#94a3b8",
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
                <div style={{ marginTop: 16, padding: "14px", background: "#fffbeb", borderRadius: 12, border: "1.5px solid #fcd34d" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#92400e", marginBottom: 12 }}>
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
                          background: sel ? t.bg : "#fff",
                          transition: "all .2s",
                        }}>
                          <div style={{ fontSize: 20, marginBottom: 2 }}>{t.emoji}</div>
                          <div style={{ fontSize: 11, fontWeight: 800, color: sel ? t.color : "#475569" }}>{t.label}</div>
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
                              background: sel ? mc.bg : "#fff",
                              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                              transition: "all .2s",
                            }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 36, padding: "4px 8px", background: sel ? "#fff" : "#f8fafc", borderRadius: 6, border: "1px solid " + (sel ? mc.border : "#e2e8f0") }}>
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
                        fontSize: 11, background: "#fff",
                        border: "1px solid " + tipoObj.border,
                        color: tipoObj.color, borderRadius: 20,
                        padding: "2px 9px", fontWeight: 600,
                      }}>
                        {s.title} <span style={{ color: "#94a3b8" }}>({s.items.length})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* SIGUIENTE */}
              <button
                onClick={() => {
                  if (!form.atmTipo || !form.marca) {
                    setToast({ msg: "Selecciona tipo y marca del cajero", color: "#dc2626" });
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
                  background: "#f0f4ff",
                  border: "1px solid #c7d7fd",
                }}
              >
                <span style={{ fontSize: 22 }}>🏢</span>
                <div>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: "#3730a3",
                    }}
                  >
                    Evaluación del SITE
                  </p>
                  <p style={{ fontSize: 10, color: "#6366f1" }}>
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
                  Bueno: "#16a34a",
                  Defectuoso: "#dc2626",
                  Regular: "#d97706",
                  "No Aplica": "#64748b",
                };
                return (
                  <div
                    key={i}
                    style={{
                      background: "#fff",
                      borderRadius: 10,
                      border:
                        "2px solid " +
                        (val ? E_COL_SITE[val] || "#e2e8f0" : "#e2e8f0"),
                      padding: "12px 14px",
                      marginBottom: 8,
                      boxShadow: "0 1px 3px rgba(0,0,0,.05)",
                    }}
                  >
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#334155",
                        marginBottom: 8,
                      }}
                    >
                      <span
                        style={{
                          background: "#e0e7ff",
                          color: "#3730a3",
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
                        "Bueno",
                        "Defectuoso",
                        "Regular",
                        "No Aplica",
                      ].map((e) => (
                        <button
                          key={e}
                          onClick={() => {
                            const s = { ...form.site };
                            s[i] = s[i] === e ? "" : e;
                            upd("site", s);
                          }}
                          style={{
                            padding: "7px 13px",
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                            border:
                              "1.5px solid " +
                              (val === e ? E_COL_SITE[e] : "#e2e8f0"),
                            background:
                              val === e ? E_COL_SITE[e] : "#fff",
                            color: val === e ? "#fff" : "#94a3b8",
                            transition: "all .15s",
                          }}
                        >
                          {val === e ? "✓ " : ""}
                          {e}
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
                    background: "#f1f5f9",
                    color: "#475569",
                    border: "none",
                    borderRadius: 12,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  ← Atrás
                </button>
                <button
                  onClick={() => setTab(2)}
                  style={{
                    flex: 2,
                    padding: 12,
                    background: "#3730a3",
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
                  background: "#f0f9ff",
                  border: "1px solid #bae6fd",
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: "#0369a1",
                    }}
                  >
                    ⚡ Rangos de voltaje
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      color: "#0284c7",
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
                      color: "#7c3aed",
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
                      background: "#dcfce7",
                      color: "#16a34a",
                      border: "1px solid #86efac",
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
                      background: "#fef2f2",
                      color: "#dc2626",
                      border: "1px solid #fca5a5",
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
                      background: "#f5f3ff",
                      color: "#7c3aed",
                      border: "1px solid #c4b5fd",
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
                  ? "#e2e8f0"
                  : hayErr
                    ? "#fca5a5"
                    : "#86efac";
                const headerBg = !hayOk
                  ? "#f8fafc"
                  : hayErr
                    ? "#fef2f2"
                    : "#f0fdf4";
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
                          color: "#1e293b",
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
                                ? "#7c3aed"
                                : hayErr
                                  ? "#dc2626"
                                  : "#16a34a",
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
                              ? "#86efac"
                              : est === "err"
                                ? isNT
                                  ? "#c4b5fd"
                                  : "#fca5a5"
                                : "#e2e8f0";
                          const cBg =
                            est === "ok"
                              ? "#f0fdf4"
                              : est === "err"
                                ? isNT
                                  ? "#f5f3ff"
                                  : "#fef2f2"
                                : "#fff";
                          const cText =
                            est === "ok"
                              ? "#16a34a"
                              : est === "err"
                                ? isNT
                                  ? "#7c3aed"
                                  : "#dc2626"
                                : "#1e293b";
                          return (
                            <div key={f}>
                              <label
                                style={{
                                  ...LBL,
                                  textAlign: "center",
                                  color: isNT ? "#7c3aed" : "#94a3b8",
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
                                {est && (
                                  <p
                                    style={{
                                      textAlign: "center",
                                      fontSize: 9,
                                      fontWeight: 700,
                                      marginTop: 3,
                                      color: cText,
                                    }}
                                  >
                                    {est === "ok"
                                      ? isNT
                                        ? "✓ " + v[f] + " V"
                                        : "✓ " + v[f] + " V"
                                      : isNT
                                        ? "⚠ " + v[f] + " V"
                                        : "✗ " + v[f] + " V"}
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
                            ? "#f1f5f9"
                            : hayErr
                              ? "#fef2f2"
                              : "#f0fdf4",
                          border:
                            "1px solid " +
                            (!hayOk
                              ? "#e2e8f0"
                              : hayErr
                                ? "#fca5a5"
                                : "#86efac"),
                          color: !hayOk
                            ? "#94a3b8"
                            : hayErr
                              ? "#dc2626"
                              : "#16a34a",
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
                        ? "#fef2f2"
                        : errNT
                          ? "#f5f3ff"
                          : "#f0fdf4",
                      border:
                        "2px solid " +
                        (errLL
                          ? "#fca5a5"
                          : errNT
                            ? "#c4b5fd"
                            : "#86efac"),
                    }}
                  >
                    {errLL && (
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 800,
                          color: "#dc2626",
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
                          color: "#7c3aed",
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
                          color: "#16a34a",
                        }}
                      >
                        ✅ Todos los voltajes dentro del rango
                      </p>
                    )}
                    <p
                      style={{
                        fontSize: 11,
                        color: "#64748b",
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
                    background: "#f1f5f9",
                    color: "#475569",
                    border: "none",
                    borderRadius: 12,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  ← Atrás
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
                    color: "#94a3b8",
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
                            style={{ color: "#64748b", fontWeight: 600 }}
                          >
                            {" "}
                            · {form.punto}
                          </span>
                        )}
                      </p>
                      <p style={{ fontSize: 10, color: "#64748b" }}>
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
                    background: "#f1f5f9",
                    color: "#475569",
                    border: "none",
                    borderRadius: 12,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  ← Atrás
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
                ["obsGen", "Observaciones Generales", 3],
                ["rec", "Recomendaciones", 3],
              ].map(([f, l, r]) => (
                <div key={f}>
                  <label style={LBL}>{l}</label>
                  <textarea
                    rows={r}
                    value={form[f]}
                    onChange={(e) => upd(f, e.target.value)}
                    style={{ ...INP, resize: "none" }}
                    placeholder={l + "…"}
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
                    ["Operativo", "#16a34a", "#f0fdf4"],
                    ["Inoperativo", "#dc2626", "#fef2f2"],
                    ["Operativo con observaciones", "#d97706", "#fffbeb"],
                  ].map(([s, c, bg]) => (
                    <button
                      key={s}
                      onClick={() => upd("estFinal", s)}
                      style={{
                        padding: "13px 16px",
                        borderRadius: 10,
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: "pointer",
                        border:
                          "2px solid " +
                          (form.estFinal === s ? c : "#e2e8f0"),
                        background: form.estFinal === s ? bg : "#fff",
                        color: form.estFinal === s ? c : "#94a3b8",
                        textAlign: "left",
                      }}
                    >
                      {form.estFinal === s ? "✓ " : ""}
                      {s}
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
                    background: "#f1f5f9",
                    color: "#475569",
                    border: "none",
                    borderRadius: 12,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  ← Atrás
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
              <PhotoUpload
                label="📸 Antes del Mantenimiento"
                photos={fotosAntes}
                setPhotos={setFotosAntes}
              />
              <PhotoUpload
                label="📸 Después del Mantenimiento"
                photos={fotosDespues}
                setPhotos={setFotosDespues}
              />

              {/* Resumen */}
              <div
                style={{
                  background: "#f8fafc",
                  borderRadius: 14,
                  border: "1px solid #e2e8f0",
                  padding: "16px 14px",
                  marginTop: 4,
                  marginBottom: 16,
                }}
              >
                <p
                  style={{
                    fontWeight: 800,
                    fontSize: 14,
                    color: "#0f172a",
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
                            color: "#64748b",
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
                        background: "#fff",
                        borderRadius: 8,
                        padding: "9px 11px",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <p
                        style={{
                          fontSize: 9,
                          color: "#94a3b8",
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
                          color: "#1e293b",
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
                          background: "#fff",
                          borderRadius: 10,
                          padding: "10px 4px",
                          border:
                            "2px solid " +
                            (cnt > 0 ? E_COL[e] : "#e2e8f0"),
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
                            color: "#64748b",
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
                  background: "#f1f5f9",
                  color: "#475569",
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
                      <div style={{ textAlign: 'center', fontSize: 11, color: '#f59e0b', marginBottom: 8, fontWeight: 600 }}>
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
                        color: !formCompleto ? "#64748b" : "#fff",
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
    </div>
  );
}
