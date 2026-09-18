-- ============================================================
-- Fictional demo data
-- Replace 'YOUR_USER_UUID' with a real id from `profiles`
-- ============================================================

-- Promote a user to admin (run manually, never via app):
-- update profiles set role = 'admin' where email = 'admin@example.com';

insert into patients (patient_id, name, date_of_birth, gender, created_by)
values ('P1001', 'Ananya Kumar', '2002-05-14', 'Female', 'YOUR_USER_UUID')
on conflict (patient_id) do nothing;
