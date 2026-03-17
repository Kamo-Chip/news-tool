import fs from "fs";

import { CONFIG } from "../config.js";
import { logError } from "../utils/logging.js";

export function loadDigestSentCount() {
  if (!fs.existsSync(CONFIG.digestCounterFile)) {
    return 0;
  }

  try {
    const data = JSON.parse(fs.readFileSync(CONFIG.digestCounterFile, "utf8"));
    const count = Number(data?.sentCount);
    return Number.isInteger(count) && count >= 0 ? count : 0;
  } catch (error) {
    logError("Error reading digest counter file; defaulting to 0.", error);
    return 0;
  }
}

export function saveDigestSentCount(sentCount) {
  fs.writeFileSync(
    CONFIG.digestCounterFile,
    JSON.stringify({ sentCount }, null, 2),
    "utf8",
  );
}
