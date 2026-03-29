-- Políticas DELETE para tablas que solo tenían INSERT/UPDATE
-- Ejecutar en Supabase Dashboard → SQL Editor

CREATE POLICY "auth_delete_atms"     ON atms     FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "auth_delete_tecnicos" ON tecnicos  FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "auth_delete_clientes" ON clientes  FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "auth_delete_marcas"   ON marcas    FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "auth_delete_modelos"  ON modelos   FOR DELETE USING (auth.role() = 'authenticated');
