import express from "express";
import { docsRouter } from "@/routes/docs";
import { httpLogger, httpLoggerVerbose } from "@/lib/logger";

export const app = express();

app.use(httpLogger);
app.use(express.json());

app.get("/howareyou", (_req, res) => {
  res.json({
    status: "alive",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage(),
    node: process.version,
  });
});

app.use("/docs", docsRouter);

if (require.main === module) {
  const PORT = process.env.PORT ?? 3001;
  app.listen(PORT, () => {
    console.log(`app-api running on http://localhost:${PORT}`);
  });
}
