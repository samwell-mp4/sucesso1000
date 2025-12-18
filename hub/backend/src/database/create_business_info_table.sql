-- Create table for WhatsApp Robot Business Info
create table if not exists public.whatsapp_robot_business_info (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references auth.users(id) on delete cascade not null unique,
  company_name text,
  industry text,
  website text,
  description text,
  target_audience text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table public.whatsapp_robot_business_info enable row level security;

create policy "Users can view their own business info"
  on public.whatsapp_robot_business_info for select
  using (auth.uid() = client_id);

create policy "Users can insert their own business info"
  on public.whatsapp_robot_business_info for insert
  with check (auth.uid() = client_id);

create policy "Users can update their own business info"
  on public.whatsapp_robot_business_info for update
  using (auth.uid() = client_id);

-- Create trigger for updated_at
create trigger handle_whatsapp_robot_business_info_updated_at
  before update on public.whatsapp_robot_business_info
  for each row
  execute procedure public.handle_updated_at();
