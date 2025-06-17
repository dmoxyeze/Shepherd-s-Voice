import { createLogger, format, transports } from "winston";

interface Logger {
  info(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
}

const consoleLogger: Logger = {
  info(message: string, meta?: any) {
    console.log(`[INFO] ${message}`, meta || "");
  },
  error(message: string, meta?: any) {
    console.error(`[ERROR] ${message}`, meta || "");
  },
  warn(message: string, meta?: any) {
    console.warn(`[WARN] ${message}`, meta || "");
  },
};

const winstonLogger = createLogger({
  level: "info",
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.File({ filename: "logs/pipeline.log" })],
});

const logger: Logger =
  process.env.NODE_ENV === "production" ? winstonLogger : consoleLogger;

export default logger;
