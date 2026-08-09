import { founder, invoiceIssuer } from "@/lib/site-data";
import { PRACTICE_PHONE } from "@/lib/structured-data";

/**
 * Shared transactional email shell used by every outbound email (receipt,
 * assessment link, magic link, reminders). Before this existed, individual
 * emails were bare HTML fragments with no <html>/<head>, no physical address,
 * and no plain-text alternative — all things spam filters weigh, on top of
 * just looking unpolished/untrustworthy in a client that renders them raw.
 * Centralising it also means every email carries the same banner/footer
 * without each call site re-inventing it.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://physioonclick.co.uk";
const NAVY = "#043246";
const ACCENT = "#0EA5E9";
const ACCENT_DARK = "#0A77A8";
const PAPER = "#F7F4ED";

export function renderEmailLayout(input: {
  /** Short hidden preview text shown next to the subject line in inbox lists. */
  preheader: string;
  /** Body HTML — already-escaped content specific to this email. */
  bodyHtml: string;
}): string {
  const addressLine = invoiceIssuer.addressLines.filter(Boolean).join(", ");
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <title>PhysioOnClick</title>
  </head>
  <body style="margin:0; padding:0; background:${PAPER}; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">${input.preheader}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER}; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 1px 2px rgba(4,50,70,0.06), 0 8px 24px -12px rgba(4,50,70,0.14);">
            <tr>
              <td style="background:linear-gradient(135deg, ${ACCENT_DARK}, ${ACCENT}); padding:28px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width:40px; vertical-align:middle;">
                      <div style="width:36px; height:36px; border-radius:9px; background:rgba(255,255,255,0.18); color:#ffffff; font-weight:700; font-size:16px; line-height:36px; text-align:center; font-family:Georgia,serif;">P</div>
                    </td>
                    <td style="vertical-align:middle; padding-left:12px;">
                      <div style="color:#ffffff; font-weight:700; font-size:18px; letter-spacing:-0.01em;">PhysioOnClick</div>
                      <div style="color:rgba(255,255,255,0.85); font-size:12.5px; margin-top:2px;">Online Physiotherapy Across the UK</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:32px; color:${NAVY}; font-size:15px; line-height:1.6;">
                ${input.bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px; background:${PAPER}; border-top:1px solid #E4E8F1;">
                <p style="margin:0 0 6px; font-size:13px; font-weight:700; color:${NAVY};">${founder.name}</p>
                <p style="margin:0 0 12px; font-size:12.5px; color:#5B7184;">${founder.credentials.join(" &middot; ")}</p>
                <p style="margin:0; font-size:12px; color:#7C8FA0; line-height:1.6;">
                  ${invoiceIssuer.tradingName}, ${addressLine}<br />
                  ${PRACTICE_PHONE} &middot; <a href="mailto:${invoiceIssuer.contactEmail}" style="color:#7C8FA0;">${invoiceIssuer.contactEmail}</a>
                </p>
                <p style="margin:12px 0 0; font-size:11.5px; color:#9AA9B6;">
                  You're receiving this because you have an appointment or account with ${invoiceIssuer.tradingName}.
                  <a href="${SITE_URL}/privacy-policy" style="color:#9AA9B6;">Privacy policy</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** Strips the shared layout down to a readable plain-text alternative — every
 * Resend send should carry both `html` and `text` bodies; HTML-only mail is
 * itself a spam-scoring signal, and it's the accessible fallback besides. */
export function toPlainText(bodyText: string): string {
  const addressLine = invoiceIssuer.addressLines.filter(Boolean).join(", ");
  return [
    bodyText.trim(),
    "",
    "—",
    `${founder.name}, ${founder.credentials.join(", ")}`,
    `${invoiceIssuer.tradingName}, ${addressLine}`,
    `${PRACTICE_PHONE} · ${invoiceIssuer.contactEmail}`,
  ].join("\n");
}
