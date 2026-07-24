import React from 'react';
import AtmIdInput from '../AtmIdInput.jsx';
import TecnicoNumInput from '../TecnicoNumInput.jsx';
import { ATM_TIPOS, MARCA_CONFIG, BrandLogo, LOGO_MAP } from '../../constants/atm.jsx';
import { INP, LBL } from './styles.js';

export default function TabInfo({
  form, upd, atmNotFound, setAtmNotFound,
  cambiarTipo, cambiarMarca, handleTecnicoAutofill, handleAtmAutofill,
  marcasDisp, tipoObj, marcaObj, sections, setToast, setTab, accentBg,
}) {
  return (
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
  );
}
