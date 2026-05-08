import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme.js';

const CARDS = [
  {
    to: '/checklist',
    icon: '📋',
    title: 'Check List MP',
    subtitle: 'Mantenimiento Preventivo',
    description: 'Evaluación de site, voltaje y dispositivos.',
    accent: '#3b82f6',
    accentDim: 'rgba(59,130,246,0.12)',
    duration: '~20 min',
    complexity: 'Sencillo',
    draftKey: 'checklist_draft',
  },
  {
    to: '/auditoria',
    icon: '📝',
    title: 'Acta de Auditoría',
    subtitle: 'Recepción de Equipos',
    description: 'Verificación técnica, pruebas en línea y estado del site.',
    accent: '#22c55e',
    accentDim: 'rgba(34,197,94,0.12)',
    duration: '~45 min',
    complexity: 'Completo',
    draftKey: 'auditoria_draft',
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(null);
  const { theme, toggle: toggleTheme } = useTheme();
  const [activeDraft, setActiveDraft] = useState(null);

  useEffect(() => {
    for (const card of CARDS) {
      try {
        const raw = localStorage.getItem(card.draftKey);
        if (!raw) continue;
        const data = JSON.parse(raw);
        // checklist draft: has form.idAtm; auditoria draft: has idAtm directly
        const idAtm = data?.form?.idAtm || data?.idAtm;
        if (idAtm) {
          setActiveDraft({ to: card.to, accent: card.accent, accentDim: card.accentDim, icon: card.icon, title: card.title, idAtm });
          break;
        }
      } catch { }
    }
  }, []);

  return (
    <div style={{
      minHeight: '100svh',
      background: 'var(--bg-base)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-body)',
      padding: '24px 16px',
      boxSizing: 'border-box',
    }}>

      {/* ── Header ── */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{
          width: 100, height: 100, borderRadius: '50%', overflow: 'hidden',
          margin: '0 auto 14px',
          border: '2px solid var(--border-default)',
          background: 'var(--bg-secondary)',
        }}>
          <img
            src="/logo.png"
            alt="Logo"
            style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#fff' }}
            onError={e => { e.target.style.display = 'none'; }}
          />
        </div>
        <div style={{
          fontSize: 22,
          fontFamily: 'var(--font-heading)',
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.3px',
        }}>
          Gestión Integral de Canales Electrónicos
        </div>
        <div style={{
          fontSize: 11, color: 'var(--text-disabled)',
          marginTop: 4, letterSpacing: '1.5px', textTransform: 'uppercase',
        }}>
          Prosegur Cash
        </div>
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          style={{ marginTop: 10, background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, opacity: 0.6 }}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      {/* ── Continuar borrador activo ── */}
      {activeDraft && (
        <>
          <div style={{
            fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
            letterSpacing: '1.2px', textTransform: 'uppercase',
            marginBottom: 8, textAlign: 'center', maxWidth: 420, width: '100%',
          }}>
            En progreso
          </div>
          <div style={{ width: '100%', maxWidth: 420, marginBottom: 16 }}>
            <button
              onClick={() => navigate(activeDraft.to)}
              onMouseEnter={() => setHovered('draft')}
              onMouseLeave={() => setHovered(null)}
              onTouchStart={() => setHovered('draft')}
              onTouchEnd={() => setHovered(null)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                background: hovered === 'draft' ? activeDraft.accentDim : 'var(--bg-primary)',
                borderTop: `1.5px solid ${hovered === 'draft' ? activeDraft.accent : activeDraft.accent + '55'}`,
                borderRight: `1.5px solid ${hovered === 'draft' ? activeDraft.accent : activeDraft.accent + '55'}`,
                borderBottom: `1.5px solid ${hovered === 'draft' ? activeDraft.accent : activeDraft.accent + '55'}`,
                borderLeft: `4px solid ${activeDraft.accent}`,
                borderRadius: 12,
                cursor: 'pointer',
                textAlign: 'left',
                outline: 'none',
                transition: 'background 0.18s, box-shadow 0.18s',
                boxShadow: hovered === 'draft'
                  ? `0 0 0 1px ${activeDraft.accent}33, 0 4px 16px ${activeDraft.accent}22`
                  : '0 1px 4px rgba(0,0,0,0.25)',
              }}
            >
              <div style={{
                width: 38, height: 38, borderRadius: 8, flexShrink: 0,
                background: activeDraft.accentDim,
                border: `1px solid ${activeDraft.accent}55`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
              }}>
                {activeDraft.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: activeDraft.accent, lineHeight: 1.3 }}>
                  Continuar — {activeDraft.title}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  ATM: {activeDraft.idAtm} · borrador guardado
                </div>
              </div>
              <span style={{
                fontSize: 15, color: activeDraft.accent,
                transition: 'transform 0.15s',
                transform: hovered === 'draft' ? 'translateX(3px)' : 'none',
                display: 'inline-block', flexShrink: 0,
              }}>→</span>
            </button>
          </div>
        </>
      )}

      {/* ── Módulos label ── */}
      <div style={{
        fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
        letterSpacing: '1.2px', textTransform: 'uppercase',
        marginBottom: 10, textAlign: 'center', maxWidth: 420, width: '100%',
      }}>
        Módulos
      </div>

      {/* ── Cards ── */}
      <div style={{
        width: '100%',
        maxWidth: 420,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}>
        {CARDS.map((card) => {
          const isHov = hovered === card.to;
          return (
            <button
              key={card.to}
              onClick={() => navigate(card.to)}
              onMouseEnter={() => setHovered(card.to)}
              onMouseLeave={() => setHovered(null)}
              onTouchStart={() => setHovered(card.to)}
              onTouchEnd={() => setHovered(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 16px',
                background: isHov ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                borderTop: `1.5px solid ${isHov ? card.accent : 'var(--border-default)'}`,
                borderRight: `1.5px solid ${isHov ? card.accent : 'var(--border-default)'}`,
                borderBottom: `1.5px solid ${isHov ? card.accent : 'var(--border-default)'}`,
                borderLeft: `4px solid ${card.accent}`,
                borderRadius: 12,
                cursor: 'pointer',
                textAlign: 'left',
                outline: 'none',
                transition: 'border-color 0.18s, background 0.18s, box-shadow 0.18s',
                boxShadow: isHov
                  ? `0 0 0 1px ${card.accent}33, 0 4px 16px ${card.accent}22`
                  : '0 1px 4px rgba(0,0,0,0.25)',
              }}
            >
              {/* Icono */}
              <div style={{
                width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                background: isHov ? card.accentDim : 'var(--bg-secondary)',
                border: `1px solid ${isHov ? card.accent + '66' : 'var(--border-default)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20,
                transition: 'background 0.18s, border-color 0.18s',
              }}>
                {card.icon}
              </div>

              {/* Texto */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 14, fontWeight: 700,
                  fontFamily: 'var(--font-heading)',
                  color: isHov ? card.accent : 'var(--text-primary)',
                  transition: 'color 0.15s',
                  lineHeight: 1.3,
                }}>
                  {card.title}
                </div>
                <div style={{
                  fontSize: 11, color: 'var(--text-muted)',
                  marginTop: 2, letterSpacing: '0.5px', textTransform: 'uppercase',
                }}>
                  {card.subtitle}
                </div>
                <div style={{
                  fontSize: 12, color: 'var(--text-disabled)',
                  marginTop: 3, lineHeight: 1.4,
                }}>
                  {card.description}
                </div>
                {/* Badges de duración y complejidad */}
                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.4px',
                    padding: '2px 7px', borderRadius: 4,
                    background: card.accentDim,
                    color: card.accent,
                    border: `1px solid ${card.accent}44`,
                  }}>
                    {card.duration}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.4px',
                    padding: '2px 7px', borderRadius: 4,
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border-default)',
                  }}>
                    {card.complexity}
                  </span>
                </div>
              </div>

              {/* Flecha */}
              <span style={{
                fontSize: 16, color: isHov ? card.accent : 'var(--text-disabled)',
                transition: 'color 0.15s, transform 0.15s',
                transform: isHov ? 'translateX(3px)' : 'none',
                display: 'inline-block',
                flexShrink: 0,
              }}>→</span>
            </button>
          );
        })}
      </div>

      {/* ── Crédito ── */}
      <div style={{
        marginTop: 28,
        fontSize: 11,
        color: 'var(--text-disabled)',
        letterSpacing: '0.08em',
        opacity: 0.5,
      }}>
        By AG
      </div>
    </div>
  );
}
