import { Router } from "express";
import { getEmployerSettings, listEmployerApplicants, updateApplicationStatus, updateEmployerSettings } from "../db/repositories.js";
import { requireAuth, requireRole, requireSelfOrRole } from "../middleware/auth.js";

const router = Router();

router.get("/:employerId/applicants", requireAuth, requireSelfOrRole("employerId", "admin"), async (req, res, next) => {
  try {
    const items = await listEmployerApplicants(req.params.employerId);
    return res.json({ items });
  } catch (error) {
    return next(error);
  }
});

router.get("/:employerId/settings", requireAuth, requireSelfOrRole("employerId", "admin"), async (req, res, next) => {
  try {
    const item = await getEmployerSettings(req.params.employerId);
    if (!item) {
      return res.status(404).json({ error: "Employer settings not found." });
    }
    return res.json({ item });
  } catch (error) {
    return next(error);
  }
});

router.patch("/:employerId/settings", requireAuth, requireSelfOrRole("employerId", "admin"), async (req, res, next) => {
  try {
    const item = await updateEmployerSettings(req.params.employerId, req.auth, req.body || {});
    return res.json({ item });
  } catch (error) {
    return next(error);
  }
});

router.patch(
  "/:employerId/applications/:applicationId",
  requireAuth,
  requireSelfOrRole("employerId", "admin"),
  requireRole("employer", "admin"),
  async (req, res, next) => {
    try {
      const item = await updateApplicationStatus(req.params.applicationId, req.auth, req.body || {});
      return res.json({ item });
    } catch (error) {
      return next(error);
    }
  }
);

export default router;
