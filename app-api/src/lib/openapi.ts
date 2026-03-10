import {
  OpenAPIRegistry,
  OpenApiGeneratorV31,
  extendZodWithOpenApi,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

// ── Security ─────────────────────────────────────────────────────────────────

const BearerAuth = registry.registerComponent("securitySchemes", "BearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
  description: "Clerk-issued JWT. Obtain via `useAuth().getToken()` on the frontend.",
});

// ── Reusable schemas ─────────────────────────────────────────────────────────

const JobSchema = registry.register(
  "Job",
  z
    .object({
      id: z.string().uuid(),
      title: z.string(),
      company: z.string(),
      locationRaw: z.string().nullable(),
      city: z.string().nullable(),
      country: z.string().nullable(),
      isRemote: z.boolean(),
      workMode: z.enum(["onsite", "remote", "hybrid"]).nullable(),
      source: z.enum(["linkedin", "naukri", "indeed"]),
      jobType: z
        .enum(["full_time", "part_time", "contract", "internship", "freelance", "temporary"])
        .nullable(),
      experienceLevel: z
        .enum(["internship", "entry", "mid", "senior", "lead", "manager", "director", "executive"])
        .nullable(),
      salaryRaw: z.string().nullable(),
      salaryMin: z.number().nullable(),
      salaryMax: z.number().nullable(),
      salaryCurrency: z.string().nullable(),
      description: z.string().nullable(),
      skillsRaw: z.array(z.string()).nullable(),
      url: z.string().url(),
      applyUrl: z.string().url().nullable(),
      postedAt: z.string().datetime().nullable(),
      scrapedAt: z.string().datetime(),
      createdAt: z.string().datetime(),
    })
    .openapi({
      example: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        title: "Senior Software Engineer",
        company: "Acme Corp",
        locationRaw: "Bengaluru, Karnataka, India",
        city: "bengaluru",
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
        description: "We are looking for a Senior SWE to join our platform team...",
        skillsRaw: ["TypeScript", "Node.js", "PostgreSQL"],
        url: "https://www.linkedin.com/jobs/view/123456789",
        applyUrl: null,
        postedAt: "2026-03-08T10:00:00.000Z",
        scrapedAt: "2026-03-10T06:00:00.000Z",
        createdAt: "2026-03-08T10:00:00.000Z",
      },
    }),
);

const SavedJobSchema = registry.register(
  "SavedJob",
  z
    .object({
      id: z.string().uuid(),
      clerkId: z.string(),
      jobId: z.string().uuid(),
      status: z.enum(["saved", "applied", "interviewing", "offered", "rejected", "withdrawn"]),
      notes: z.string().nullable(),
      appliedAt: z.string().datetime().nullable(),
      createdAt: z.string().datetime(),
      updatedAt: z.string().datetime(),
    })
    .openapi({
      example: {
        id: "660e8400-e29b-41d4-a716-446655440001",
        clerkId: "user_2abc123",
        jobId: "550e8400-e29b-41d4-a716-446655440000",
        status: "applied",
        notes: "Applied via LinkedIn Easy Apply",
        appliedAt: "2026-03-09T14:30:00.000Z",
        createdAt: "2026-03-08T11:00:00.000Z",
        updatedAt: "2026-03-09T14:30:00.000Z",
      },
    }),
);

const SavedJobWithJobSchema = registry.register(
  "SavedJobWithJob",
  z.object({
    savedJob: SavedJobSchema,
    job: JobSchema,
  }),
);

const PaginatedJobsSchema = registry.register(
  "PaginatedJobs",
  z.object({
    jobs: z.array(JobSchema),
    total: z.number().int(),
    page: z.number().int(),
    limit: z.number().int(),
    totalPages: z.number().int(),
  }),
);

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

const ValidationErrorSchema = registry.register(
  "ValidationError",
  z.object({
    error: z.literal("Validation failed"),
    code: z.literal("VALIDATION_ERROR"),
    errors: z.record(z.string(), z.array(z.string())),
  }),
);

// ── Helper ───────────────────────────────────────────────────────────────────

const authResponses = {
  401: {
    description: "Unauthorized — missing or invalid Clerk JWT",
    content: { "application/json": { schema: ErrorResponseSchema } },
  },
};

const notFoundResponse = {
  description: "Resource not found",
  content: { "application/json": { schema: ErrorResponseSchema } },
};

