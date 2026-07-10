-- ════════════════════════════════════════════════════════════════
-- Normaliza la tabla clientes con los 4 clientes vigentes:
--   BBVA, Scotiabank, JV LATM, Cash Today
--
-- 1) Renombra "Alfin" → "JV LATM" (preserva la FK con atms.cliente_id
--    en lugar de borrar+insertar).
-- 2) Asegura que los 4 clientes existan (INSERT ... ON CONFLICT).
--
-- Ejecutable múltiples veces sin efectos secundarios.
-- ════════════════════════════════════════════════════════════════

-- Si "Alfin" ya existe, renombrarlo a "JV LATM" (para preservar
-- los ATMs históricos vinculados). Solo aplica si "JV LATM" NO existe
-- todavía; si ya existe, el UPDATE falla por UNIQUE. En ese caso los
-- ATMs de Alfin habría que reasignarlos manualmente.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM clientes WHERE nombre = 'Alfin')
     AND NOT EXISTS (SELECT 1 FROM clientes WHERE nombre = 'JV LATM') THEN
    UPDATE clientes SET nombre = 'JV LATM' WHERE nombre = 'Alfin';
  END IF;
END $$;

-- Asegurar los 4 clientes vigentes
INSERT INTO clientes (nombre) VALUES
  ('BBVA'),
  ('Scotiabank'),
  ('JV LATM'),
  ('Cash Today')
ON CONFLICT (nombre) DO NOTHING;
