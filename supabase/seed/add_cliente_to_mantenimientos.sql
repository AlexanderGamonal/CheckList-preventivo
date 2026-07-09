-- ════════════════════════════════════════════════════════════════
-- Agregar cliente_texto a la tabla mantenimientos.
-- Los registros históricos se rellenan con el cliente del ATM
-- referenciado en atm_id (join con atms → clientes).
-- ════════════════════════════════════════════════════════════════

ALTER TABLE mantenimientos
  ADD COLUMN IF NOT EXISTS cliente_texto TEXT;

-- Backfill: para cada mantenimiento existente con atm_id, resolver
-- el nombre del cliente vía atms → clientes.
UPDATE mantenimientos m
   SET cliente_texto = c.nombre
  FROM atms a
  JOIN clientes c ON c.id = a.cliente_id
 WHERE m.atm_id = a.id
   AND m.cliente_texto IS NULL;

-- Índice para búsquedas y agrupaciones
CREATE INDEX IF NOT EXISTS idx_mant_cliente ON mantenimientos(cliente_texto);
