import { Router } from "express";
import { getJobs, getJobById } from "@/handlers/jobs";
import { validate } from "@/middleware/validate";
import { getJobsQuerySchema } from "@/services/jobs";

export const jobsRouter = Router();

jobsRouter.get("/", validate(getJobsQuerySchema, "query"), getJobs);
jobsRouter.get("/:id", getJobById);
