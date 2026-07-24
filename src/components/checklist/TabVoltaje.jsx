import React from 'react';
import { VOLT_ITEMS, VOLT_MIN, VOLT_MAX, NT_MAX, voltEstadoCampo } from '../../constants/voltages.js';
import { INP, LBL } from './styles.js';

export default function TabVoltaje({ form, updV, setTab, marcaObj, accentBg }) {
  return (
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
              color: "var(--status-caution)",
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
              color: "var(--status-caution)",
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
                          ? "var(--status-caution)"
                          : "var(--status-critical)"
                        : "var(--text-primary)";
                  return (
                    <div key={f}>
                      <label
                        style={{
                          ...LBL,
                          textAlign: "center",
                          color: isNT ? "var(--status-caution)" : "var(--text-muted)",
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
                  color: "var(--status-caution)",
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
  );
}
