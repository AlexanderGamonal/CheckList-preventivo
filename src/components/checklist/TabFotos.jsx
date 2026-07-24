import React from 'react';
import PhotoUploader from '../PhotoUploader.jsx';
import { E_COL } from '../../constants/devices.js';

export default function TabFotos({
  fotosAntes, setFotosAntes, fotosDespues, setFotosDespues,
  tipoObj, marcaObj, form, filled, total, pct, sections, tabOk,
  enviando, setTab, handleGenerarPDF,
}) {
  return (
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
                  ? "var(--text-disabled)"
                  : !formCompleto
                    ? "var(--bg-tertiary)"
                    : marcaObj?.color || "var(--brand-dark)",
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
  );
}
