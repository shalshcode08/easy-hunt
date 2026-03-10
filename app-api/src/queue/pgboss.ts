import { PgBoss } from "pg-boss";
import { env } from "@/env";
import { logger } from "@/lib/logger";

let boss: PgBoss | null = null;

export const getBoss = (): PgBoss => {
  if (!boss) throw new Error("PgBoss not started — call startBoss() first");
  return boss;
};

export const startBoss = async (): Promise<PgBoss> => {
  const connectionString = (env.PGBOSS_DATABASE_URL ?? env.DATABASE_URL)
    .replace("sslmode=require", "sslmode=verify-full")
    .replace("channel_binding=require&", "")
    .replace("&channel_binding=require", "");

  boss = new PgBoss({
    connectionString,
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
