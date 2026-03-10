import { Router } from "express";
import { triggerScrape } from "@/handlers/scrape";
import { validate } from "@/middleware/validate";
import { triggerScrapeSchema } from "@/services/scrape";

export const scrapeRouter = Router();

scrapeRouter.post("/trigger", validate(triggerScrapeSchema), triggerScrape);
