-- ============================================================
-- PASO 1: PREVISUALIZAR — corre esto primero para verificar
-- ============================================================
SELECT
  id,
  id_atm                    AS id_actual,
  'BBVA-' || id_atm         AS id_nuevo
FROM atms
WHERE id_atm NOT LIKE 'BBVA-%'
ORDER BY id;

-- ============================================================
-- PASO 2: ACTUALIZAR atms (cuando confirmes que el listado es correcto)
-- ============================================================
UPDATE atms
SET id_atm = 'BBVA-' || id_atm
WHERE id_atm NOT LIKE 'BBVA-%';

-- ============================================================
-- PASO 3: ACTUALIZAR mantenimientos (por si alguno ya fue registrado)
-- ============================================================
UPDATE mantenimientos
SET id_atm_texto = 'BBVA-' || id_atm_texto
WHERE id_atm_texto NOT LIKE 'BBVA-%';

-- ============================================================
-- PASO 4: VERIFICAR resultado final
-- ============================================================
SELECT id, id_atm FROM atms ORDER BY id DESC LIMIT 20;
