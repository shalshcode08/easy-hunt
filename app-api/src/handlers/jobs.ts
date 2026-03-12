import type { Request, Response, NextFunction } from "express";
import { JobsService, type GetJobsQuery } from "@/services/jobs";

export const getJobs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await JobsService.getJobs(req.query as unknown as GetJobsQuery, req.clerkId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getJobById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const job = await JobsService.getJobById(req.params.id as string);
    res.json(job);
  } catch (err) {
    next(err);
  }
};
