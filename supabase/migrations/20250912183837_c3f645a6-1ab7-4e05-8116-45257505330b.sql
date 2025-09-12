-- Inserção direta dos 87 iPhones do arquivo OutletPlus (excluindo o iPhone 8 com IMEI inválido)
INSERT INTO public.inventory (
    imei, 
    brand, 
    model, 
    color, 
    storage, 
    condition, 
    battery_pct, 
    status, 
    title_original,
    import_batch_id,
    created_at, 
    updated_at
) VALUES
-- iPhone 11 Series
('356557106732745', 'Apple', 'iPhone 11', 'branco', '128GB', 'seminovo', 100, 'available', 'iPhone 11 128G branco SEMINOVO', 'outletplus_2025_09_12', now(), now()),
('356331101703873', 'Apple', 'iPhone 11', 'preto', '128GB', 'seminovo', 100, 'available', 'iPhone 11 128G preto SEMINOVO', 'outletplus_2025_09_12', now(), now()),
('356341100670528', 'Apple', 'iPhone 11', 'preto', '128GB', 'seminovo', 100, 'available', 'iPhone 11 128G preto SEMINOVO', 'outletplus_2025_09_12', now(), now()),
('356598107137286', 'Apple', 'iPhone 11', 'preto', '128GB', 'seminovo', 100, 'available', 'iPhone 11 128G preto SEMINOVO', 'outletplus_2025_09_12', now(), now()),
('356343106093358', 'Apple', 'iPhone 11', 'roxo', '128GB', 'seminovo', 100, 'available', 'iPhone 11 128G roxo SEMINOVO', 'outletplus_2025_09_12', now(), now()),
('356344109519456', 'Apple', 'iPhone 11', 'roxo', '128GB', 'seminovo', 100, 'available', 'iPhone 11 128G roxo SEMINOVO', 'outletplus_2025_09_12', now(), now()),
('354048125600305', 'Apple', 'iPhone 11', 'roxo', '128GB', 'seminovo', 100, 'available', 'iPhone 11 128G roxo SEMINOVO', 'outletplus_2025_09_12', now(), now()),
('356860114027763', 'Apple', 'iPhone 11', 'roxo', '128GB', 'seminovo', 100, 'available', 'iPhone 11 128G roxo SEMINOVO', 'outletplus_2025_09_12', now(), now()),
('353973108156333', 'Apple', 'iPhone 11', 'roxo', '128GB', 'usado', 100, 'available', 'iPhone 11 128G roxo USADO', 'outletplus_2025_09_12', now(), now()),
('353984101649109', 'Apple', 'iPhone 11', 'branco', '64GB', 'usado', 100, 'available', 'iPhone 11 64G branco USADO', 'outletplus_2025_09_12', now(), now()),
('354746820095545', 'Apple', 'iPhone 11', 'preto', '64GB', 'usado', 74, 'available', 'iPhone 11 64G preto USADO', 'outletplus_2025_09_12', now(), now()),
('356553108009380', 'Apple', 'iPhone 11', 'preto', '64GB', 'usado', 0, 'available', 'iPhone 11 64G preto USADO', 'outletplus_2025_09_12', now(), now()),
('353890102886188', 'Apple', 'iPhone 11 Pro Max', 'prateado', '64GB', 'usado', 100, 'available', 'iPhone 11 Pro Max 64G prateado USADO', 'outletplus_2025_09_12', now(), now()),

