import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PGBOSS_DATABASE_URL: z.string().min(1).optional(),
  CLERK_SECRET_KEY: z.string().min(1),
  ADMIN_KEY: z.string().min(1),
  BROWSERBASE_API_KEY: z.string().min(1),
  BROWSERBASE_PROJECT_ID: z.string().min(1),
  COOKIE_ENCRYPTION_KEY: z.string().length(64), // 32 bytes as hex
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  FRONTEND_URL: z.url(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
