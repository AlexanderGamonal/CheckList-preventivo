import React from 'react';

/* ══════════════════════════════════════════════════
   TIPOS DE CAJERO
══════════════════════════════════════════════════ */
export const ATM_TIPOS = [
  {
    id: "dispensador",
    label: "Dispensador",
    emoji: "💵",
    desc: "Solo dispensa billetes",
    color: "#1d4ed8",
    bg: "#eff6ff",
    border: "#bfdbfe",
    pdfBanner: "pdf-banner-disp",
  },
  {
    id: "depositos",
    label: "Depósitos",
    emoji: "📥",
    desc: "Solo recibe depósitos",
    color: "#166534",
    bg: "#f0fdf4",
    border: "#86efac",
    pdfBanner: "pdf-banner-dep",
  },
  {
    id: "multifuncion",
    label: "Multifunción",
    emoji: "🔄",
    desc: "Dispensa y recibe depósitos",
    color: "#92400e",
    bg: "#fffbeb",
    border: "#fcd34d",
    pdfBanner: "pdf-banner-multi",
  },
];

/* ══════════════════════════════════════════════════
   MARCAS DISPONIBLES POR TIPO
══════════════════════════════════════════════════ */
export const MARCAS_POR_TIPO = {
  dispensador: ["NCR", "Diebold", "GRG"],
  depositos: ["NCR", "Diebold"],
  multifuncion: ["NCR", "Diebold"],
};

export const MARCA_CONFIG = {
  NCR: { color: "#4caf50", bg: "#f1fdf1", border: "#a5d6a7" },
  Diebold: { color: "#1e3a8a", bg: "#eff4ff", border: "#93c5fd" },
  GRG: { color: "#1565c0", bg: "#e8f0fb", border: "#90caf9" },
};

/* ══════════════════════════════════════════════════
   LOGOS DE MARCA — archivos estáticos en public/logos/
══════════════════════════════════════════════════ */
export const LOGO_SRCS = {
  NCR: "/logos/ncr.png",
  Diebold: "/logos/diebold.png",
  GRG: "/logos/grg.jpg",
  Hyosung: "/logos/hyosung.png",
};

export function BrandLogo({ marca, height = 40, style = {} }) {
  const src = LOGO_SRCS[marca];
  if (!src) return null;
  // Contenedor fijo: misma altura Y mismo ancho para los 3 logos
  return (
    <span
      style={{
        width: height * 2.5,
        height: height,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
    >
      <img
        src={src}
        alt={marca}
        style={{
          maxWidth: "100%",
          maxHeight: "100%",
          objectFit: "contain",
          display: "block",
        }}
      />
    </span>
  );
}

/* Para compatibilidad con React.createElement(LOGO_MAP[m]) */
export const LOGO_MAP = {
  NCR: ({ size }) => <BrandLogo marca="NCR" height={size * 1.2} />,
  Diebold: ({ size }) => (
    <BrandLogo marca="Diebold" height={size * 1.2} />
  ),
  GRG: ({ size }) => <BrandLogo marca="GRG" height={size * 1.2} />,
  Hyosung: ({ size }) => <BrandLogo marca="Hyosung" height={size * 1.2} />,
};
