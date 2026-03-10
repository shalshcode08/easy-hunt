import type { Request, Response, NextFunction } from "express";
import { ScrapeService } from "@/services/scrape";

export const triggerScrape = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await ScrapeService.trigger(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
