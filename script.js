import "dotenv/config";

import { XMLParser } from "fast-xml-parser";
import * as cheerio from "cheerio";
import OpenAI from "openai";
import { Resend } from "resend";

import fs from "fs";
import path from "path";

const FEEDS = [
  "https://mybroadband.co.za/news/feed/",
  "https://mg.co.za/feed/",
  "https://www.dailymaverick.co.za/dmrss/",
  "https://rss.iol.io/iol/news",
  "https://techcentral.co.za/feed/",
];

const openai = new OpenAI();
const resend = new Resend(process.env.RESEND_API_KEY);

const seenFile = path.resolve("./seen.json");
let seen = [];
if (fs.existsSync(seenFile)) {
  try {
    const data = JSON.parse(fs.readFileSync(seenFile, "utf8"));
    seen = data.seen || [];
  } catch (e) {
    console.error("Error reading seen.json, starting fresh:", e);
    seen = [];
  }
}

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
    // "[class*='ad-']",
    // "[id*='ad-']",
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

async function summariseArticle(article) {
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
                - Return your output as valid JSON.

                Example output as JSON:
                {
                    keyFacts: [
                        "Key fact 1",
                        "Key fact 2",
                        "Key fact 3",
                        "...",
                    ]
                }`,
      },
      {
        role: "user",
        content: `Article: ${article.text}`,
      },
    ],
  });

  return JSON.parse(summary.choices[0].message.content.trim()).keyFacts;
}

async function getArticlesFromFeed(url) {
  const parser = new XMLParser();
  let response = await fetch(url);
  const data = await response.text();

  let jObj = parser.parse(data);

  let items = jObj.rss.channel.item.slice(0, 1);

  return items;
}

function buildEmailTemplate({ title, summary, url }) {
  const summaryHtml = `<ul style="padding-left: 20px; margin: 0; color: #333;">${summary
    .map(
      (point) =>
        `<li style="margin-bottom: 8px; font-size: 15px; line-height: 1.4;">${point}</li>`
    )
    .join("")}</ul>`;

  return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background: #ffffff; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
    <div style="background: #0077cc; color: white; padding: 16px; text-align: center;">
      <h1 style="margin: 0; font-size: 20px;">${title}</h1>
    </div>
    <div style="padding: 16px; color: #333;">
      ${summaryHtml}
      <p style="margin-top: 20px; text-align: center;">
        <a href="${url}" style="background: #0077cc; color: white; padding: 10px 16px; text-decoration: none; border-radius: 4px; font-size: 14px; display: inline-block;">Read Full Article</a>
      </p>
    </div>
    <div style="background: #f4f4f4; padding: 12px; text-align: center; font-size: 12px; color: #666;">
     <a href="${url}" style="color: #0077cc;">Source</a>
    </div>
  </div>
  `;
}

async function sendDigestEmail(html) {
  console.log("Sending email...");

  const { error } = await resend.emails.send({
    from: "News Digest <newsdigest@honourablemembergpt.com>",
    to: ["kamokhumalo04@gmail.com"],
    subject: "Stay Up to Date 🧠",
    html: html,
  });

  if (error) {
    return console.error({ error });
  }

  console.log("Email sent successfully!");
}

async function generateSummaries() {
  let summaries = [];
  let newSeen = [...seen];

  await Promise.all(
    FEEDS.map(async (feed) => {
      const items = await getArticlesFromFeed(feed);
      for (const item of items) {
        try {
          const url = item.link;

          if (seen.includes(url)) {
            console.log(`Already seen article, skipping: ${url}`);
            continue;
          }

          console.log(`Fetching article from feed ${feed}: ${url}`);
          const html = await fetchHtml(url);

          const article = extractArticleText(html, url);
          console.log(
            `Extracted article text, approx ${article.approxChars} chars. Summarizing...`
          );

          const summary = await summariseArticle(article);
          summaries.push({
            title: item.title,
            summary,
            url: article.sourceUrl,
          });

          newSeen.push(url);
        } catch (err) {
          console.error("Error processing item:", err);
        }
      }
    })
  );
  fs.writeFileSync(seenFile, JSON.stringify({ seen: newSeen }, null, 2));

  return summaries;
}

const summaries = await generateSummaries();

if (summaries.length) {
  const templates = summaries.map((s) => buildEmailTemplate(s)).join("<hr/>");
  await sendDigestEmail(templates);
} else {
  console.log("No new articles to summarise.");
}
