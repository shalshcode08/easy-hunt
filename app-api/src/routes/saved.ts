import { Router } from "express";
import { getSavedJobs, saveJob, updateSavedJob, deleteSavedJob } from "@/handlers/saved";
import { validate } from "@/middleware/validate";
import { saveJobSchema, updateSavedJobSchema, getSavedJobsQuerySchema } from "@/services/saved";

export const savedRouter = Router();

savedRouter.get("/", validate(getSavedJobsQuerySchema, "query"), getSavedJobs);
savedRouter.post("/", validate(saveJobSchema), saveJob);
savedRouter.patch("/:id", validate(updateSavedJobSchema), updateSavedJob);
savedRouter.delete("/:id", deleteSavedJob);
