-- =====================================================
-- Migración: Cambiar ATMs de Alfin de GRG/H22N a Hyosung/MX5700
-- Ejecutar en Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. Insertar marca Hyosung
INSERT INTO marcas (nombre) VALUES ('Hyosung')
ON CONFLICT (nombre) DO NOTHING;

-- 2. Insertar modelo MX5700 para Hyosung
INSERT INTO modelos (nombre, marca_id)
VALUES ('MX5700', (SELECT id FROM marcas WHERE nombre = 'Hyosung'))
ON CONFLICT (nombre, marca_id) DO NOTHING;

-- 3. Actualizar ATMs de Alfin: marca y modelo
UPDATE atms
SET
  marca_id  = (SELECT id FROM marcas  WHERE nombre = 'Hyosung'),
  modelo_id = (SELECT id FROM modelos WHERE nombre = 'MX5700')
WHERE cliente_id = (SELECT id FROM clientes WHERE nombre = 'Alfin');

-- Verificación
SELECT a.id_atm, a.punto, m.nombre AS marca, mo.nombre AS modelo, a.atm_tipo
FROM atms a
JOIN marcas  m  ON m.id  = a.marca_id
JOIN modelos mo ON mo.id = a.modelo_id
JOIN clientes c ON c.id  = a.cliente_id
WHERE c.nombre = 'Alfin';
