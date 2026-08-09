// logging-demo.ts - structured logging: level thresholds, child(), and redaction.
import { createLogger } from "../src/index.js";

const logger = createLogger({ level: "info" });

logger.trace("trace is below the info threshold and is dropped");
logger.debug("debug is below the info threshold and is dropped");
logger.info("info is emitted");

logger.warn("disk space is low", { freeBytes: 42 });
logger.error("operation failed", { code: "EIO" });

const child = logger.child({ requestId: "req-123" });
child.info("request started");

const guarded = createLogger({ level: "info", redact: ["password", "token"] });
guarded.info("submitted", {
  user: "alice",
  password: "sup3rs3cret",
  token: "abc123",
});
