-- ════════════════════════════════════════════════════════════════
-- Normaliza la marca "DIEBOLD" → "Diebold"
--
-- La marca Diebold estaba guardada en mayúsculas ("DIEBOLD") en vez
-- de "Diebold". El frontend (src/constants/devices.js y
-- src/constants/atm.jsx) hace comparación exacta de mayúsculas para
-- resolver la sección de Dispensador/Aceptador y el logo de marca, así
-- que con "DIEBOLD" esas búsquedas fallaban silenciosamente: la
-- sección de dispensador no aparecía en el checklist para ningún ATM
-- Diebold (~300 ATMs BBVA afectados).
--
-- Ejecutable múltiples veces sin efectos secundarios.
-- ════════════════════════════════════════════════════════════════

UPDATE marcas SET nombre = 'Diebold' WHERE nombre = 'DIEBOLD';
