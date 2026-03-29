-- Enable UUID extension (optional but good practice)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- LOOKUP TABLES
CREATE TABLE IF NOT EXISTS clientes (
  id     SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS marcas (
  id     SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS modelos (
  id       SERIAL PRIMARY KEY,
  nombre   TEXT NOT NULL,
  marca_id INT NOT NULL REFERENCES marcas(id),
  UNIQUE(nombre, marca_id)
);

-- CORE TABLES
CREATE TABLE IF NOT EXISTS atms (
  id         SERIAL PRIMARY KEY,
  id_atm     TEXT NOT NULL UNIQUE,
  punto      TEXT NOT NULL,
  marca_id   INT NOT NULL REFERENCES marcas(id),
  modelo_id  INT NOT NULL REFERENCES modelos(id),
  atm_tipo   TEXT NOT NULL CHECK (atm_tipo IN ('dispensador','depositos','multifuncion')),
  cliente_id INT NOT NULL REFERENCES clientes(id),
  activo     BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_atms_id_atm   ON atms(id_atm);
CREATE INDEX IF NOT EXISTS idx_atms_cliente  ON atms(cliente_id);

CREATE TABLE IF NOT EXISTS tecnicos (
  id          SERIAL PRIMARY KEY,
  nombre      TEXT NOT NULL,
  num_interno TEXT NOT NULL UNIQUE,
  activo      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_contactos (
  id     SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  email  TEXT NOT NULL UNIQUE,
  activo BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS mantenimientos (
  id               SERIAL PRIMARY KEY,
  num_interno      TEXT,
  fecha            DATE NOT NULL,
  atm_id           INT REFERENCES atms(id),
  id_atm_texto     TEXT NOT NULL,
  punto_texto      TEXT NOT NULL,
  marca_texto      TEXT NOT NULL,
  modelo_texto     TEXT,
  atm_tipo         TEXT NOT NULL,
  tecnico_id       INT REFERENCES tecnicos(id),
  tecnico_nombre   TEXT NOT NULL,
  tecnico_num      TEXT,
  site_eval        JSONB,
  voltajes         JSONB,
  dispositivos     JSONB,
  disp_buenos      INT NOT NULL DEFAULT 0,
  disp_defectuosos INT NOT NULL DEFAULT 0,
  disp_regulares   INT NOT NULL DEFAULT 0,
  disp_no_aplica   INT NOT NULL DEFAULT 0,
  obs_gen          TEXT,
  resultados       TEXT,
  recomendaciones  TEXT,
  est_final        TEXT NOT NULL CHECK (est_final IN ('Operativo','Inoperativo','Operativo con observaciones')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mant_fecha     ON mantenimientos(fecha);
CREATE INDEX IF NOT EXISTS idx_mant_id_atm    ON mantenimientos(id_atm_texto);
CREATE INDEX IF NOT EXISTS idx_mant_tecnico   ON mantenimientos(tecnico_id);
CREATE INDEX IF NOT EXISTS idx_mant_est_final ON mantenimientos(est_final);

-- RLS
ALTER TABLE clientes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE marcas          ENABLE ROW LEVEL SECURITY;
ALTER TABLE modelos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE atms            ENABLE ROW LEVEL SECURITY;
ALTER TABLE tecnicos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_contactos ENABLE ROW LEVEL SECURITY;
ALTER TABLE mantenimientos  ENABLE ROW LEVEL SECURITY;

-- Public read on lookup tables
CREATE POLICY "public_read_clientes"  ON clientes        FOR SELECT USING (true);
CREATE POLICY "public_read_marcas"    ON marcas           FOR SELECT USING (true);
CREATE POLICY "public_read_modelos"   ON modelos          FOR SELECT USING (true);
CREATE POLICY "public_read_atms"      ON atms             FOR SELECT USING (true);
CREATE POLICY "public_read_tecnicos"  ON tecnicos         FOR SELECT USING (true);

-- Mantenimientos: public INSERT, authenticated SELECT
CREATE POLICY "public_insert_mant"   ON mantenimientos   FOR INSERT WITH CHECK (true);
CREATE POLICY "auth_select_mant"     ON mantenimientos   FOR SELECT USING (auth.role() = 'authenticated');

-- Mantenimientos: authenticated UPDATE/DELETE (for admin corrections)
CREATE POLICY "auth_update_mant"     ON mantenimientos   FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "auth_delete_mant"     ON mantenimientos   FOR DELETE USING (auth.role() = 'authenticated');

-- email_contactos: only authenticated (Edge Function uses service_role, bypasses RLS)
CREATE POLICY "auth_all_contactos"   ON email_contactos  FOR ALL USING (auth.role() = 'authenticated');

-- Mutations on lookup tables: only authenticated
CREATE POLICY "auth_insert_atms"     ON atms      FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_update_atms"     ON atms      FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "auth_insert_tecnicos" ON tecnicos  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_update_tecnicos" ON tecnicos  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "auth_insert_clientes" ON clientes  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_insert_marcas"   ON marcas    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_insert_modelos"  ON modelos   FOR INSERT WITH CHECK (auth.role() = 'authenticated');