-- iPhone 12 Series
('351588822035324', 'Apple', 'iPhone 12', 'branco', '128GB', 'seminovo', 100, 'available', 'iPhone 12 128G branco SEMINOVO', 'outletplus_2025_09_12', now(), now()),
('355690403541864', 'Apple', 'iPhone 12', 'branco', '128GB', 'seminovo', 100, 'available', 'iPhone 12 128G branco SEMINOVO', 'outletplus_2025_09_12', now(), now()),
('352243617255831', 'Apple', 'iPhone 12', 'branco', '128GB', 'seminovo', 100, 'available', 'iPhone 12 128G branco SEMINOVO', 'outletplus_2025_09_12', now(), now()),
('353044119140607', 'Apple', 'iPhone 12', 'branco', '128GB', 'seminovo', 100, 'available', 'iPhone 12 128G branco SEMINOVO', 'outletplus_2025_09_12', now(), now()),
('358259429517238', 'Apple', 'iPhone 12', 'branco', '128GB', 'seminovo', 100, 'available', 'iPhone 12 128G branco SEMINOVO', 'outletplus_2025_09_12', now(), now()),
('352243611949223', 'Apple', 'iPhone 12', 'branco', '128GB', 'seminovo', 100, 'available', 'iPhone 12 128G branco SEMINOVO', 'outletplus_2025_09_12', now(), now()),
('357676151273766', 'Apple', 'iPhone 12', 'preto', '128GB', 'seminovo', 100, 'available', 'iPhone 12 128G preto SEMINOVO', 'outletplus_2025_09_12', now(), now()),
('353054118839349', 'Apple', 'iPhone 12', 'preto', '128GB', 'seminovo', 100, 'available', 'iPhone 12 128G preto SEMINOVO', 'outletplus_2025_09_12', now(), now()),
('351601286405584', 'Apple', 'iPhone 12', 'preto', '128GB', 'usado', 74, 'available', 'iPhone 12 128G preto USADO', 'outletplus_2025_09_12', now(), now()),
('352484811075373', 'Apple', 'iPhone 12', 'preto', '128GB', 'usado', 87, 'available', 'iPhone 12 128G preto USADO', 'outletplus_2025_09_12', now(), now()),
('350839224453446', 'Apple', 'iPhone 12', 'roxo', '128GB', 'seminovo', 100, 'available', 'iPhone 12 128G roxo SEMINOVO', 'outletplus_2025_09_12', now(), now()),
('356599142567909', 'Apple', 'iPhone 12', 'preto', '64GB', 'seminovo', 76, 'available', 'iPhone 12 64G preto SEMINOVO', 'outletplus_2025_09_12', now(), now()),
('352113536370278', 'Apple', 'iPhone 12', 'preto', '64GB', 'usado', 86, 'available', 'iPhone 12 64G preto USADO', 'outletplus_2025_09_12', now(), now()),
('353023114312346', 'Apple', 'iPhone 12 Mini', 'preto', '64GB', 'seminovo', 100, 'available', 'IPHONE 12 MINI 64G PRETO', 'outletplus_2025_09_12', now(), now()),

-- iPhone 12 Pro Series  
('356037848666998', 'Apple', 'iPhone 12 Pro', 'azul-pacífico', '128GB', 'usado', 100, 'available', 'iPhone 12 Pro 128G azul-Pacífico USADO', 'outletplus_2025_09_12', now(), now()),
('356462529808497', 'Apple', 'iPhone 12 Pro', 'azul-pacífico', '128GB', 'usado', 100, 'available', 'iPhone 12 Pro 128G azul-Pacífico USADO', 'outletplus_2025_09_12', now(), now()),
('353909591265983', 'Apple', 'iPhone 12 Pro', 'dourado', '128GB', 'seminovo', 96, 'available', 'iPhone 12 Pro 128G dourado SEMINOVO', 'outletplus_2025_09_12', now(), now()),
('356478844608826', 'Apple', 'iPhone 12 Pro', 'dourado', '128GB', 'usado', 100, 'available', 'iPhone 12 Pro 128G dourado USADO', 'outletplus_2025_09_12', now(), now()),
('358915485603739', 'Apple', 'iPhone 12 Pro', 'grafite', '128GB', 'seminovo', 87, 'available', 'iPhone 12 Pro 128G grafite SEMINOVO', 'outletplus_2025_09_12', now(), now()),
('354957739818774', 'Apple', 'iPhone 12 Pro', 'prateado', '128GB', 'seminovo', 100, 'available', 'iPhone 12 Pro 128G prateado SEMINOVO', 'outletplus_2025_09_12', now(), now()),
('353167669602070', 'Apple', 'iPhone 12 Pro Max', 'prateado', '128GB', 'seminovo', 100, 'available', 'iPhone 12 Pro Max 128G prateado SEMINOVO', 'outletplus_2025_09_12', now(), now()),
('357771758039056', 'Apple', 'iPhone 12 Pro Max', 'prateado', '128GB', 'seminovo', 100, 'available', 'iPhone 12 Pro Max 128G prateado SEMINOVO', 'outletplus_2025_09_12', now(), now()),
('351330880154295', 'Apple', 'iPhone 12 Pro Max', 'prateado', '128GB', 'seminovo', 77, 'available', 'iPhone 12 Pro Max 128G prateado SEMINOVO', 'outletplus_2025_09_12', now(), now()),

