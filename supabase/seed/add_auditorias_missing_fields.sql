-- ============================================================
-- MIGRATION: Agregar columnas faltantes a auditorias
-- Ejecutar en: Supabase → SQL Editor
-- ============================================================

ALTER TABLE auditorias
  ADD COLUMN IF NOT EXISTS tipo_atm            text,
  ADD COLUMN IF NOT EXISTS voltajes            jsonb,
  ADD COLUMN IF NOT EXISTS dispositivos_estado jsonb,
  ADD COLUMN IF NOT EXISTS obs_generales       text;

-- Índice para filtrar por tipo de ATM
CREATE INDEX IF NOT EXISTS idx_auditorias_tipo_atm ON auditorias (tipo_atm);
