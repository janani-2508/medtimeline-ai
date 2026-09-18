-- ============================================================
-- HE-05 Medical Document Intelligence & Patient Timeline
-- Supabase PostgreSQL Schema
-- ============================================================

create extension if not exists "uuid-ossp";

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  role text not null default 'user' check (role in ('user','admin')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists patients (
  id uuid primary key default uuid_generate_v4(),
  patient_id text not null unique,
  name text not null,
  date_of_birth date,
  gender text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists documents (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid not null references patients(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  document_type text,
  document_date date,
  processing_status text not null default 'uploaded'
    check (processing_status in ('uploaded','processing','completed','failed')),
  error_message text,
  retry_count int not null default 0,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists medical_records (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid not null references documents(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  diagnosis jsonb default '[]',
  symptoms jsonb default '[]',
  medications jsonb default '[]',
  lab_results jsonb default '[]',
  procedures jsonb default '[]',
  allergies jsonb default '[]',
  raw_extraction jsonb,
  created_at timestamptz not null default now()
);

create table if not exists timeline_events (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid not null references patients(id) on delete cascade,
  event_date date not null,
  event_type text not null,
  title text not null,
  description text,
  source_document_id uuid references documents(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists activity_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_patients_created_by on patients(created_by);
create index if not exists idx_documents_patient on documents(patient_id);
create index if not exists idx_documents_status on documents(processing_status);
create index if not exists idx_records_patient on medical_records(patient_id);
create index if not exists idx_timeline_patient_date on timeline_events(patient_id, event_date);
create index if not exists idx_activity_created_at on activity_logs(created_at desc);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', new.email), 'user');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
