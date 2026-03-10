import type { Request, Response, NextFunction } from "express";
import { ScrapeService, type TriggerScrapeBody } from "@/services/scrape";

export const triggerScrape = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await ScrapeService.trigger(req.body as TriggerScrapeBody);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
