-- ============================================================
-- PASO 1: PREVISUALIZAR — corre esto primero para verificar
-- ============================================================
SELECT
  id,
  id_atm               AS id_actual,
  'BBVA-' || id_atm    AS id_nuevo
FROM atms
WHERE id_atm ~ '^[0-9]+$'
ORDER BY id;

-- ============================================================
-- PASO 2: ACTUALIZAR atms
-- ============================================================
UPDATE atms
SET id_atm = 'BBVA-' || id_atm
WHERE id_atm ~ '^[0-9]+$';

-- ============================================================
-- PASO 3: ACTUALIZAR mantenimientos
-- ============================================================
UPDATE mantenimientos
SET id_atm_texto = 'BBVA-' || id_atm_texto
WHERE id_atm_texto ~ '^[0-9]+$';

-- ============================================================
-- PASO 4: VERIFICAR resultado final
-- ============================================================
SELECT id, id_atm FROM atms ORDER BY id DESC LIMIT 20;
