export const CARD_STYLES = {
  shell:
    "background: linear-gradient(180deg, #f4f8ff 0%, #eef9f3 100%); margin: 0 0 18px 0; border-radius: 18px;",
  card:
    "max-width: 640px; background: #ffffff; border: 1px solid #d9e3f1; border-radius: 16px; overflow: hidden;",
  header:
    "padding: 14px 20px; background: linear-gradient(135deg, #0b4fbd 0%, #0a7aa6 100%); color: #ffffff !important; -webkit-text-fill-color: #ffffff !important;",
  kicker:
    "font-size: 11px; line-height: 1; color: #d8ecff !important; -webkit-text-fill-color: #d8ecff !important; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; display: flex; flex-direction: row; align-items: center; gap: 6px;",
  title:
    "font-size: 24px; line-height: 1.3; color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; font-weight: 800; margin-top: 8px;",
  badge:
    "display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; color: #0b4fbd; background: #eaf2ff; border: 1px solid #d3e2ff; border-radius: 999px; padding: 6px 10px;",
  factText: "font-size: 15px; line-height: 1.6; color: #243041; padding-top: 1px;",
  cta:
    "display: inline-block; background: #0b4fbd; color: #ffffff; text-decoration: none; border-radius: 10px; font-size: 14px; font-weight: 700; padding: 11px 16px;",
  sourceRow:
    "padding: 12px 20px; background: #f7faff; border-top: 1px solid #e4ebf6; font-size: 12px; line-height: 1.5; color: #5b6776;",
  sourceLink: "color: #0b4fbd; text-decoration: underline;",
};

export const DIGEST_STYLES = {
  background: "margin: 0; padding: 24px 12px; background: #f1f5fb;",
  headerCard:
    "max-width: 680px; margin: 0 auto 14px auto; background: #ffffff; border: 1px solid #dce6f5; border-radius: 16px; overflow: hidden;",
  hero:
    "padding: 20px; background: linear-gradient(135deg, #0a4ea8 0%, #0d789c 100%); color: #ffffff !important; -webkit-text-fill-color: #ffffff !important;",
  heroKicker:
    "font-size: 12px; letter-spacing: 1px; text-transform: uppercase; color: #cde4ff !important; -webkit-text-fill-color: #cde4ff !important; font-weight: 700;",
  heroTitle:
    "font-size: 28px; line-height: 1.2; color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; font-weight: 800; margin-top: 8px;",
  heroDate:
    "font-size: 14px; line-height: 1.4; color: #d4eaff !important; -webkit-text-fill-color: #d4eaff !important; margin-top: 8px;",
  metricsCell: "padding: 16px 20px 18px 20px;",
  metricLabel:
    "font-size: 11px; color: #6b7b8d; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 700;",
  metricValue:
    "font-size: 22px; color: #14263d; font-weight: 800; margin-top: 2px;",
  topicPill:
    "display: inline-block; margin: 4px 6px 0 0; font-size: 12px; font-weight: 700; color: #194381; background: #e8f1ff; border: 1px solid #cadffd; border-radius: 999px; padding: 6px 10px;",
};

export const EMAIL_CSS = `
  .gmail-screen { background: transparent; }
  .gmail-difference { background: transparent; }
  .gmail-difference-lightblue { background: transparent; }
  u + .body .gmail-screen { background: #000; mix-blend-mode: screen; }
  u + .body .gmail-difference { background: #000; mix-blend-mode: difference; color: #fff; }
  u + .body .gmail-difference-lightblue { background: #000; mix-blend-mode: difference; color: #d4eaff; }
  @media (prefers-color-scheme: dark) {
    .digest-bg { background: #0f1724 !important; }
    .digest-header-card { background: #172132 !important; border-color: #2a3a52 !important; }
    .digest-metrics { background: #172132 !important; color: #e2e8f0 !important; }
    .metric-label { color: #9eb0c9 !important; }
    .metric-value { color: #f8fafc !important; }
    .topic-pill { background: #21324b !important; border-color: #35527a !important; color: #dbeafe !important; }
    .news-card-shell { background: #111a29 !important; }
    .news-card { background: #172132 !important; border-color: #2a3a52 !important; }
    .news-card-fact { color: #e2e8f0 !important; }
    .news-card-source { background: #1b2a40 !important; border-top-color: #2a3a52 !important; color: #9eb0c9 !important; }
    .news-card-source a { color: #93c5fd !important; }
  }
  [data-ogsc] .digest-bg { background: #0f1724 !important; }
  [data-ogsc] .digest-header-card { background: #172132 !important; border-color: #2a3a52 !important; }
  [data-ogsc] .digest-metrics { background: #172132 !important; color: #e2e8f0 !important; }
  [data-ogsc] .metric-label { color: #9eb0c9 !important; }
  [data-ogsc] .metric-value { color: #f8fafc !important; }
  [data-ogsc] .topic-pill { background: #21324b !important; border-color: #35527a !important; color: #dbeafe !important; }
  [data-ogsc] .news-card-shell { background: #111a29 !important; }
  [data-ogsc] .news-card { background: #172132 !important; border-color: #2a3a52 !important; }
  [data-ogsc] .news-card-fact { color: #e2e8f0 !important; }
  [data-ogsc] .news-card-source { background: #1b2a40 !important; border-top-color: #2a3a52 !important; color: #9eb0c9 !important; }
  [data-ogsc] .news-card-source a { color: #93c5fd !important; }
`;

export function gmailLocked(content, tone = "white") {
  const className = tone === "lightblue" ? "gmail-difference-lightblue" : "gmail-difference";
  return `<div class="gmail-screen"><div class="${className}">${content}</div></div>`;
}
