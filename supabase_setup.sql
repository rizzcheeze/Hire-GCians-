-- ═══════════════════════════════════════════════════════════════
-- HIRE GCIANS! — Supabase Schema + Seed Data
-- Run this entire file in the Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- 1. PROFILES (extends Supabase auth.users)
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  role          text not null check (role in ('student', 'employer', 'admin')),
  first_name    text,
  last_name     text,
  email         text,
  program       text,
  year_level    text,
  section       text,
  organization  text,
  about         text,
  skills        jsonb default '[]',
  experience    jsonb default '[]',
  preferences   jsonb default '[]',
  created_at    timestamptz default now()
);

-- 2. JOBS
create table if not exists public.jobs (
  id              text primary key,
  title           text not null,
  company_name    text,
  job_type        text,
  work_setup      text,
  schedule        text,
  description     text,
  required_skills jsonb default '[]',
  slots           int default 1,
  employer_id     uuid references public.profiles(id),
  posted_at       date default current_date,
  status          text default 'active',
  created_at      timestamptz default now()
);

-- 3. APPLICATIONS
create table if not exists public.applications (
  id          uuid primary key default gen_random_uuid(),
  job_id      text references public.jobs(id),
  student_id  uuid references public.profiles(id),
  status      text default 'pending',
  applied_at  date default current_date,
  events      jsonb default '["Application submitted"]',
  created_at  timestamptz default now(),
  unique (job_id, student_id)
);

-- 4. SAVED JOBS
create table if not exists public.saved_jobs (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid references public.profiles(id),
  job_id      text references public.jobs(id),
  created_at  timestamptz default now(),
  unique (student_id, job_id)
);

-- 5. APPLICANT NOTES (per employer, per application)
create table if not exists public.applicant_notes (
  id              uuid primary key default gen_random_uuid(),
  application_id  uuid references public.applications(id),
  employer_id     uuid references public.profiles(id),
  note            text,
  updated_at      timestamptz default now(),
  unique (application_id, employer_id)
);

