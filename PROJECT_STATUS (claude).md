# HIRE GCIANS! — AI Pipeline Project Status

## Project Overview
HIRE GCIANS! is a locally-deployable AI-powered resume matching platform for GC (Gordon College) students. It processes student resumes, generates semantic embeddings, and matches them against job descriptions using cosine similarity. A hiring rationale is generated via Gemini 2.0 Flash API.

---

## Current Stack

| Layer | Technology | Status |
|---|---|---|
| Web Framework | Django 6.0.4 + Django REST Framework 3.17.1 | ✅ Installed & running |
| Database | PostgreSQL 18 (via pgAdmin 4) | ✅ Connected |
| Vector Search | pgvector 0.8.2 (extension enabled) | ✅ Enabled in DB |
| Local LLM | Ollama — qwen3:4b | ✅ Pulled & running |
| Embedding Model | Ollama — qwen3:0.6b | ✅ Pulled & running |
| PDF Extraction | PyMuPDF 1.25.5 | ✅ Installed |
| OCR Fallback | Tesseract OCR v5 (Windows) | ✅ Installed & in PATH |
| PDF-to-image | pdf2image + Pillow | ✅ Installed |
| Task Queue | Celery 5.4.0 | ✅ Installed |
| Message Broker | Redis 7 (Docker container) | ✅ Running on port 6379 |
| Gemini API | google-generativeai 0.7.2 | ✅ Installed, API key set |
| ORM | SQLAlchemy 2.0.31 + psycopg2-binary 2.9.12 | ✅ Installed |
| Data Validation | Pydantic 2.8.2 | ✅ Installed |

---

## Environment

- **OS:** Windows 11 x64
- **Python:** 3.13.3
- **Virtual Environment:** `.venv` (located in project root)
- **Django settings module:** `core.settings`
- **Server:** `http://127.0.0.1:8000` (development)
- **Database name:** `hire_gcians`
- **Database user:** `postgres`
- **Redis:** Docker container named `redis-hire-gcians`, port `6379`
- **Ollama:** Running locally on `http://localhost:11434`

---

## Project Structure

```
project-root/
├── .env                        # Environment variables (DB, Ollama, Redis, Gemini)
├── .gitignore                  # Protects .env, .venv, __pycache__, uploads
├── manage.py                   # Django entry point
├── requirements.txt            # All Python dependencies
│
├── core/                       # Django project config
│   ├── settings.py             # Configured: DB, DRF, installed apps, Manila timezone
│   ├── urls.py                 # Root URL config (needs AI pipeline URLs added)
│   ├── asgi.py
│   └── wsgi.py
│
├── ai/                         # AI pipeline modules (NOT yet implemented)
│   ├── __init__.py
│   ├── extractor.py            # TODO: PyMuPDF + Tesseract OCR fallback
│   ├── parser.py               # TODO: Ollama Qwen3 4B → structured JSON
│   ├── embedder.py             # TODO: Qwen3-0.6B-embed → pgvector storage
│   ├── matcher.py              # TODO: Cosine similarity matching
│   └── rationale.py            # TODO: Gemini 2.0 Flash rationale generation
│
├── tasks/                      # Celery async tasks (NOT yet implemented)
│   ├── __init__.py
│   ├── resume_tasks.py         # TODO: extract → parse → embed → store pipeline
│   └── matching_tasks.py       # TODO: match score + rationale generation
│
├── ai_pipeline/                # Django app — REST API endpoints (NOT yet implemented)
│   ├── models.py               # TODO: Resume, Embedding models
│   ├── views.py                # TODO: API views
│   ├── urls.py                 # TODO: URL routes
│   └── serializers.py          # TODO: DRF serializers
│
├── jobs/                       # Django app — Job listings (NOT yet implemented)
│   ├── models.py               # TODO: Job model with embedding field
│   ├── views.py
│   ├── urls.py
│   └── serializers.py
│
├── students/                   # Django app — Student profiles (NOT yet implemented)
│   ├── models.py               # TODO: Student model
│   ├── views.py
│   ├── urls.py
│   └── serializers.py
│
├── backend/                    # Existing Node.js/Express backend (separate service)
│   ├── src/
│   ├── package.json
│   └── ...
│
└── uploads/                    # Resume PDF uploads (gitignored)
```

