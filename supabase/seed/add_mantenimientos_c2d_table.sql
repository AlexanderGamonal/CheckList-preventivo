-- ════════════════════════════════════════════════════════════════
-- Check List MP C2D (Cash Today) — tabla + políticas RLS
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS mantenimientos_c2d (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha                 DATE NOT NULL,
  hora_inicio           TEXT,
  hora_fin              TEXT,

  atm_id                INT REFERENCES atms(id),
  id_atm_texto          TEXT NOT NULL,
  punto_texto           TEXT,
  nro_serie             TEXT,
  marca_texto           TEXT,
  modelo_texto          TEXT,

  tecnico_id            INT REFERENCES tecnicos(id),
  tecnico_nombre        TEXT,
  tecnico_num           TEXT,

  tiene_cash_control    BOOLEAN,

  estado_site           JSONB,   -- { items:{camaras,aireAcondicionado,iluminacion,excesoPolvo}, obs:{...} }
  pruebas_deposito      JSONB,   -- { items:{depositoBilletes,depositoMonedas,voucher}, obs:{...} }

  voltajes              JSONB,   -- { equipo:{ln,lt,nt}, ups:{...}, transformador:{...} }
  voltajes_fuera_rango  BOOLEAN, -- true si algún valor de cualquier bloque salió de rango

  dispositivos          JSONB,   -- { cashToday:{estado,obs,num_fotos_antes,num_fotos_despues}, ... }

  obs_generales         TEXT
);

ALTER TABLE mantenimientos_c2d ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_insert_c2d" ON mantenimientos_c2d
  FOR INSERT WITH CHECK (true);

CREATE POLICY "auth_read_c2d" ON mantenimientos_c2d
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "auth_update_c2d" ON mantenimientos_c2d
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "auth_delete_c2d" ON mantenimientos_c2d
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_c2d_fecha ON mantenimientos_c2d(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_c2d_atm   ON mantenimientos_c2d(atm_id);
