# app-api

Bun + Express backend for EasyHunt. Scrapes LinkedIn, Naukri, and Indeed into a unified job feed.

## Setup

```bash
cp ../.env.example .env   # fill in the values
bun install
bun run db:migrate
bun run dev
```

## Scripts

| Command | Description |
|---|---|
| `bun run dev` | Start with hot reload |
| `bun run test` | Run tests |
| `bun run db:migrate` | Run DB migrations |
| `bun run db:studio` | Open Drizzle Studio |

## Requirements

- [Bun](https://bun.sh) 1.x
- CockroachDB Serverless (app data)
- PostgreSQL — Neon or Supabase free tier (pg-boss queue)
- Clerk account (auth)
