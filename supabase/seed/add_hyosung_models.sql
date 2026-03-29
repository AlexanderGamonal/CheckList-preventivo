-- Agrega la marca Hyosung si no existe
INSERT INTO marcas (nombre) VALUES ('Hyosung')
ON CONFLICT (nombre) DO NOTHING;

-- Agrega modelos MX500 y 5XW a la marca Hyosung
INSERT INTO modelos (nombre, marca_id) VALUES
  ('MX500', (SELECT id FROM marcas WHERE nombre = 'Hyosung')),
  ('5XW',   (SELECT id FROM marcas WHERE nombre = 'Hyosung'))
ON CONFLICT (nombre, marca_id) DO NOTHING;
