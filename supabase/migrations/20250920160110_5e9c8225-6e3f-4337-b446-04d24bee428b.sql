-- Inserir todos os 21 aparelhos no estoque
INSERT INTO stock_items (
  imei, model, brand, color, storage, condition, battery_pct, price, status, location, 
  acquisition_date, warranty_until, notes, created_at, updated_at
) VALUES 
-- iPhone 11 128GB branco SEMINOVO (100%) - 2 unidades
('351594955657173', 'iPhone 11', 'Apple', 'branco', '128GB', 'seminovo', 100, 1115.00, 'disponivel', 'estoque', CURRENT_DATE, CURRENT_DATE + INTERVAL '3 months', 'Garantia: 3 meses', NOW(), NOW()),
('350320526724412', 'iPhone 11', 'Apple', 'branco', '128GB', 'seminovo', 100, NULL, 'disponivel', 'estoque', CURRENT_DATE, CURRENT_DATE + INTERVAL '3 months', 'Garantia: 3 meses', NOW(), NOW()),

-- iPhone 15 Pro Max 256GB titânio branco SEMINOVO (100%)
('354689822016830', 'iPhone 15 Pro Max', 'Apple', 'titânio branco', '256GB', 'seminovo', 100, 4045.00, 'disponivel', 'estoque', CURRENT_DATE, CURRENT_DATE + INTERVAL '6 months', 'Garantia: 6 meses', NOW(), NOW()),

-- iPhone 14 Pro Max 128GB roxo-profundo SEMINOVO (100%)
('356163578404994', 'iPhone 14 Pro Max', 'Apple', 'roxo-profundo', '128GB', 'seminovo', 100, 2970.00, 'disponivel', 'estoque', CURRENT_DATE, CURRENT_DATE + INTERVAL '3 months', 'Garantia: 3 meses', NOW(), NOW()),

-- iPhone 14 Pro Max 128GB preto-espacial SEMINOVO (100%)
('357938436757314', 'iPhone 14 Pro Max', 'Apple', 'preto-espacial', '128GB', 'seminovo', 100, 2970.00, 'disponivel', 'estoque', CURRENT_DATE, CURRENT_DATE + INTERVAL '3 months', 'Garantia: 3 meses', NOW(), NOW()),

-- iPhone 14 Pro Max 128GB prateado SEMINOVO (100%)
('353742536633332', 'iPhone 14 Pro Max', 'Apple', 'prateado', '128GB', 'seminovo', 100, 2970.00, 'disponivel', 'estoque', CURRENT_DATE, CURRENT_DATE + INTERVAL '3 months', 'Garantia: 3 meses', NOW(), NOW()),

-- iPhone 13 128GB meia-noite, SEMI-NOVO (100%) - 2 unidades
('358110349472832', 'iPhone 13', 'Apple', 'meia-noite', '128GB', 'seminovo', 100, 1695.00, 'disponivel', 'estoque', CURRENT_DATE, CURRENT_DATE + INTERVAL '3 months', 'Garantia: 3 meses', NOW(), NOW()),
('357167828587093', 'iPhone 13', 'Apple', 'meia-noite', '128GB', 'seminovo', 100, 1695.00, 'disponivel', 'estoque', CURRENT_DATE, CURRENT_DATE + INTERVAL '3 months', 'Garantia: 3 meses', NOW(), NOW()),

-- iPhone 13 128GB estelar SEMI-NOVO (100%) - 2 unidades
('352180445097185', 'iPhone 13', 'Apple', 'estelar', '128GB', 'seminovo', 100, 1695.00, 'disponivel', 'estoque', CURRENT_DATE, CURRENT_DATE + INTERVAL '3 months', 'Garantia: 3 meses', NOW(), NOW()),
('357084348902654', 'iPhone 13', 'Apple', 'estelar', '128GB', 'seminovo', 100, 1695.00, 'disponivel', 'estoque', CURRENT_DATE, CURRENT_DATE + INTERVAL '3 months', 'Garantia: 3 meses', NOW(), NOW()),

