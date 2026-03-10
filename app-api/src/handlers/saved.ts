import type { Request, Response, NextFunction } from "express";
import { SavedService } from "@/services/saved";

export const getSavedJobs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await SavedService.getSavedJobs(req.clerkId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const saveJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await SavedService.saveJob(req.clerkId, req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const updateSavedJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await SavedService.updateSavedJob(req.clerkId, req.params.id as string, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const deleteSavedJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await SavedService.deleteSavedJob(req.clerkId, req.params.id as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
