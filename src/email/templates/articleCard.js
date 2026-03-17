import { escapeHtml } from "../../utils/text.js";
import { CARD_STYLES, gmailLocked } from "./styleTokens.js";

export function buildArticleCard({ title, summary, url }) {
  const safeTitle = escapeHtml(title);
  const safeUrl = escapeHtml(url);
  const summaryHtml = summary
    .map((point, index) => {
      const safePoint = escapeHtml(point);
      return `
      <tr>
        <td style="padding: 0 0 12px 0; vertical-align: top;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td width="32" style="vertical-align: top;">
                <div style="width: 24px; height: 24px; border-radius: 999px; background: #e8f1ff; color: #0b4fbd; text-align: center; line-height: 24px; font-size: 12px; font-weight: 700;">
                  ${index + 1}
                </div>
              </td>
              <td class="news-card-fact" style="${CARD_STYLES.factText}">
                ${safePoint}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
    })
    .join("");

  return `
  <table class="news-card-shell" role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="${CARD_STYLES.shell}">
    <tr>
      <td align="center">
        <table class="news-card" role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="${CARD_STYLES.card}">
          <tr>
            <td class="news-card-header" style="${CARD_STYLES.header}">
              <div class="news-card-kicker" style="${CARD_STYLES.kicker}">
                ${gmailLocked('<font color="#d8ecff">News Digest</font>', "lightblue")}
                <span style="font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif; margin-left: 4px;"> 🧠</span>
              </div>
              <div class="news-card-title" style="${CARD_STYLES.title}">
                ${gmailLocked(`<font color="#ffffff"><span style="color: #ffffff !important; -webkit-text-fill-color: #ffffff !important;">${safeTitle}</span></font>`)}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 18px 20px 8px 20px;">
              <div style="${CARD_STYLES.badge}">
                Key Takeaways
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 6px 20px 8px 20px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                ${summaryHtml}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 4px 20px 20px 20px;">
              <a href="${safeUrl}" style="${CARD_STYLES.cta}">
                Read Full Story
              </a>
            </td>
          </tr>
          <tr>
            <td class="news-card-source" style="${CARD_STYLES.sourceRow}">
              Source: <a href="${safeUrl}" style="${CARD_STYLES.sourceLink}">${safeUrl}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  `;
}
