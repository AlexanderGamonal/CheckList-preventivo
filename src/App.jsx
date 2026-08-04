import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from './hooks/useTheme.js';
import { useMpDraft } from './hooks/useMpDraft.js';
import { useMpSubmit } from './hooks/useMpSubmit.js';
import Toast from './components/Toast.jsx';
import PdfView from './components/PdfView.jsx';
import LeaveConfirmModal from './components/checklist/LeaveConfirmModal.jsx';
import ChecklistHeader from './components/checklist/ChecklistHeader.jsx';
import TabInfo from './components/checklist/TabInfo.jsx';
import TabSite from './components/checklist/TabSite.jsx';
import TabVoltaje from './components/checklist/TabVoltaje.jsx';
import TabDispositivos from './components/checklist/TabDispositivos.jsx';
import TabCierre from './components/checklist/TabCierre.jsx';
import TabFotos from './components/checklist/TabFotos.jsx';
import { ATM_TIPOS, MARCAS_POR_TIPO, MARCA_CONFIG, normalizeMarca } from './constants/atm.jsx';
import { voltMensaje } from './constants/voltages.js';
import { getSections, initDevicesFor } from './constants/devices.js';
import './pdf-styles.css';

/* ══════════════════════════════════════
   APP PRINCIPAL
══════════════════════════════════════ */
export default function App() {
  const navigate = useNavigate();
  const { theme, toggle: toggleTheme } = useTheme();

  const {
    form, setForm,
    fotosAntes, setFotosAntes,
    fotosDespues, setFotosDespues,
    tab, setTab,
    storageError,
    clearDraft,
  } = useMpDraft();

  const [toast, setToast] = useState(null);
  const [atmNotFound, setAtmNotFound] = useState(false);
  const [hoveredTab, setHoveredTab] = useState(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [tab]);

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
  const marcaObj = form.marca ? MARCA_CONFIG[normalizeMarca(form.marca)] : null;
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
  const progressColor = pct >= 100 ? 'var(--status-ok)' : pct >= 50 ? 'var(--status-warn)' : 'var(--status-critical)';

  const accentBg = tipoObj?.color || "#1e3a5f";

  // Indicadores de completitud por pestaña (solo las obligatorias)
  // ⚠️ El orden debe coincidir con el array TABS de ChecklistHeader.jsx
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

  const { enviando, sendStep, handleGenerarPDF } = useMpSubmit({
    form, sections, fotosAntes, fotosDespues,
    setForm, setFotosAntes, setFotosDespues, setTab,
    clearDraft, setToast,
  });

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
          <LeaveConfirmModal
            pct={pct}
            onCancel={() => setShowLeaveModal(false)}
            onConfirm={() => { setShowLeaveModal(false); navigate('/'); }}
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

          {/* Overlay pantalla completa durante el envío */}
          {enviando && (
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

          <ChecklistHeader
            pct={pct}
            progressColor={progressColor}
            theme={theme}
            toggleTheme={toggleTheme}
            tab={tab}
            setTab={setTab}
            hoveredTab={hoveredTab}
            setHoveredTab={setHoveredTab}
            tabOk={tabOk}
            storageError={storageError}
            onBack={() => pct > 0 ? setShowLeaveModal(true) : navigate('/')}
          />

          <div
            style={{
              background: "var(--bg-base)",
              minHeight: "calc(100vh - 88px)",
              padding: "16px 14px",
            }}
          >
            {/* ══ TAB INFO ══ */}
            {tab === 0 && (
              <TabInfo
                form={form}
                upd={upd}
                atmNotFound={atmNotFound}
                setAtmNotFound={setAtmNotFound}
                cambiarTipo={cambiarTipo}
                cambiarMarca={cambiarMarca}
                handleTecnicoAutofill={handleTecnicoAutofill}
                handleAtmAutofill={handleAtmAutofill}
                marcasDisp={marcasDisp}
                tipoObj={tipoObj}
                marcaObj={marcaObj}
                sections={sections}
                setToast={setToast}
                setTab={setTab}
                accentBg={accentBg}
              />
            )}

            {/* ══ TAB SITE ══ */}
            {tab === 1 && (
              <TabSite form={form} upd={upd} setTab={setTab} />
            )}

            {/* ══ TAB VOLTAJE ══ */}
            {tab === 2 && (
              <TabVoltaje
                form={form}
                updV={updV}
                setTab={setTab}
                marcaObj={marcaObj}
                accentBg={accentBg}
              />
            )}

            {/* ══ TAB DISPOSITIVOS ══ */}
            {tab === 3 && (
              <TabDispositivos
                form={form}
                updD={updD}
                sections={sections}
                tipoObj={tipoObj}
                marcaObj={marcaObj}
                filled={filled}
                total={total}
                setTab={setTab}
                accentBg={accentBg}
              />
            )}

            {/* ══ TAB CIERRE ══ */}
            {tab === 4 && (
              <TabCierre
                form={form}
                upd={upd}
                marcaObj={marcaObj}
                accentBg={accentBg}
                setTab={setTab}
              />
            )}

            {/* ══ TAB FOTOS ══ */}
            {tab === 5 && (
              <TabFotos
                fotosAntes={fotosAntes}
                setFotosAntes={setFotosAntes}
                fotosDespues={fotosDespues}
                setFotosDespues={setFotosDespues}
                tipoObj={tipoObj}
                marcaObj={marcaObj}
                form={form}
                filled={filled}
                total={total}
                pct={pct}
                sections={sections}
                tabOk={tabOk}
                enviando={enviando}
                setTab={setTab}
                handleGenerarPDF={handleGenerarPDF}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
