"use server";

import { sql } from "@/db";
import { currentUser } from "@/lib/auth";

export type SnakeRank = {
  userId: string;
  name: string;
  best: number;
};

async function ensureTable() {
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS snake_scores (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      score integer NOT NULL CHECK (score >= 0 AND score <= 9999),
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS snake_scores_best_idx ON snake_scores (score DESC, created_at ASC)`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS snake_scores_user_idx ON snake_scores (user_id, score DESC)`);
}

async function ranks(): Promise<SnakeRank[]> {
  await ensureTable();
  const rows = await sql<
    { user_id: string; name: string; best: number }[]
  >`
    SELECT
      u.id AS user_id,
      COALESCE(NULLIF(p.display_name, ''), split_part(u.email, '@', 1)) AS name,
      MAX(s.score)::int AS best
    FROM snake_scores s
    JOIN users u ON u.id = s.user_id
    LEFT JOIN profiles p ON p.user_id = u.id
    GROUP BY u.id, p.display_name, u.email
    ORDER BY MAX(s.score) DESC, MIN(s.created_at) ASC
    LIMIT 12
  `;
  return rows.map((r) => ({
    userId: r.user_id,
    name: r.name,
    best: Number(r.best),
  }));
}

export async function getSnakeBoard() {
  const user = await currentUser();
  return {
    signedIn: Boolean(user),
    me: user?.id ?? null,
    ranks: await ranks(),
  };
}

export async function submitSnakeScore(score: number) {
  const n = Math.floor(Number(score));
  if (!Number.isFinite(n) || n < 1 || n > 9999) {
    return getSnakeBoard();
  }
  const user = await currentUser();
  if (!user) return getSnakeBoard();
  await ensureTable();
  await sql`
    INSERT INTO snake_scores (user_id, score)
    VALUES (${user.id}, ${n})
  `;
  return getSnakeBoard();
}
