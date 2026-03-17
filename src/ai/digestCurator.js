import { openai } from "../clients.js";
import { CONFIG } from "../config.js";
import { parseJsonObject } from "../utils/json.js";
import { logError } from "../utils/logging.js";

function buildSummaryPreview(item) {
  const facts = Array.isArray(item?.summary) ? item.summary : [];
  return facts
    .slice(0, 2)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 320);
}

function fallbackCuration(summaries, limit) {
  const seen = new Set();
  const curated = [];

  for (const item of summaries) {
    const key = String(item.title || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    curated.push(item);
    if (curated.length >= limit) break;
  }

  return {
    curated,
    rationale: "Fallback curation used",
  };
}

export async function curateDigestSummaries(summaries, interestProfile) {
  const limit = CONFIG.digestTopLimit;
  if (!summaries.length) {
    return { curated: [], rationale: "No summaries" };
  }

  const response = await openai.chat.completions.create({
    model: CONFIG.models.curator,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "digest_curation",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            selectedIndices: {
              type: "array",
              items: {
                type: "integer",
                minimum: 0,
                maximum: summaries.length - 1,
              },
              minItems: 1,
              maxItems: limit,
            },
            rationale: {
              type: "string",
            },
          },
          required: ["selectedIndices", "rationale"],
        },
      },
    },
    messages: [
      {
        role: "system",
        content: `You curate a final daily digest list from multiple feeds.

Goals:
1) Remove duplicates and near-duplicates that cover the same story/event from different sources.
2) Keep only the most relevant stories for the reader's interests.
3) Return at most ${limit} stories.
4) Don't include stories about a similar topic if one is already included, unless the story provides unique and important information.

Rules:
- Prefer diversity of topics while keeping relevance high.
- If two stories are about the same event, keep the stronger/more informative one.
- Do not invent stories.
- Use title/topic/summaryPreview to assess overlap and relevance.
- Return valid JSON matching schema only.`,
      },
      {
        role: "user",
        content: JSON.stringify({
          interestProfile,
          maxStories: limit,
          candidates: summaries.map((item, index) => ({
            index,
            title: item.title,
            topic: item.topic,
            summaryPreview: buildSummaryPreview(item),
            url: item.url,
          })),
        }),
      },
    ],
  });

  const parsed = parseJsonObject(response.choices[0]?.message?.content?.trim());
  const rawIndices = Array.isArray(parsed?.selectedIndices)
    ? parsed.selectedIndices
    : [];

  const uniqueIndices = [...new Set(rawIndices)].filter(
    (idx) => Number.isInteger(idx) && idx >= 0 && idx < summaries.length,
  );

  if (!uniqueIndices.length) {
    return fallbackCuration(summaries, limit);
  }

  const curated = uniqueIndices.slice(0, limit).map((idx) => summaries[idx]);
  return {
    curated,
    rationale:
      typeof parsed?.rationale === "string" && parsed.rationale.trim()
        ? parsed.rationale.trim()
        : "Curated by LLM",
  };
}

export async function curateDigestSummariesSafe(summaries, interestProfile) {
  try {
    return await curateDigestSummaries(summaries, interestProfile);
  } catch (error) {
    logError("Digest curation failed. Using fallback.", error);
    return fallbackCuration(summaries, CONFIG.digestTopLimit);
  }
}
