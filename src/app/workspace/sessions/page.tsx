import { requireUser } from "@/app/actions/auth";
import { sql } from "@/db";
import { revokeSession } from "@/app/actions/account";
import { describeAgent, formatIp, formatWhen } from "@/lib/format";

export const metadata = { title: "Sessions" };

export default async function SessionsPage() {
  const user = await requireUser();
  const rows = await sql<{ id: string; user_agent: string | null; ip_address: string | null; last_seen_at: string; revoked_at: string | null }[]>`
    SELECT id, user_agent, ip_address, last_seen_at::text, revoked_at::text
    FROM sessions WHERE user_id = ${user.id} ORDER BY last_seen_at DESC
  `;
  const currentId = rows.find((row) => !row.revoked_at)?.id;
  return (
    <>
      <p className="kicker">Sessions</p>
      <h1>Device and session visibility</h1>
      <p className="lede">Revoke any session you do not recognise. Localhost addresses are this computer, not a public IP.</p>
      <div className="session-list">
        {rows.map((session) => {
          const agent = describeAgent(session.user_agent);
          const current = session.id === currentId && !session.revoked_at;
          return (
            <form action={revokeSession} key={session.id} className="panel session">
              <input type="hidden" name="id" value={session.id} />
              <span className="session-mark" aria-hidden>
                <svg viewBox="0 0 24 24">
                  {agent.mobile ? (
                    <path d="M8 3h8v18H8V3zm4 15h.01" />
                  ) : (
                    <path d="M4 5h16v11H4V5zm3 14h10M12 16v3" />
                  )}
                </svg>
              </span>
              <div className="session-copy">
                <h3>{agent.title}</h3>
                <p className="muted">{formatIp(session.ip_address)}</p>
                <div className="session-meta">
                  <span className={`tag ${session.revoked_at ? "danger" : "ok"}`}>
                    {session.revoked_at ? "Revoked" : current ? "This session" : "Active"}
                  </span>
                  <span>Last seen {formatWhen(session.last_seen_at)}</span>
                </div>
              </div>
              {!session.revoked_at ? (
                <button className="btn small danger" type="submit">
                  Revoke
                </button>
              ) : null}
            </form>
          );
        })}
      </div>
    </>
  );
}
