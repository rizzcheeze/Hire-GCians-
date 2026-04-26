import { Router } from "express";
import authRoutes from "./auth.routes.js";
import employerRoutes from "./employers.routes.js";
import jobRoutes from "./jobs.routes.js";
import meRoutes from "./me.routes.js";
import studentRoutes from "./students.routes.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ ok: true, service: "hire-gcians-backend" });
});

router.use("/auth", authRoutes);
router.use("/me", meRoutes);
router.use("/jobs", jobRoutes);
router.use("/students", studentRoutes);
router.use("/employers", employerRoutes);

export default router;
