import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { httpError } from "../lib/http.js";

function readBearerToken(req) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw httpError(401, "Authorization header is required.");
  }
  return token;
}

export function requireAuth(req, _res, next) {
  try {
    const token = readBearerToken(req);
    const payload = jwt.verify(token, env.jwtSecret);
    req.auth = {
      userId: payload.sub,
      role: payload.role,
    };
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return next(httpError(401, "Invalid or expired token."));
    }
    return next(error);
  }
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      return next(httpError(403, "You do not have access to this resource."));
    }
    return next();
  };
}

export function requireSelfOrRole(paramName, ...roles) {
  return (req, _res, next) => {
    const requestedId = req.params[paramName];
    if (req.auth?.userId === requestedId || roles.includes(req.auth?.role)) {
      return next();
    }
    return next(httpError(403, "You cannot access another user's resource."));
  };
}
