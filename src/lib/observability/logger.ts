type LogLevel = "info" | "warn" | "error";

type LogMetadata = Record<string, string | number | boolean | null | undefined>;

function writeLog(level: LogLevel, event: string, metadata: LogMetadata = {}) {
  const payload = {
    level,
    event,
    metadata,
    occurredAt: new Date().toISOString()
  };

  const serializedPayload = JSON.stringify(payload);

  if (level === "error") {
    console.error(serializedPayload);
    return;
  }

  if (level === "warn") {
    console.warn(serializedPayload);
    return;
  }

  console.info(serializedPayload);
}

export const logger = {
  info(event: string, metadata?: LogMetadata) {
    writeLog("info", event, metadata);
  },
  warn(event: string, metadata?: LogMetadata) {
    writeLog("warn", event, metadata);
  },
  error(event: string, metadata?: LogMetadata) {
    writeLog("error", event, metadata);
  }
};
