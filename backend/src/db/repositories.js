import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { httpError } from "../lib/http.js";
import { query, withTransaction } from "./pool.js";

function mapUser(row) {
  return {
    id: row.id,
    role: row.role,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    organization: row.organization_name,
    createdAt: row.created_at,
  };
}

function issueToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, {
    expiresIn: "7d",
  });
}

function normalizeSkills(skills = []) {
  return Array.from(
    new Set(
      skills
        .map((skill) => String(skill || "").trim())
        .filter(Boolean)
    )
  );
}

function createPrefixedId(prefix) {
  return `${prefix}-${randomUUID()}`;
}

function requireNonEmptyString(value, label) {
  const normalized = String(value || "").trim();
  if (!normalized) {
    throw httpError(400, `${label} is required.`);
  }
  return normalized;
}

function parsePositiveInteger(value, label) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw httpError(400, `${label} must be a positive integer.`);
  }
  return parsed;
}

function mapJob(row) {
  return {
    id: row.id,
    title: row.title,
    company: row.company_name,
    type: row.type,
    setup: row.setup,
    schedule: row.schedule,
    description: row.description,
    slots: row.slots,
    status: row.status,
    postedAt: row.posted_at,
    employerId: row.employer_id,
    skills: row.skills || [],
  };
}

function mapApplication(row) {
  return {
    id: row.id || row.application_id,
    status: row.status,
    appliedAt: row.applied_at,
    jobId: row.job_id,
    title: row.title || row.job_title,
    company: row.company_name,
    events: row.events || [],
    studentId: row.student_id,
    firstName: row.first_name,
    lastName: row.last_name,
    program: row.program,
    section: row.section,
    fileName: row.file_name,
    extractedSkills: row.extracted_skills || [],
    note: row.note,
  };
}

function mapResume(row) {
  if (!row) return null;
  return {
    id: row.id,
    studentId: row.student_id,
    fileName: row.file_name,
    originalFileName: row.original_file_name,
    mimeType: row.mime_type,
    fileSizeBytes: row.file_size_bytes,
    storagePath: row.storage_path,
    processingStatus: row.processing_status,
    extractedText: row.extracted_text,
    needsOcr: row.needs_ocr,
    lastError: row.last_error,
    summary: row.summary,
    queuedAt: row.queued_at,
    processedAt: row.processed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    extractedSkills: row.extracted_skills || [],
    quantifiable: row.quantifiable || [],
  };
}

export async function listJobs(filters = {}) {
  const params = [];
  const where = [];
  if (filters.status) {
    params.push(filters.status);
    where.push(`j.status = $${params.length}`);
  }
  if (filters.employerId) {
    params.push(filters.employerId);
    where.push(`j.employer_id = $${params.length}`);
  }
  const clause = where.length ? `where ${where.join(" and ")}` : "";
  const { rows } = await query(
    `select
      j.id,
      j.employer_id,
      j.title,
      j.type,
      j.setup,
      j.schedule,
      j.description,
      j.slots,
      j.status,
      j.posted_at,
      e.company_name,
      coalesce(
        json_agg(distinct js.skill_name) filter (where js.skill_name is not null),
        '[]'::json
      ) as skills
    from jobs j
    join employer_profiles e on e.user_id = j.employer_id
    left join job_skills js on js.job_id = j.id
    ${clause}
    group by j.id, e.company_name
    order by j.posted_at desc nulls last, j.created_at desc`,
    params
  );
  return rows.map(mapJob);
}

export async function findUserByEmail(email) {
  const { rows } = await query(
    `select
      u.id,
      u.role,
      u.first_name,
      u.last_name,
      u.email,
      u.password_hash,
      ep.company_name as organization_name,
      u.created_at
    from users u
    left join employer_profiles ep on ep.user_id = u.id
    where lower(u.email) = lower($1)
    limit 1`,
    [email]
  );
  return rows[0] || null;
}

export async function findUserById(userId) {
  const { rows } = await query(
    `select
      u.id,
      u.role,
      u.first_name,
      u.last_name,
      u.email,
      ep.company_name as organization_name,
      u.created_at
    from users u
    left join employer_profiles ep on ep.user_id = u.id
    where u.id = $1
    limit 1`,
    [userId]
  );
  return rows[0] ? mapUser(rows[0]) : null;
}