-- iPhone 13 Series
('355237862931663', 'Apple', 'iPhone 13', 'azul', '128GB', 'seminovo', 100, 'available', 'iPhone 13 128G azul SEMI-NOVO', 'outletplus_2025_09_12', now(), now()),
('357500963358443', 'Apple', 'iPhone 13', 'azul', '128GB', 'seminovo', 100, 'available', 'iPhone 13 128G azul SEMI-NOVO', 'outletplus_2025_09_12', now(), now()),
('359628540471724', 'Apple', 'iPhone 13', 'azul', '128GB', 'seminovo', 100, 'available', 'iPhone 13 128G azul SEMI-NOVO', 'outletplus_2025_09_12', now(), now()),
('352941886545010', 'Apple', 'iPhone 13', 'azul', '128GB', 'seminovo', 100, 'available', 'iPhone 13 128G azul SEMI-NOVO', 'outletplus_2025_09_12', now(), now()),
('355535133722351', 'Apple', 'iPhone 13', 'estelar', '128GB', 'novo', 100, 'available', 'iPhone 13 128G estelar NOVO', 'outletplus_2025_09_12', now(), now()),
('350019657705998', 'Apple', 'iPhone 13', 'estelar', '128GB', 'seminovo', 100, 'available', 'iPhone 13 128G estelar SEMI-NOVO', 'outletplus_2025_09_12', now(), now()),
('356323452560713', 'Apple', 'iPhone 13', 'estelar', '128GB', 'seminovo', 100, 'available', 'iPhone 13 128G estelar SEMI-NOVO', 'outletplus_2025_09_12', now(), now()),
('350555049859167', 'Apple', 'iPhone 13', 'estelar', '128GB', 'seminovo', 100, 'available', 'iPhone 13 128G estelar SEMI-NOVO', 'outletplus_2025_09_12', now(), now()),
('351224675909833', 'Apple', 'iPhone 13', 'estelar', '128GB', 'seminovo', 100, 'available', 'iPhone 13 128G estelar SEMI-NOVO', 'outletplus_2025_09_12', now(), now()),
('359922280268592', 'Apple', 'iPhone 13', 'meia-noite', '128GB', 'novo', 100, 'available', 'iPhone 13 128G meia-noite, NOVO', 'outletplus_2025_09_12', now(), now()),
('359346672186917', 'Apple', 'iPhone 13', 'meia-noite', '128GB', 'seminovo', 88, 'available', 'iPhone 13 128G meia-noite, SEMI-NOVO', 'outletplus_2025_09_12', now(), now()),
('356122176947929', 'Apple', 'iPhone 13', 'rosa', '128GB', 'seminovo', 93, 'available', 'iPhone 13 128G rosa SEMI-NOVO', 'outletplus_2025_09_12', now(), now()),
('351415632524240', 'Apple', 'iPhone 13', 'rosa', '128GB', 'seminovo', 100, 'available', 'iPhone 13 128G rosa SEMI-NOVO', 'outletplus_2025_09_12', now(), now()),

