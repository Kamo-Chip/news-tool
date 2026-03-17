import { XMLParser } from "fast-xml-parser";

import { CONFIG } from "../config.js";
import { decodeHtmlEntities } from "../utils/text.js";

function normalizeFeedItem(item) {
  const url = typeof item?.link === "string" ? item.link.trim() : "";
  const titleRaw = typeof item?.title === "string" ? item.title.trim() : "Untitled";
  const title = decodeHtmlEntities(titleRaw);

  if (!url) return null;

  return { title, url };
}

export async function fetchFeedItems(feedUrl, limit = CONFIG.feedItemLimit) {
  const parser = new XMLParser();
  const response = await fetch(feedUrl);

  if (!response.ok) {
    throw new Error(
      `Feed fetch failed for ${feedUrl}: ${response.status} ${response.statusText}`,
    );
  }

  const xml = await response.text();
  const parsed = parser.parse(xml);
  const rawItems = parsed?.rss?.channel?.item;

  const list = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];
  return list.slice(0, limit).map(normalizeFeedItem).filter(Boolean);
}
