import request from "supertest";

// Mock Clerk middleware — no real Clerk keys in test env
jest.mock("@/middleware/auth", () => ({
  clerkAuth: (_req: any, _res: any, next: any) => next(),
  requireAuth: (_req: any, _res: any, next: any) => next(),
  requireAdminKey: (_req: any, _res: any, next: any) => next(),
}));

import { app } from "@/index";

describe("GET /howareyou", () => {
  it("should return 200", async () => {
    const res = await request(app).get("/howareyou");
    expect(res.status).toBe(200);
  });

  it("should return status: alive", async () => {
    const res = await request(app).get("/howareyou");
    expect(res.body.status).toBe("alive");
  });

  it("should return uptime as a number", async () => {
    const res = await request(app).get("/howareyou");
    expect(typeof res.body.uptime).toBe("number");
    expect(res.body.uptime).toBeGreaterThanOrEqual(0);
  });

  it("should return a valid ISO timestamp", async () => {
    const res = await request(app).get("/howareyou");
    expect(typeof res.body.timestamp).toBe("string");
    expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp);
  });

  it("should return memory usage object", async () => {
    const res = await request(app).get("/howareyou");
    expect(res.body.memory).toBeDefined();
    expect(typeof res.body.memory.rss).toBe("number");
    expect(typeof res.body.memory.heapUsed).toBe("number");
    expect(typeof res.body.memory.heapTotal).toBe("number");
  });

  it("should return node version string", async () => {
    const res = await request(app).get("/howareyou");
    expect(typeof res.body.node).toBe("string");
    expect(res.body.node).toMatch(/^v\d+\.\d+\.\d+/);
  });

  it("should return JSON content-type", async () => {
    const res = await request(app).get("/howareyou");
    expect(res.headers["content-type"]).toMatch(/application\/json/);
  });
});

describe("unknown routes", () => {
  it("should return 404 for unknown routes", async () => {
    const res = await request(app).get("/unknown-route");
    expect(res.status).toBe(404);
  });
});
