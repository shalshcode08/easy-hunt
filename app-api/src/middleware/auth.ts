import type { Request, Response, NextFunction } from "express";
import { clerkMiddleware, getAuth } from "@clerk/express";
import { createError } from "@/middleware/errorHandler";
import { env } from "@/env";

declare global {
  namespace Express {
    interface Request {
      clerkId: string;
    }
  }
}

export const clerkAuth = clerkMiddleware({ secretKey: env.CLERK_SECRET_KEY });

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  const auth = getAuth(req);
  if (!auth.userId) return next(createError("Unauthorized", 401, "UNAUTHORIZED"));
  req.clerkId = auth.userId;
  next();
};

export const requireAdminKey = (req: Request, _res: Response, next: NextFunction) => {
  const key = req.headers["x-admin-key"];
  if (!key || key !== env.ADMIN_KEY) return next(createError("Forbidden", 403, "FORBIDDEN"));
  next();
};