export async function loginUser(email, password) {
  const user = await findUserByEmail(email);
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return null;
  const token = issueToken(user);
  return { token, user: mapUser(user) };
}

export async function signupUser(input) {
  const role = String(input.role || "").trim();
  const email = String(input.email || "").trim().toLowerCase();
  const password = String(input.password || "");
  const firstName = String(input.firstName || "").trim();
  const lastName = String(input.lastName || "").trim();

  if (!["student", "employer", "admin"].includes(role)) {
    throw httpError(400, "Role must be student, employer, or admin.");
  }
  if (role === "admin") {
    throw httpError(403, "Admin accounts cannot be created through public signup.");
  }
  if (!email || !password || !firstName || !lastName) {
    throw httpError(400, "First name, last name, email, password, and role are required.");
  }
  if (password.length < 8) {
    throw httpError(400, "Password must be at least 8 characters.");
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    throw httpError(409, "An account with that email already exists.");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const userId = createPrefixedId(`user-${role}`);
  const organizationName =
    role === "employer"
      ? String(input.companyName || input.organization || `${firstName} ${lastName}`).trim()
      : undefined;

  await withTransaction(async (client) => {
    await client.query(
      `insert into users (id, role, first_name, last_name, email, password_hash)
       values ($1, $2, $3, $4, $5, $6)`,
      [userId, role, firstName, lastName, email, passwordHash]
    );

    if (role === "student") {
      await client.query(
        `insert into student_profiles
          (user_id, program, year_level, section, about, availability, preferred_setup, public_profile)
         values ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          userId,
          String(input.program || "BSCS"),
          String(input.yearLevel || "1st Year"),
          String(input.section || "1-A"),
          String(input.about || "New student account."),
          String(input.availability || ""),
          String(input.preferredSetup || ""),
          input.publicProfile ?? true,
        ]
      );
      await client.query(
        `insert into student_preferences (student_id, label) values ($1, $2) on conflict do nothing`,
        [userId, "Open to opportunities"]
      );
      await client.query(
        `insert into resume_analyses (student_id, file_name, summary) values ($1, $2, $3)`,
        [userId, "", "Upload a PDF resume so the AI can extract skills for matching."]
      );
    } else if (role === "employer") {
      await client.query(
        `insert into employer_profiles (user_id, company_name, summary, public_company)
         values ($1, $2, $3, $4)`,
        [
          userId,
          organizationName,
          String(input.summary || `${organizationName} is hiring Gordon College students for internships, part-time work, and entry-level project support.`),
          input.publicCompany ?? true,
        ]
      );
      await client.query(
        `insert into employer_settings (employer_id, default_job_type, default_work_setup, email_applicants, email_expiring)
         values ($1, $2, $3, $4, $5)`,
        [
          userId,
          String(input.defaultJobType || "Part-time"),
          String(input.defaultWorkSetup || "Remote"),
          input.emailApplicants ?? true,
          input.emailExpiring ?? true,
        ]
      );
    } else {
      await client.query(
        `insert into admin_profiles (user_id, title) values ($1, $2)`,
        [userId, String(input.title || "College admin")]
      );
    }
  });

  const profile = {
    id: userId,
    role,
    firstName,
    lastName,
    email,
    organization: organizationName,
    createdAt: new Date().toISOString(),
  };

  return { token: issueToken(profile), user: profile };
}

export async function getCurrentUserProfile(userId) {
  const user = await findUserById(userId);
  if (!user) return null;

  if (user.role === "student") {
    const { rows } = await query(
      `select
        sp.program,
        sp.year_level,
        sp.section,
        sp.about,
        sp.availability,
        sp.preferred_setup,
        sp.public_profile,
        ra.file_name,
        ra.processing_status,
        ra.summary,
        coalesce(
          (select json_agg(label order by label) from student_preferences where student_id = sp.user_id),
          '[]'::json
        ) as preferences,
        coalesce(
          (select json_agg(skill_name order by skill_name) from resume_skills where resume_analysis_id = ra.id),
          '[]'::json
        ) as extracted_skills
      from student_profiles sp
      left join resume_analyses ra on ra.student_id = sp.user_id
      where sp.user_id = $1`,
      [userId]
    );
    return { ...user, profile: rows[0] || null };
  }

  if (user.role === "employer") {
    const { rows } = await query(
      `select
        ep.company_name,
        ep.summary,
        ep.public_company,
        es.default_job_type,
        es.default_work_setup,
        es.email_applicants,
        es.email_expiring
      from employer_profiles ep
      join employer_settings es on es.employer_id = ep.user_id
      where ep.user_id = $1`,
      [userId]
    );
    return { ...user, profile: rows[0] || null };
  }

  const { rows } = await query(
    `select title from admin_profiles where user_id = $1`,
    [userId]
  );
  return { ...user, profile: rows[0] || null };
}

export async function getStudentResume(studentId) {
  const { rows } = await query(
    `select
      ra.*,
      coalesce(
        (select json_agg(skill_name order by skill_name) from resume_skills where resume_analysis_id = ra.id),
        '[]'::json
      ) as extracted_skills,
      coalesce(
        (select json_agg(detail order by detail) from resume_achievements where resume_analysis_id = ra.id),
        '[]'::json
      ) as quantifiable
     from resume_analyses ra
     where ra.student_id = $1
     limit 1`,
    [studentId]
  );
  return mapResume(rows[0] || null);
}

export async function upsertStudentResume(studentId, fileMeta) {
  const existing = await getStudentResume(studentId);
  const { rows } = await query(
    `insert into resume_analyses
      (
        student_id,
        file_name,
        original_file_name,
        mime_type,
        file_size_bytes,
        storage_path,
        processing_status,
        extracted_text,
        needs_ocr,
        last_error,
        summary,
        queued_at,
        processed_at
      )
     values ($1, $2, $3, $4, $5, $6, 'uploaded', null, false, null, $7, now(), null)
     on conflict (student_id)
     do update set
       file_name = excluded.file_name,
       original_file_name = excluded.original_file_name,
       mime_type = excluded.mime_type,
       file_size_bytes = excluded.file_size_bytes,
       storage_path = excluded.storage_path,
       processing_status = 'uploaded',
       extracted_text = null,
       needs_ocr = false,
       last_error = null,
       summary = excluded.summary,
       queued_at = now(),
       processed_at = null,
       updated_at = now()
     returning *`,
    [
      studentId,
      fileMeta.fileName,
      fileMeta.originalFileName,
      fileMeta.mimeType,
      fileMeta.fileSizeBytes,
      fileMeta.storagePath,
      "Resume uploaded. Waiting for PDF extraction and AI analysis.",
    ]
  );

  const analysisId = rows[0].id;
  await query(`delete from resume_skills where resume_analysis_id = $1`, [analysisId]);
  await query(`delete from resume_achievements where resume_analysis_id = $1`, [analysisId]);

  return {
    previousStoragePath: existing?.storagePath || null,
    resume: mapResume(rows[0]),
  };
}

export async function updateResumeProcessing(studentId, actor, input) {
  if (actor.role !== "admin") {
    throw httpError(403, "Only admin or worker contexts may update resume processing state.");
  }
  const current = await getStudentResume(studentId);
  if (!current) {
    throw httpError(404, "Resume record not found.");
  }

  const nextStatus = input.processingStatus ?? current.processingStatus;
  const validStatuses = ["missing", "uploaded", "extracting", "ocr_needed", "analyzing", "ready", "failed"];
  if (!validStatuses.includes(nextStatus)) {
    throw httpError(400, "Invalid resume processing status.");
  }

  const extractedSkills = normalizeSkills(input.extractedSkills ?? current.extractedSkills);
  const quantifiable = Array.from(new Set((input.quantifiable ?? current.quantifiable).map((item) => String(item || "").trim()).filter(Boolean)));
  const summary = String(input.summary ?? current.summary ?? "").trim() || "Resume processing updated.";
  const extractedText = input.extractedText ?? current.extractedText;
  const needsOcr = input.needsOcr ?? current.needsOcr ?? false;
  const lastError = input.lastError ?? null;

  await withTransaction(async (client) => {
    const { rows } = await client.query(
      `update resume_analyses
       set processing_status = $2,
           extracted_text = $3,
           needs_ocr = $4,
           last_error = $5,
           summary = $6,
           processed_at = case when $2 in ('ready', 'failed') then now() else null end,
           updated_at = now()
       where student_id = $1
       returning id`,
      [studentId, nextStatus, extractedText, needsOcr, lastError, summary]
    );
    const analysisId = rows[0].id;
    await client.query(`delete from resume_skills where resume_analysis_id = $1`, [analysisId]);
    await client.query(`delete from resume_achievements where resume_analysis_id = $1`, [analysisId]);
    for (const skill of extractedSkills) {
      await client.query(`insert into resume_skills (resume_analysis_id, skill_name) values ($1, $2)`, [analysisId, skill]);
    }
    for (const item of quantifiable) {
      await client.query(`insert into resume_achievements (resume_analysis_id, detail) values ($1, $2)`, [analysisId, item]);
    }
  });

  return getStudentResume(studentId);
}

export async function listStudentApplications(studentId) {
  const { rows } = await query(
    `select
      a.id,
      a.status,
      a.applied_at,
      j.id as job_id,
      j.title,
      e.company_name,
      n.note,
      coalesce(
        json_agg(distinct ae.label) filter (where ae.label is not null),
        '[]'::json
      ) as events
    from applications a
    join jobs j on j.id = a.job_id
    join employer_profiles e on e.user_id = j.employer_id
    left join application_events ae on ae.application_id = a.id
    left join application_notes n on n.application_id = a.id
    where a.student_id = $1
    group by a.id, j.id, e.company_name, n.note
    order by a.applied_at desc`,
    [studentId]
  );
  return rows.map(mapApplication);
}

export async function listEmployerApplicants(employerId) {
  const { rows } = await query(
    `select
      a.id as application_id,
      a.status,
      a.applied_at,
      j.id as job_id,
      j.title as job_title,
      s.user_id as student_id,
      u.first_name,
      u.last_name,
      s.program,
      s.section,
      rn.file_name,
      n.note,
      coalesce(
        json_agg(distinct rs.skill_name) filter (where rs.skill_name is not null),
        '[]'::json
      ) as extracted_skills
    from jobs j
    join applications a on a.job_id = j.id
    join student_profiles s on s.user_id = a.student_id
    join users u on u.id = s.user_id
    left join resume_analyses rn on rn.student_id = s.user_id
    left join resume_skills rs on rs.resume_analysis_id = rn.id
    left join application_notes n on n.application_id = a.id
    where j.employer_id = $1
    group by a.id, j.id, s.user_id, u.id, rn.id, n.note
    order by a.applied_at desc`,
    [employerId]
  );
  return rows.map(mapApplication);
}

export async function getJobById(jobId) {
  return getJobDetails(jobId);
}

export async function createJob(employerId, input) {
  const title = requireNonEmptyString(input.title, "Title");
  const type = requireNonEmptyString(input.type, "Type");
  const setup = requireNonEmptyString(input.setup, "Setup");
  const schedule = requireNonEmptyString(input.schedule, "Schedule");
  const description = requireNonEmptyString(input.description, "Description");
  const status = String(input.status || "draft").trim();
  const slots = parsePositiveInteger(input.slots ?? 1, "Slots");
  const skills = normalizeSkills(input.skills || []);

  if (!["draft", "active", "closed"].includes(status)) {
    throw httpError(400, "Status must be draft, active, or closed.");
  }

  const jobId = createPrefixedId("job");
  await withTransaction(async (client) => {
    await client.query(
      `insert into jobs
        (id, employer_id, title, type, setup, schedule, description, slots, status, posted_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        jobId,
        employerId,
        title,
        type,
        setup,
        schedule,
        description,
        slots,
        status,
        status === "active" ? new Date().toISOString().slice(0, 10) : null,
      ]
    );
    for (const skill of skills) {
      await client.query(
        `insert into job_skills (job_id, skill_name) values ($1, $2) on conflict do nothing`,
        [jobId, skill]
      );
    }
  });
  return getJobDetails(jobId);
}

export async function getJobDetails(jobId) {
  const { rows } = await query(
    `select
      j.id,
      j.employer_id,
      j.title,
      j.type,
      j.setup,
      j.schedule,
      j.description,
      j.slots,
      j.status,
      j.posted_at,
      e.company_name,
      coalesce(
        json_agg(distinct js.skill_name) filter (where js.skill_name is not null),
        '[]'::json
      ) as skills
    from jobs j
    join employer_profiles e on e.user_id = j.employer_id
    left join job_skills js on js.job_id = j.id
    where j.id = $1
    group by j.id, e.company_name`,
    [jobId]
  );
  return rows[0] ? mapJob(rows[0]) : null;
}

export async function updateJob(jobId, actor, input) {
  const job = await getJobDetails(jobId);
  if (!job) {
    throw httpError(404, "Job not found.");
  }
  if (actor.role !== "admin" && job.employerId !== actor.userId) {
    throw httpError(403, "You cannot modify another employer's job.");
  }

  const next = {
    title: input.title ?? job.title,
    type: input.type ?? job.type,
    setup: input.setup ?? job.setup,
    schedule: input.schedule ?? job.schedule,
    description: input.description ?? job.description,
    slots: input.slots ?? job.slots,
    status: input.status ?? job.status,
    skills: input.skills ?? job.skills,
  };
  const title = requireNonEmptyString(next.title, "Title");
  const type = requireNonEmptyString(next.type, "Type");
  const setup = requireNonEmptyString(next.setup, "Setup");
  const schedule = requireNonEmptyString(next.schedule, "Schedule");
  const description = requireNonEmptyString(next.description, "Description");
  const slots = parsePositiveInteger(next.slots, "Slots");
  const status = String(next.status || "").trim();
  const skills = normalizeSkills(next.skills);
  if (!["draft", "active", "closed"].includes(status)) {
    throw httpError(400, "Status must be draft, active, or closed.");
  }

  await withTransaction(async (client) => {
    await client.query(
      `update jobs
       set title = $2,
           type = $3,
           setup = $4,
           schedule = $5,
           description = $6,
           slots = $7,
           status = $8,
           posted_at = case when $8 = 'active' and posted_at is null then current_date else posted_at end,
           updated_at = now()
       where id = $1`,
      [jobId, title, type, setup, schedule, description, slots, status]
    );
    await client.query(`delete from job_skills where job_id = $1`, [jobId]);
    for (const skill of skills) {
      await client.query(`insert into job_skills (job_id, skill_name) values ($1, $2)`, [jobId, skill]);
    }
  });

  return getJobDetails(jobId);
}

export async function listSavedJobs(studentId) {
  const { rows } = await query(
    `select
      j.id,
      j.employer_id,
      j.title,
      j.type,
      j.setup,
      j.schedule,
      j.description,
      j.slots,
      j.status,
      j.posted_at,
      e.company_name,
      coalesce(
        json_agg(distinct js.skill_name) filter (where js.skill_name is not null),
        '[]'::json
      ) as skills
    from saved_jobs sj
    join jobs j on j.id = sj.job_id
    join employer_profiles e on e.user_id = j.employer_id
    left join job_skills js on js.job_id = j.id
    where sj.student_id = $1
    group by j.id, e.company_name
    order by sj.saved_at desc`,
    [studentId]
  );
  return rows.map(mapJob);
}

export async function saveJob(studentId, jobId) {
  const job = await getJobDetails(jobId);
  if (!job) {
    throw httpError(404, "Job not found.");
  }
  await query(
    `insert into saved_jobs (student_id, job_id) values ($1, $2) on conflict do nothing`,
    [studentId, jobId]
  );
  return listSavedJobs(studentId);
}

export async function unsaveJob(studentId, jobId) {
  await query(`delete from saved_jobs where student_id = $1 and job_id = $2`, [studentId, jobId]);
  return listSavedJobs(studentId);
}

export async function createApplication(studentId, input) {
  const jobId = requireNonEmptyString(input.jobId, "jobId");
  const job = await getJobDetails(jobId);
  if (!job || job.status !== "active") {
    throw httpError(404, "Active job not found.");
  }
  const existing = await query(
    `select id from applications where job_id = $1 and student_id = $2 limit 1`,
    [jobId, studentId]
  );
  if (existing.rows[0]) {
    throw httpError(409, "You already applied to this job.");
  }

  const applicationId = createPrefixedId("app");
  await withTransaction(async (client) => {
    await client.query(
      `insert into applications (id, job_id, student_id, status, applied_at)
       values ($1, $2, $3, 'pending', current_date)`,
      [applicationId, jobId, studentId]
    );
    await client.query(
      `insert into application_events (application_id, label) values ($1, $2)`,
      [applicationId, "Application submitted"]
    );
  });

  const applications = await listStudentApplications(studentId);
  return applications.find((item) => item.id === applicationId) || null;
}

export async function updateApplicationStatus(applicationId, actor, input) {
  const status = String(input.status || "").trim();
  const note = input.note;
  const validStatuses = ["pending", "review", "interview", "hired", "rejected", "withdrawn"];
  if (!validStatuses.includes(status)) {
    throw httpError(400, "Invalid application status.");
  }

  const { rows } = await query(
    `select a.id, a.student_id, j.employer_id
     from applications a
     join jobs j on j.id = a.job_id
     where a.id = $1`,
    [applicationId]
  );
  const row = rows[0];
  if (!row) {
    throw httpError(404, "Application not found.");
  }

  const isOwnerStudent = actor.role === "student" && row.student_id === actor.userId;
  const isOwnerEmployer = actor.role === "employer" && row.employer_id === actor.userId;
  const isAdmin = actor.role === "admin";
  if (!isOwnerStudent && !isOwnerEmployer && !isAdmin) {
    throw httpError(403, "You cannot update this application.");
  }
  if (isOwnerStudent && !["withdrawn"].includes(status)) {
    throw httpError(403, "Students may only withdraw their own applications.");
  }

  const eventLabels = {
    pending: "Application submitted",
    review: "Under review",
    interview: "Interview scheduled",
    hired: "Hired",
    rejected: "Rejected",
    withdrawn: "Withdrawn",
  };

  await withTransaction(async (client) => {
    await client.query(
      `update applications set status = $2 where id = $1`,
      [applicationId, status]
    );
    await client.query(
      `insert into application_events (application_id, label) values ($1, $2) on conflict do nothing`,
      [applicationId, eventLabels[status]]
    );
    if (typeof note === "string") {
      await client.query(
        `insert into application_notes (application_id, note, updated_at)
         values ($1, $2, now())
         on conflict (application_id)
         do update set note = excluded.note, updated_at = now()`,
        [applicationId, note]
      );
    }
  });

  const items =
    actor.role === "student"
      ? await listStudentApplications(row.student_id)
      : await listEmployerApplicants(row.employer_id);
  return items.find((item) => item.id === applicationId) || null;
}

export async function getEmployerSettings(employerId) {
  const { rows } = await query(
    `select
      ep.user_id as employer_id,
      ep.company_name,
      ep.summary,
      ep.public_company,
      es.default_job_type,
      es.default_work_setup,
      es.email_applicants,
      es.email_expiring
     from employer_profiles ep
     join employer_settings es on es.employer_id = ep.user_id
     where ep.user_id = $1`,
    [employerId]
  );
  return rows[0] || null;
}

export async function updateEmployerSettings(employerId, actor, input) {
  if (actor.role !== "admin" && actor.userId !== employerId) {
    throw httpError(403, "You cannot update another employer's settings.");
  }
  const current = await getEmployerSettings(employerId);
  if (!current) {
    throw httpError(404, "Employer settings not found.");
  }
  const next = {
    companyName: String(input.companyName ?? current.company_name).trim(),
    summary: String(input.summary ?? current.summary).trim(),
    publicCompany: input.publicCompany ?? current.public_company,
    defaultJobType: String(input.defaultJobType ?? current.default_job_type).trim(),
    defaultWorkSetup: String(input.defaultWorkSetup ?? current.default_work_setup).trim(),
    emailApplicants: input.emailApplicants ?? current.email_applicants,
    emailExpiring: input.emailExpiring ?? current.email_expiring,
  };
  const companyName = requireNonEmptyString(next.companyName, "Company name");
  const summary = requireNonEmptyString(next.summary, "Summary");
  const defaultJobType = requireNonEmptyString(next.defaultJobType, "Default job type");
  const defaultWorkSetup = requireNonEmptyString(next.defaultWorkSetup, "Default work setup");

  await withTransaction(async (client) => {
    await client.query(
      `update employer_profiles
       set company_name = $2, summary = $3, public_company = $4
       where user_id = $1`,
      [employerId, companyName, summary, next.publicCompany]
    );
    await client.query(
      `update employer_settings
       set default_job_type = $2,
           default_work_setup = $3,
           email_applicants = $4,
           email_expiring = $5
       where employer_id = $1`,
      [employerId, defaultJobType, defaultWorkSetup, next.emailApplicants, next.emailExpiring]
    );
  });

  return getEmployerSettings(employerId);
}
