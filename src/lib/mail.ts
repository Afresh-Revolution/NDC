import { Resend } from "resend";
import { env } from "@/lib/env";

function plainText(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function sendMail(to: string, subject: string, html: string) {
  if (!env.resendKey) {
    console.info(`[mail:dev] to=${to} subject=${subject}`);
    return { id: "dev-noop" };
  }
  const resend = new Resend(env.resendKey);
  const result = await Promise.race([
    resend.emails.send({
      from: env.emailFrom,
      to,
      subject,
      html,
      text: plainText(html),
    }),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("The email service did not respond.")), 12000);
    }),
  ]);
  if (result.error) {
    console.error(`[mail] ${result.error.name}: ${result.error.message}`);
    throw new Error(result.error.message || "The approval email could not be sent.");
  }
  return result;
}

export function transactionalHtml(title: string, body: string) {
  const publicSite = env.appUrl.startsWith("https://");
  const logo = publicSite
    ? `<img src="${env.appUrl}/brand/ndc-logo.png" width="56" height="56" alt="NDC" style="display:block;margin-bottom:16px" />`
    : "";
  return `<!doctype html>
  <html><body style="font-family:IBM Plex Sans,Segoe UI,sans-serif;background:#f4f1ea;color:#14161c;padding:32px">
    <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #d9d2c5;padding:28px">
      ${logo}
      <p style="letter-spacing:.18em;text-transform:uppercase;font-size:11px;color:#148078">NDC Naija</p>
      <h1 style="font-size:22px">${title}</h1>
      <div style="font-size:15px;line-height:1.6">${body}</div>
      <p style="font-size:12px;color:#6b6458;margin-top:28px">Building together. Funding innovation. Owning the future.</p>
    </div>
  </body></html>`;
}
