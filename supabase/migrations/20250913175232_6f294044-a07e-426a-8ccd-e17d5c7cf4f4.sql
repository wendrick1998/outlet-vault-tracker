-- Habilitar permissão de retirada para o usuário admin principal
UPDATE public.profiles 
SET can_withdraw = true 
WHERE email = 'wendrick.1761998@gmail.com' AND role = 'admin';