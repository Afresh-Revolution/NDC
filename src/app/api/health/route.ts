import { NextResponse } from "next/server";
import { sql } from "@/db";

export async function GET() {
  try {
    await sql`SELECT 1`;
    return NextResponse.json({ ok: true, db: "up" });
  } catch (err) {
    return NextResponse.json({ ok: false, db: "down", error: String(err) }, { status: 503 });
  }
}
