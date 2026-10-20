import { Resend } from "resend";
import { env } from "@/lib/env";

export async function sendMail(to: string, subject: string, html: string) {
  if (!env.resendKey) {
    console.info(`[mail:dev] to=${to} subject=${subject}`);
    return { id: "dev-noop" };
  }
  const resend = new Resend(env.resendKey);
  const result = await resend.emails.send({
    from: env.emailFrom,
    to,
    subject,
    html,
  });
  return result;
}

export function transactionalHtml(title: string, body: string) {
  return `<!doctype html>
  <html><body style="font-family:IBM Plex Sans,Segoe UI,sans-serif;background:#f4f1ea;color:#14161c;padding:32px">
    <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #d9d2c5;padding:28px">
      <img src="${env.appUrl}/brand/ndc-logo.png" width="56" height="56" alt="NDC" style="display:block;margin-bottom:16px" />
      <p style="letter-spacing:.18em;text-transform:uppercase;font-size:11px;color:#148078">NDC Naija</p>
      <h1 style="font-size:22px">${title}</h1>
      <div style="font-size:15px;line-height:1.6">${body}</div>
      <p style="font-size:12px;color:#6b6458;margin-top:28px">Building together. Funding innovation. Owning the future.</p>
    </div>
  </body></html>`;
}
