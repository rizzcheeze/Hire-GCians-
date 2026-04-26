import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL || "",
  jwtSecret: process.env.JWT_SECRET || "dev-secret",
  corsOrigin: process.env.CORS_ORIGIN || "*",
  resumeUploadDir: process.env.RESUME_UPLOAD_DIR || "./uploads/resumes",
  maxResumeSizeMb: Number(process.env.MAX_RESUME_SIZE_MB || 10),
};
