-- ============================================================
-- TABLA: auditorias
-- Constancia de Recepción de Equipos ATM (BBVA / Prosegur Cash)
-- Ejecutar en: Supabase → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS auditorias (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at            timestamptz DEFAULT now(),

  -- Identificación del equipo
  fecha                 text,
  id_atm                text,
  atm_id                INT REFERENCES atms(id) ON DELETE SET NULL,
  punto_texto           text,
  marca_texto           text,
  modelo_texto          text,
  cliente_texto         text,
  establecimiento       text,
  direccion             text,
  nro_serie             text,

  -- Campos de verificación
  equipo_funcionando     boolean,
  equipo_funcionando_obs text,

  -- Pruebas en línea
  pruebas_linea         jsonb,  -- { consultaSaldos, retiroEfectivo, depositoEfectivo }
  pruebas_linea_obs     jsonb,  -- observaciones por prueba
  pruebas_exitosas      boolean,
  pruebas_exitosas_obs  text,

  -- Información general de red + cassettes
  info_general          jsonb,  -- { ipEquipo, mascaraRed, gateway, dns1, dns2, so, software, cassettes }

  -- Datos de dispositivos
  dispositivos          jsonb,  -- { lectorTarjetas, askTipo, impresoraRecibos, tecladoEPP, cpu, pantalla, ram, hdd, shutter, entintado, nose }

  -- Estado del site
  estado_site           jsonb   -- { items: { camaras, aireAcondicionado, iluminacion, excesoPolvp }, obs: {...} }
);

-- Índices para filtros frecuentes
CREATE INDEX IF NOT EXISTS idx_auditorias_fecha   ON auditorias (fecha);
CREATE INDEX IF NOT EXISTS idx_auditorias_id_atm  ON auditorias (id_atm);
CREATE INDEX IF NOT EXISTS idx_auditorias_atm_id  ON auditorias (atm_id);

-- ── Row Level Security ──────────────────────────────────────
ALTER TABLE auditorias ENABLE ROW LEVEL SECURITY;

-- Técnicos de campo pueden insertar sin autenticarse
CREATE POLICY "auditoria_public_insert"
  ON auditorias FOR INSERT
  WITH CHECK (true);

-- Solo usuarios autenticados (admin / superadmin) pueden leer
CREATE POLICY "auditoria_auth_select"
  ON auditorias FOR SELECT
  USING (auth.role() = 'authenticated');

-- Solo usuarios autenticados pueden actualizar / eliminar
CREATE POLICY "auditoria_auth_update"
  ON auditorias FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "auditoria_auth_delete"
  ON auditorias FOR DELETE
  USING (auth.role() = 'authenticated');
