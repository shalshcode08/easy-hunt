import { Router } from "express";
import { triggerScrape } from "@/handlers/scrape";

export const scrapeRouter = Router();

scrapeRouter.post("/trigger", triggerScrape);
