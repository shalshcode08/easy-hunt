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

const createHttpLogger = ({ verbose = false }: { verbose?: boolean } = {}) =>
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

export const httpLogger = createHttpLogger();
export const httpLoggerVerbose = createHttpLogger({ verbose: true });
