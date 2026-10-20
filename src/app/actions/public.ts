"use server";

import { sql } from "@/db";
import { redirect } from "next/navigation";

export async function contactAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!name || !email || !body) throw new Error("All fields required");
  await sql`
    INSERT INTO support_tickets (subject, body, status)
    VALUES (${`Public contact from ${name} <${email}>`}, ${body}, 'open')
  `;
  redirect("/contact?sent=1");
}
