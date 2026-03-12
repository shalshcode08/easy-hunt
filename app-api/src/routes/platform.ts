import { Router } from "express";
import {
  onboard,
  getMe,
  initConnect,
  pollConnection,
  saveConnection,
  getConnections,
  disconnect,
  rescrape,
} from "@/handlers/platform";

export const platformRouter = Router();

// User profile & onboarding
platformRouter.get("/me", getMe);
platformRouter.post("/me/onboard", onboard);

// Platform connection lifecycle
platformRouter.get("/connections", getConnections);
platformRouter.post("/connections/:platform/init", initConnect);
platformRouter.get("/connections/:platform/:sessionId/poll", pollConnection);
platformRouter.post("/connections/:platform/:sessionId/save", saveConnection);
platformRouter.delete("/connections/:platform", disconnect);
platformRouter.post("/connections/:platform/rescrape", rescrape);
