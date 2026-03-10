import pino from "pino";
import pinoHttp from "pino-http";

export const logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  ...(process.env.NODE_ENV !== "production" && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:MM:ss",
        ignore: "pid,hostname",
      },
    },
  }),
});

export const createHttpLogger = ({ verbose = false }: { verbose?: boolean } = {}) =>
  pinoHttp({
    logger,
    customLogLevel(_req, res) {
      if (res.statusCode >= 500) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },
    customSuccessMessage(req, res) {
      return `${req.method} ${req.url} ${res.statusCode}`;
    },
    customErrorMessage(req, res) {
      return `${req.method} ${req.url} ${res.statusCode}`;
    },
    ...(verbose
      ? {
          redact: {
            paths: ["req.headers.authorization", "req.headers.cookie", "responseTime"],
            remove: true,
          },
        }
      : {
          serializers: {
            req: () => undefined,
            res: () => undefined,
          },
          redact: {
            paths: ["responseTime"],
            remove: true,
          },
        }),
  });

// Default: clean one-line logs — used globally in index.ts
export const httpLogger = createHttpLogger();

// Verbose: full req/res — use on specific routes when debugging
export const httpLoggerVerbose = createHttpLogger({ verbose: true });
