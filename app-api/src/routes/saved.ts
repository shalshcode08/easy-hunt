import { Router } from "express";
import { getSavedJobs, saveJob, updateSavedJob, deleteSavedJob } from "@/handlers/saved";

export const savedRouter = Router();

savedRouter.get("/", getSavedJobs);
savedRouter.post("/", saveJob);
savedRouter.patch("/:id", updateSavedJob);
savedRouter.delete("/:id", deleteSavedJob);
