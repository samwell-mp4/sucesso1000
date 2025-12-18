-- Add new settings columns to whatsapp_robot_configs table
alter table public.whatsapp_robot_configs
add column if not exists transfer_to_human boolean default false,
add column if not exists use_emojis boolean default true,
add column if not exists sign_responses boolean default false,
add column if not exists restrict_topics boolean default false,
add column if not exists split_responses boolean default true,
add column if not exists allow_reminders boolean default false,
add column if not exists smart_training_search boolean default true,
add column if not exists timezone text default 'America/Sao_Paulo',
add column if not exists response_time text default 'immediate',
add column if not exists interaction_limit text default 'unlimited';
