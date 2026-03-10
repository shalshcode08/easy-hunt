import request from "supertest";

jest.mock("@/middleware/rateLimit", () => ({
  apiRateLimit: (_req: any, _res: any, next: any) => next(),
  scrapeRateLimit: (_req: any, _res: any, next: any) => next(),
}));

jest.mock("@/middleware/auth", () => ({
  clerkAuth: (_req: any, _res: any, next: any) => next(),
  requireAuth: (req: any, _res: any, next: any) => {
    req.clerkId = "user_test123";
    next();
  },
  requireAdminKey: (_req: any, _res: any, next: any) => next(),
}));

jest.mock("@/services/scrape", () => ({
  ...jest.requireActual("@/services/scrape"),
  ScrapeService: {
    trigger: jest.fn(),
  },
}));

import { app } from "@/index";
import { ScrapeService } from "@/services/scrape";

describe("POST /api/v1/admin/scrape/trigger", () => {
  beforeEach(() => {
    (ScrapeService.trigger as jest.Mock).mockResolvedValue({
      queued: true,
      jobId: "pg-boss-job-id-123",
    });
  });

  it("returns 200 with queued and jobId", async () => {
    const res = await request(app)
      .post("/api/v1/admin/scrape/trigger")
      .send({ source: "linkedin" });
    expect(res.status).toBe(200);
    expect(res.body.queued).toBe(true);
    expect(res.body.jobId).toBeDefined();
  });

  it("calls service with validated body including defaults", async () => {
    await request(app).post("/api/v1/admin/scrape/trigger").send({ source: "naukri" });
    expect(ScrapeService.trigger).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "naukri",
        role: "software engineer",
        location: "india",
        limit: 50,
      }),
    );
  });

  it("accepts overridden role and location", async () => {
    await request(app)
      .post("/api/v1/admin/scrape/trigger")
      .send({ source: "indeed", role: "frontend developer", location: "mumbai", limit: 100 });
    expect(ScrapeService.trigger).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "indeed",
        role: "frontend developer",
        location: "mumbai",
        limit: 100,
      }),
    );
  });

  it("returns 422 when source is missing", async () => {
    const res = await request(app).post("/api/v1/admin/scrape/trigger").send({});
    expect(res.status).toBe(422);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });

  it("returns 422 for invalid source value", async () => {
    const res = await request(app)
      .post("/api/v1/admin/scrape/trigger")
      .send({ source: "glassdoor" });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });

  it("returns 422 when limit exceeds max (200)", async () => {
    const res = await request(app)
      .post("/api/v1/admin/scrape/trigger")
      .send({ source: "linkedin", limit: 201 });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });

  it("returns 422 when limit is less than 1", async () => {
    const res = await request(app)
      .post("/api/v1/admin/scrape/trigger")
      .send({ source: "linkedin", limit: 0 });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });

  it("returns 500 when service throws", async () => {
    (ScrapeService.trigger as jest.Mock).mockRejectedValue(new Error("Queue unavailable"));
    const res = await request(app)
      .post("/api/v1/admin/scrape/trigger")
      .send({ source: "linkedin" });
    expect(res.status).toBe(500);
  });
});
