import { CONFIG, requireInterestProfile } from "./config.js";
import { logError, logInfo } from "./utils/logging.js";
import { generateSummaries } from "./pipeline.js";
import { curateDigestSummariesSafe } from "./ai/digestCurator.js";
import { buildDigestEmail } from "./email/templates/digest.js";
import { sendDigestEmail } from "./email/sendDigestEmail.js";
import {
  loadDigestSentCount,
  saveDigestSentCount,
} from "./state/digestCounterStore.js";

function finishRun(runStartedAt, summaries) {
  logInfo("News digest run finished.", {
    durationMs: Date.now() - runStartedAt,
    summaries,
  });
}

export async function run() {
  const runStartedAt = Date.now();

  logInfo("News digest run started.", {
    feeds: CONFIG.feeds.length,
    modelSelector: CONFIG.models.selector,
    modelSummariser: CONFIG.models.summariser,
  });

  const interestProfile = requireInterestProfile();
  const summaries = await generateSummaries(interestProfile);
  logInfo("Summaries generated before final curation.", {
    count: summaries.length,
  });

  if (!summaries.length) {
    logInfo("No new relevant articles to summarise.");
    finishRun(runStartedAt, 0);
    return;
  }

  const curation = await curateDigestSummariesSafe(summaries, interestProfile);
  const finalSummaries = curation.curated;
  logInfo("Final digest curation complete.", {
    selectedCount: finalSummaries.length,
    droppedCount: summaries.length - finalSummaries.length,
    rationale: curation.rationale,
  });

  if (!finalSummaries.length) {
    logInfo("No stories left after curation; skipping send.");
    finishRun(runStartedAt, 0);
    return;
  }

  const lastSentCount = loadDigestSentCount();
  const digestNumber = lastSentCount + 1;
  const digestHtml = buildDigestEmail(finalSummaries, { digestNumber });
  const sent = await sendDigestEmail(digestHtml);

  if (sent) {
    saveDigestSentCount(digestNumber);
    logInfo("Digest counter updated.", { digestNumber });
  } else {
    logError("Digest email send failed; counter not updated.", { digestNumber });
  }

  finishRun(runStartedAt, finalSummaries.length);
}

export async function runWithErrorHandling() {
  try {
    await run();
  } catch (error) {
    logError("Fatal error during run.", error);
    process.exitCode = 1;
  }
}
