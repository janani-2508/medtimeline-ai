-- ============================================================
-- Row Level Security Policies
-- ============================================================

alter table profiles enable row level security;
alter table patients enable row level security;
alter table documents enable row level security;
alter table medical_records enable row level security;
alter table timeline_events enable row level security;
alter table activity_logs enable row level security;

create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql stable security definer;

create policy "users can view own profile" on profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "users can update own profile" on profiles
  for update using (id = auth.uid());

create policy "users can view own patients or admin all" on patients
  for select using (created_by = auth.uid() or public.is_admin());
create policy "users can insert patients" on patients
  for insert with check (created_by = auth.uid());
create policy "users can update own patients or admin" on patients
  for update using (created_by = auth.uid() or public.is_admin());

create policy "users can view own documents or admin all" on documents
  for select using (created_by = auth.uid() or public.is_admin());
create policy "users can insert documents" on documents
  for insert with check (created_by = auth.uid());
create policy "users can update own documents or admin" on documents
  for update using (created_by = auth.uid() or public.is_admin());

create policy "users can view records of own documents or admin" on medical_records
  for select using (
    exists (select 1 from documents d where d.id = document_id
      and (d.created_by = auth.uid() or public.is_admin()))
  );
create policy "service can insert records" on medical_records
  for insert with check (true);

create policy "users can view timeline of own patients or admin" on timeline_events
  for select using (
    exists (select 1 from patients p where p.id = patient_id
      and (p.created_by = auth.uid() or public.is_admin()))
  );
create policy "service can insert timeline events" on timeline_events
  for insert with check (true);

create policy "admin can view activity logs" on activity_logs
  for select using (public.is_admin());
create policy "service can insert activity logs" on activity_logs
  for insert with check (true);

-- NOTE: inserts into medical_records / timeline_events / activity_logs
-- are performed by the backend using the Supabase SERVICE ROLE key
-- (bypasses RLS by design), never directly from the frontend.
