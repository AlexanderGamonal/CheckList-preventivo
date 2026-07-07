-- ════════════════════════════════════════════════════════════════
-- Iteración 3: agregar Estado del site y Pruebas de depósito al C2D
-- Ejecutar sobre BDs que ya tienen la tabla mantenimientos_c2d creada
-- con la versión anterior (sin estas dos columnas).
-- Si la tabla se crea desde cero con la versión actualizada de
-- add_mantenimientos_c2d_table.sql, este script no es necesario.
-- ════════════════════════════════════════════════════════════════

ALTER TABLE mantenimientos_c2d
  ADD COLUMN IF NOT EXISTS estado_site      JSONB, -- { items:{camaras,aireAcondicionado,iluminacion,excesoPolvo}, obs:{...} }
  ADD COLUMN IF NOT EXISTS pruebas_deposito JSONB; -- { items:{depositoBilletes,depositoMonedas,voucher}, obs:{...} }
