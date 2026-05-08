import React from 'react';
import { ATM_TIPOS, BrandLogo } from '../constants/atm.jsx';
import { VOLT_ITEMS, VOLT_MIN, VOLT_MAX, NT_MAX, voltEstadoCampo } from '../constants/voltages.js';

export default function PdfView({ form, fotosAntes, fotosDespues, sections }) {
  const ck = (f) => (f ? "✓" : "");
  const stCls = {
    Operativo: "pdf-ok",
    Inoperativo: "pdf-bad",
    "Operativo con observaciones": "pdf-wrn",
  };
  const tipoObj =
    ATM_TIPOS.find((t) => t.id === form.atmTipo) || ATM_TIPOS[0];
  const badgeCls =
    "pdf-badge badge-" +
    (form.atmTipo === "multifuncion"
      ? "multi"
      : form.atmTipo === "depositos"
        ? "dep"
        : "disp");

  return (
    <div>
      {/* ═══ PÁGINA 1: Datos + Checklist ═══ */}
      <div className="pdf-page">
      <div className="pdf-title">
        CHECK LIST MANTENIMIENTO PREVENTIVO ATM{form.cliente ? ` — ${form.cliente}` : ""}
      </div>
      <div className="pdf-subtitle">
        <span className={badgeCls}>
          {tipoObj.emoji} Cajero {tipoObj.label}
        </span>
        {form.marca && (
          <span style={{ marginLeft: 12 }}>
            🏭 {form.marca}
            {form.modelo ? " — " + form.modelo : ""}
          </span>
        )}
      </div>

      {/* DATOS GENERALES */}
      <table className="pdf-table" style={{ marginTop: 4 }}>
        <tbody>
          <tr>
            <td className="pdf-lbl">Punto / Agencia:</td>
            <td
              className="pdf-val"
              colSpan={3}
              style={{ fontWeight: 700 }}
            >
              {form.punto}
            </td>
          </tr>
          <tr>
            <td className="pdf-lbl">Fecha Mantenimiento:</td>
            <td className="pdf-val" style={{ width: "26%" }}>
              {form.fecha}
            </td>
            <td className="pdf-lbl" style={{ width: "16%" }}>
              N° Interno:
            </td>
            <td className="pdf-val">{form.num}</td>
          </tr>
          <tr>
            <td className="pdf-lbl">Técnico Responsable:</td>
            <td className="pdf-val" colSpan={3}>
              {form.tec}
            </td>
          </tr>
          <tr>
            <td className="pdf-lbl">ID ATM:</td>
            <td className="pdf-val">{form.idAtm}</td>
            <td className="pdf-lbl">Marca / Modelo:</td>
            <td className="pdf-val">
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <BrandLogo marca={form.marca} height={18} />
                {form.marca}{form.modelo ? " — " + form.modelo : ""}
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* VOLTAJES */}
      <table className="pdf-table" style={{ marginTop: 5 }}>
        <thead>
          <tr>
            <th className="pdf-vh" colSpan={6}>
              Mediciones de Voltajes · L–N/L–T: {VOLT_MIN}V–{VOLT_MAX}V
              (±5%) · N–T: máx. {NT_MAX}V
            </th>
          </tr>
          <tr>
            <th
              className="pdf-vsh"
              style={{ textAlign: "left", paddingLeft: 4, width: "28%" }}
            >
              Punto
            </th>
            <th className="pdf-vsh" style={{ width: "10%" }}>
              L – N (V)
            </th>
            <th className="pdf-vsh" style={{ width: "10%" }}>
              L – T (V)
            </th>
            <th className="pdf-vsh" style={{ width: "10%" }}>
              N – T (V)
            </th>
            <th className="pdf-vsh" style={{ width: "9%" }}>
              Estado
            </th>
            <th className="pdf-vsh">Observaciones</th>
          </tr>
        </thead>
        <tbody>
          {VOLT_ITEMS.map((item) => {
            const v = form.voltages[item];
            const hayErrLL = [v.ln, v.lt].some(
              (x) => voltEstadoCampo("ln", x) === "err",
            );
            const hayErrNT = voltEstadoCampo("nt", v.nt) === "err";
            const hayErr = hayErrLL || hayErrNT;
            const hayVal = [v.ln, v.lt, v.nt].some((x) => x !== "");
            const estBg = !hayVal ? "" : hayErr ? "#FFCCCC" : "#E2EFDA";
            const estClr = !hayVal
              ? "#64748b"
              : hayErr
                ? "#9C0006"
                : "#375623";
            return (
              <tr key={item}>
                <td className="pdf-vi">{item}</td>
                {[
                  ["ln", v.ln],
                  ["lt", v.lt],
                  ["nt", v.nt],
                ].map(([campo, val], i) => {
                  const est = voltEstadoCampo(campo, val);
                  const isNT = campo === "nt";
                  return (
                    <td
                      key={i}
                      className="pdf-vc"
                      style={{
                        background:
                          est === "err"
                            ? isNT
                              ? "#EDE9FE"
                              : "#FFCCCC"
                            : est === "ok"
                              ? "#E2EFDA"
                              : "",
                        color:
                          est === "err"
                            ? isNT
                              ? "#5B21B6"
                              : "#9C0006"
                            : "",
                        fontWeight: est ? "700" : "",
                      }}
                    >
                      {val ? val + " V" : ""}
                    </td>
                  );
                })}
                <td
                  style={{
                    textAlign: "center",
                    fontSize: "6pt",
                    fontWeight: 700,
                    background: estBg,
                    color: estClr,
                  }}
                >
                  {!hayVal ? "—" : hayErr ? "✗ FUERA" : "✓ OK"}
                </td>
                <td
                  style={{
                    fontSize: "6pt",
                    fontWeight: 700,
                    background: estBg,
                    color: estClr,
                  }}
                >
                  {v.obs}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* BANNER DISPOSITIVOS */}
      <div className={"pdf-banner " + tipoObj.pdfBanner}>
        ESTADO DE DISPOSITIVOS — {tipoObj.label.toUpperCase()}{" "}
        {form.marca ? "| " + form.marca : ""}
      </div>

      {/* TABLAS DISPOSITIVOS */}
      {sections.map((sec) => {
        const headCls =
          "pdf-sh " +
          (sec.tipo === "disp"
            ? "pdf-sh-disp"
            : sec.tipo === "dep"
              ? "pdf-sh-dep"
              : "pdf-sh-base");
        return (
          <table
            key={sec.id + sec.title}
            className="pdf-table"
            style={{ marginTop: 3 }}
          >
            <thead>
              <tr>
                <th
                  className={headCls}
                  style={{
                    textAlign: "left",
                    paddingLeft: 4,
                    width: "29%",
                  }}
                >
                  {sec.title}
                </th>
                <th className={headCls} style={{ width: "5%" }}>
                  Limp.
                </th>
                <th className={headCls} style={{ width: "5%" }}>
                  Pru.
                </th>
                <th className={headCls} style={{ width: "5.5%" }}>
                  Bueno
                </th>
                <th className={headCls} style={{ width: "7%" }}>
                  Defect.
                </th>
                <th className={headCls} style={{ width: "6%" }}>
                  Regular
                </th>
                <th className={headCls} style={{ width: "6.5%" }}>
                  N/Aplica
                </th>
                <th className={headCls}>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {sec.items.map((item, ii) => {
                const d = form.devices[sec.id + "_" + ii] || {};
                return (
                  <tr key={ii} className={ii % 2 === 1 ? "pdf-alt" : ""}>
                    <td className="pdf-col-item">{item}</td>
                    <td
                      className="pdf-col-chk"
                      style={{ color: "#1d4ed8" }}
                    >
                      {ck(d.lim)}
                    </td>
                    <td
                      className="pdf-col-chk"
                      style={{ color: "#1d4ed8" }}
                    >
                      {ck(d.pru)}
                    </td>
                    <td
                      className="pdf-col-chk2"
                      style={{
                        color: "#16a34a",
                        background: d.est === "Bueno" ? "#f0fdf4" : "",
                      }}
                    >
                      {d.est === "Bueno" ? "✓" : ""}
                    </td>
                    <td
                      className="pdf-col-def"
                      style={{
                        color: "#dc2626",
                        background:
                          d.est === "Defectuoso" ? "#fef2f2" : "",
                      }}
                    >
                      {d.est === "Defectuoso" ? "✓" : ""}
                    </td>
                    <td
                      className="pdf-col-reg"
                      style={{
                        color: "#d97706",
                        background: d.est === "Regular" ? "#fffbeb" : "",
                      }}
                    >
                      {d.est === "Regular" ? "✓" : ""}
                    </td>
                    <td
                      className="pdf-col-na"
                      style={{ color: "#64748b" }}
                    >
                      {d.est === "No Aplica" ? "✓" : ""}
                    </td>
                    <td className="pdf-col-obs">{d.obs}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        );
      })}

      </div>{/* fin pdf-page 1 */}

      {/* ═══ PÁGINA 2: Conclusiones + Fotos + Firmas ═══ */}
      <div className="pdf-page">
      <div className="pdf-title" style={{ marginBottom: 4 }}>
        CONCLUSIONES DEL MANTENIMIENTO — ATM{form.cliente ? ` — ${form.cliente}` : ""}
      </div>
      <div className="pdf-subtitle" style={{ marginBottom: 5 }}>
        {form.punto} · {form.marca} {form.modelo} · ID: {form.idAtm}
      </div>

      <table className="pdf-table">
        <tbody>
          <tr>
            <td className="pdf-cl">Punto / Agencia:</td>
            <td className="pdf-cv" style={{ fontWeight: 700 }}>
              {form.punto}
            </td>
          </tr>
          <tr>
            <td className="pdf-cl">ID ATM / Modelo:</td>
            <td className="pdf-cv">
              {form.idAtm}
              {form.modelo ? " — " + form.modelo : ""}
            </td>
          </tr>
          {/* SITE en PDF */}
          {Object.keys(form.site || {}).length > 0 && (
            <>
              <tr>
                <td
                  colSpan={2}
                  style={{
                    background: "#e0e7ff",
                    fontWeight: 700,
                    fontSize: "6.5pt",
                    padding: "3px 5px",
                    color: "#3730a3",
                  }}
                >
                  EVALUACIÓN DEL SITE — Entorno y Cabina
                </td>
              </tr>
              {[
                "Iluminación",
                "Ubicación / Accesibilidad",
                "Limpieza de Cabina",
                "Tacho de Papel / Basurero",
                "Aire Acondicionado / Ventilación",
                "Señalética y Adhesivos",
                "Estado Piso y Techo",
              ].map((item, i) => {
                const val = (form.site || {})[i] || "";
                const bg =
                  val === "Bueno"
                    ? "#E2EFDA"
                    : val === "Defectuoso"
                      ? "#FFCCCC"
                      : val === "Regular"
                        ? "#FFEB9C"
                        : val === "No Aplica"
                          ? "#f1f5f9"
                          : "#fff";
                const clr =
                  val === "Bueno"
                    ? "#375623"
                    : val === "Defectuoso"
                      ? "#9C0006"
                      : val === "Regular"
                        ? "#9C5700"
                        : val === "No Aplica"
                          ? "#64748b"
                          : "#94a3b8";
                return (
                  <tr
                    key={i}
                    style={{
                      background: i % 2 === 1 ? "#f8fafc" : "#fff",
                    }}
                  >
                    <td
                      style={{
                        fontSize: "6.5pt",
                        fontWeight: 600,
                        padding: "2px 5px",
                        border: "1px solid #bbb",
                        width: "60%",
                      }}
                    >
                      {i + 1}. {item}
                    </td>
                    <td
                      style={{
                        fontSize: "6.5pt",
                        fontWeight: 700,
                        padding: "2px 5px",
                        border: "1px solid #bbb",
                        background: bg,
                        color: clr,
                        textAlign: "center",
                      }}
                    >
                      {val || "—"}
                    </td>
                  </tr>
                );
              })}
            </>
          )}
          <tr>
            <td className="pdf-cl">Observaciones Generales:</td>
            <td className="pdf-cv" style={{ minHeight: 30 }}>
              {form.obsGen}
            </td>
          </tr>

          <tr>
            <td className="pdf-cl">Recomendaciones:</td>
            <td className="pdf-cv" style={{ minHeight: 26 }}>
              {form.rec}
            </td>
          </tr>
          <tr>
            <td className="pdf-cl">Estado Final del Equipo:</td>
            <td className={stCls[form.estFinal] || "pdf-cv"}>
              {form.estFinal}
            </td>
          </tr>
        </tbody>
      </table>

      {/* FOTOS */}
      {(fotosAntes.length > 0 || fotosDespues.length > 0) && (
        <div style={{ marginTop: 8 }}>
          <div className={"pdf-banner " + tipoObj.pdfBanner}>
            EVIDENCIA FOTOGRÁFICA
          </div>
          {fotosAntes.length > 0 && (
            <div style={{ marginTop: 5 }}>
              <p
                style={{
                  fontWeight: 700,
                  fontSize: "7pt",
                  marginBottom: 4,
                }}
              >
                Antes del Mantenimiento
              </p>
              <div className="pdf-photos">
                {fotosAntes.map((p, i) => (
                  <div key={i}>
                    <img src={typeof p === 'string' ? p : p.src} alt="" className="pdf-photo" />
                  </div>
                ))}
              </div>
            </div>
          )}
          {fotosDespues.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <p
                style={{
                  fontWeight: 700,
                  fontSize: "7pt",
                  marginBottom: 4,
                }}
              >
                Después del Mantenimiento
              </p>
              <div className="pdf-photos">
                {fotosDespues.map((p, i) => (
                  <div key={i}>
                    <img src={typeof p === 'string' ? p : p.src} alt="" className="pdf-photo" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* FIRMAS */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: 22,
        }}
      >
        <tbody>
          <tr>
            <td
              style={{
                width: "47%",
                textAlign: "center",
                paddingTop: 30,
                fontWeight: 700,
                fontSize: "7pt",
                border: "none",
                borderBottom: "1.5px solid #000",
              }}
            >
              {form.tec || " "}
            </td>
            <td style={{ width: "6%", border: "none" }}></td>
            <td
              style={{
                width: "47%",
                textAlign: "center",
                paddingTop: 30,
                border: "none",
                borderBottom: "1.5px solid #000",
              }}
            >
              {" "}
            </td>
          </tr>
          <tr>
            <td
              style={{
                textAlign: "center",
                fontSize: "7pt",
                paddingTop: 3,
                border: "none",
                color: "#475569",
              }}
            >
              Técnico Responsable
            </td>
            <td style={{ border: "none" }}></td>
            <td
              style={{
                textAlign: "center",
                fontSize: "7pt",
                paddingTop: 3,
                border: "none",
                color: "#475569",
              }}
            >
              Supervisor / V°B°
            </td>
          </tr>
        </tbody>
      </table>
      </div>{/* fin pdf-page 2 */}
    </div>
  );
}