---

## .env Variables (keys only, no values)

```
PORT
DATABASE_URL
JWT_SECRET
CORS_ORIGIN
OLLAMA_BASE_URL
OLLAMA_LLM_MODEL
OLLAMA_EMBED_MODEL
REDIS_URL
CELERY_BROKER_URL
CELERY_RESULT_BACKEND
GEMINI_API_KEY
```

---

## Django Apps & Migrations

- `python manage.py migrate` — ✅ All default migrations applied (auth, admin, contenttypes, sessions)
- No custom models created yet — all app `models.py` files are empty stubs

---

## What's Done
- Full environment setup on Windows 11
- PostgreSQL 18 + pgvector extension enabled
- Django 6.0.4 project created (`core/`) and connected to PostgreSQL
- Django REST Framework installed and added to INSTALLED_APPS
- All three Django apps created: `ai_pipeline`, `jobs`, `students`
- `ai/` and `tasks/` module folders created with `__init__.py`
- Redis running in Docker
- All Python packages installed in `.venv`
- Ollama running with both models pulled
- Tesseract installed and in system PATH
- `.env` file complete with all required variables
- `.gitignore` created

---

## What Needs To Be Built Next

### Priority Order:

1. **`ai/extractor.py`**
   - Extract text from PDF using PyMuPDF (`fitz`)
   - Fallback to Tesseract OCR via `pytesseract` + `pdf2image` for scanned PDFs
   - Return clean plain text string

2. **`ai/parser.py`**
   - Send extracted text to Ollama `qwen3:4b`
   - Prompt it to return structured JSON: `{skills, years_of_experience, education, job_titles}`
   - Parse and validate response with Pydantic

3. **`ai/embedder.py`**
   - Send parsed profile text to Ollama `qwen3:0.6b` embed endpoint
   - Return 1024-dimensional vector
   - Store vector in pgvector table

4. **`ai/matcher.py`**
   - Query pgvector using cosine similarity
   - Compare student profile vector vs job description vector
   - Return match percentage (0–100%)

5. **`ai/rationale.py`**
   - Send matched profile + job description + score to Gemini 2.0 Flash
   - Return employer-facing 3-paragraph hiring rationale

6. **`tasks/resume_tasks.py`**
   - Celery task: wrap extractor → parser → embedder into one async pipeline
   - Triggered on resume upload

7. **`tasks/matching_tasks.py`**
   - Celery task: wrap matcher → rationale into one async pipeline
   - Triggered on match request

8. **`celery_app.py`** (in project root)
   - Initialize Celery with Redis broker
   - Autodiscover tasks

9. **Django models** (`ai_pipeline/models.py`, `jobs/models.py`, `students/models.py`)
   - Define Resume, StudentProfile, Job, Embedding, MatchResult models
   - Use `pgvector.django` for vector fields

10. **Django REST API endpoints** (`ai_pipeline/views.py`, `jobs/views.py`, `students/views.py`)
    - POST `/api/resume/upload/` — triggers resume processing pipeline
    - GET `/api/match/<student_id>/<job_id>/` — returns match score + rationale
    - GET `/api/jobs/` — list all jobs
    - GET `/api/students/` — list all students

---

## Known Issues / Notes
- PyMuPDF had to be upgraded to 1.25.5 (1.24.5 requires Visual Studio Build Tools on Windows)
- numpy had to be installed with `--only-binary=:all:` flag (same reason)
- psycopg2-binary upgraded to 2.9.12 (2.9.9 has no wheel for Python 3.13)
- Redis runs via Docker on Windows (no native Windows Redis binary)
- pgvector installed via pre-built binary from `andreiramani/pgvector_pgsql_windows` GitHub releases
- No Visual Studio Build Tools installed — always use `--only-binary=:all:` for new packages
- Existing Node.js backend in `backend/` folder is a separate service and should not be modified
