import { Router } from "express";
import { getCurrentUserProfile } from "../db/repositories.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const user = await getCurrentUserProfile(req.auth.userId);
    if (!user) {
      return res.status(404).json({ error: "Current user not found." });
    }
    return res.json({ user });
  } catch (error) {
    return next(error);
  }
});

export default router;
