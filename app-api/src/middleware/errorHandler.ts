import type { Request, Response, NextFunction } from "express";
import { logger } from "@/lib/logger";

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export const createError = (message: string, statusCode = 500, code?: string): AppError => {
  const err: AppError = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
};

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = err.statusCode ?? 500;
  const message = err.message || "Internal Server Error";
  const code = err.code ?? "INTERNAL_ERROR";

  if (statusCode >= 500) {
    logger.error(
      { err, method: req.method, url: req.url, statusCode },
      message
    );
  }

  res.status(statusCode).json({ error: message, code });
};
