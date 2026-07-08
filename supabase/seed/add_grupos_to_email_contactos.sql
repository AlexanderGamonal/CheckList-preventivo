-- ════════════════════════════════════════════════════════════════
-- Iteración 7: separar destinatarios por grupo
-- Cada contacto puede pertenecer a uno o más grupos:
--   atm_bbva       — MP ATM BBVA + Auditorías
--   atm_scotiabank — MP ATM Scotiabank
--   jv_latm        — MP ATM JV LATM
--   c2d            — MP Cash Today (C2D)
--
-- Retrocompatibilidad: los contactos existentes reciben ['atm_bbva']
-- (que es el flujo original), por lo que siguen recibiendo los correos
-- de MP BBVA y Auditorías sin cambios.
-- ════════════════════════════════════════════════════════════════

ALTER TABLE email_contactos
  ADD COLUMN IF NOT EXISTS grupos TEXT[] NOT NULL DEFAULT ARRAY['atm_bbva']::TEXT[];

-- Índice GIN para búsquedas rápidas por grupo (edge function usa .contains)
CREATE INDEX IF NOT EXISTS idx_email_contactos_grupos
  ON email_contactos USING GIN (grupos);
