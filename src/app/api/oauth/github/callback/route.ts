import { NextRequest, NextResponse } from "next/server";
import { currentUser, mfaPending } from "@/lib/auth";
import { sql } from "@/db";
import { encrypt } from "@/lib/crypto";
import { env } from "@/lib/env";

export async function GET(req: NextRequest) {
  const user = await currentUser();
  if (!user || mfaPending(user)) return NextResponse.redirect(new URL("/login/mfa", env.appUrl));
  const code = req.nextUrl.searchParams.get("code");
  if (!code || !env.githubId || !env.githubSecret) {
    return NextResponse.redirect(new URL("/workspace/settings?oauth=skipped", env.appUrl));
  }
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: env.githubId,
      client_secret: env.githubSecret,
      code,
    }),
  });
  const tokenJson = (await tokenRes.json()) as { access_token?: string };
  const profileRes = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${tokenJson.access_token ?? ""}`, "User-Agent": "ndc-naija" },
  });
  const profile = (await profileRes.json()) as { login?: string; html_url?: string };
  await sql`
    INSERT INTO oauth_connections (user_id, provider, provider_user, access_token_enc)
    VALUES (${user.id}, 'github', ${profile.login ?? null}, ${tokenJson.access_token ? encrypt(tokenJson.access_token) : null})
    ON CONFLICT (user_id, provider) DO UPDATE SET provider_user = excluded.provider_user
  `;
  if (profile.html_url) {
    await sql`UPDATE developer_profiles SET github_url = ${profile.html_url}, github_login = ${profile.login ?? null} WHERE user_id = ${user.id}`;
  }
  return NextResponse.redirect(new URL("/workspace/settings?oauth=github", env.appUrl));
}
