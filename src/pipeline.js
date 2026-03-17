import { CONFIG } from "./config.js";
import { fetchFeedItems } from "./feeds/rss.js";
import { selectBestCandidateForFeed } from "./ai/feedSelector.js";
import { summariseArticle } from "./ai/articleSummarizer.js";
import { fetchHtml, extractArticleText } from "./content/articleExtractor.js";
import { loadSeenSet, saveSeenSet } from "./state/seenStore.js";
import { logError } from "./utils/logging.js";

async function processSelectedItem(item, seenSet) {
  const { url, title } = item;

  if (seenSet.has(url)) {
    return null;
  }

  const html = await fetchHtml(url);
  const article = extractArticleText(html, url);
  const summaryResult = await summariseArticle(article);
  seenSet.add(url);

  return {
    title,
    summary: summaryResult.keyFacts,
    topic: summaryResult.topic,
    url: article.sourceUrl,
  };
}

async function processFeed(feedUrl, seenSet, interestProfile) {
  try {
    const items = await fetchFeedItems(feedUrl, CONFIG.feedItemLimit);
    if (!items.length) return null;

    const selection = await selectBestCandidateForFeed(
      feedUrl,
      items,
      interestProfile,
    );

    if (selection.selectedIndex === null) return null;

    const chosen = items[selection.selectedIndex];
    if (!chosen) return null;

    return await processSelectedItem(chosen, seenSet);
  } catch (error) {
    logError(`Error processing feed ${feedUrl}.`, error);
    return null;
  }
}

export async function generateSummaries(interestProfile) {
  const seenSet = loadSeenSet();

  const results = await Promise.all(
    CONFIG.feeds.map((feedUrl) => processFeed(feedUrl, seenSet, interestProfile)),
  );

  saveSeenSet(seenSet);
  return results.filter(Boolean);
}