const validationErrorResponse = {
  description: "Validation error — invalid request params or body",
  content: { "application/json": { schema: ValidationErrorSchema } },
};

const curlSample = (method: string, path: string, body?: string) => ({
  "x-codeSamples": [
    {
      lang: "Shell",
      label: "cURL",
      source: [
        `curl -X ${method} "http://localhost:3001${path}"`,
        `  -H "Authorization: Bearer <token>"`,
        body ? `  -H "Content-Type: application/json"` : null,
        body ? `  -d '${body}'` : null,
      ]
        .filter(Boolean)
        .join(" \\\n"),
    },
  ],
});

// ── Routes ───────────────────────────────────────────────────────────────────

registry.registerPath({
  method: "get",
  path: "/howareyou",
  tags: ["Health"],
  summary: "Server liveness check",
  description: "Returns liveness status with runtime diagnostics. No auth required.",
  responses: {
    200: {
      description: "Server is alive",
      content: { "application/json": { schema: HealthResponseSchema } },
    },
  },
  ...curlSample("GET", "/howareyou"),
});

registry.registerPath({
  method: "get",
  path: "/api/v1/jobs",
  tags: ["Jobs"],
  summary: "List jobs",
  description:
    "Returns a paginated list of scraped jobs. All filter params are optional and combinable.",
  security: [{ [BearerAuth.name]: [] }],
  request: {
    query: z.object({
      source: z.enum(["linkedin", "naukri", "indeed"]).optional().openapi({ example: "linkedin" }),
      city: z.string().optional().openapi({ example: "bengaluru" }),
      jobType: z
        .enum(["full_time", "part_time", "contract", "internship", "freelance", "temporary"])
        .optional()
        .openapi({ example: "full_time" }),
      workMode: z
        .enum(["onsite", "remote", "hybrid"])
        .optional()
        .openapi({ example: "remote" }),
      datePosted: z
        .enum(["24h", "7d", "30d"])
        .optional()
        .openapi({ description: "Filter jobs posted within this window", example: "7d" }),
      salaryMin: z.coerce.number().optional().openapi({ example: 1500000 }),
      salaryMax: z.coerce.number().optional().openapi({ example: 4000000 }),
      page: z.coerce.number().default(1).openapi({ example: 1 }),
      limit: z.coerce.number().default(20).openapi({ example: 20 }),
    }),
  },
  responses: {
    200: {
      description: "Paginated job listings",
      content: { "application/json": { schema: PaginatedJobsSchema } },
    },
    422: validationErrorResponse,
    ...authResponses,
  },
  ...curlSample("GET", "/api/v1/jobs?source=linkedin&workMode=remote&datePosted=7d&page=1&limit=20"),
});

registry.registerPath({
  method: "get",
  path: "/api/v1/jobs/{id}",
  tags: ["Jobs"],
  summary: "Get job by ID",
  security: [{ [BearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string().uuid().openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }) }),
  },
  responses: {
    200: {
      description: "Job details",
      content: { "application/json": { schema: JobSchema } },
    },
    404: notFoundResponse,
    ...authResponses,
  },
  ...curlSample("GET", "/api/v1/jobs/550e8400-e29b-41d4-a716-446655440000"),
});

registry.registerPath({
  method: "get",
  path: "/api/v1/saved",
  tags: ["Saved"],
  summary: "List saved jobs",
  description: "Returns all saved jobs for the authenticated user, joined with job details.",
  security: [{ [BearerAuth.name]: [] }],
  request: {
    query: z.object({
      status: z
        .enum(["saved", "applied", "interviewing", "offered", "rejected", "withdrawn"])
        .optional()
        .openapi({ example: "applied" }),
    }),
  },
  responses: {
    200: {
      description: "List of saved jobs with job details",
      content: { "application/json": { schema: z.array(SavedJobWithJobSchema) } },
    },
    422: validationErrorResponse,
    ...authResponses,
  },
  ...curlSample("GET", "/api/v1/saved?status=applied"),
});

registry.registerPath({
  method: "post",
  path: "/api/v1/saved",
  tags: ["Saved"],
  summary: "Save a job",
  description: "Saves a job to the authenticated user's list with initial status `saved`.",
  security: [{ [BearerAuth.name]: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            jobId: z
              .string()
              .uuid()
              .openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: "Job saved successfully",
      content: { "application/json": { schema: SavedJobSchema } },
    },
    404: { description: "Job ID does not exist", content: { "application/json": { schema: ErrorResponseSchema } } },
    422: validationErrorResponse,
    ...authResponses,
  },
  ...curlSample(
    "POST",
    "/api/v1/saved",
    '{"jobId":"550e8400-e29b-41d4-a716-446655440000"}',
  ),
});

