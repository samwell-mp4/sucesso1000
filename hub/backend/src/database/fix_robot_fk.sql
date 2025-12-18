-- Fix Foreign Key for WhatsApp Robot Configs
-- The previous FK referenced 'clients', but it should reference 'auth.users'.

-- 1. Drop the incorrect foreign key constraint
ALTER TABLE public.whatsapp_robot_configs
DROP CONSTRAINT IF EXISTS whatsapp_robot_configs_client_id_fkey;

-- 2. Add the correct foreign key constraint referencing auth.users
ALTER TABLE public.whatsapp_robot_configs
ADD CONSTRAINT whatsapp_robot_configs_client_id_fkey
FOREIGN KEY (client_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;
