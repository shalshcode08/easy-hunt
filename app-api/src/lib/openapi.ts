import {
  OpenAPIRegistry,
  OpenApiGeneratorV31,
  extendZodWithOpenApi,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

// ── Reusable schemas ────────────────────────────────────────────────────────

export const HealthResponseSchema = registry.register(
  "HealthResponse",
  z.object({
    status: z.literal("alive"),
    uptime: z.number().describe("Process uptime in seconds"),
    timestamp: z.string().datetime().describe("Current server time in ISO 8601"),
    memory: z
      .object({
        rss: z.number(),
        heapTotal: z.number(),
        heapUsed: z.number(),
        external: z.number(),
        arrayBuffers: z.number(),
      })
      .describe("Node.js memory usage in bytes"),
    node: z.string().describe("Node.js version"),
  }),
);

export const ErrorResponseSchema = registry.register(
  "ErrorResponse",
  z.object({
    error: z.string(),
    code: z.string().optional(),
  }),
);

// ── Route registrations ─────────────────────────────────────────────────────

registry.registerPath({
  method: "get",
  path: "/howareyou",
  tags: ["Health"],
  summary: "Server health check",
  description: "Returns liveness status along with runtime diagnostics.",
  responses: {
    200: {
      description: "Server is alive",
      content: { "application/json": { schema: HealthResponseSchema } },
    },
  },
});

// ── Document builder ────────────────────────────────────────────────────────

export function buildOpenApiDocument() {
  const generator = new OpenApiGeneratorV31(registry.definitions);

  return generator.generateDocument({
    openapi: "3.1.0",
    info: {
      title: "EasyHunt API",
      version: "1.0.0",
      description: "Job aggregator API — scrapes LinkedIn, Naukri, and Indeed into one feed.",
    },
    servers: [
      {
        url:
          process.env.NODE_ENV === "production"
            ? (process.env.BACKEND_URL ?? "")
            : `http://localhost:${process.env.PORT ?? 3001}`,
        description: process.env.NODE_ENV === "production" ? "Production" : "Local dev",
      },
    ],
    tags: [
      { name: "Health", description: "Server health and diagnostics" },
      { name: "Jobs", description: "Job listings from all sources" },
      { name: "Saved", description: "Save and track job applications" },
      { name: "Scrape", description: "Trigger scrape jobs (admin only)" },
    ],
  });
}
