import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { PlatformService, onboardSchema } from "@/services/platform";
import { createError } from "@/middleware/errorHandler";
import type { JobSource } from "@/scrapers/base";

const platformParam = z.enum(["linkedin", "naukri", "indeed"]);

export const onboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = onboardSchema.parse(req.body);
    await PlatformService.upsertUser(req.clerkId, body);
    const user = await PlatformService.getUser(req.clerkId);
    res.json(user);
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await PlatformService.getUser(req.clerkId);
    if (!user) return res.json(null);
    res.json(user);
  } catch (err) {
    next(err);
  }
};

export const initConnect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const platform = platformParam.parse(req.params.platform) as JobSource;
    const result = await PlatformService.initConnect(req.clerkId, platform);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const pollConnection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const platform = platformParam.parse(req.params.platform) as JobSource;
    const sessionId = req.params.sessionId as string;
    if (!sessionId) throw createError("Missing sessionId", 400, "BAD_REQUEST");
    const ready = await PlatformService.pollConnection(sessionId, platform);
    res.json({ ready });
  } catch (err) {
    next(err);
  }
};

export const saveConnection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const platform = platformParam.parse(req.params.platform) as JobSource;
    const sessionId = req.params.sessionId as string;
    if (!sessionId) throw createError("Missing sessionId", 400, "BAD_REQUEST");
    await PlatformService.saveConnection(req.clerkId, sessionId, platform);
    res.json({ saved: true });
  } catch (err) {
    next(err);
  }
};

export const getConnections = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const connections = await PlatformService.getConnections(req.clerkId);
    res.json(connections);
  } catch (err) {
    next(err);
  }
};

export const disconnect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const platform = platformParam.parse(req.params.platform) as JobSource;
    await PlatformService.disconnect(req.clerkId, platform);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