-- iPhone 12 Pro Max 128GB azul-Pacífico SEMINOVO (100%)
('356712117507962', 'iPhone 12 Pro Max', 'Apple', 'azul-Pacífico', '128GB', 'seminovo', 100, 1815.00, 'disponivel', 'estoque', CURRENT_DATE, CURRENT_DATE + INTERVAL '3 months', 'Garantia: 3 meses', NOW(), NOW()),

-- iPhone 12 Pro Max 128GB grafite SEMINOVO (100%)
('352117350848830', 'iPhone 12 Pro Max', 'Apple', 'grafite', '128GB', 'seminovo', 100, 1815.00, 'disponivel', 'estoque', CURRENT_DATE, CURRENT_DATE + INTERVAL '3 months', 'Garantia: 3 meses', NOW(), NOW()),

-- iPhone 12 128GB preto SEMINOVO (100%)
('358259427864707', 'iPhone 12', 'Apple', 'preto', '128GB', 'seminovo', 100, NULL, 'disponivel', 'estoque', CURRENT_DATE, CURRENT_DATE + INTERVAL '3 months', 'Garantia: 3 meses', NOW(), NOW()),

-- iPhone 14 Pro 128GB prateado SEMINOVO (100%)
('354672349449429', 'iPhone 14 Pro', 'Apple', 'prateado', '128GB', 'seminovo', 100, 2700.00, 'disponivel', 'estoque', CURRENT_DATE, CURRENT_DATE + INTERVAL '3 months', 'Garantia: 3 meses', NOW(), NOW()),

-- iPhone 15 Pro 256GB titânio preto SEMINOVO (100%)
('355473492331269', 'iPhone 15 Pro', 'Apple', 'titânio preto', '256GB', 'seminovo', 100, 3825.00, 'disponivel', 'estoque', CURRENT_DATE, CURRENT_DATE + INTERVAL '6 months', 'Garantia: 6 meses', NOW(), NOW()),

-- iPhone 12 128GB roxo SEMINOVO (100%)
('353726511428172', 'iPhone 12', 'Apple', 'roxo', '128GB', 'seminovo', 100, 1230.00, 'disponivel', 'estoque', CURRENT_DATE, CURRENT_DATE + INTERVAL '3 months', 'Garantia: 3 meses', NOW(), NOW()),

-- iPhone 12 128GB azul SEMINOVO (100%)
('351793391734428', 'iPhone 12', 'Apple', 'azul', '128GB', 'seminovo', 100, NULL, 'disponivel', 'estoque', CURRENT_DATE, CURRENT_DATE + INTERVAL '3 months', 'Garantia: 3 meses', NOW(), NOW()),

-- iPhone 16 Pro Max 256GB Titânio preto Novo (100%)
('353393814179455', 'iPhone 16 Pro Max', 'Apple', 'Titânio preto', '256GB', 'novo', 100, 6270.00, 'disponivel', 'estoque', CURRENT_DATE, CURRENT_DATE + INTERVAL '12 months', 'Garantia: 12 meses. IMEI 2: 353393814127066. Serial: SM9XM4D7255', NOW(), NOW()),

-- iPhone 16 Pro Max 256GB Titânio natural Novo (100%)
('353393813862648', 'iPhone 16 Pro Max', 'Apple', 'Titânio natural', '256GB', 'novo', 100, 6270.00, 'disponivel', 'estoque', CURRENT_DATE, CURRENT_DATE + INTERVAL '12 months', 'Garantia: 12 meses. IMEI 2: 353393813779461. Serial: SH44JJP6P64', NOW(), NOW()),

-- iPad 11th 128GB Silver (100%)
('SJXMXP6ND93', 'iPad 11th', 'Apple', 'Silver', '128GB', 'novo', 100, 1990.00, 'disponivel', 'estoque', CURRENT_DATE, CURRENT_DATE + INTERVAL '12 months', 'Garantia: 12 meses. Serial: SJXMXP6ND93', NOW(), NOW()),

-- iPhone 14 128GB estelar NOVO (100%)
('357012201491663', 'iPhone 14', 'Apple', 'estelar', '128GB', 'novo', 100, 2855.00, 'disponivel', 'estoque', CURRENT_DATE, CURRENT_DATE + INTERVAL '12 months', 'Garantia: 12 meses. IMEI 2: 357012201305939. Serial: SCXF6VYY9X4', NOW(), NOW());