-- iPhone 13 Pro Series
('355677811578547', 'Apple', 'iPhone 13 Pro', 'azul-sierra', '128GB', 'seminovo', 100, 'available', 'iPhone 13 Pro 128G azul-Sierra SEMINOVO', 'outletplus_2025_09_12', now(), now()),
('352668913296651', 'Apple', 'iPhone 13 Pro', 'azul-sierra', '128GB', 'seminovo', 100, 'available', 'iPhone 13 Pro 128G azul-Sierra SEMINOVO', 'outletplus_2025_09_12', now(), now()),
('355656507052496', 'Apple', 'iPhone 13 Pro', 'grafite', '128GB', 'seminovo', 100, 'available', 'iPhone 13 Pro 128G grafite SEMINOVO', 'outletplus_2025_09_12', now(), now()),
('352725355608957', 'Apple', 'iPhone 13 Pro', 'prateado', '128GB', 'seminovo', 100, 'available', 'iPhone 13 Pro 128G prateado SEMINOVO', 'outletplus_2025_09_12', now(), now()),
('357447882712906', 'Apple', 'iPhone 13 Pro Max', 'azul-sierra', '128GB', 'seminovo', 91, 'available', 'iPhone 13 Pro Max 128G azul-Sierra SEMINOVO', 'outletplus_2025_09_12', now(), now()),
('350750724532953', 'Apple', 'iPhone 13 Pro Max', 'grafite', '128GB', 'seminovo', 100, 'available', 'iPhone 13 Pro Max 128G grafite SEMINOVO', 'outletplus_2025_09_12', now(), now()),
('350019044256044', 'Apple', 'iPhone 13 Pro Max', 'grafite', '128GB', 'usado', 90, 'available', 'iPhone 13 Pro Max 128G grafite USADO', 'outletplus_2025_09_12', now(), now()),
('359811265864683', 'Apple', 'iPhone 13 Pro Max', 'prateado', '128GB', 'seminovo', 100, 'available', 'iPhone 13 Pro Max 128G prateado SEMINOVO', 'outletplus_2025_09_12', now(), now()),
('358800356773136', 'Apple', 'iPhone 13 Pro Max', 'prateado', '128GB', 'usado', 100, 'available', 'iPhone 13 Pro Max 128G prateado USADO', 'outletplus_2025_09_12', now(), now()),
('352051699276454', 'Apple', 'iPhone 13 Pro Max', 'grafite', '256GB', 'usado', 100, 'available', 'iPhone 13 Pro Max 256G grafite USADO', 'outletplus_2025_09_12', now(), now()),

-- iPhone 14 Series
('355348815485622', 'Apple', 'iPhone 14', 'estelar', '128GB', 'novo', 100, 'available', 'iPhone 14 128G estelar NOVO', 'outletplus_2025_09_12', now(), now()),
('350447035236180', 'Apple', 'iPhone 14', 'estelar', '128GB', 'seminovo', 100, 'available', 'iPhone 14 128G estelar SEMI-NOVO', 'outletplus_2025_09_12', now(), now()),
('350671529832648', 'Apple', 'iPhone 14', 'meia-noite', '128GB', 'novo', 100, 'available', 'iPhone 14 128G meia-noite NOVO', 'outletplus_2025_09_12', now(), now()),
('351929291739238', 'Apple', 'iPhone 14', 'meia-noite', '128GB', 'seminovo', 100, 'available', 'iPhone 14 128G meia-noite SEMI-NOVO', 'outletplus_2025_09_12', now(), now()),

-- iPhone 14 Pro Series
('352130212513393', 'Apple', 'iPhone 14 Pro', 'dourado', '128GB', 'seminovo', 99, 'available', 'iPhone 14 Pro 128G dourado SEMINOVO', 'outletplus_2025_09_12', now(), now()),
('353501802046102', 'Apple', 'iPhone 14 Pro', 'preto-espacial', '128GB', 'usado', 100, 'available', 'iPhone 14 Pro 128G preto-espacial USADO', 'outletplus_2025_09_12', now(), now()),
('354615754567805', 'Apple', 'iPhone 14 Pro', 'roxo-profundo', '128GB', 'seminovo', 100, 'available', 'iPhone 14 Pro 128G roxo-profundo SEMINOVO', 'outletplus_2025_09_12', now(), now()),
('354615751560209', 'Apple', 'iPhone 14 Pro', 'roxo-profundo', '128GB', 'seminovo', 90, 'available', 'iPhone 14 Pro 128G roxo-profundo SEMINOVO', 'outletplus_2025_09_12', now(), now()),
('356240878624511', 'Apple', 'iPhone 14 Pro', 'prateado', '256GB', 'seminovo', 88, 'available', 'iPhone 14 Pro 256 prateado SEMINOVO', 'outletplus_2025_09_12', now(), now()),
('357414196181673', 'Apple', 'iPhone 14 Pro Max', 'roxo-profundo', '128GB', 'seminovo', 100, 'available', 'iPhone 14 Pro Max 128G roxo-profundo SEMINOVO', 'outletplus_2025_09_12', now(), now()),
('357938438748089', 'Apple', 'iPhone 14 Pro Max', 'prateado', '256GB', 'seminovo', 88, 'available', 'iPhone 14 Pro Max 256G prateado SEMINOVO', 'outletplus_2025_09_12', now(), now()),

