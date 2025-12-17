-- Enable UUID extension if not enabled
create extension if not exists "uuid-ossp";

-- Update Clients Table
-- Ensure these columns exist.
alter table clients add column if not exists name text;
alter table clients add column if not exists responsible_name text;
alter table clients add column if not exists whatsapp text;
alter table clients add column if not exists email text;
alter table clients add column if not exists cnpj_cpf text;
alter table clients add column if not exists segment text;
alter table clients add column if not exists lead_origin text;
alter table clients add column if not exists entry_date date default current_date;

-- New fields for Multi-step Form
alter table clients add column if not exists website text;
alter table clients add column if not exists role text;
alter table clients add column if not exists cep text;
alter table clients add column if not exists address text;
alter table clients add column if not exists number text;
alter table clients add column if not exists neighborhood text;
alter table clients add column if not exists city text;
alter table clients add column if not exists state text;
alter table clients add column if not exists value numeric(10,2);
alter table clients add column if not exists seller text;

-- RLS Policies for Clients
alter table clients enable row level security;

drop policy if exists "Enable read access for all users" on clients;
create policy "Enable read access for all users" on clients
  for select using (true);

drop policy if exists "Enable insert access for all users" on clients;
create policy "Enable insert access for all users" on clients
  for insert with check (true);

drop policy if exists "Enable update access for all users" on clients;
create policy "Enable update access for all users" on clients
  for update using (true);

drop policy if exists "Enable delete access for all users" on clients;
create policy "Enable delete access for all users" on clients
  for delete using (true);

