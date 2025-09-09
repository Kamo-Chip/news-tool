import "dotenv/config";

import { XMLParser } from "fast-xml-parser";
import * as cheerio from "cheerio";
import OpenAI from "openai";

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      // Some sites serve simpler HTML to bots; this UA helps get full article.
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

function extractArticleText(html, url) {
  const $ = cheerio.load(html);

  // Remove obvious non-article elements
  [
    "script",
    "style",
    "noscript",
    "header",
    "footer",
    "nav",
    "aside",
    ".advert",
    ".ads",
    "[class*='ad-']",
    "[id*='ad-']",
    ".newsletter",
    ".subscribe",
    ".paywall",
    ".promo",
  ].forEach((sel) => $(sel).remove());

  // Try a few likely containers (tweak / add as needed)
  const candidates = [
    "article",
    "[itemprop='articleBody']",
    ".article__content",
    ".article-content",
    ".single-article__content",
    ".entry-content",
    ".post-content",
    ".content__article-body",
    ".td-post-content",
    ".c-article-content",
    ".l-article__body",
  ];

  let $container = null;
  for (const sel of candidates) {
    const el = $(sel).first();
    if (el && el.length && el.text().trim().length > 200) {
      $container = el;
      break;
    }
  }
  // Fallback: biggest <div> by text length
  if (!$container) {
    let bestEl = null;
    let bestLen = 0;
    $("div").each((_, el) => {
      const len = $(el).text().trim().length;
      if (len > bestLen) {
        bestLen = len;
        bestEl = el;
      }
    });
    $container = bestEl ? $(bestEl) : $("body");
  }

  // Convert paragraphs and headings to text lines
  const blocks = [];
  $container.find("p, h1, h2, h3, li, blockquote").each((_, el) => {
    const t = $(el).text().replace(/\s+/g, " ").trim();
    if (t) blocks.push(t);
  });

  // Gentle de-duplication (some CMS repeat standfirsts)
  const seen = new Set();
  const lines = [];
  for (const b of blocks) {
    const key = b.slice(0, 120); // prefix key
    if (!seen.has(key)) {
      seen.add(key);
      lines.push(b);
    }
  }

  // Join and lightly normalize
  const fullText = lines.join("\n\n").trim();
  // Basic sanity guard
  if (fullText.length < 500) {
    throw new Error("Article extraction seems too short; adjust selectors.");
  }

  // Optional: cap very long articles to keep tokens in check
  const MAX_CHARS = 12000; // ~ 1.5–2k tokens rough
  const clipped =
    fullText.length > MAX_CHARS ? fullText.slice(0, MAX_CHARS) : fullText;

  return { text: clipped, approxChars: clipped.length, sourceUrl: url };
}

const parser = new XMLParser();
let response = await fetch("https://mybroadband.co.za/news/feed/");
const data = await response.text();

let jObj = parser.parse(data);

let items = jObj.rss.channel.item.slice(0, 1);

const openai = new OpenAI();

for (const item of items) {
  try {
    const url = item.link;
    console.log(`Fetching article: ${url}`);
    const html = await fetchHtml(url);
    const article = extractArticleText(html, url);
    console.log(
      `Extracted article text, approx ${article.approxChars} chars. Summarizing...`
    );

    const summary = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: `You are a news explainer that extracts the most important, factual takeaways from articles. Given an article, identify the key facts a citizen should know to stay informed. Output them as a concise, easy-to-read list.

                Guidelines:
                - Focus only on what matters: who, what, where, when, why, how.
                - Highlight roles (e.g., political positions, business roles, public figures).
                - Skip fluff, opinions, and rhetorical flourishes.
                - Avoid jargon; explain in simple terms.
                - If relevant, include why this matters to ordinary citizens.
                - Write in plain text, not markdown.

                Example output:
                - [Key Fact 1]
                - [Key Fact 2]
                - [Key Fact 3]
                ...`,
        },
        {
          role: "user",
          content: `Article: ${article.text}`,
        },
      ],
    });

    console.log("\n=== SUMMARY ===\n");
    console.log("\nTITLE: " + item.title + "\n");   
    console.log(summary.choices[0].message.content.trim());
    console.log("\nURL: " + article.sourceUrl + "\n");
    console.log("\n");
  } catch (err) {
    console.error("Error processing item:", err);
  }
}
