import express from "express";

const app = express();
const PORT = process.env.PORT ?? 3001;

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

app.listen(PORT, () => {
  console.log(`app-api running on http://localhost:${PORT}`);
});
