import { Router } from "express";
import { getJobs, getJobById } from "@/handlers/jobs";

export const jobsRouter = Router();

jobsRouter.get("/", getJobs);
jobsRouter.get("/:id", getJobById);
