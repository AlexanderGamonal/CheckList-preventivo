/**
 * ColorSystemPreview — Página de revisión del design system
 * Ruta sugerida: /dev/colors (solo para desarrollo)
 * Eliminar o proteger antes de producción.
 */
export default function ColorSystemPreview() {
  const backgrounds = [
    { label: '--bg-base',      hex: '#020617', var: 'var(--bg-base)' },
    { label: '--bg-primary',   hex: '#0F172A', var: 'var(--bg-primary)' },
    { label: '--bg-secondary', hex: '#1E293B', var: 'var(--bg-secondary)' },
    { label: '--bg-tertiary',  hex: '#334155', var: 'var(--bg-tertiary)' },
    { label: '--bg-overlay',   hex: '#475569', var: 'var(--bg-overlay)' },
  ]

  const brand = [
    { label: '--brand',        hex: '#3B82F6' },
    { label: '--brand-light',  hex: '#60A5FA' },
    { label: '--brand-dark',   hex: '#1D4ED8' },
    { label: '--brand-subtle', hex: 'rgba(59,130,246,0.12)' },
  ]

  const statuses = [
    { label: 'ok',       color: 'var(--status-ok)',       bg: 'var(--status-ok-dim)',       border: 'var(--status-ok-border)',       text: 'Operacional' },
    { label: 'warn',     color: 'var(--status-warn)',     bg: 'var(--status-warn-dim)',     border: 'var(--status-warn-border)',     text: 'Advertencia' },
    { label: 'critical', color: 'var(--status-critical)', bg: 'var(--status-critical-dim)', border: 'var(--status-critical-border)', text: 'Crítico' },
    { label: 'offline',  color: 'var(--status-offline)',  bg: 'var(--status-offline-dim)',  border: 'var(--status-offline-border)',  text: 'Sin conexión' },
    { label: 'info',     color: 'var(--status-info)',     bg: 'var(--status-info-dim)',     border: 'var(--status-info-border)',     text: 'En proceso' },
  ]

  const texts = [
    { label: '--text-primary',   val: 'var(--text-primary)',   sample: 'Texto primario — títulos, datos críticos' },
    { label: '--text-secondary', val: 'var(--text-secondary)', sample: 'Texto secundario — descripción, cuerpo' },
    { label: '--text-muted',     val: 'var(--text-muted)',     sample: 'Texto muted — labels, timestamps, metadatos' },
    { label: '--text-disabled',  val: 'var(--text-disabled)',  sample: 'Texto disabled — inactivo' },
    { label: '--text-brand',     val: 'var(--text-brand)',     sample: 'Texto brand — links, acciones' },
  ]

  const s = {
    page: {
      minHeight: '100vh',
      background: 'var(--bg-base)',
      padding: '40px 24px',
      fontFamily: 'var(--font-body)',
    },
    wrap: { maxWidth: 900, margin: '0 auto' },
    h1: {
      fontFamily: 'var(--font-heading)',
      fontSize: 'var(--text-2xl)',
      color: 'var(--text-primary)',
      marginBottom: 8,
    },
    subtitle: { color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginBottom: 48 },
    section: { marginBottom: 48 },
    sectionTitle: {
      fontFamily: 'var(--font-heading)',
      fontSize: 'var(--text-sm)',
      color: 'var(--text-muted)',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      marginBottom: 16,
      paddingBottom: 8,
      borderBottom: '1px solid var(--border-subtle)',
    },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 },
    swatch: {
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      border: '1px solid var(--border-default)',
    },
    swatchColor: { height: 64 },
    swatchLabel: {
      background: 'var(--bg-secondary)',
      padding: '8px 10px',
      fontSize: 11,
      color: 'var(--text-muted)',
      fontFamily: 'var(--font-mono)',
    },
    swatchHex: { color: 'var(--text-secondary)', fontSize: 11, marginTop: 2 },
  }

  return (
    <div style={s.page}>
      <div style={s.wrap}>
        <h1 style={s.h1}>ATM CheckList — Color System</h1>
        <p style={s.subtitle}>Design tokens · Dark Mode OLED · Fintech</p>

        {/* Backgrounds */}
        <div style={s.section}>
          <div style={s.sectionTitle}>Backgrounds</div>
          <div style={s.grid}>
            {backgrounds.map(({ label, hex, var: v }) => (
              <div key={label} style={s.swatch}>
                <div style={{ ...s.swatchColor, background: v, border: '1px solid var(--border-default)' }} />
                <div style={s.swatchLabel}>
                  <div>{label}</div>
                  <div style={s.swatchHex}>{hex}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Brand */}
        <div style={s.section}>
          <div style={s.sectionTitle}>Brand</div>
          <div style={s.grid}>
            {brand.map(({ label, hex }) => (
              <div key={label} style={s.swatch}>
                <div style={{ ...s.swatchColor, background: hex }} />
                <div style={s.swatchLabel}>
                  <div>{label}</div>
                  <div style={s.swatchHex}>{hex}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status — ATM states */}
        <div style={s.section}>
          <div style={s.sectionTitle}>Status — Estados de ATM</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {statuses.map(({ label, color, bg, border, text }) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', gap: 16,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
              }}>
                {/* Dot */}
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: color, boxShadow: `0 0 6px ${color}`, flexShrink: 0,
                }} />
                {/* Badge */}
                <div className={`status-badge status-badge--${label}`} style={{ minWidth: 110 }}>
                  {text}
                </div>
                {/* Color strip */}
                <div style={{ flex: 1, height: 28, background: bg, border: `1px solid ${border}`, borderRadius: 6 }} />
                {/* Token name */}
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)', minWidth: 120 }}>
                  --status-{label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Text hierarchy */}
        <div style={s.section}>
          <div style={s.sectionTitle}>Jerarquía de texto</div>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            display: 'flex', flexDirection: 'column', gap: 14,
          }}>
            {texts.map(({ label, val, sample }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', width: 180, flexShrink: 0 }}>
                  {label}
                </div>
                <div style={{ color: val, fontSize: 'var(--text-base)' }}>{sample}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Card examples */}
        <div style={s.section}>
          <div style={s.sectionTitle}>Componentes de ejemplo — ATM Card</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {statuses.map(({ label, color, bg, border, text }) => (
              <div key={label} className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: 600 }}>
                      ATM-{String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', marginTop: 2 }}>
                      Hyosung MX8200
                    </div>
                  </div>
                  <div className={`status-badge status-badge--${label}`}>{text}</div>
                </div>
                <div style={{
                  height: 1, background: 'var(--border-subtle)', margin: '12px 0'
                }} />
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Último checklist:</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>hoy 08:45</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Typography scale */}
        <div style={s.section}>
          <div style={s.sectionTitle}>Tipografía — Fira Code (headings) + Fira Sans (body)</div>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            padding: 24,
          }}>
            {[
              { size: 'var(--text-3xl)', font: 'var(--font-heading)', weight: 600, label: '3xl / heading', text: 'ATM-042 Crítico' },
              { size: 'var(--text-2xl)', font: 'var(--font-heading)', weight: 500, label: '2xl / heading', text: 'Dashboard general' },
              { size: 'var(--text-xl)',  font: 'var(--font-body)',    weight: 600, label: 'xl / section',  text: 'Checklist del día' },
              { size: 'var(--text-lg)',  font: 'var(--font-body)',    weight: 500, label: 'lg / subtitle', text: 'Revisión de cassette' },
              { size: 'var(--text-base)',font: 'var(--font-body)',    weight: 400, label: 'base / body',   text: 'Verificar que el cassette tenga billetes suficientes y no esté trabado.' },
              { size: 'var(--text-sm)', font: 'var(--font-body)',    weight: 400, label: 'sm / label',    text: 'Técnico asignado — Juan Pérez' },
              { size: 'var(--text-xs)', font: 'var(--font-mono)',    weight: 400, label: 'xs / mono meta',text: '2024-03-29T08:45:00Z · ID: CHK-9921' },
            ].map(({ size, font, weight, label, text }) => (
              <div key={label} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-disabled)', marginBottom: 4 }}>
                  {label}
                </div>
                <div style={{ fontFamily: font, fontSize: size, fontWeight: weight, color: 'var(--text-primary)', lineHeight: 'var(--leading-tight)' }}>
                  {text}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ textAlign: 'center', color: 'var(--text-disabled)', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', marginTop: 32 }}>
          tokens.css · ATM CheckList Design System · Solo desarrollo
        </div>
      </div>
    </div>
  )
}
