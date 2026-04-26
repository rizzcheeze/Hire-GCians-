# Hire GCians Backend

This backend is the first move away from browser-only demo state. It gives the project:

- a PostgreSQL schema aligned with the current MVP entities
- seed data that mirrors the current `hire_gcians.js` demo accounts and listings
- an Express API with auth, role checks, employer job management, student applications, saved jobs, and employer settings
- local resume file storage plus processing-state tracking for the future PDF/OCR/AI pipeline

## Stack

- Node.js
- Express
- PostgreSQL
- `pg` for queries
- `bcryptjs` for password hashes
- `jsonwebtoken` for session tokens

## Quick start

1. Create a PostgreSQL database named `hire_gcians`.
2. Copy `.env.example` to `.env` and set `DATABASE_URL`.
3. Install dependencies with `npm install`.
4. Run `sql/schema.sql` against the database.
5. Run `sql/seed.sql` against the database.
6. Start the API with `npm run dev`.

If you already loaded an older version of the seed before bcrypt hashes were added, run `sql/seed.sql` again so the existing demo users are updated with hashed passwords.
If you already loaded the schema before resume-processing fields were added, run `sql/schema.sql` again before rerunning `sql/seed.sql`.

## Initial endpoints

- `GET /api/health`
- `POST /api/auth/login`
- `POST /api/auth/signup`
- `GET /api/me`
- `GET /api/jobs`
- `GET /api/jobs/:jobId`
- `POST /api/jobs`
- `PATCH /api/jobs/:jobId`
- `GET /api/students/:studentId/applications`
- `POST /api/students/:studentId/applications`
- `PATCH /api/students/:studentId/applications/:applicationId`
- `GET /api/students/:studentId/saved-jobs`
- `POST /api/students/:studentId/saved-jobs`
- `DELETE /api/students/:studentId/saved-jobs/:jobId`
- `GET /api/students/:studentId/resume`
- `POST /api/students/:studentId/resume`
- `PATCH /api/students/:studentId/resume`
- `GET /api/employers/:employerId/applicants`
- `PATCH /api/employers/:employerId/applications/:applicationId`
- `GET /api/employers/:employerId/settings`
- `PATCH /api/employers/:employerId/settings`

## Scope of this first backend slice

This does not replace the frontend `localStorage` flow yet. It establishes the server contract and the relational model first so the frontend can migrate incrementally.

## Resume upload contract

- upload field name: `resume`
- accepted type: PDF only
- max size: `MAX_RESUME_SIZE_MB`
- storage: local disk under `RESUME_UPLOAD_DIR`
- processing states: `missing`, `uploaded`, `extracting`, `ocr_needed`, `analyzing`, `ready`, `failed`

The backend now stores resume file metadata and extracted-text placeholders even though the actual PDF/OCR/AI worker is not implemented yet.

## Demo credentials

The seeded demo accounts still use the same visible passwords from the MVP:

- student: `student123`
- employer: `employer123`
- admin: `admin123`

Those are now stored as bcrypt hashes in the seed data.
