import { openai } from "../clients.js";
import { CONFIG } from "../config.js";
import { parseJsonObject } from "../utils/json.js";

export async function selectBestCandidateForFeed(feedUrl, items, interestProfile) {
  if (!items.length) {
    return {
      selectedIndex: null,
      skipReason: "No valid items in feed",
      rationale: "",
    };
  }

  const response = await openai.chat.completions.create({
    model: CONFIG.models.selector,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "feed_selection",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            selectedIndex: {
              anyOf: [
                {
                  type: "integer",
                  minimum: 0,
                  maximum: CONFIG.feedItemLimit - 1,
                },
                { type: "null" },
              ],
            },
            skipReason: { anyOf: [{ type: "string" }, { type: "null" }] },
            rationale: { anyOf: [{ type: "string" }, { type: "null" }] },
          },
          required: ["selectedIndex", "skipReason", "rationale"],
        },
      },
    },
    messages: [
      {
        role: "system",
        content: `You select one article title from a feed for a specific reader.

Tasks:
1) Reject promotional/advertorial/commercial items.
2) From remaining titles, choose the single most relevant item for the reader interests.
3) If none are relevant enough, return selectedIndex = null with a concise skipReason.

Rules:
- Do not use random choice.
- Prefer public-interest reporting over opinion fluff.
- If uncertain between two, pick the one with clearer civic/economic impact.
- Return valid JSON matching schema only.`,
      },
      {
        role: "user",
        content: JSON.stringify({
          feedUrl,
          interestProfile,
          candidates: items.map((item, index) => ({
            index,
            title: item.title,
            url: item.url,
          })),
        }),
      },
    ],
  });

  const parsed = parseJsonObject(response.choices[0]?.message?.content?.trim());
  const rawIndex = parsed?.selectedIndex;
  const isValidIndex =
    Number.isInteger(rawIndex) && rawIndex >= 0 && rawIndex < items.length;

  return {
    selectedIndex: isValidIndex ? rawIndex : null,
    skipReason:
      typeof parsed?.skipReason === "string" && parsed.skipReason.trim()
        ? parsed.skipReason
        : isValidIndex
          ? null
          : "No strong match for interests",
    rationale: typeof parsed?.rationale === "string" ? parsed.rationale : "",
  };
}
