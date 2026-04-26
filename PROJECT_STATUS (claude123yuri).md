# Hire GCians! Project Status

## Read This First

This project has two important realities:

- the current working baseline is a client-side MVP built from static HTML mockups plus an Express/PostgreSQL backend scaffold
- the target system is the approved proposal architecture: `Vue.js` frontend + `Django REST` backend + `Celery` + `Redis` + `Ollama` + `PyMuPDF` + `Tesseract OCR` + `pgvector`

If reopening this project in a future session, start here, then read:
- `hire_gcians.js`
- `hire_gcians.css`
- `backend/`
- `C:\Users\yana.LAPTOP-I8ASRTS6\ESPIRIDION.ALLYANARIZZ.REVISED.APPROVED.PROPOSAL.docx.pdf`

Recommended prompt for future sessions:
- `Read PROJECT_STATUS.md first, then continue from there.`

---

## Current Product Model

### Roles
- `student` = Gordon College applicants
- `employer` = third-party companies hiring Gordon College students
- `admin` = Gordon College officials with oversight access only

### Core rule for matching
- students do not manually manage profile skills
- skills used for matching come from AI analysis of the uploaded PDF resume
- the current app simulates that flow on the client side

---

## Current Baseline Architecture

- standalone HTML pages
- shared styles in `hire_gcians.css`
- shared app logic and seeded state in `hire_gcians.js`
- browser `localStorage` persistence
- backend scaffold in `backend/` with Express + PostgreSQL
- live Vercel deployment for the current MVP

## Target Architecture

- `Vue.js` frontend
- `Django REST` backend
- `PostgreSQL 18` with `pgvector`
- `Celery` + `Redis` for background processing
- `PyMuPDF` for direct PDF text extraction
- `Tesseract OCR` fallback for scanned/image-based resumes
- local `Ollama` models for resume parsing and embeddings (`qwen3:4b` + `nomic-embed-text`)
- semantic job matching with cosine similarity

---

## Django Project Structure

```
project root/
├── manage.py
├── core/               # Django project config
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── students/           # Student + Resume models, serializers, views, urls
├── jobs/               # Job + JobEmbedding models, serializers, views, urls
├── ai_pipeline/        # ParsedProfile, StudentEmbedding, MatchResult models, serializers, views, urls
├── ai/                 # AI utility modules
│   ├── extractor.py    # PyMuPDF extraction + OCR heuristics
│   ├── parser.py       # Ollama qwen3:4b resume parser
│   ├── embedder.py     # Ollama nomic-embed-text embedder
│   └── matcher.py      # Cosine similarity matcher
├── tasks/              # Celery task definitions (not yet wired)
├── backend/            # Express + PostgreSQL scaffold (MVP reference, not target)
└── .venv/
```

---

## Django Model Layer (as of 2026-04-23)

### students app
- `Student` — full_name, email, course, year_level, section, about, availability, preferred_setup, public_profile
- `Resume` — FK to Student, file (FileField), original_file_name, mime_type, file_size_bytes, extracted_text, summary, needs_ocr, last_error, status, uploaded_at, queued_at, processed_at

Resume status flow: `uploaded → extracting → ocr_needed → analyzing → ready → failed`

### jobs app
- `Job` — id (CharField PK, slug-style from Express seed), employer_id (CharField), title, company_name, job_type (db_column="type"), work_setup (db_column="setup"), schedule, description, requirements, required_skills (JSONField), location, slots, status, posted_at
- `JobEmbedding` — OneToOne to Job, source_text, model_name, embedding (VectorField 768d)

**Important:** The `jobs` table uses string slug PKs like `'job-uiux'`, `'job-graphic'` from the Express seed. `id` is a `CharField(primary_key=True)`. New jobs created through the Django API will need string IDs supplied explicitly or this will need a migration to auto-generate UUIDs later.

### ai_pipeline app
- `ParsedProfile` — OneToOne to Resume, skills, years_of_experience, education, job_titles, raw_json, parser_model
- `StudentEmbedding` — FK to Student, OneToOne to Resume, source_text, model_name, embedding (VectorField 768d)
- `MatchResult` — FK to Student + Resume + Job, similarity, match_percentage (both nullable), rationale, rationale_model. Unique constraint on (resume, job).

---

## Migration State (as of 2026-04-23)

