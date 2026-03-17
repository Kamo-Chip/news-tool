import { resend } from "../clients.js";
import { CONFIG } from "../config.js";
import { logError } from "../utils/logging.js";

export async function sendDigestEmail(html) {
  const { error } = await resend.emails.send({
    from: CONFIG.email.from,
    to: CONFIG.email.to,
    subject: CONFIG.email.subject,
    html,
  });

  if (error) {
    logError("Email send failed.", error);
    return false;
  }

  return true;
}
