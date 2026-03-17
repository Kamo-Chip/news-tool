export function log(level, message, details = null) {
  const ts = new Date().toISOString();
  if (details === null || details === undefined) {
    console.log(`[${ts}] [${level}] ${message}`);
    return;
  }
  console.log(`[${ts}] [${level}] ${message}`, details);
}

export function logInfo(message, details = null) {
  log("INFO", message, details);
}

export function logError(message, details = null) {
  log("ERROR", message, details);
}
