import fs from "fs/promises";
import path from "path";
import multer from "multer";
import { env } from "../config/env.js";
import { httpError } from "../lib/http.js";

const uploadDir = path.resolve(process.cwd(), env.resumeUploadDir);

async function ensureUploadDir() {
  await fs.mkdir(uploadDir, { recursive: true });
}

function safeExtension(fileName) {
  const ext = path.extname(fileName || "").toLowerCase();
  return ext === ".pdf" ? ext : ".pdf";
}

const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    try {
      await ensureUploadDir();
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const studentId = req.params.studentId || "student";
    const stamp = Date.now();
    cb(null, `${studentId}-${stamp}${safeExtension(file.originalname)}`);
  },
});

function fileFilter(_req, file, cb) {
  const isPdf = file.mimetype === "application/pdf" || path.extname(file.originalname || "").toLowerCase() === ".pdf";
  if (!isPdf) {
    cb(httpError(400, "Only PDF resumes are supported."));
    return;
  }
  cb(null, true);
}

export const resumeUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.maxResumeSizeMb * 1024 * 1024,
  },
});

export async function deleteStoredResume(relativePath) {
  if (!relativePath) return;
  const fullPath = path.resolve(process.cwd(), relativePath);
  if (!fullPath.startsWith(uploadDir)) {
    throw httpError(400, "Refusing to delete a file outside the resume upload directory.");
  }
  await fs.rm(fullPath, { force: true });
}

export function toRelativeResumePath(filePath) {
  return path.relative(process.cwd(), filePath).replace(/\\/g, "/");
}
