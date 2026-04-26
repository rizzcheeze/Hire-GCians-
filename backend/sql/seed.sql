insert into users (id, role, first_name, last_name, email, password_hash) values
  ('student-allyana', 'student', 'Allyana', 'Espiridion', 'allyana@gordoncollege.edu.ph', '$2a$10$HJ9pew3WDyb07y/idKQR0OY/0bL.EyC66kxA/coWqi.HtGrg6WBaK'),
  ('student-juan', 'student', 'Juan', 'dela Cruz', 'juan@gordoncollege.edu.ph', '$2a$10$HJ9pew3WDyb07y/idKQR0OY/0bL.EyC66kxA/coWqi.HtGrg6WBaK'),
  ('student-maria', 'student', 'Maria', 'Santos', 'maria@gordoncollege.edu.ph', '$2a$10$HJ9pew3WDyb07y/idKQR0OY/0bL.EyC66kxA/coWqi.HtGrg6WBaK'),
  ('student-rey', 'student', 'Rey', 'Lim', 'rey@gordoncollege.edu.ph', '$2a$10$HJ9pew3WDyb07y/idKQR0OY/0bL.EyC66kxA/coWqi.HtGrg6WBaK'),
  ('student-katrina', 'student', 'Katrina', 'Reyes', 'katrina@gordoncollege.edu.ph', '$2a$10$HJ9pew3WDyb07y/idKQR0OY/0bL.EyC66kxA/coWqi.HtGrg6WBaK'),
  ('employer-it', 'employer', 'BrightPath', 'Digital', 'hiring@brightpathdigital.com', '$2a$10$pM1fxaSq4FU4GXfiuWH.V./LV5So1D60Xr9QOuJLfj2fmYZvb7tqC'),
  ('employer-north', 'employer', 'North Harbor', 'Team', 'jobs@northharborcreatives.com', '$2a$10$pM1fxaSq4FU4GXfiuWH.V./LV5So1D60Xr9QOuJLfj2fmYZvb7tqC'),
  ('employer-summit', 'employer', 'Summit', 'Workforce', 'talent@summitworkforce.com', '$2a$10$pM1fxaSq4FU4GXfiuWH.V./LV5So1D60Xr9QOuJLfj2fmYZvb7tqC'),
  ('employer-nova', 'employer', 'Nova', 'Analytics', 'careers@novaanalytics.com', '$2a$10$pM1fxaSq4FU4GXfiuWH.V./LV5So1D60Xr9QOuJLfj2fmYZvb7tqC'),
  ('admin-1', 'admin', 'GC', 'Official', 'admin@gordoncollege.edu.ph', '$2a$10$e1Ic5gBO2PdEz3Som2QD8eW/S5OQEittet5KjFmQXNzwP75o5L.ee')
on conflict (id) do update set
  role = excluded.role,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  email = excluded.email,
  password_hash = excluded.password_hash;

insert into student_profiles (user_id, program, year_level, section, about, availability, preferred_setup, public_profile) values
  ('student-allyana', 'BSCS', '2nd Year', '2-B', '2nd-year Computer Science student passionate about building user-centered web applications. Looking for internships and part-time opportunities from companies hiring Gordon College students.', 'Weekdays after class', 'On-site / Remote', true),
  ('student-juan', 'BSIT', '3rd Year', '3-A', 'BSIT student focused on practical web, systems support, and client-facing technical work.', 'Flexible hours', 'Remote', true),
  ('student-maria', 'BSCS', '2nd Year', '2-A', 'Computer Science student interested in Python, design systems, and content support.', null, null, true),
  ('student-rey', 'BSIT', '2nd Year', '2-B', 'BSIT student building Django-based tools and small admin systems.', null, null, true),
  ('student-katrina', 'BSCS', '3rd Year', '3-B', 'CS student exploring frontend and documentation work.', null, null, true)
on conflict (user_id) do nothing;