All migrations applied and clean:

```
students    [X] 0001_initial  [X] 0002  [X] 0003
jobs        [X] 0001_initial  [X] 0002  [X] 0003  [X] 0004  [X] 0005  [X] 0006
ai_pipeline [X] 0001_initial  [X] 0002  [X] 0003
auth/admin/contenttypes/sessions — all fully applied
```

### Migration reconciliation notes
- `students.0002` applied normally after dropping stale FK constraint `resumes_student_id_e0b56870_fk_students_student_id`
- `jobs.0002`, `jobs.0003` were faked — DB already had correct shape
- `ai_pipeline.0002`, `ai_pipeline.0003` were faked — DB already had correct shape
- `jobs.0004` was faked — `employer_id` column already existed
- `jobs.0005` changed `employer_id` from `IntegerField` to `CharField` (Express seed uses string slugs)
- `jobs.0006` changed `id` from `AutoField` to `CharField(primary_key=True)` (Express seed uses string slug PKs)
- `parsed_profiles`, `student_embeddings`, `match_results`, `job_embeddings` tables were created manually via Django shell since their migrations were faked
- `MatchResult.resume`, `similarity`, `match_percentage` are nullable — tighten in a future migration once real pipeline data flows through

---

## Actual Database Tables (as of 2026-04-23)

Express seed tables (managed by Express backend):
`admin_profiles`, `application_events`, `application_notes`, `applications`,
`employer_profiles`, `employer_settings`, `job_match_overrides`, `job_skills`,
`resume_achievements`, `resume_analyses`, `resume_skills`, `saved_jobs`,
`student_experiences`, `student_preferences`, `student_profiles`, `users`

Django-managed tables:
`jobs`, `job_embeddings`, `match_results`, `parsed_profiles`, `student_embeddings`,
`students_student`, `students_resume`

Django auth tables:
`auth_group`, `auth_group_permissions`, `auth_permission`, `auth_user`,
`auth_user_groups`, `auth_user_user_permissions`, `django_admin_log`,
`django_content_type`, `django_migrations`, `django_session`

---

## Django REST API (live as of 2026-04-23)

Base: `http://127.0.0.1:8000/api/`

### Students
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/students/` | List / create students |
| GET/PATCH | `/api/students/<id>/` | Retrieve / update student |
| POST | `/api/students/resumes/upload/` | Upload PDF resume (multipart) |
| GET | `/api/students/<student_id>/resumes/` | List resumes for a student |
| GET | `/api/students/resumes/<id>/` | Resume detail |

### Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/jobs/` | List / create jobs |
| GET/PATCH | `/api/jobs/<id>/` | Retrieve / update job |
| GET | `/api/jobs/?status=active` | Filter by status |

