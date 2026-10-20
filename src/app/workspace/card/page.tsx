import { requireUser } from "@/app/actions/auth";
import { BrandMark } from "@/components/BrandMark";
import { sql } from "@/db";

export const metadata = { title: "Digital member card" };

export default async function CardPage() {
  const user = await requireUser();
  const profile = (await sql<{ display_name: string; digital_card_number: string | null; state_code: string | null }[]>`
    SELECT display_name, digital_card_number, state_code FROM profiles WHERE user_id = ${user.id}
  `)[0];
  const active = user.membershipStatus === "active";
  return (
    <>
      <p className="kicker">Member card</p>
      <h1>Digital membership</h1>
      <div className="panel" style={{ maxWidth: 420, background: "#000", color: "#f3efe6" }}>
        <BrandMark size="lg" />
        <p className="kicker" style={{ marginTop: "0.8rem" }}>NDC Naija</p>
        <h2>{profile?.display_name}</h2>
        <p className="mono">{profile?.digital_card_number ?? "Unissued — pending committee approval"}</p>
        <p>{user.membershipClass} · {profile?.state_code ?? "—"}</p>
        <p>{active ? "ACTIVE" : (user.membershipStatus ?? "PENDING")}</p>
      </div>
    </>
  );
}
