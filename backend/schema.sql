-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  role text not null check (role in ('patient', 'doctor', 'pharmacy')) default 'patient',
  display_name text,
  avatar_url text,
  phone text,
  date_of_birth date,
  blood_group text,
  allergies text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- prescriptions table
create table if not exists public.prescriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  doctor_name text,
  hospital_name text,
  diagnosis text,
  prescribed_date date,
  notes text,
  status text default 'active' check (status in ('active', 'completed', 'discontinued')),
  source text default 'manual' check (source in ('manual', 'ocr_scan')),
  ocr_confidence real,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- prescription_medicines table
create table if not exists public.prescription_medicines (
  id uuid default uuid_generate_v4() primary key,
  prescription_id uuid references public.prescriptions(id) on delete cascade not null,
  medicine_name text not null,
  dosage text,
  frequency text,
  duration text,
  instructions text,
  intended_use text,
  confidence text default 'high' check (confidence in ('high', 'medium', 'low', 'ambiguous', 'unmatched')),
  needs_review boolean default false,
  created_at timestamptz default now()
);

-- Ensure intended_use exists on already created tables
alter table public.prescription_medicines add column if not exists intended_use text;

-- treatment_groups table
create table if not exists public.treatment_groups (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  condition text,
  description text,
  color text default '#0f766e',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- treatment_group_members junction
create table if not exists public.treatment_group_members (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references public.treatment_groups(id) on delete cascade not null,
  prescription_id uuid references public.prescriptions(id) on delete cascade not null,
  added_at timestamptz default now(),
  unique(group_id, prescription_id)
);

-- documents table
create table if not exists public.documents (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  prescription_id uuid references public.prescriptions(id) on delete set null,
  file_name text not null,
  file_type text not null,
  file_size integer not null,
  storage_path text not null,
  uploaded_at timestamptz default now()
);

-- ai_analyses table
create table if not exists public.ai_analyses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  analysis_type text not null check (analysis_type in ('health_summary', 'drug_interaction', 'allergy_alert', 'insight')),
  content jsonb not null,
  prescription_ids uuid[],
  created_at timestamptz default now()
);

-- appointments table
create table if not exists public.appointments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  doctor_name text,
  hospital_name text,
  appointment_date date not null,
  appointment_time time,
  duration_minutes integer default 30,
  location text,
  notes text,
  status text default 'upcoming' check (status in ('upcoming', 'completed', 'cancelled', 'missed')),
  reminder_sent boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- doctor_access_grants table
create table if not exists public.doctor_access_grants (
  id uuid default uuid_generate_v4() primary key,
  patient_id uuid references auth.users(id) on delete cascade not null,
  doctor_email text not null,
  doctor_id uuid references auth.users(id) on delete set null,
  scope text default 'all' check (scope in ('all', 'treatment_group')),
  treatment_group_id uuid references public.treatment_groups(id) on delete set null,
  access_token text unique not null default encode(gen_random_bytes(32), 'hex'),
  expires_at timestamptz not null,
  revoked boolean default false,
  created_at timestamptz default now()
);

-- audit_log table
create table if not exists public.audit_log (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  metadata jsonb,
  ip_address text,
  created_at timestamptz default now()
);

-- Indexes for performance
create index if not exists idx_prescriptions_user on public.prescriptions(user_id);
create index if not exists idx_prescription_medicines_rx on public.prescription_medicines(prescription_id);
create index if not exists idx_treatment_groups_user on public.treatment_groups(user_id);
create index if not exists idx_documents_user on public.documents(user_id);
create index if not exists idx_documents_rx on public.documents(prescription_id);
create index if not exists idx_appointments_user on public.appointments(user_id);
create index if not exists idx_appointments_date on public.appointments(appointment_date);
create index if not exists idx_doctor_access_patient on public.doctor_access_grants(patient_id);
create index if not exists idx_doctor_access_doctor on public.doctor_access_grants(doctor_id);
create index if not exists idx_audit_user on public.audit_log(user_id);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.prescriptions enable row level security;
alter table public.prescription_medicines enable row level security;
alter table public.treatment_groups enable row level security;
alter table public.treatment_group_members enable row level security;
alter table public.documents enable row level security;
alter table public.ai_analyses enable row level security;
alter table public.appointments enable row level security;
alter table public.doctor_access_grants enable row level security;
alter table public.audit_log enable row level security;

