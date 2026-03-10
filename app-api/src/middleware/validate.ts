import type { Request, Response, NextFunction } from "express";
import { type ZodSchema } from "zod";

type Target = "body" | "query" | "params";

export const validate =
  (schema: ZodSchema, target: Target = "body") =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      res.status(422).json({ error: "Validation failed", code: "VALIDATION_ERROR", errors });
      return;
    }

    req[target] = result.data;
    next();
  };
