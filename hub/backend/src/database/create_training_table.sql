-- Table for WhatsApp Robot Trainings
-- Stores training data categorized by topic (e.g., Personality, Communication, etc.)

create table if not exists public.whatsapp_robot_trainings (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references auth.users(id) on delete cascade not null,
  category text not null,
  content text default '',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(client_id, category)
);

-- Add RLS policies
alter table public.whatsapp_robot_trainings enable row level security;

create policy "Users can view their own robot trainings"
  on public.whatsapp_robot_trainings for select
  using (auth.uid() = client_id);

create policy "Users can insert their own robot trainings"
  on public.whatsapp_robot_trainings for insert
  with check (auth.uid() = client_id);

create policy "Users can update their own robot trainings"
  on public.whatsapp_robot_trainings for update
  using (auth.uid() = client_id);

create policy "Users can delete their own robot trainings"
  on public.whatsapp_robot_trainings for delete
  using (auth.uid() = client_id);

-- Trigger for updated_at
create trigger handle_whatsapp_robot_trainings_updated_at
  before update on public.whatsapp_robot_trainings
  for each row
  execute procedure public.handle_updated_at();