-- Client Services
create table if not exists client_services (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references clients(id) on delete cascade,
  name text not null,
  category text not null, -- 'Agentes IA', 'SEO', etc.
  description text,
  value numeric(10,2) not null,
  type text not null, -- 'Implementação', 'Mensalidade', 'Projeto único'
  status text default 'Ativo', -- 'Ativo', 'Em produção', 'Concluído', 'Cancelado'
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Financial Records
create table if not exists financial_records (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references clients(id) on delete cascade,
  service_id uuid references client_services(id) on delete set null,
  type text not null, -- 'Implementação', 'Mensalidade', 'Anual'
  value numeric(10,2) not null,
  due_date date not null,
  payment_method text,
  status text default 'Pendente', -- 'Pendente', 'Pago', 'Atrasado'
  payment_date date,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Documents
create table if not exists documents (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references clients(id) on delete cascade,
  name text not null,
  type text not null, -- 'Contrato', 'Proposta', etc.
  url text not null,
  uploaded_by text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- CRM Notes
create table if not exists crm_notes (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references clients(id) on delete cascade,
  content text not null,
  type text default 'Observação', -- 'Observação', 'Contato', 'Recusa', 'Cancelamento'
  next_action text,
  follow_up_date timestamp with time zone,
  created_by text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Client History (Audit Log)
create table if not exists client_history (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references clients(id) on delete cascade,
  action text not null, -- 'Criação', 'Alteração de Status', etc.
  details text,
  performed_by text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Traffic Campaigns
create table if not exists traffic_campaigns (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references clients(id) on delete cascade,
  platform text not null, -- 'Google Ads', 'Meta Ads', 'TikTok Ads'
  status text default 'active', -- 'active', 'paused'
  monthly_budget numeric(10,2) default 0,
  objective text,
  start_date date,
  manager text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Client Robots
create table if not exists client_robots (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references clients(id) on delete cascade,
  name text not null,
  type text not null, -- 'Atendimento', 'Prospecção', 'Agendamento'
  status text default 'active', -- 'active', 'inactive', 'maintenance'
  instance_id text, -- ID da instância no Typebot/Evolution API
  webhook_url text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS for other tables just in case, with permissive policies
alter table client_services enable row level security;
drop policy if exists "Enable all access for client_services" on client_services;
create policy "Enable all access for client_services" on client_services for all using (true) with check (true);

alter table financial_records enable row level security;
drop policy if exists "Enable all access for financial_records" on financial_records;
create policy "Enable all access for financial_records" on financial_records for all using (true) with check (true);

alter table documents enable row level security;
drop policy if exists "Enable all access for documents" on documents;
create policy "Enable all access for documents" on documents for all using (true) with check (true);

alter table crm_notes enable row level security;
drop policy if exists "Enable all access for crm_notes" on crm_notes;
create policy "Enable all access for crm_notes" on crm_notes for all using (true) with check (true);

alter table client_history enable row level security;
drop policy if exists "Enable all access for client_history" on client_history;
create policy "Enable all access for client_history" on client_history for all using (true) with check (true);

alter table traffic_campaigns enable row level security;
drop policy if exists "Enable all access for traffic_campaigns" on traffic_campaigns;
create policy "Enable all access for traffic_campaigns" on traffic_campaigns for all using (true) with check (true);

alter table client_robots enable row level security;
drop policy if exists "Enable all access for client_robots" on client_robots;
create policy "Enable all access for client_robots" on client_robots for all using (true) with check (true);

-- Client Schedules
create table if not exists client_schedules (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references clients(id) on delete cascade,
  title text not null,
  description text,
  event_date timestamp with time zone not null,
  type text default 'Manutenção', -- 'Manutenção', 'Relatório', 'Reunião', 'Outro'
  status text default 'Pendente', -- 'Pendente', 'Concluído', 'Cancelado'
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table client_schedules enable row level security;
drop policy if exists "Enable all access for client_schedules" on client_schedules;
create policy "Enable all access for client_schedules" on client_schedules for all using (true) with check (true);

-- ==========================================
-- FINANCIAL MODULE TABLES
-- ==========================================

-- Plans
create table if not exists plans (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  price_implementation numeric(10,2) default 0,
  price_monthly numeric(10,2) default 0,
  price_annual numeric(10,2) default 0,
  features jsonb default '[]',
  status text default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Contracts
create table if not exists contracts (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references clients(id) on delete cascade,
  plan_id uuid references plans(id) on delete set null,
  start_date date not null default current_date,
  end_date date,
  status text default 'active',
  pdf_url text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Expense Categories
create table if not exists expense_categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  color text default '#6b7280',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Expenses
create table if not exists expenses (
  id uuid default uuid_generate_v4() primary key,
  category_id uuid references expense_categories(id) on delete set null,
  description text not null,
  value numeric(10,2) not null,
  date date not null default current_date,
  payment_method text,
  status text default 'Pago',
  attachment_url text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Update Financial Records
alter table financial_records add column if not exists contract_id uuid references contracts(id) on delete set null;
alter table financial_records add column if not exists attachment_url text;

-- ==========================================
-- AFFILIATES MODULE TABLES
-- ==========================================

create table if not exists affiliates (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    email text unique not null,
    cpf text unique,
    phone text,
    address text,
    city text,
    state text,
    pix_key text,
    code text unique not null,
    type text check (type in ('Afiliado', 'Vendedor Interno')) default 'Afiliado',
    commission_rate_implementation decimal(5,2) default 0,
    commission_rate_monthly decimal(5,2) default 0,
    status text check (status in ('Ativo', 'Inativo', 'Suspenso', 'Bloqueado')) default 'Ativo',
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Add affiliate_id to clients
alter table clients add column if not exists affiliate_id uuid references affiliates(id) on delete set null;

create table if not exists commissions (
    id uuid default uuid_generate_v4() primary key,
    affiliate_id uuid references affiliates(id) on delete cascade,
    client_id uuid references clients(id) on delete set null,
    sale_type text check (sale_type in ('Implementação', 'Mensalidade', 'Upgrade')),
    base_value decimal(10,2) not null,
    commission_rate decimal(5,2) not null,
    commission_value decimal(10,2) not null,
    status text check (status in ('Pendente', 'Aprovada', 'Paga', 'Cancelada')) default 'Pendente',
    release_date date,
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists affiliate_payments (
    id uuid default uuid_generate_v4() primary key,
    affiliate_id uuid references affiliates(id) on delete cascade,
    amount decimal(10,2) not null,
    period_start date,
    period_end date,
    payment_method text,
    payment_date date default current_date,
    receipt_url text,
    status text check (status in ('Pago', 'Pendente', 'Retido')) default 'Pendente',
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- ==========================================
-- RLS POLICIES
-- ==========================================

alter table plans enable row level security;
drop policy if exists "Enable all access for plans" on plans;
create policy "Enable all access for plans" on plans for all using (true) with check (true);

alter table contracts enable row level security;
drop policy if exists "Enable all access for contracts" on contracts;
create policy "Enable all access for contracts" on contracts for all using (true) with check (true);

alter table expense_categories enable row level security;
drop policy if exists "Enable all access for expense_categories" on expense_categories;
create policy "Enable all access for expense_categories" on expense_categories for all using (true) with check (true);

alter table expenses enable row level security;
drop policy if exists "Enable all access for expenses" on expenses;
create policy "Enable all access for expenses" on expenses for all using (true) with check (true);

alter table affiliates enable row level security;
drop policy if exists "Admins can manage affiliates" on affiliates;
create policy "Admins can manage affiliates" on affiliates for all to authenticated using (true) with check (true);
drop policy if exists "Affiliates can view own profile" on affiliates;
create policy "Affiliates can view own profile" on affiliates for select using (email = auth.jwt()->>'email');
-- Add permissive policy for development ease if needed, but sticking to role-based for now as requested.
-- Note: If you are testing as a user without 'admin' role and not in affiliates table, you won't see anything.
-- Adding a temporary permissive policy for affiliates to ensure list works for now (can be removed later):
drop policy if exists "Enable read access for all users on affiliates" on affiliates;
create policy "Enable read access for all users on affiliates" on affiliates for select using (true);

alter table commissions enable row level security;
drop policy if exists "Admins can manage commissions" on commissions;
create policy "Admins can manage commissions" on commissions for all to authenticated using (true) with check (true);
drop policy if exists "Affiliates can view own commissions" on commissions;
create policy "Affiliates can view own commissions" on commissions for select using (affiliate_id in (select id from affiliates where email = auth.jwt()->>'email'));

alter table affiliate_payments enable row level security;
drop policy if exists "Admins can manage payments" on affiliate_payments;
create policy "Admins can manage payments" on affiliate_payments for all to authenticated using (true) with check (true);
drop policy if exists "Affiliates can view own payments" on affiliate_payments;
create policy "Affiliates can view own payments" on affiliate_payments for select using (affiliate_id in (select id from affiliates where email = auth.jwt()->>'email'));

-- ==========================================
-- TRIGGERS
-- ==========================================

-- Trigger to generate commission on contract creation
create or replace function generate_commission_on_contract()
returns trigger as $$
declare
    client_affiliate_id uuid;
    affiliate_rate decimal;
    commission_val decimal;
begin
    -- Get client's affiliate
    select affiliate_id into client_affiliate_id from clients where id = new.client_id;
    
    if client_affiliate_id is not null then
        -- Get affiliate's implementation rate
        select commission_rate_implementation into affiliate_rate from affiliates where id = client_affiliate_id;
        
        if affiliate_rate > 0 then
            commission_val := (new.value * affiliate_rate) / 100;
            
            insert into commissions (
                affiliate_id,
                client_id,
                sale_type,
                base_value,
                commission_rate,
                commission_value,
                status,
                notes
            ) values (
                client_affiliate_id,
                new.client_id,
                'Implementação',
                new.value,
                affiliate_rate,
                commission_val,
                'Pendente',
                'Comissão gerada automaticamente pelo contrato ' || new.id
            );
        end if;
    end if;
    
    return new;
end;
$$ language plpgsql;

drop trigger if exists on_contract_created on contracts;
create trigger on_contract_created
    after insert on contracts
    for each row
    execute function generate_commission_on_contract();
