# Frontend Transition Plan

The current frontend should not jump straight from `localStorage` to a full rewrite. Move the state ownership in this order:

1. Auth
   Replace the current seeded login lookup in `hire_gcians.js` with `POST /api/auth/login`.

2. Jobs and listings
   Replace the demo job list and employer job ownership reads with `GET /api/jobs`, `GET /api/jobs/:jobId`, `POST /api/jobs`, and `PATCH /api/jobs/:jobId`.

3. Student application state
   Move saved jobs, applications, and application events to backend-backed reads and writes through the student application and saved-job endpoints.

4. Employer workspace
   Move employer settings, applicant notes, and stage updates off `localStorage` using employer settings and application-status routes.

5. Resume pipeline
   Use the resume upload/status endpoints first, then attach PDF extraction, OCR fallback, and AI skill extraction behind the same stored resume record.

The existing `hire_gcians.js` seed state should be treated as a migration source, not the long-term truth.