### AI Pipeline
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ai/matches/` | List match results |
| GET | `/api/ai/matches/?student=<id>` | Filter by student |
| GET | `/api/ai/matches/?job=<id>` | Filter by job |
| GET | `/api/ai/matches/?resume=<id>` | Filter by resume |
| GET | `/api/ai/matches/<id>/` | Match result detail |
| GET | `/api/ai/parsed-profile/<resume_id>/` | Parsed profile for resume |
| POST | `/api/ai/match/trigger/` | Trigger matcher for a ready resume (sync, pre-Celery) |

### Resume upload
- accepts `multipart/form-data` with fields: `student` (int PK) and `file` (PDF only, max 10 MB)
- creates Resume record with `status=uploaded`
- Celery task hook is stubbed in `students/views.py` — see TODO comment in `ResumeUploadView.post()`

---

## AI Pipeline Modules (in `ai/`)

All four modules implemented and live-verified on 2026-04-23:

- `ai/extractor.py` — PyMuPDF direct extraction, pdf2image + pytesseract OCR fallback, text normalization, OCR-needed heuristics
- `ai/parser.py` — sends resume text to Ollama `qwen3:4b`, returns validated structured JSON
- `ai/embedder.py` — generates 768d embedding vectors via Ollama `nomic-embed-text`
- `ai/matcher.py` — cosine similarity between student embedding and job embeddings, returns ranked MatchResult list

Ollama config in `backend/.env`:
```
OLLAMA_LLM_MODEL=qwen3:4b
OLLAMA_EMBED_MODEL=nomic-embed-text
```

---

## pgvector Status

- PostgreSQL 18 is the intended backend database
- `pgvector` extension enabled in `hire_gcians` DB at version `0.8.2`
- `VectorField(dimensions=768)` live in `JobEmbedding` and `StudentEmbedding` models
- vector search not yet wired into query logic — cosine similarity currently runs in Python via `ai/matcher.py`

---

## What Works Now

### Static MVP (localStorage)
- full student flow: login, browse jobs, apply, save, profile, resume upload simulation, compatibility scoring
- full employer flow: dashboard, post jobs, manage applicants, stage updates, company profile, settings
- admin overview: metrics, users, listings, health, alerts
- deployed to Vercel as public MVP (2026-04-09)

### Django backend (local, not wired to frontend yet)
- all models migrated and clean
- DRF configured with pagination and multi-parser support
- all three API endpoint groups live and returning real seed data
- resume upload endpoint accepts PDF, creates Resume record
- match trigger endpoint runs matcher synchronously (pre-Celery)
- AI modules verified end-to-end locally

---

## Known Gaps / Not Done Yet

### High priority
- Celery + Redis not installed or wired — resume processing is synchronous only
- frontend still uses `localStorage` — not wired to Django API at all
- no authentication/permissions on DRF endpoints — all endpoints are currently open
- `TriggerMatchView` calls `ai.matcher.match_resume_to_jobs(resume)` — verify this function signature matches actual `ai/matcher.py` before using
- `Job.id` is a `CharField` PK — creating new jobs via the API requires supplying a string ID explicitly; needs a plan (UUID auto-generation or integer sequence) before frontend wiring

### Medium priority
- OCR fallback not verified end-to-end against a real scanned PDF (Poppler runtime not confirmed)
- `JobEmbedding` records not created for existing seed jobs — embedder needs to be run against existing job data
- pgvector cosine similarity query not wired — matching still runs in Python, not at DB level
- `MatchResult.resume`, `similarity`, `match_percentage` are nullable — tighten with a future migration once real pipeline data flows

### Low priority
- some `department` references remain in `hire_gcians.js` as localStorage compatibility fallbacks
- marketing/explanatory text is static by design
- browser localStorage means deployed demo state is per-browser and not shared

---

## Best Next Steps

1. **Wire Celery tasks** — install Redis, set up Celery, create `tasks/resume_pipeline.py` chaining extractor → parser → embedder, hook into `ResumeUploadView`
2. **Add DRF authentication** — add JWT or session auth to protect endpoints before any frontend wiring
3. **Seed job embeddings** — write a management command to run the embedder against all existing published jobs and create `JobEmbedding` records
4. **Verify `ai/matcher.py` signature** — confirm `match_resume_to_jobs(resume)` exists and returns saved `MatchResult` objects, update `TriggerMatchView` if needed
5. **Verify OCR fallback** — test `ai/extractor.py` against a real scanned PDF, confirm Poppler availability
6. **Plan Job PK strategy** — decide between UUID auto-generation or integer sequence for new jobs created via the Django API

---

## Migration Path

1. Preserve current MVP as UI/flow reference while building target stack in parallel.
2. Stand up Celery + Redis and wire async resume processing.
3. Add JWT auth to Django REST endpoints.
4. Move frontend consumers from static/local demo state to real API-driven state (Vue.js rewrite).
5. Replace demo-only matching with real resume-derived matching and employer-facing rationale output.
6. Wire pgvector cosine similarity at DB level for scalable matching.

---

## Demo Accounts

### Student
- email: `allyana@gordoncollege.edu.ph`
- password: `student123`

### Employer
- email: `hiring@brightpathdigital.com`
- password: `employer123`

### Admin
- email: `admin@gordoncollege.edu.ph`
- password: `admin123`

---

## Resume-After-Reopen Instructions

Tell the assistant:
- `Read PROJECT_STATUS.md first.`
- `Use the current role model: students, third-party employers, and college-admin oversight.`
- `Resume matching must stay PDF/AI-driven, not manually entered by students.`
- `Treat the current static HTML + Express app as the MVP baseline, but aim future work at the approved Vue + Django + Celery + Redis + Ollama proposal architecture.`
- `The Django REST API scaffold is live. Do not re-scaffold it. Continue from Best Next Steps.`

If a feature is actively in progress, add that task here before closing the tab.
