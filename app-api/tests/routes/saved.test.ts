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

jest.mock("@/services/saved", () => ({
  ...jest.requireActual("@/services/saved"),
  SavedService: {
    getSavedJobs: jest.fn(),
    saveJob: jest.fn(),
    updateSavedJob: jest.fn(),
    deleteSavedJob: jest.fn(),
  },
}));

import { app } from "@/index";
import { SavedService } from "@/services/saved";

const savedJobId = "660e8400-e29b-41d4-a716-446655440001";
const jobId = "550e8400-e29b-41d4-a716-446655440000";

const mockSavedJob = {
  id: savedJobId,
  clerkId: "user_test123",
  jobId,
  status: "saved",
  notes: null,
  appliedAt: null,
  isDeleted: false,
  deletedAt: null,
  createdAt: new Date("2026-03-10T08:00:00.000Z"),
  updatedAt: new Date("2026-03-10T08:00:00.000Z"),
};

const mockJob = {
  id: jobId,
  title: "Senior Software Engineer",
  company: "Acme Corp",
  source: "linkedin",
  locationRaw: "Bengaluru, India",
};

describe("GET /api/v1/saved", () => {
  beforeEach(() => {
    (SavedService.getSavedJobs as jest.Mock).mockResolvedValue([
      { savedJob: mockSavedJob, job: mockJob },
    ]);
  });

  it("returns 200 with saved jobs list", async () => {
    const res = await request(app).get("/api/v1/saved");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
  });

  it("passes clerkId to service", async () => {
    await request(app).get("/api/v1/saved");
    expect(SavedService.getSavedJobs).toHaveBeenCalledWith(
      "user_test123",
      expect.any(Object),
    );
  });

  it("passes status filter to service", async () => {
    await request(app).get("/api/v1/saved?status=applied");
    expect(SavedService.getSavedJobs).toHaveBeenCalledWith(
      "user_test123",
      expect.objectContaining({ status: "applied" }),
    );
  });

  it("returns 422 for invalid status value", async () => {
    const res = await request(app).get("/api/v1/saved?status=ghosted");
    expect(res.status).toBe(422);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });
});

describe("POST /api/v1/saved", () => {
  beforeEach(() => {
    (SavedService.saveJob as jest.Mock).mockResolvedValue(mockSavedJob);
  });

  it("returns 201 with the saved job", async () => {
    const res = await request(app).post("/api/v1/saved").send({ jobId });
    expect(res.status).toBe(201);
    expect(res.body.id).toBe(savedJobId);
    expect(res.body.status).toBe("saved");
  });

  it("calls service with clerkId and body", async () => {
    await request(app).post("/api/v1/saved").send({ jobId });
    expect(SavedService.saveJob).toHaveBeenCalledWith("user_test123", { jobId });
  });

  it("returns 422 when jobId is missing", async () => {
    const res = await request(app).post("/api/v1/saved").send({});
    expect(res.status).toBe(422);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });

  it("returns 422 when jobId is not a uuid", async () => {
    const res = await request(app).post("/api/v1/saved").send({ jobId: "not-a-uuid" });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });

  it("returns 404 when job does not exist", async () => {
    const { createError } = await import("@/middleware/errorHandler");
    (SavedService.saveJob as jest.Mock).mockRejectedValue(
      createError("Job not found", 404, "NOT_FOUND"),
    );
    const res = await request(app).post("/api/v1/saved").send({ jobId });
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("NOT_FOUND");
  });
});

describe("PATCH /api/v1/saved/:id", () => {
  beforeEach(() => {
    (SavedService.updateSavedJob as jest.Mock).mockResolvedValue({
      ...mockSavedJob,
      status: "applied",
      appliedAt: new Date("2026-03-10T09:00:00.000Z"),
    });
  });

  it("returns 200 with updated saved job", async () => {
    const res = await request(app)
      .patch(`/api/v1/saved/${savedJobId}`)
      .send({ status: "applied" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("applied");
  });

  it("calls service with clerkId, id and body", async () => {
    await request(app).patch(`/api/v1/saved/${savedJobId}`).send({ status: "applied" });
    expect(SavedService.updateSavedJob).toHaveBeenCalledWith(
      "user_test123",
      savedJobId,
      { status: "applied" },
    );
  });

  it("allows updating notes only", async () => {
    (SavedService.updateSavedJob as jest.Mock).mockResolvedValue({
      ...mockSavedJob,
      notes: "Good company",
    });
    const res = await request(app)
      .patch(`/api/v1/saved/${savedJobId}`)
      .send({ notes: "Good company" });
    expect(res.status).toBe(200);
  });

  it("returns 422 for invalid status value", async () => {
    const res = await request(app)
      .patch(`/api/v1/saved/${savedJobId}`)
      .send({ status: "ghosted" });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });

  it("returns 404 when saved job does not exist", async () => {
    const { createError } = await import("@/middleware/errorHandler");
    (SavedService.updateSavedJob as jest.Mock).mockRejectedValue(
      createError("Saved job not found", 404, "NOT_FOUND"),
    );
    const res = await request(app)
      .patch(`/api/v1/saved/${savedJobId}`)
      .send({ status: "applied" });
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("NOT_FOUND");
  });
});

describe("DELETE /api/v1/saved/:id", () => {
  beforeEach(() => {
    (SavedService.deleteSavedJob as jest.Mock).mockResolvedValue(undefined);
  });

  it("returns 204 on successful delete", async () => {
    const res = await request(app).delete(`/api/v1/saved/${savedJobId}`);
    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
  });

  it("calls service with clerkId and id", async () => {
    await request(app).delete(`/api/v1/saved/${savedJobId}`);
    expect(SavedService.deleteSavedJob).toHaveBeenCalledWith("user_test123", savedJobId);
  });

  it("returns 404 when saved job does not exist", async () => {
    const { createError } = await import("@/middleware/errorHandler");
    (SavedService.deleteSavedJob as jest.Mock).mockRejectedValue(
      createError("Saved job not found", 404, "NOT_FOUND"),
    );
    const res = await request(app).delete(`/api/v1/saved/${savedJobId}`);
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("NOT_FOUND");
  });
});
