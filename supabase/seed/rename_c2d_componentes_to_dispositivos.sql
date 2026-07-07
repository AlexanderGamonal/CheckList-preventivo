-- ════════════════════════════════════════════════════════════════
-- Renombrar columna JSONB `componentes` → `dispositivos`
-- Ejecutar solo si ya se corrió la primera versión de
--   add_mantenimientos_c2d_table.sql (que creó la columna `componentes`).
-- Si la tabla se creó con la versión corregida (que ya usa
-- `dispositivos`), este script no es necesario.
-- ════════════════════════════════════════════════════════════════

ALTER TABLE mantenimientos_c2d
  RENAME COLUMN componentes TO dispositivos;
