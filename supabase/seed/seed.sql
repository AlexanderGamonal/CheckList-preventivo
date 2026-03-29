-- Clients
INSERT INTO clientes (nombre) VALUES
  ('BBVA'), ('Scotiabank'), ('Alfin'), ('Cash Today')
ON CONFLICT (nombre) DO NOTHING;

-- Brands
INSERT INTO marcas (nombre) VALUES
  ('NCR'), ('Diebold'), ('GRG'), ('Hyosung')
ON CONFLICT (nombre) DO NOTHING;

-- Models
INSERT INTO modelos (nombre, marca_id) VALUES
  ('SelfServ 6683', (SELECT id FROM marcas WHERE nombre='NCR')),
  ('SelfServ 6685', (SELECT id FROM marcas WHERE nombre='NCR')),
  ('Opteva 522',    (SELECT id FROM marcas WHERE nombre='Diebold')),
  ('Opteva 720',    (SELECT id FROM marcas WHERE nombre='Diebold')),
  ('H22N',          (SELECT id FROM marcas WHERE nombre='GRG')),
  ('MX5700',        (SELECT id FROM marcas WHERE nombre='Hyosung')),
  ('MX500',         (SELECT id FROM marcas WHERE nombre='Hyosung')),
  ('5XW',           (SELECT id FROM marcas WHERE nombre='Hyosung'))
ON CONFLICT (nombre, marca_id) DO NOTHING;

-- ATMs (10 simulated)
INSERT INTO atms (id_atm, punto, marca_id, modelo_id, atm_tipo, cliente_id) VALUES
  ('BBVA-0001', 'BBVA Miraflores',         (SELECT id FROM marcas WHERE nombre='NCR'),    (SELECT id FROM modelos WHERE nombre='SelfServ 6683'), 'dispensador',  (SELECT id FROM clientes WHERE nombre='BBVA')),
  ('BBVA-0002', 'BBVA San Isidro',         (SELECT id FROM marcas WHERE nombre='NCR'),    (SELECT id FROM modelos WHERE nombre='SelfServ 6685'), 'dispensador',  (SELECT id FROM clientes WHERE nombre='BBVA')),
  ('BBVA-0003', 'BBVA La Molina',          (SELECT id FROM marcas WHERE nombre='Diebold'),(SELECT id FROM modelos WHERE nombre='Opteva 720'),    'multifuncion', (SELECT id FROM clientes WHERE nombre='BBVA')),
  ('SBP-001',      'Scotiabank Surco',        (SELECT id FROM marcas WHERE nombre='NCR'),    (SELECT id FROM modelos WHERE nombre='SelfServ 6683'), 'dispensador',  (SELECT id FROM clientes WHERE nombre='Scotiabank')),
  ('SBP-002',      'Scotiabank San Borja',    (SELECT id FROM marcas WHERE nombre='Diebold'),(SELECT id FROM modelos WHERE nombre='Opteva 522'),    'depositos',    (SELECT id FROM clientes WHERE nombre='Scotiabank')),
  ('LHPE0001',     'Alfin Banco Lince',       (SELECT id FROM marcas WHERE nombre='Hyosung'), (SELECT id FROM modelos WHERE nombre='MX5700'),        'dispensador',  (SELECT id FROM clientes WHERE nombre='Alfin')),
  ('LHPE0002',     'Alfin Banco Jesus Maria', (SELECT id FROM marcas WHERE nombre='Hyosung'), (SELECT id FROM modelos WHERE nombre='MX5700'),        'multifuncion', (SELECT id FROM clientes WHERE nombre='Alfin')),
  ('100000000001', 'Cash Today Callao',       (SELECT id FROM marcas WHERE nombre='NCR'),    (SELECT id FROM modelos WHERE nombre='SelfServ 6683'), 'dispensador',  (SELECT id FROM clientes WHERE nombre='Cash Today')),
  ('100000000002', 'Cash Today Villa El Salvador', (SELECT id FROM marcas WHERE nombre='Diebold'),(SELECT id FROM modelos WHERE nombre='Opteva 522'), 'dispensador', (SELECT id FROM clientes WHERE nombre='Cash Today')),
  ('100000000003', 'Cash Today San Juan de Lurigancho', (SELECT id FROM marcas WHERE nombre='NCR'),(SELECT id FROM modelos WHERE nombre='SelfServ 6685'), 'multifuncion', (SELECT id FROM clientes WHERE nombre='Cash Today'))
ON CONFLICT (id_atm) DO NOTHING;

-- Tecnicos (5 simulated)
INSERT INTO tecnicos (nombre, num_interno) VALUES
  ('Carlos Ramirez Torres',  '10000001'),
  ('Miguel Angel Flores',    '10000002'),
  ('Jorge Luis Mendoza',     '10000003'),
  ('Roberto Silva Huanca',   '10000004'),
  ('Luis Alberto Quispe',    '10000005')
ON CONFLICT (num_interno) DO NOTHING;

-- Email contacts (3 simulated) — replace with real emails
INSERT INTO email_contactos (nombre, email) VALUES
  ('Coordinacion ATM',  'coordinacion@empresa.com'),
  ('Soporte Tecnico',   'soporte@empresa.com'),
  ('Gerencia Tecnica',  'gerencia@empresa.com')
ON CONFLICT (email) DO NOTHING;
