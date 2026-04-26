import { Router } from "express";
import { loginUser, signupUser } from "../db/repositories.js";

const router = Router();

router.post("/login", async (req, res, next) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }
    const session = await loginUser(email, password);
    if (!session) {
      return res.status(401).json({ error: "Invalid credentials." });
    }
    return res.json(session);
  } catch (error) {
    return next(error);
  }
});

router.post("/signup", async (req, res, next) => {
  try {
    const session = await signupUser(req.body || {});
    return res.status(201).json(session);
  } catch (error) {
    return next(error);
  }
});

export default router;
