# Hire GCians! Post-Deploy Smoke Test

Use this checklist after each deploy of the current client-side MVP.

## Test Setup

- Test against the deployed site and one local browser run when possible.
- Use a fresh incognito/private window first so old `localStorage` does not hide regressions.
- Confirm the build is using the current role model:
  - `student` = Gordon College applicants
  - `employer` = third-party companies
  - `admin` = Gordon College oversight only
- Remember that the deployed MVP is browser-local:
  - state is not shared across devices
  - test actions may need a reset by clearing site storage between passes

## Demo Accounts

- Student: `allyana@gordoncollege.edu.ph` / `student123`
- Employer: `hiring@brightpathdigital.com` / `employer123`
- Admin: `admin@gordoncollege.edu.ph` / `admin123`

## Public Routes

- Open `/` and confirm the landing page loads with working navigation links.
- Open `/for-employers` and confirm employer-facing marketing content renders correctly.
- Open `/about` and confirm the page loads without broken layout or missing assets.
- Open `/auth` and confirm the page shows login and signup states.
- Confirm CSS and JS load correctly on all public pages with no obvious unstyled content.
- Confirm route links use clean public paths and work after direct page refresh.

## Auth Flow

- Log in as `student` and confirm redirect to the student dashboard.
- Log out and log in as `employer` and confirm redirect to the employer dashboard.
- Log out and log in as `admin` and confirm redirect to the admin page.
- Try signup as a student and confirm a new local demo account is created without breaking seeded users.
- Confirm role-gated pages redirect away when the logged-in user opens a route for another role.

## Student Flow

- On the dashboard, confirm profile summary, AI-match messaging, and top job matches render.
- Open job listings and confirm filters, job selection, score display, and save/apply actions work.
- Save and unsave at least one job and confirm the saved jobs page updates.
- Apply to one eligible job and confirm the applications page reflects the new application.
- Withdraw one application and confirm counts and status views update.
- Open the student profile and confirm skills shown are resume-derived, not manually edited profile skills.
- Open the public profile and confirm resume-derived skills and profile content render correctly.
- Open `Skills & Resume` and upload a PDF file.
- Confirm the app stores the PDF filename, generates simulated extracted skills, shows quantifiable items, and updates matching-related messaging.
- Confirm the resume recommendation text still describes the current MVP honestly:
  - simulated local analysis only
  - no real PDF extraction, OCR, or AI backend yet

## Employer Flow

- Log in as the BrightPath employer and confirm dashboard metrics and listing summaries render.
- Open posting and confirm draft fields, preview card, and publish flow work.
- Publish a test listing and confirm it appears in active listings.
- Open applicants and confirm job switcher, stage filters, applicant detail, score breakdown, and notes work.
- Change an applicant stage and confirm the new stage persists in browser state.
- Open hired students and confirm hired-state rows render when relevant.
- Open company profile and confirm company-facing copy and data render correctly.
- Open employer settings and confirm settings save locally without affecting role access.

## Admin Flow

- Log in as admin and confirm overview metrics, recent users, active listings, health card, and alerts load.
- Confirm admin copy reflects oversight access only and does not imply employer-style hiring actions.
- Confirm recent users include students, employers, and admin accounts with the correct role labels.

## Route And Asset Checks

- Refresh at least one student route, one employer route, and the admin route directly by URL.
- Confirm root-absolute CSS, JS, and page links still work after refresh on nested routes.
- Confirm there are no broken navigation links to the old employer profile route.
- Confirm company profile links resolve to `hire_gcians_company_profile.html`.

## Responsive Pass

- Check at least one public page, one student page, one employer page, and the admin page around:
  - desktop width
  - tablet width
  - mobile width
- Confirm sidebars collapse into a readable stacked layout on smaller screens.
- Confirm major cards, tables, forms, and action buttons stay usable without horizontal overflow.

## Resume Matching Guardrails

- Confirm compatibility scoring is driven by resume-derived skills.
- Confirm the student cannot manually manage matching skills as a separate profile editor flow.
- Confirm employer applicant skill breakdown labels skills as found or not found in the resume.

## Regression Notes

- Record any route that fails only after refresh.
- Record any page that depends on stale `localStorage` data to appear correct.
- Record any remaining legacy `department` wording found in live UI text.
- Record any mismatch between seeded demo data and what the UI claims.
