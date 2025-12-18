-- Script to fix the unique constraint error for WhatsApp Robot Configs

-- 1. Remove duplicate entries if any exist (keeping the most recently updated one)
DELETE FROM public.whatsapp_robot_configs
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (partition BY client_id ORDER BY updated_at DESC) AS rnum
    FROM public.whatsapp_robot_configs
  ) t
  WHERE t.rnum > 1
);

-- 2. Add the unique constraint to the client_id column
-- This is required for the 'upsert' function to work correctly
ALTER TABLE public.whatsapp_robot_configs
ADD CONSTRAINT whatsapp_robot_configs_client_id_key UNIQUE (client_id);
