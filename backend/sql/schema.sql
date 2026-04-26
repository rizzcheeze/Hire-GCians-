create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('student', 'employer', 'admin');
  end if;
  if not exists (select 1 from pg_type where typname = 'job_status') then
    create type job_status as enum ('draft', 'active', 'closed');
  end if;
  if not exists (select 1 from pg_type where typname = 'application_status') then
    create type application_status as enum ('pending', 'review', 'interview', 'hired', 'rejected', 'withdrawn');
  end if;
  if not exists (select 1 from pg_type where typname = 'resume_processing_status') then
    create type resume_processing_status as enum ('missing', 'uploaded', 'extracting', 'ocr_needed', 'analyzing', 'ready', 'failed');
  end if;
end $$;

create table if not exists users (
  id text primary key,
  role user_role not null,
  first_name text not null,
  last_name text not null,
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists student_profiles (
  user_id text primary key references users(id) on delete cascade,
  program text not null,
  year_level text not null,
  section text not null,
  about text not null,
  availability text,
  preferred_setup text,
  public_profile boolean not null default true
);

create table if not exists student_preferences (
  id uuid primary key default gen_random_uuid(),
  student_id text not null references student_profiles(user_id) on delete cascade,
  label text not null,
  unique (student_id, label)
);

create table if not exists student_experiences (
  id uuid primary key default gen_random_uuid(),
  student_id text not null references student_profiles(user_id) on delete cascade,
  title text not null,
  organization text not null,
  date_label text not null,
  description text not null,
  sort_order integer not null default 0,
  unique (student_id, title, organization, date_label)
);

create table if not exists employer_profiles (
  user_id text primary key references users(id) on delete cascade,
  company_name text not null,
  summary text not null,
  public_company boolean not null default true
);

create table if not exists employer_settings (
  employer_id text primary key references employer_profiles(user_id) on delete cascade,
  default_job_type text not null,
  default_work_setup text not null,
  email_applicants boolean not null default true,
  email_expiring boolean not null default true
);

create table if not exists admin_profiles (
  user_id text primary key references users(id) on delete cascade,
  title text not null
);

create table if not exists resume_analyses (
  id uuid primary key default gen_random_uuid(),
  student_id text not null unique references student_profiles(user_id) on delete cascade,
  file_name text,
  original_file_name text,
  mime_type text,
  file_size_bytes integer,
  storage_path text,
  processing_status resume_processing_status not null default 'missing',
  extracted_text text,
  needs_ocr boolean not null default false,
  last_error text,
  summary text not null,
  queued_at timestamptz,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table resume_analyses add column if not exists original_file_name text;
alter table resume_analyses add column if not exists mime_type text;
alter table resume_analyses add column if not exists file_size_bytes integer;
alter table resume_analyses add column if not exists storage_path text;
alter table resume_analyses add column if not exists processing_status resume_processing_status not null default 'missing';
alter table resume_analyses add column if not exists extracted_text text;
alter table resume_analyses add column if not exists needs_ocr boolean not null default false;
alter table resume_analyses add column if not exists last_error text;
alter table resume_analyses add column if not exists queued_at timestamptz;
alter table resume_analyses add column if not exists processed_at timestamptz;

create table if not exists resume_skills (
  id uuid primary key default gen_random_uuid(),
  resume_analysis_id uuid not null references resume_analyses(id) on delete cascade,
  skill_name text not null,
  unique (resume_analysis_id, skill_name)
);

create table if not exists resume_achievements (
  id uuid primary key default gen_random_uuid(),
  resume_analysis_id uuid not null references resume_analyses(id) on delete cascade,
  detail text not null,
  unique (resume_analysis_id, detail)
);

create table if not exists jobs (
  id text primary key,
  employer_id text not null references employer_profiles(user_id) on delete cascade,
  title text not null,
  type text not null,
  setup text not null,
  schedule text not null,
  description text not null,
  slots integer not null default 1,
  status job_status not null default 'draft',
  posted_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists job_skills (
  id uuid primary key default gen_random_uuid(),
  job_id text not null references jobs(id) on delete cascade,
  skill_name text not null,
  unique (job_id, skill_name)
);

create table if not exists job_match_overrides (
  id uuid primary key default gen_random_uuid(),
  job_id text not null references jobs(id) on delete cascade,
  student_id text not null references student_profiles(user_id) on delete cascade,
  score integer not null check (score between 0 and 100),
  unique (job_id, student_id)
);

create table if not exists saved_jobs (
  student_id text not null references student_profiles(user_id) on delete cascade,
  job_id text not null references jobs(id) on delete cascade,
  saved_at timestamptz not null default now(),
  primary key (student_id, job_id)
);

create table if not exists applications (
  id text primary key,
  job_id text not null references jobs(id) on delete cascade,
  student_id text not null references student_profiles(user_id) on delete cascade,
  status application_status not null default 'pending',
  applied_at date not null,
  unique (job_id, student_id)
);

create table if not exists application_events (
  id uuid primary key default gen_random_uuid(),
  application_id text not null references applications(id) on delete cascade,
  label text not null,
  created_at timestamptz not null default now(),
  unique (application_id, label)
);

create table if not exists application_notes (
  application_id text primary key references applications(id) on delete cascade,
  note text not null,
  updated_at timestamptz not null default now()
);

create index if not exists idx_jobs_employer_id on jobs(employer_id);
create index if not exists idx_jobs_status on jobs(status);
create index if not exists idx_applications_student_id on applications(student_id);
create index if not exists idx_applications_job_id on applications(job_id);
create index if not exists idx_resume_skills_analysis_id on resume_skills(resume_analysis_id);
create index if not exists idx_resume_analyses_student_id on resume_analyses(student_id);
create index if not exists idx_resume_analyses_processing_status on resume_analyses(processing_status);
