import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

import { CONFIG } from "../config.js";

export async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari",
      "Accept-Language": "en",
      Accept: "text/html,application/xhtml+xml",
    },
  });

  if (!res.ok) {
    throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  }

  return await res.text();
}

export function extractArticleText(html, url) {
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const parsed = reader.parse();

  const text = parsed?.textContent?.replace(/\s+/g, " ").trim();
  if (!text || text.length < 500) {
    throw new Error("Article extraction seems too short or failed.");
  }

  const clipped =
    text.length > CONFIG.maxArticleChars
      ? text.slice(0, CONFIG.maxArticleChars)
      : text;

  return {
    title: parsed?.title || "Untitled",
    text: clipped,
    approxChars: clipped.length,
    sourceUrl: url,
  };
}
