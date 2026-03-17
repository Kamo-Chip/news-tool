import path from "path";

export const CONFIG = {
  feeds: [
    "https://rss.iol.io/iol/news",
    "https://rss.iol.io/iol/business-report",
    "https://www.thesouthafrican.com/business/finance/feed/",
    "https://www.thesouthafrican.com/business/feed/",
    "https://businesstech.co.za/news/feed/",
    "https://www.thesouthafrican.com/business/economics/feed/",
    "https://mg.co.za/section/business/feed/",
    "https://www.dailymaverick.co.za/dmrss/",
    "https://mg.co.za/section/politics/feed/",
    "https://www.thesouthafrican.com/technology/feed/",
    "https://mybroadband.co.za/news/feed",
    "https://techcentral.co.za/feed/",
  ],
  models: {
    selector: "gpt-5-nano",
    summariser: "gpt-5-mini",
    curator: "gpt-5-mini",
  },
  feedItemLimit: 5,
  digestTopLimit: 5,
  maxArticleChars: 12000,
  seenFile: path.resolve("./seen.json"),
  digestCounterFile: path.resolve("./digest-counter.json"),
  email: {
    from: "News Digest <newsdigest@honourablemembergpt.com>",
    to: ["kamokhumalo04@gmail.com"],
    subject: "Stay Up to Date 🧠",
  },
};

export function requireInterestProfile() {
  const value = process.env.INTEREST_PROFILE?.trim();
  if (!value) {
    throw new Error(
      "Missing INTEREST_PROFILE env var. Add a short profile to .env.",
    );
  }
  return value;
}
