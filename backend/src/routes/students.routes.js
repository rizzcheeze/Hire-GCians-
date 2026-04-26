import { Router } from "express";
import {
  createApplication,
  getStudentResume,
  listSavedJobs,
  listStudentApplications,
  saveJob,
  unsaveJob,
  updateResumeProcessing,
  updateApplicationStatus,
  upsertStudentResume,
} from "../db/repositories.js";
import { requireAuth, requireRole, requireSelfOrRole } from "../middleware/auth.js";
import { resumeUpload } from "../storage/resume-storage.js";

const router = Router();

router.get("/:studentId/applications", requireAuth, requireSelfOrRole("studentId", "admin"), async (req, res, next) => {
  try {
    const items = await listStudentApplications(req.params.studentId);
    return res.json({ items });
  } catch (error) {
    return next(error);
  }
});

router.post("/:studentId/applications", requireAuth, requireSelfOrRole("studentId", "admin"), async (req, res, next) => {
  try {
    const item = await createApplication(req.params.studentId, req.body || {});
    return res.status(201).json({ item });
  } catch (error) {
    return next(error);
  }
});

router.patch(
  "/:studentId/applications/:applicationId",
  requireAuth,
  requireSelfOrRole("studentId", "admin"),
  async (req, res, next) => {
    try {
      const item = await updateApplicationStatus(req.params.applicationId, req.auth, req.body || {});
      return res.json({ item });
    } catch (error) {
      return next(error);
    }
  }
);

router.get("/:studentId/saved-jobs", requireAuth, requireSelfOrRole("studentId", "admin"), async (req, res, next) => {
  try {
    const items = await listSavedJobs(req.params.studentId);
    return res.json({ items });
  } catch (error) {
    return next(error);
  }
});

router.post("/:studentId/saved-jobs", requireAuth, requireSelfOrRole("studentId", "admin"), async (req, res, next) => {
  try {
    const items = await saveJob(req.params.studentId, String(req.body?.jobId || ""));
    return res.status(201).json({ items });
  } catch (error) {
    return next(error);
  }
});

router.delete(
  "/:studentId/saved-jobs/:jobId",
  requireAuth,
  requireSelfOrRole("studentId", "admin"),
  async (req, res, next) => {
    try {
      const items = await unsaveJob(req.params.studentId, req.params.jobId);
      return res.json({ items });
    } catch (error) {
      return next(error);
    }
  }
);

router.get("/:studentId/resume", requireAuth, requireSelfOrRole("studentId", "admin"), async (req, res, next) => {
  try {
    const item = await getStudentResume(req.params.studentId);
    if (!item) {
      return res.status(404).json({ error: "Resume record not found." });
    }
    return res.json({ item });
  } catch (error) {
    return next(error);
  }
});

router.post(
  "/:studentId/resume",
  requireAuth,
  requireSelfOrRole("studentId", "admin"),
  resumeUpload.single("resume"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "A PDF resume file is required." });
      }
      const { deleteStoredResume, toRelativeResumePath } = await import("../storage/resume-storage.js");
      const result = await upsertStudentResume(req.params.studentId, {
        fileName: req.file.filename,
        originalFileName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSizeBytes: req.file.size,
        storagePath: toRelativeResumePath(req.file.path),
      });
      if (result.previousStoragePath && result.previousStoragePath !== result.resume.storagePath) {
        await deleteStoredResume(result.previousStoragePath);
      }
      return res.status(201).json({ item: result.resume });
    } catch (error) {
      return next(error);
    }
  }
);

router.patch("/:studentId/resume", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const item = await updateResumeProcessing(req.params.studentId, req.auth, req.body || {});
    return res.json({ item });
  } catch (error) {
    return next(error);
  }
});

export default router;
