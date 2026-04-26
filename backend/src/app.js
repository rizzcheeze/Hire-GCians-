import cors from "cors";
import express from "express";
import multer from "multer";
import { env } from "./config/env.js";
import apiRouter from "./routes/index.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.corsOrigin === "*" ? true : env.corsOrigin,
      credentials: true,
    })
  );
  app.use(express.json());

  app.get("/", (_req, res) => {
    res.json({
      name: "Hire GCians Backend",
      status: "ok",
      apiBase: "/api",
    });
  });

  app.use("/api", apiRouter);

  app.use((err, _req, res, _next) => {
    console.error(err);
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        error: err.code === "LIMIT_FILE_SIZE" ? `Resume exceeds ${env.maxResumeSizeMb} MB limit.` : err.message,
      });
    }
    res.status(err.status || err.statusCode || 500).json({
      error: err.expose || err.status ? err.message : "Internal server error.",
    });
  });

  return app;
}
