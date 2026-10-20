import { requireUser } from "@/app/actions/auth";
import { sql } from "@/db";
import { updateProfile } from "@/app/actions/account";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUser();
  const p = (await sql<{ first_name: string; last_name: string; bio: string | null; headline: string | null; city: string | null }[]>`
    SELECT first_name, last_name, bio, headline, city FROM profiles WHERE user_id = ${user.id}
  `)[0];
  return (
    <>
      <p className="kicker">Profile</p>
      <h1>Public-facing details</h1>
      <form action={updateProfile} className="panel">
        <div className="grid-2">
          <div className="field"><label>First name</label><input name="firstName" defaultValue={p?.first_name} required /></div>
          <div className="field"><label>Last name</label><input name="lastName" defaultValue={p?.last_name} required /></div>
        </div>
        <div className="field"><label>Headline</label><input name="headline" defaultValue={p?.headline ?? ""} /></div>
        <div className="field"><label>City</label><input name="city" defaultValue={p?.city ?? ""} /></div>
        <div className="field"><label>Bio</label><textarea name="bio" rows={5} defaultValue={p?.bio ?? ""} /></div>
        <button className="btn" type="submit">Save profile</button>
      </form>
    </>
  );
}