insert into student_preferences (student_id, label) values
  ('student-allyana', 'Open to opportunities'),
  ('student-allyana', 'Part-time preferred'),
  ('student-allyana', 'On-site / Remote'),
  ('student-juan', 'Open to opportunities'),
  ('student-juan', 'Flexible hours'),
  ('student-maria', 'Open to opportunities'),
  ('student-rey', 'Part-time preferred'),
  ('student-katrina', 'Open to opportunities')
on conflict (student_id, label) do nothing;

insert into student_experiences (student_id, title, organization, date_label, description, sort_order) values
  ('student-allyana', 'Frontend Developer - Capstone Project', 'Gordon College', 'Jan 2025 - Present', 'Led frontend development of HIRE GCians! using Vue.js and a Django REST API.', 1),
  ('student-allyana', 'Graphic Designer - SC Newsletter', 'Student Council', 'Aug 2024 - Dec 2024', 'Designed monthly newsletters for 2,000+ students.', 2),
  ('student-juan', 'Technical Support Volunteer', 'Community Tech Hub', '2024', 'Maintained devices and handled basic user support workflows.', 1),
  ('student-maria', 'Design Volunteer', 'Youth Media Collective', '2024', 'Created posters and campaign assets for community activities.', 1),
  ('student-rey', 'Database Project Lead', 'Coursework', '2025', 'Built a student records prototype using SQL and Python.', 1),
  ('student-katrina', 'Newsletter Contributor', 'College Publication', '2024', 'Wrote and formatted student feature articles.', 1)
on conflict (student_id, title, organization, date_label) do nothing;

insert into employer_profiles (user_id, company_name, summary, public_company) values
  ('employer-it', 'BrightPath Digital Solutions', 'BrightPath Digital Solutions hires Gordon College students for internships, freelance support, and entry-level project work in product, operations, and digital delivery.', true),
  ('employer-north', 'North Harbor Creatives', 'North Harbor Creatives hires Gordon College students for flexible content, design, and social-media support roles.', true),
  ('employer-summit', 'Summit Workforce Partners', 'Summit Workforce Partners offers operations, documentation, and back-office support opportunities for Gordon College students.', true),
  ('employer-nova', 'Nova Analytics', 'Nova Analytics works with Gordon College students on entry-level analytics, research-support, and documentation-heavy projects.', true)
on conflict (user_id) do nothing;

insert into employer_settings (employer_id, default_job_type, default_work_setup, email_applicants, email_expiring) values
  ('employer-it', 'Part-time', 'Remote', true, true),
  ('employer-north', 'Part-time', 'Remote', true, true),
  ('employer-summit', 'Part-time', 'Hybrid', true, true),
  ('employer-nova', 'Internship', 'Hybrid', true, true)
on conflict (employer_id) do nothing;

insert into admin_profiles (user_id, title) values
  ('admin-1', 'Gordon College Career Services')
on conflict (user_id) do nothing;

