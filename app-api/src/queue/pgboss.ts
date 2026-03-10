import { PgBoss } from "pg-boss";
import { env } from "@/env";
import { logger } from "@/lib/logger";

let boss: PgBoss | null = null;

export const getBoss = (): PgBoss => {
  if (!boss) throw new Error("PgBoss not started — call startBoss() first");
  return boss;
};

function normalizePgUrl(raw: string): string {
  const url = new URL(raw);
  url.searchParams.set("sslmode", "verify-full");
  url.searchParams.delete("channel_binding");
  return url.toString();
}

export const startBoss = async (): Promise<PgBoss> => {
  boss = new PgBoss({
    connectionString: normalizePgUrl(env.PGBOSS_DATABASE_URL ?? env.DATABASE_URL),
    ssl: { rejectUnauthorized: false },
    max: 5,
  });

  boss.on("error", (err: Error) => logger.error({ err }, "pg-boss error"));

  await boss.start();
  return boss;
};

export const stopBoss = async (): Promise<void> => {
  if (boss) {
    await boss.stop();
    boss = null;
  }
};
