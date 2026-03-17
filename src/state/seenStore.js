import fs from "fs";

import { CONFIG } from "../config.js";
import { logError } from "../utils/logging.js";

export function loadSeenSet() {
  if (!fs.existsSync(CONFIG.seenFile)) {
    return new Set();
  }

  try {
    const data = JSON.parse(fs.readFileSync(CONFIG.seenFile, "utf8"));
    return new Set(Array.isArray(data?.seen) ? data.seen : []);
  } catch (error) {
    logError("Error reading seen.json; starting fresh.", error);
    return new Set();
  }
}

export function saveSeenSet(seenSet) {
  fs.writeFileSync(
    CONFIG.seenFile,
    JSON.stringify({ seen: [...seenSet] }, null, 2),
    "utf8",
  );
}