with inserted as (
  insert into resume_analyses (
    student_id,
    file_name,
    original_file_name,
    mime_type,
    processing_status,
    summary,
    queued_at,
    processed_at
  ) values
    ('student-allyana', 'allyana_resume.pdf', 'allyana_resume.pdf', 'application/pdf', 'ready', 'The current resume profile is strongest in frontend, UI/UX, and practical campus project work.', now(), now()),
    ('student-juan', 'juan_resume.pdf', 'juan_resume.pdf', 'application/pdf', 'ready', 'The current resume profile is strongest in practical web support and systems troubleshooting.', now(), now()),
    ('student-maria', 'maria_resume.pdf', 'maria_resume.pdf', 'application/pdf', 'ready', 'The current resume profile is strongest in design support, documentation, and entry-level development.', now(), now()),
    ('student-rey', 'rey_resume.pdf', 'rey_resume.pdf', 'application/pdf', 'ready', 'The current resume profile is strongest in backend coursework, SQL, and Django-based tool building.', now(), now()),
    ('student-katrina', 'katrina_resume.pdf', 'katrina_resume.pdf', 'application/pdf', 'ready', 'The current resume profile is strongest in writing and basic web-content support.', now(), now())
  on conflict (student_id) do update set
    file_name = excluded.file_name,
    original_file_name = excluded.original_file_name,
    mime_type = 'application/pdf',
    processing_status = 'ready',
    summary = excluded.summary,
    queued_at = coalesce(resume_analyses.queued_at, now()),
    processed_at = coalesce(resume_analyses.processed_at, now()),
    updated_at = now()
  returning id, student_id
)
insert into resume_skills (resume_analysis_id, skill_name)
select i.id, skill_name
from inserted i
join (
  values
    ('student-allyana', 'Vue.js'),
    ('student-allyana', 'Django'),
    ('student-allyana', 'Python'),
    ('student-allyana', 'Figma'),
    ('student-allyana', 'Adobe XD'),
    ('student-allyana', 'UI/UX Design'),
    ('student-allyana', 'HTML/CSS'),
    ('student-allyana', 'REST APIs'),
    ('student-juan', 'Vue.js'),
    ('student-juan', 'REST APIs'),
    ('student-juan', 'JavaScript'),
    ('student-juan', 'HTML/CSS'),
    ('student-juan', 'Troubleshooting'),
    ('student-maria', 'Python'),
    ('student-maria', 'HTML/CSS'),
    ('student-maria', 'Canva'),
    ('student-maria', 'Figma'),
    ('student-maria', 'Documentation'),
    ('student-rey', 'Django'),
    ('student-rey', 'HTML/CSS'),
    ('student-rey', 'SQL'),
    ('student-rey', 'Python'),
    ('student-katrina', 'HTML/CSS'),
    ('student-katrina', 'Writing')
) as data(student_id, skill_name) on data.student_id = i.student_id
on conflict (resume_analysis_id, skill_name) do nothing;

with existing as (
  select id, student_id from resume_analyses
)
insert into resume_achievements (resume_analysis_id, detail)
select e.id, detail
from existing e
join (
  values
    ('student-allyana', 'Designed interfaces for 2 student projects'),
    ('student-allyana', 'Built 1 capstone frontend with REST integration'),
    ('student-juan', 'Supported 1 campus lab environment and student troubleshooting workflow.'),
    ('student-maria', 'Created design assets for multiple campus activities and documentation tasks.'),
    ('student-rey', 'Built 1 database-driven records prototype with Python and SQL.'),
    ('student-katrina', 'Produced written student-facing content for campus publication work.')
) as data(student_id, detail) on data.student_id = e.student_id
on conflict (resume_analysis_id, detail) do nothing;

insert into jobs (id, employer_id, title, type, setup, schedule, description, slots, status, posted_at) values
  ('job-uiux', 'employer-it', 'UI/UX Design Intern', 'Internship', 'Remote', '20 hours/week', 'Support product designers in creating UI flows, wireframes, and usability notes for client products.', 2, 'active', '2026-04-06'),
  ('job-webdev', 'employer-it', 'Web Development Assistant', 'Part-time', 'Remote', 'Mon-Fri, flexible hours', 'Maintain client-facing web tools, fix UI bugs, and support REST API integrations.', 2, 'active', '2026-04-02'),
  ('job-graphic', 'employer-north', 'Graphic Design Assistant', 'Part-time', 'Remote', 'Weekends only', 'Produce digital assets, social graphics, and campaign layouts for client work.', 1, 'active', '2026-04-07'),
  ('job-content', 'employer-north', 'Content Creator - Social Media', 'Part-time', 'Remote', '10 hours/week', 'Create social posts, short-form captions, and basic edited reels for business accounts.', 1, 'active', '2026-04-05'),
  ('job-library', 'employer-summit', 'Operations Support Assistant', 'Part-time', 'Hybrid', 'Afternoons', 'Support spreadsheets, documentation, and back-office coordination for operations staff.', 2, 'active', '2026-04-04'),
  ('job-ai-lab', 'employer-nova', 'AI Research Support Intern', 'Internship', 'Hybrid', 'Flexible', 'Support lightweight ML experiments, documentation, and dataset cleanup for analytics projects.', 1, 'active', '2026-04-03')