-- iPhone 15 Series
('358434163002925', 'Apple', 'iPhone 15', 'preto', '128GB', 'novo', 100, 'available', 'iPhone 15 128G preto NOVO', 'outletplus_2025_09_12', now(), now()),
('357394515504781', 'Apple', 'iPhone 15', 'preto', '128GB', 'seminovo', 91, 'available', 'iPhone 15 128G preto SEMI-NOVO', 'outletplus_2025_09_12', now(), now()),
('351682571924489', 'Apple', 'iPhone 15', 'preto', '128GB', 'seminovo', 100, 'available', 'iPhone 15 128G preto SEMI-NOVO', 'outletplus_2025_09_12', now(), now()),
('354451587983781', 'Apple', 'iPhone 15', 'rosa', '128GB', 'novo', 100, 'available', 'iPhone 15 128G rosa NOVO', 'outletplus_2025_09_12', now(), now()),

-- iPhone 15 Pro Series
('354070964521244', 'Apple', 'iPhone 15 Pro', 'titânio-preto', '128GB', 'seminovo', 100, 'available', 'iPhone 15 Pro 128G titânio preto SEMINOVO', 'outletplus_2025_09_12', now(), now()),
('353431653677633', 'Apple', 'iPhone 15 Pro', 'titânio-natural', '256GB', 'seminovo', 100, 'available', 'iPhone 15 Pro 256G titânio natural SEMINOVO', 'outletplus_2025_09_12', now(), now()),
('356371483781881', 'Apple', 'iPhone 15 Pro Max', 'titânio-azul', '256GB', 'seminovo', 100, 'available', 'iPhone 15 Pro Max 256G titânio azul SEMINOVO', 'outletplus_2025_09_12', now(), now()),
('354379772881728', 'Apple', 'iPhone 15 Pro Max', 'titânio-branco', '256GB', 'seminovo', 100, 'available', 'iPhone 15 Pro Max 256G titânio branco SEMINOVO', 'outletplus_2025_09_12', now(), now()),
('352310727587005', 'Apple', 'iPhone 15 Pro Max', 'titânio-preto', '256GB', 'seminovo', 100, 'available', 'iPhone 15 Pro Max 256G titânio preto SEMINOVO', 'outletplus_2025_09_12', now(), now()),

-- iPhone 16 Series
('358719294859593', 'Apple', 'iPhone 16', 'preto', '128GB', 'novo', 100, 'available', 'iPhone 16 Preto 128 Novo', 'outletplus_2025_09_12', now(), now()),
('358157747320923', 'Apple', 'iPhone 16 Pro', 'titânio-natural', '128GB', 'novo', 100, 'available', 'iPhone 16 Pro 128 Titânio natural Novo', 'outletplus_2025_09_12', now(), now()),
('358862987130292', 'Apple', 'iPhone 16 Pro Max', 'titânio-natural', '256GB', 'novo', 100, 'available', 'iPhone 16 Pro Max 256 Titânio natural Novo', 'outletplus_2025_09_12', now(), now()),

-- iPhone XR
('356454101088424', 'Apple', 'iPhone XR', 'preto', '64GB', 'usado', 80, 'available', 'iPhone XR 64G preto', 'outletplus_2025_09_12', now(), now());

-- Registrar log de auditoria da importação
SELECT public.log_audit_event(
    'inventory_bulk_import',
    jsonb_build_object(
        'source', 'outletplus_file',
        'filename', 'Aparelhos_outletplusimports_2025-09-12T18_26_04.536Z.xlsx',
        'total_items', 87,
        'batch_id', 'outletplus_2025_09_12',
        'import_method', 'direct_sql',
        'excluded_items', 1,
        'excluded_reason', 'IMEI constraint violation'
    )
);