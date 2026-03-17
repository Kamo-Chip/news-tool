import { JSDOM } from "jsdom";

const entityDecoderDoc = new JSDOM("").window.document;
const entityDecoderEl = entityDecoderDoc.createElement("textarea");

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
    .replaceAll("’", "&rsquo;");
}

export function decodeHtmlEntities(value) {
  const text = String(value ?? "");
  entityDecoderEl.innerHTML = text;
  return entityDecoderEl.value;
}
