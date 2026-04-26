import { Router } from "express";
import { createJob, getJobDetails, listJobs, updateJob } from "../db/repositories.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const filters = {};
    if (req.query.status) filters.status = String(req.query.status);
    if (req.query.employerId) filters.employerId = String(req.query.employerId);
    const jobs = await listJobs(filters);
    return res.json({ items: jobs });
  } catch (error) {
    return next(error);
  }
});

router.get("/:jobId", async (req, res, next) => {
  try {
    const job = await getJobDetails(req.params.jobId);
    if (!job) {
      return res.status(404).json({ error: "Job not found." });
    }
    return res.json({ item: job });
  } catch (error) {
    return next(error);
  }
});

router.post("/", requireAuth, requireRole("employer", "admin"), async (req, res, next) => {
  try {
    const employerId = req.auth.role === "admin" ? String(req.body.employerId || "") : req.auth.userId;
    if (!employerId) {
      return res.status(400).json({ error: "employerId is required for admin-created jobs." });
    }
    const job = await createJob(employerId, req.body || {});
    return res.status(201).json({ item: job });
  } catch (error) {
    return next(error);
  }
});

router.patch("/:jobId", requireAuth, requireRole("employer", "admin"), async (req, res, next) => {
  try {
    const job = await updateJob(req.params.jobId, req.auth, req.body || {});
    return res.json({ item: job });
  } catch (error) {
    return next(error);
  }
});

export default router;
