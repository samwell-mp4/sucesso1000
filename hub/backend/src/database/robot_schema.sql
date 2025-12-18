-- Create table for WhatsApp Robot Configurations
create table if not exists public.whatsapp_robot_configs (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references auth.users(id) on delete cascade not null unique, -- Changed references to auth.users and added unique
  name text not null default 'Winnie',
  behavior text,
  communication_style text check (communication_style in ('formal', 'normal', 'informal')) default 'normal',
  purpose text check (purpose in ('support', 'sales', 'personal')) default 'support',
  site text,
  description text,
  status text check (status in ('online', 'offline', 'maintenance')) default 'online',
  -- Advanced Settings
  transfer_to_human boolean default false,
  use_emojis boolean default true,
  sign_responses boolean default false,
  restrict_topics boolean default false,
  split_responses boolean default true,
  allow_reminders boolean default false,
  smart_training_search boolean default true,
  timezone text default 'America/Sao_Paulo',
  response_time text default 'immediate',
  interaction_limit text default 'unlimited',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table public.whatsapp_robot_configs enable row level security;

create policy "Users can view their own robot configs"
  on public.whatsapp_robot_configs for select
  using (auth.uid() = client_id);

create policy "Users can insert their own robot configs"
  on public.whatsapp_robot_configs for insert
  with check (auth.uid() = client_id);

create policy "Users can update their own robot configs"
  on public.whatsapp_robot_configs for update
  using (auth.uid() = client_id);

-- Create function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger for updated_at
create trigger handle_whatsapp_robot_configs_updated_at
  before update on public.whatsapp_robot_configs
  for each row
  execute procedure public.handle_updated_at();

-- MIGRATION: Run this if the table already exists to fix the error
-- alter table public.whatsapp_robot_configs add constraint whatsapp_robot_configs_client_id_key unique (client_id);
