import { openai } from "../clients.js";
import { CONFIG } from "../config.js";
import { parseJsonObject } from "../utils/json.js";

export async function summariseArticle(article) {
  const response = await openai.chat.completions.create({
    model: CONFIG.models.summariser,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "article_summary",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            topic: {
              type: "string",
              minLength: 2,
              maxLength: 40,
            },
            keyFacts: {
              type: "array",
              items: { type: "string" },
              minItems: 1,
              maxItems: 5,
            },
          },
          required: ["topic", "keyFacts"],
        },
      },
    },
    messages: [
      {
        role: "system",
        content: `You are a factual news explainer.
Extract only important facts a citizen should know.
Focus on who, what, where, when, why, and how.
Avoid fluff, rhetoric, and speculation.
Return valid JSON matching schema only.
Also set a concise topic label in title case (1-3 words) that best represents the article.
Extract a maximum of 5 key facts, prioritising the most critical information for a reader to understand the news story. Each fact should be concise and self-contained.`,
      },
      {
        role: "user",
        content: `Article URL: ${article.sourceUrl}\n\nArticle text:\n${article.text}`,
      },
    ],
  });

  const parsed = parseJsonObject(response.choices[0]?.message?.content?.trim());
  const topic =
    typeof parsed?.topic === "string" && parsed.topic.trim()
      ? parsed.topic.trim()
      : "General news";
  const facts = Array.isArray(parsed?.keyFacts)
    ? parsed.keyFacts.filter((fact) => typeof fact === "string" && fact.trim())
    : [];

  if (!facts.length) {
    throw new Error("Summariser returned no usable key facts.");
  }

  return {
    topic,
    keyFacts: facts,
  };
}
