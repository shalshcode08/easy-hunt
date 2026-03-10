import { config } from "dotenv";
import { resolve } from "path";

// Load real .env first
config({ path: resolve(__dirname, "../.env") });

// Fill in any missing vars with test stubs so env.ts validation passes
const testDefaults: Record<string, string> = {
  DATABASE_URL: "postgresql://test:test@localhost:5432/test",
  UPSTASH_REDIS_URL: "https://test.upstash.io",
  UPSTASH_REDIS_TOKEN: "test-token",
  CLERK_SECRET_KEY: "sk_test_placeholder",
  CLERK_PUBLISHABLE_KEY: "pk_test_placeholder",
  ADMIN_KEY: "test-admin-key",
  FRONTEND_URL: "http://localhost:3000",
  PORT: "3001",
  NODE_ENV: "test",
};

for (const [key, value] of Object.entries(testDefaults)) {
  if (!process.env[key]) process.env[key] = value;
}
