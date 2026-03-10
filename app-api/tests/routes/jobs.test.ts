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

jest.mock("@/services/jobs", () => ({
  ...jest.requireActual("@/services/jobs"),
  JobsService: {
    getJobs: jest.fn(),
    getJobById: jest.fn(),
  },
}));

import { app } from "@/index";
import { JobsService } from "@/services/jobs";

const mockJob = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  url: "https://linkedin.com/jobs/view/123",
  urlHash: "a".repeat(64),
  externalId: null,
  title: "Senior Software Engineer",
  titleNormalized: "senior software engineer",
  company: "Acme Corp",
  companyNormalized: "acme corp",
  locationRaw: "Bengaluru, India",
  city: "bengaluru",
  state: null,
  country: "IN",
  isRemote: false,
  workMode: "onsite",
  source: "linkedin",
  jobType: "full_time",
  experienceLevel: "senior",
  salaryRaw: "₹25–40 LPA",
  salaryMin: null,
  salaryMax: null,
  salaryCurrency: "INR",
  description: "We are hiring...",
  descriptionTsv: null,
  skillsRaw: ["TypeScript", "Node.js"],
  applyUrl: null,
  isActive: true,
  isDeleted: false,
  deletedAt: null,
  postedAt: new Date("2026-03-08T10:00:00.000Z"),
  scrapedAt: new Date("2026-03-10T06:00:00.000Z"),
  lastSeenAt: new Date("2026-03-10T06:00:00.000Z"),
  expiresAt: null,
  createdAt: new Date("2026-03-08T10:00:00.000Z"),
  updatedAt: new Date("2026-03-08T10:00:00.000Z"),
};

const mockPaginatedResponse = {
  jobs: [mockJob],
  total: 1,
  page: 1,
  limit: 20,
  totalPages: 1,
};

describe("GET /api/v1/jobs", () => {
  beforeEach(() => {
    (JobsService.getJobs as jest.Mock).mockResolvedValue(mockPaginatedResponse);
  });

  it("returns 200 with paginated jobs", async () => {
    const res = await request(app).get("/api/v1/jobs");
    expect(res.status).toBe(200);
    expect(res.body.jobs).toHaveLength(1);
    expect(res.body.total).toBe(1);
    expect(res.body.page).toBe(1);
    expect(res.body.totalPages).toBe(1);
  });

  it("passes source filter to service", async () => {
    await request(app).get("/api/v1/jobs?source=linkedin");
    expect(JobsService.getJobs).toHaveBeenCalledWith(
      expect.objectContaining({ source: "linkedin" }),
    );
  });

  it("passes workMode filter to service", async () => {
    await request(app).get("/api/v1/jobs?workMode=remote");
    expect(JobsService.getJobs).toHaveBeenCalledWith(
      expect.objectContaining({ workMode: "remote" }),
    );
  });

  it("passes pagination params to service", async () => {
    await request(app).get("/api/v1/jobs?page=2&limit=10");
    expect(JobsService.getJobs).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, limit: 10 }),
    );
  });

  it("returns 422 for invalid source value", async () => {
    const res = await request(app).get("/api/v1/jobs?source=monster");
    expect(res.status).toBe(422);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });

  it("returns 422 for invalid workMode value", async () => {
    const res = await request(app).get("/api/v1/jobs?workMode=office");
    expect(res.status).toBe(422);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });

  it("returns 422 for limit exceeding max (100)", async () => {
    const res = await request(app).get("/api/v1/jobs?limit=200");
    expect(res.status).toBe(422);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });

  it("returns 422 for page less than 1", async () => {
    const res = await request(app).get("/api/v1/jobs?page=0");
    expect(res.status).toBe(422);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });

  it("returns 500 when service throws", async () => {
    (JobsService.getJobs as jest.Mock).mockRejectedValue(new Error("DB error"));
    const res = await request(app).get("/api/v1/jobs");
    expect(res.status).toBe(500);
  });
});

describe("GET /api/v1/jobs/:id", () => {
  const jobId = "550e8400-e29b-41d4-a716-446655440000";

  beforeEach(() => {
    (JobsService.getJobById as jest.Mock).mockResolvedValue(mockJob);
  });

  it("returns 200 with the job", async () => {
    const res = await request(app).get(`/api/v1/jobs/${jobId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(jobId);
    expect(res.body.title).toBe("Senior Software Engineer");
  });

  it("calls service with the correct id", async () => {
    await request(app).get(`/api/v1/jobs/${jobId}`);
    expect(JobsService.getJobById).toHaveBeenCalledWith(jobId);
  });

  it("returns 404 when job does not exist", async () => {
    const { createError } = await import("@/middleware/errorHandler");
    (JobsService.getJobById as jest.Mock).mockRejectedValue(
      createError("Job not found", 404, "NOT_FOUND"),
    );
    const res = await request(app).get(`/api/v1/jobs/${jobId}`);
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("NOT_FOUND");
  });
});