-- 6. EMPLOYER SETTINGS
create table if not exists public.employer_settings (
  id                uuid primary key default gen_random_uuid(),
  employer_id       uuid references public.profiles(id) unique,
  company_name      text,
  summary           text,
  default_job_type  text default 'Part-time',
  default_work_setup text default 'Remote',
  email_applicants  boolean default true,
  email_expiring    boolean default true,
  public_company    boolean default true,
  updated_at        timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════

alter table public.profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;
alter table public.saved_jobs enable row level security;
alter table public.applicant_notes enable row level security;
alter table public.employer_settings enable row level security;

-- Profiles: anyone can read, owners can update
create policy "Public profiles are viewable" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Jobs: anyone can read active jobs, employers can insert/update their own
create policy "Anyone can view active jobs" on public.jobs for select using (true);
create policy "Employers can insert jobs" on public.jobs for insert with check (auth.uid() = employer_id);
create policy "Employers can update own jobs" on public.jobs for update using (auth.uid() = employer_id);

-- Applications: students see own, employers see apps to their jobs
create policy "Students see own applications" on public.applications for select using (auth.uid() = student_id);
create policy "Employers see apps to their jobs" on public.applications for select using (
  exists (select 1 from public.jobs where jobs.id = applications.job_id and jobs.employer_id = auth.uid())
);
create policy "Students can apply" on public.applications for insert with check (auth.uid() = student_id);
create policy "Employers can update application status" on public.applications for update using (
  exists (select 1 from public.jobs where jobs.id = applications.job_id and jobs.employer_id = auth.uid())
);

-- Saved jobs: students manage their own
create policy "Students manage saved jobs" on public.saved_jobs for all using (auth.uid() = student_id);

-- Notes: employers manage their own notes
create policy "Employers manage own notes" on public.applicant_notes for all using (auth.uid() = employer_id);

-- Employer settings: employers manage their own
create policy "Employers manage own settings" on public.employer_settings for all using (auth.uid() = employer_id);

-- ═══════════════════════════════════════════════════════════════
-- SEED DATA
-- Step 1: Create these auth users via Supabase Dashboard > Auth > Users
--         or via the signup form in the app.
--         THEN run the seed below using the actual UUIDs.
--
-- Demo accounts to create in Auth:
--   allyana@gordoncollege.edu.ph / student123
--   juan@gordoncollege.edu.ph    / student123
--   maria@gordoncollege.edu.ph   / student123
--   rey@gordoncollege.edu.ph     / student123
--   katrina@gordoncollege.edu.ph / student123
--   hiring@brightpathdigital.com / employer123
--   jobs@northharborcreatives.com / employer123
--   talent@summitworkforce.com   / employer123
--   careers@novaanalytics.com    / employer123
--   admin@gordoncollege.edu.ph   / admin123
--
-- After creating the auth users, run the SQL below with the real UUIDs.
-- To get UUIDs: Supabase Dashboard > Auth > Users > copy each user's ID.
-- ═══════════════════════════════════════════════════════════════

-- REPLACE THESE WITH REAL UUIDs FROM AUTH > USERS:
do $$
declare
  id_allyana  uuid := '00000000-0000-0000-0000-000000000001';  -- REPLACE
  id_juan     uuid := '00000000-0000-0000-0000-000000000002';  -- REPLACE
  id_maria    uuid := '00000000-0000-0000-0000-000000000003';  -- REPLACE
  id_rey      uuid := '00000000-0000-0000-0000-000000000004';  -- REPLACE
  id_katrina  uuid := '00000000-0000-0000-0000-000000000005';  -- REPLACE
  id_brightpath uuid := '00000000-0000-0000-0000-000000000006'; -- REPLACE
  id_northharbor uuid := '00000000-0000-0000-0000-000000000007'; -- REPLACE
  id_summit   uuid := '00000000-0000-0000-0000-000000000008';  -- REPLACE
  id_nova     uuid := '00000000-0000-0000-0000-000000000009';  -- REPLACE
  id_admin    uuid := '00000000-0000-0000-0000-000000000010';  -- REPLACE
begin

-- PROFILES
insert into public.profiles (id, role, first_name, last_name, email, program, year_level, section, about, skills, experience, preferences) values
(id_allyana, 'student', 'Allyana', 'Espiridion', 'allyana@gordoncollege.edu.ph', 'BSCS', '2nd Year', '2-B',
  '2nd-year Computer Science student passionate about building user-centered web applications.',
  '["Vue.js","Django","Python","Figma","Adobe XD","UI/UX Design","HTML/CSS","REST APIs","Canva","User Research"]',
  '[{"title":"Frontend Developer — Capstone Project","org":"Gordon College","dates":"Jan 2025 – Present","desc":"Led frontend development of HIRE GCians! using Vue.js and a Django REST API."},{"title":"Graphic Designer — SC Newsletter","org":"Student Council","dates":"Aug 2024 – Dec 2024","desc":"Designed monthly newsletters for 2,000+ students."}]',
  '["Open to opportunities","Part-time preferred","On-site / Remote"]'),

(id_juan, 'student', 'Juan', 'dela Cruz', 'juan@gordoncollege.edu.ph', 'BSIT', '3rd Year', '3-A',
  'BSIT student focused on practical web, systems support, and client-facing technical work.',
  '["Vue.js","REST APIs","JavaScript","HTML/CSS","Troubleshooting"]',
  '[{"title":"Technical Support Volunteer","org":"Community Tech Hub","dates":"2024","desc":"Maintained devices and handled basic user support workflows."}]',
  '["Open to opportunities","Flexible hours"]'),

(id_maria, 'student', 'Maria', 'Santos', 'maria@gordoncollege.edu.ph', 'BSCS', '2nd Year', '2-A',
  'Computer Science student interested in Python, design systems, and content support.',
  '["Python","HTML/CSS","Canva","Figma","Documentation"]',
  '[{"title":"Design Volunteer","org":"Youth Media Collective","dates":"2024","desc":"Created posters and campaign assets for community activities."}]',
  '["Open to opportunities"]'),

(id_rey, 'student', 'Rey', 'Lim', 'rey@gordoncollege.edu.ph', 'BSIT', '2nd Year', '2-B',
  'BSIT student building Django-based tools and small admin systems.',
  '["Django","HTML/CSS","SQL","Python"]',
  '[{"title":"Database Project Lead","org":"Coursework","dates":"2025","desc":"Built a student records prototype using SQL and Python."}]',
  '["Part-time preferred"]'),

(id_katrina, 'student', 'Katrina', 'Reyes', 'katrina@gordoncollege.edu.ph', 'BSCS', '3rd Year', '3-B',
  'CS student exploring frontend and documentation work.',
  '["HTML/CSS","Writing"]',
  '[{"title":"Newsletter Contributor","org":"College Publication","dates":"2024","desc":"Wrote and formatted student feature articles."}]',
  '["Open to opportunities"]'),

(id_brightpath, 'employer', 'BrightPath', 'Digital', 'hiring@brightpathdigital.com', null, null, null,
  'BrightPath Digital Solutions hires Gordon College students for internships and part-time project work.',
  '[]', '[]', '[]'),

(id_northharbor, 'employer', 'North Harbor', 'Team', 'jobs@northharborcreatives.com', null, null, null,
  'North Harbor Creatives hires students for flexible content, design, and social-media support roles.',
  '[]', '[]', '[]'),

(id_summit, 'employer', 'Summit', 'Workforce', 'talent@summitworkforce.com', null, null, null,
  'Summit Workforce Partners offers operations and documentation support opportunities.',
  '[]', '[]', '[]'),

(id_nova, 'employer', 'Nova', 'Analytics', 'careers@novaanalytics.com', null, null, null,
  'Nova Analytics works with Gordon College students on analytics and documentation-heavy projects.',
  '[]', '[]', '[]'),

(id_admin, 'admin', 'GC', 'Official', 'admin@gordoncollege.edu.ph', null, null, null,
  'Gordon College Career Services administration.',
  '[]', '[]', '[]')
on conflict (id) do nothing;

-- JOBS
insert into public.jobs (id, title, company_name, job_type, work_setup, schedule, description, required_skills, slots, employer_id, posted_at, status) values
('job-uiux', 'UI/UX Design Intern', 'BrightPath Digital Solutions', 'Internship', 'Remote', '20 hours/week',
  'Support product designers in creating UI flows, wireframes, and usability notes for client products.',
  '["Figma","Adobe XD","Prototyping","User Research"]', 2, id_brightpath, '2026-04-06', 'active'),

('job-webdev', 'Web Development Assistant', 'BrightPath Digital Solutions', 'Part-time', 'Remote', 'Mon-Fri, flexible hours',
  'Maintain client-facing web tools, fix UI bugs, and support REST API integrations.',
  '["Vue.js","Django","REST APIs","Python","HTML/CSS"]', 2, id_brightpath, '2026-04-02', 'active'),

('job-graphic', 'Graphic Design Assistant', 'North Harbor Creatives', 'Part-time', 'Remote', 'Weekends only',
  'Produce digital assets, social graphics, and campaign layouts for client work.',
  '["Canva","Photoshop","Layout"]', 1, id_northharbor, '2026-04-07', 'active'),

('job-content', 'Content Creator — Social Media', 'North Harbor Creatives', 'Part-time', 'Remote', '10 hours/week',
  'Create social posts, short-form captions, and basic edited reels for business accounts.',
  '["Copywriting","Video editing","Canva"]', 1, id_northharbor, '2026-04-05', 'active'),

('job-library', 'Operations Support Assistant', 'Summit Workforce Partners', 'Part-time', 'Hybrid', 'Afternoons',
  'Support spreadsheets, documentation, and back-office coordination for operations staff.',
  '["Data entry","MS Office","Documentation"]', 2, id_summit, '2026-04-04', 'active'),

('job-ai-lab', 'AI Research Support Intern', 'Nova Analytics', 'Internship', 'Hybrid', 'Flexible',
  'Support lightweight ML experiments, documentation, and dataset cleanup for analytics projects.',
  '["Python","Machine Learning","Documentation"]', 1, id_nova, '2026-04-03', 'active')
on conflict (id) do nothing;

-- APPLICATIONS (seeded)
insert into public.applications (job_id, student_id, status, applied_at, events) values
('job-uiux',    id_allyana,  'interview', '2026-04-03', '["Application submitted","Under review","Interview scheduled"]'),
('job-webdev',  id_allyana,  'review',    '2026-04-05', '["Application submitted","Under review"]'),
('job-graphic', id_allyana,  'pending',   '2026-04-07', '["Application submitted"]'),
('job-webdev',  id_juan,     'review',    '2026-04-04', '["Application submitted","Under review"]'),
('job-webdev',  id_maria,    'review',    '2026-04-05', '["Application submitted","Under review"]'),
('job-webdev',  id_rey,      'pending',   '2026-04-05', '["Application submitted"]'),
('job-webdev',  id_katrina,  'pending',   '2026-04-06', '["Application submitted"]')
on conflict (job_id, student_id) do nothing;

-- SAVED JOBS for Allyana
insert into public.saved_jobs (student_id, job_id) values
(id_allyana, 'job-uiux'),
(id_allyana, 'job-content'),
(id_allyana, 'job-library'),
(id_allyana, 'job-ai-lab')
on conflict (student_id, job_id) do nothing;

-- EMPLOYER SETTINGS
insert into public.employer_settings (employer_id, company_name, summary, default_job_type, default_work_setup, email_applicants, email_expiring, public_company) values
(id_brightpath, 'BrightPath Digital Solutions', 'BrightPath Digital Solutions hires Gordon College students for internships, freelance support, and entry-level project work.', 'Part-time', 'Remote', true, true, true),
(id_northharbor, 'North Harbor Creatives', 'North Harbor Creatives hires Gordon College students for flexible content, design, and social-media support roles.', 'Part-time', 'Remote', true, true, true),
(id_summit, 'Summit Workforce Partners', 'Summit Workforce Partners offers operations, documentation, and back-office support opportunities for Gordon College students.', 'Part-time', 'Hybrid', true, true, true),
(id_nova, 'Nova Analytics', 'Nova Analytics works with Gordon College students on entry-level analytics, research-support, and documentation-heavy projects.', 'Internship', 'Hybrid', true, true, true)
on conflict (employer_id) do nothing;

-- NOTE for Allyana's webdev application
insert into public.applicant_notes (application_id, employer_id, note)
select a.id, id_brightpath, 'Strong profile. Has most required skills. Schedule for technical interview.'
from public.applications a
where a.job_id = 'job-webdev' and a.student_id = id_allyana
on conflict (application_id, employer_id) do nothing;

end $$;
