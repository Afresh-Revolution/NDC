"use server";

import { redirect } from "next/navigation";
import { sql } from "@/db";
import { requireUser } from "@/app/actions/auth";

export async function requestMentorship(formData: FormData) {
  const user = await requireUser();
  const email = String(formData.get("mentorEmail") ?? "").toLowerCase();
  const mentor = (await sql<{ id: string }[]>`SELECT id FROM users WHERE email = ${email}`)[0];
  if (!mentor) throw new Error("Mentor not found");
  await sql`
    INSERT INTO mentorships (mentor_id, mentee_id, focus, status)
    VALUES (${mentor.id}, ${user.id}, ${String(formData.get("focus") ?? "")}, 'requested')
  `;
  redirect("/workspace/learn/mentorship");
}

export async function applyProgramme(formData: FormData) {
  const user = await requireUser();
  await sql`
    INSERT INTO programme_applications (programme_id, user_id)
    VALUES (${String(formData.get("programmeId") ?? "")}, ${user.id})
    ON CONFLICT DO NOTHING
  `;
  redirect("/workspace/learn/programmes");
}

export async function registerEvent(formData: FormData) {
  const user = await requireUser();
  await sql`
    INSERT INTO event_registrations (event_id, user_id)
    VALUES (${String(formData.get("eventId") ?? "")}, ${user.id})
    ON CONFLICT DO NOTHING
  `;
  redirect("/workspace/learn/events");
}

export async function joinCommunity(formData: FormData) {
  const user = await requireUser();
  await sql`
    INSERT INTO community_members (community_id, user_id)
    VALUES (${String(formData.get("communityId") ?? "")}, ${user.id})
    ON CONFLICT DO NOTHING
  `;
  redirect("/workspace/learn/communities");
}

export async function sendFeedback(formData: FormData) {
  const user = await requireUser();
  await sql`
    INSERT INTO feedback (user_id, related_type, rating, body)
    VALUES (
      ${user.id},
      ${String(formData.get("related") ?? "platform")},
      ${Number(formData.get("rating") ?? 0) || null},
      ${String(formData.get("body") ?? "")}
    )
  `;
  redirect("/workspace/learn/feedback");
}