-- Drop existing policies to allow clean re-runs
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can view own prescriptions" on public.prescriptions;
drop policy if exists "Users can create own prescriptions" on public.prescriptions;
drop policy if exists "Users can update own prescriptions" on public.prescriptions;
drop policy if exists "Users can delete own prescriptions" on public.prescriptions;
drop policy if exists "Users can view own prescription medicines" on public.prescription_medicines;
drop policy if exists "Users can create own prescription medicines" on public.prescription_medicines;
drop policy if exists "Users can update own prescription medicines" on public.prescription_medicines;
drop policy if exists "Users can delete own prescription medicines" on public.prescription_medicines;
drop policy if exists "Users can view own treatment groups" on public.treatment_groups;
drop policy if exists "Users can create own treatment groups" on public.treatment_groups;
drop policy if exists "Users can update own treatment groups" on public.treatment_groups;
drop policy if exists "Users can delete own treatment groups" on public.treatment_groups;
drop policy if exists "Users can view own group members" on public.treatment_group_members;
drop policy if exists "Users can add group members" on public.treatment_group_members;
drop policy if exists "Users can remove group members" on public.treatment_group_members;
drop policy if exists "Users can view own documents" on public.documents;
drop policy if exists "Users can upload documents" on public.documents;
drop policy if exists "Users can delete own documents" on public.documents;
drop policy if exists "Users can view own analyses" on public.ai_analyses;
drop policy if exists "Users can create own analyses" on public.ai_analyses;
drop policy if exists "Users can view own appointments" on public.appointments;
drop policy if exists "Users can create own appointments" on public.appointments;
drop policy if exists "Users can update own appointments" on public.appointments;
drop policy if exists "Users can delete own appointments" on public.appointments;
drop policy if exists "Patients can view own grants" on public.doctor_access_grants;
drop policy if exists "Doctors can view grants to them" on public.doctor_access_grants;
drop policy if exists "Patients can create grants" on public.doctor_access_grants;
drop policy if exists "Patients can revoke grants" on public.doctor_access_grants;
drop policy if exists "Users can view own audit log" on public.audit_log;
drop policy if exists "System can insert audit entries" on public.audit_log;

-- Recreate policies
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

create policy "Users can view own prescriptions" on public.prescriptions for select using (auth.uid() = user_id);
create policy "Users can create own prescriptions" on public.prescriptions for insert with check (auth.uid() = user_id);
create policy "Users can update own prescriptions" on public.prescriptions for update using (auth.uid() = user_id);
create policy "Users can delete own prescriptions" on public.prescriptions for delete using (auth.uid() = user_id);

create policy "Users can view own prescription medicines" on public.prescription_medicines for select using (
  exists (select 1 from public.prescriptions p where p.id = prescription_id and p.user_id = auth.uid())
);
create policy "Users can create own prescription medicines" on public.prescription_medicines for insert with check (
  exists (select 1 from public.prescriptions p where p.id = prescription_id and p.user_id = auth.uid())
);
create policy "Users can update own prescription medicines" on public.prescription_medicines for update using (
  exists (select 1 from public.prescriptions p where p.id = prescription_id and p.user_id = auth.uid())
);
create policy "Users can delete own prescription medicines" on public.prescription_medicines for delete using (
  exists (select 1 from public.prescriptions p where p.id = prescription_id and p.user_id = auth.uid())
);

create policy "Users can view own treatment groups" on public.treatment_groups for select using (auth.uid() = user_id);
create policy "Users can create own treatment groups" on public.treatment_groups for insert with check (auth.uid() = user_id);
create policy "Users can update own treatment groups" on public.treatment_groups for update using (auth.uid() = user_id);
create policy "Users can delete own treatment groups" on public.treatment_groups for delete using (auth.uid() = user_id);

create policy "Users can view own group members" on public.treatment_group_members for select using (
  exists (select 1 from public.treatment_groups tg where tg.id = group_id and tg.user_id = auth.uid())
);
create policy "Users can add group members" on public.treatment_group_members for insert with check (
  exists (select 1 from public.treatment_groups tg where tg.id = group_id and tg.user_id = auth.uid())
);
create policy "Users can remove group members" on public.treatment_group_members for delete using (
  exists (select 1 from public.treatment_groups tg where tg.id = group_id and tg.user_id = auth.uid())
);

create policy "Users can view own documents" on public.documents for select using (auth.uid() = user_id);
create policy "Users can upload documents" on public.documents for insert with check (auth.uid() = user_id);
create policy "Users can delete own documents" on public.documents for delete using (auth.uid() = user_id);

create policy "Users can view own analyses" on public.ai_analyses for select using (auth.uid() = user_id);
create policy "Users can create own analyses" on public.ai_analyses for insert with check (auth.uid() = user_id);

create policy "Users can view own appointments" on public.appointments for select using (auth.uid() = user_id);
create policy "Users can create own appointments" on public.appointments for insert with check (auth.uid() = user_id);
create policy "Users can update own appointments" on public.appointments for update using (auth.uid() = user_id);
create policy "Users can delete own appointments" on public.appointments for delete using (auth.uid() = user_id);

create policy "Patients can view own grants" on public.doctor_access_grants for select using (auth.uid() = patient_id);
create policy "Doctors can view grants to them" on public.doctor_access_grants for select using (auth.uid() = doctor_id);
create policy "Patients can create grants" on public.doctor_access_grants for insert with check (auth.uid() = patient_id);
create policy "Patients can revoke grants" on public.doctor_access_grants for update using (auth.uid() = patient_id);

create policy "Users can view own audit log" on public.audit_log for select using (auth.uid() = user_id);
create policy "System can insert audit entries" on public.audit_log for insert with check (true);

-- Auto-create profile on signup trigger
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, role, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'patient'),
    coalesce(new.raw_user_meta_data->>'username', new.email)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Storage bucket for prescription images (idempotent)
insert into storage.buckets (id, name, public)
values ('prescription-images', 'prescription-images', false)
on conflict (id) do nothing;