on conflict (id) do nothing;

insert into job_skills (job_id, skill_name) values
  ('job-uiux', 'Figma'),
  ('job-uiux', 'Adobe XD'),
  ('job-uiux', 'Prototyping'),
  ('job-uiux', 'User Research'),
  ('job-webdev', 'Vue.js'),
  ('job-webdev', 'Django'),
  ('job-webdev', 'REST APIs'),
  ('job-webdev', 'Python'),
  ('job-webdev', 'HTML/CSS'),
  ('job-graphic', 'Canva'),
  ('job-graphic', 'Photoshop'),
  ('job-graphic', 'Layout'),
  ('job-content', 'Copywriting'),
  ('job-content', 'Video editing'),
  ('job-content', 'Canva'),
  ('job-library', 'Data entry'),
  ('job-library', 'MS Office'),
  ('job-library', 'Documentation'),
  ('job-ai-lab', 'Python'),
  ('job-ai-lab', 'Machine Learning'),
  ('job-ai-lab', 'Documentation')
on conflict (job_id, skill_name) do nothing;

insert into job_match_overrides (job_id, student_id, score) values
  ('job-uiux', 'student-allyana', 94),
  ('job-webdev', 'student-allyana', 81),
  ('job-webdev', 'student-juan', 78),
  ('job-webdev', 'student-maria', 72),
  ('job-webdev', 'student-rey', 69),
  ('job-webdev', 'student-katrina', 58),
  ('job-graphic', 'student-allyana', 73),
  ('job-content', 'student-allyana', 68),
  ('job-library', 'student-allyana', 61),
  ('job-ai-lab', 'student-allyana', 77)
on conflict (job_id, student_id) do nothing;

insert into saved_jobs (student_id, job_id) values
  ('student-allyana', 'job-uiux'),
  ('student-allyana', 'job-content'),
  ('student-allyana', 'job-library'),
  ('student-allyana', 'job-ai-lab')
on conflict (student_id, job_id) do nothing;

insert into applications (id, job_id, student_id, status, applied_at) values
  ('app-uiux-allyana', 'job-uiux', 'student-allyana', 'interview', '2026-04-03'),
  ('app-webdev-allyana', 'job-webdev', 'student-allyana', 'review', '2026-04-05'),
  ('app-graphic-allyana', 'job-graphic', 'student-allyana', 'pending', '2026-04-07'),
  ('app-webdev-juan', 'job-webdev', 'student-juan', 'review', '2026-04-04'),
  ('app-webdev-maria', 'job-webdev', 'student-maria', 'review', '2026-04-05'),
  ('app-webdev-rey', 'job-webdev', 'student-rey', 'pending', '2026-04-05'),
  ('app-webdev-katrina', 'job-webdev', 'student-katrina', 'pending', '2026-04-06')
on conflict (id) do nothing;

insert into application_events (application_id, label) values
  ('app-uiux-allyana', 'Application submitted'),
  ('app-uiux-allyana', 'Under review'),
  ('app-uiux-allyana', 'Interview scheduled'),
  ('app-webdev-allyana', 'Application submitted'),
  ('app-webdev-allyana', 'Under review'),
  ('app-graphic-allyana', 'Application submitted'),
  ('app-webdev-juan', 'Application submitted'),
  ('app-webdev-juan', 'Under review'),
  ('app-webdev-maria', 'Application submitted'),
  ('app-webdev-maria', 'Under review'),
  ('app-webdev-rey', 'Application submitted'),
  ('app-webdev-katrina', 'Application submitted')
on conflict (application_id, label) do nothing;

insert into application_notes (application_id, note) values
  ('app-webdev-allyana', 'Strong profile. Has most required skills. Schedule for technical interview.')
on conflict (application_id) do nothing;