registry.registerPath({
  method: "patch",
  path: "/api/v1/saved/{id}",
  tags: ["Saved"],
  summary: "Update a saved job",
  description:
    "Update status and/or notes. Status changes are recorded in history. Setting status to `applied` auto-sets `appliedAt`.",
  security: [{ [BearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string().uuid().openapi({ example: "660e8400-e29b-41d4-a716-446655440001" }) }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            status: z
              .enum(["saved", "applied", "interviewing", "offered", "rejected", "withdrawn"])
              .optional()
              .openapi({ example: "interviewing" }),
            notes: z.string().optional().openapi({ example: "Had a great first call!" }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Updated saved job",
      content: { "application/json": { schema: SavedJobSchema } },
    },
    404: notFoundResponse,
    422: validationErrorResponse,
    ...authResponses,
  },
  ...curlSample(
    "PATCH",
    "/api/v1/saved/660e8400-e29b-41d4-a716-446655440001",
    '{"status":"interviewing","notes":"Had a great first call!"}',
  ),
});

registry.registerPath({
  method: "delete",
  path: "/api/v1/saved/{id}",
  tags: ["Saved"],
  summary: "Remove a saved job",
  description: "Soft-deletes the saved job. The underlying job record is unaffected.",
  security: [{ [BearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string().uuid().openapi({ example: "660e8400-e29b-41d4-a716-446655440001" }) }),
  },
  responses: {
    204: { description: "Deleted successfully — no content" },
    404: notFoundResponse,
    ...authResponses,
  },
  ...curlSample("DELETE", "/api/v1/saved/660e8400-e29b-41d4-a716-446655440001"),
});

registry.registerPath({
  method: "post",
  path: "/api/v1/admin/scrape/trigger",
  tags: ["Scrape"],
  summary: "Trigger a scrape job",
  description:
    "Enqueues an immediate scrape for the given source. Requires both a valid Clerk JWT **and** the `x-admin-key` header.",
  security: [{ [BearerAuth.name]: [] }],
  request: {
    headers: z.object({
      "x-admin-key": z.string().openapi({ example: "my-secret-admin-key" }),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            source: z.enum(["linkedin", "naukri", "indeed"]).openapi({ example: "linkedin" }),
            role: z.string().default("software engineer").openapi({ example: "backend engineer" }),
            location: z.string().default("india").openapi({ example: "bengaluru" }),
            limit: z.number().int().min(1).max(200).default(50).openapi({ example: 50 }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Scrape job queued",
      content: {
        "application/json": {
          schema: z.object({
            queued: z.literal(true),
            jobId: z.string().nullable().openapi({ example: "pg-boss-job-id-abc123" }),
          }),
        },
      },
    },
    403: {
      description: "Forbidden — invalid or missing x-admin-key",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    422: validationErrorResponse,
    ...authResponses,
  },
  ...curlSample(
    "POST",
    "/api/v1/admin/scrape/trigger",
    '{"source":"linkedin","role":"backend engineer","location":"bengaluru","limit":50}',
  ),
});

// ── Document builder ─────────────────────────────────────────────────────────

export function buildOpenApiDocument() {
  const generator = new OpenApiGeneratorV31(registry.definitions);

  return generator.generateDocument({
    openapi: "3.1.0",
    info: {
      title: "EasyHunt API",
      version: "1.0.0",
      description: [
        "Job aggregator API — scrapes LinkedIn, Naukri, and Indeed into one unified feed.",
        "",
        "## Authentication",
        "All `/api/v1/*` routes require a Clerk-issued Bearer token.",
        "Obtain it via `useAuth().getToken()` in the frontend, then pass it as:",
        "```",
        "Authorization: Bearer <token>",
        "```",
        "",
        "## Admin routes",
        "Admin routes additionally require the `x-admin-key` header.",
      ].join("\n"),
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
      { name: "Health", description: "Server liveness and diagnostics" },
      { name: "Jobs", description: "Paginated, filterable job listings from all sources" },
      { name: "Saved", description: "Save and track job applications with status history" },
      { name: "Scrape", description: "Admin-only endpoints to trigger and manage scrape jobs" },
    ],
  });
}
