import { escapeHtml } from "../../utils/text.js";
import { buildArticleCard } from "./articleCard.js";
import { DIGEST_STYLES, EMAIL_CSS, gmailLocked } from "./styleTokens.js";

function deriveDigestTopics(summaries, maxTopics = 6) {
  const counts = new Map();

  for (const item of summaries) {
    const topic = typeof item?.topic === "string" ? item.topic.trim() : "";
    if (!topic) continue;
    counts.set(topic, (counts.get(topic) || 0) + 1);
  }

  const ranked = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxTopics)
    .map(([topic]) => topic);

  return ranked.length ? ranked : ["General news"];
}

function buildTopicsPills(topicLabels) {
  return topicLabels
    .map(
      (topic) => `
        <span class="topic-pill" style="${DIGEST_STYLES.topicPill}">
          ${escapeHtml(topic)}
        </span>
      `,
    )
    .join("");
}

export function buildDigestEmail(summaries, options = {}) {
  const digestNumberRaw = Number(options?.digestNumber);
  const digestNumber = Number.isInteger(digestNumberRaw) && digestNumberRaw > 0
    ? digestNumberRaw
    : 1;
  const topicLabels = deriveDigestTopics(summaries);
  const topicPills = buildTopicsPills(topicLabels);
  const storyCount = summaries.length;
  const sourceCount = new Set(
    summaries
      .map((item) => {
        try {
          return new URL(item.url).hostname.replace(/^www\./, "");
        } catch {
          return null;
        }
      })
      .filter(Boolean),
  ).size;
  const dateLabel = new Intl.DateTimeFormat("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const cards = summaries
    .map((summary) => buildArticleCard(summary))
    .join('<div style="height: 8px; line-height: 8px;">&nbsp;</div>');

  return `
  <!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <meta name="color-scheme" content="light dark" />
    <meta name="supported-color-schemes" content="light dark" />
    <style>${EMAIL_CSS}</style>
  </head>
  <body class="body" style="margin: 0; padding: 0;">
  <div class="digest-bg" style="${DIGEST_STYLES.background}">
    <table class="digest-header-card" role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="${DIGEST_STYLES.headerCard}">
      <tr>
        <td style="${DIGEST_STYLES.hero}">
          <div style="${DIGEST_STYLES.heroKicker}">
            ${gmailLocked('<font color="#cde4ff">Daily Briefing</font>', "lightblue")}
          </div>
          <div style="${DIGEST_STYLES.heroTitle}">
            ${gmailLocked('<font color="#ffffff"><span style="color: #ffffff !important; -webkit-text-fill-color: #ffffff !important;">Today in 5 Minutes</span></font>')}
          </div>
          <div style="${DIGEST_STYLES.heroDate}">
            ${gmailLocked(`<font color="#d4eaff">${escapeHtml(dateLabel)}</font>`, "lightblue")}
          </div>
        </td>
      </tr>
      <tr>
        <td class="digest-metrics" style="${DIGEST_STYLES.metricsCell}">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td width="33.33%" style="padding: 0 10px 10px 0;">
                <div class="metric-label" style="${DIGEST_STYLES.metricLabel}">Stories</div>
                <div class="metric-value" style="${DIGEST_STYLES.metricValue}">${storyCount}</div>
              </td>
              <td width="33.33%" style="padding: 0 10px 10px 0;">
                <div class="metric-label" style="${DIGEST_STYLES.metricLabel}">Sources</div>
                <div class="metric-value" style="${DIGEST_STYLES.metricValue}">${sourceCount}</div>
              </td>
              <td width="33.33%" style="padding: 0 0 10px 0;">
                <div class="metric-label" style="${DIGEST_STYLES.metricLabel}">Digest</div>
                <div class="metric-value" style="${DIGEST_STYLES.metricValue}">#${digestNumber}</div>
              </td>
            </tr>
          </table>
          <div class="metric-label" style="${DIGEST_STYLES.metricLabel}; margin-top: 2px;">Top Topics</div>
          <div style="margin-top: 4px;">
            ${topicPills}
          </div>
        </td>
      </tr>
    </table>
    <div style="max-width: 680px; margin: 0 auto;">
      ${cards}
    </div>
  </div>
  </body>
  </html>
  `;
}
