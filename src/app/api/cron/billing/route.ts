import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { runMembershipBilling } from "@/lib/membership";

async function run(req: NextRequest) {
  const header = req.headers.get("authorization") ?? "";
  const secret = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!secret || secret !== env.cronSecret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const result = await runMembershipBilling();
  return NextResponse.json({ ok: true, ...result });
}

export const GET = run;
export const POST = run;
