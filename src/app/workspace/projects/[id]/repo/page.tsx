import { saveProjectSection } from "@/app/actions/projects";
import { sql } from "@/db";

export default async function RepoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const repos = await sql<{ url: string; provider: string; visibility: string }[]>`
    SELECT url, provider, visibility FROM repos WHERE project_id = ${id}
  `;
  return (
    <>
      <form action={saveProjectSection} className="panel">
        <input type="hidden" name="projectId" value={id} />
        <input type="hidden" name="section" value="repo" />
        <p>Register a metadata URL only. Private secrets and source are not imported. Reviewers of unrelated projects cannot see confidential source.</p>
        <div className="field"><label>Provider</label>
          <select name="provider"><option>github</option><option>gitlab</option><option>other</option></select>
        </div>
        <div className="field"><label>URL</label><input name="url" required /></div>
        <div className="field"><label>Visibility</label>
          <select name="visibility"><option>private</option><option>public</option></select>
        </div>
        <button className="btn" type="submit">Register repo metadata</button>
      </form>
      <ul>{repos.map((r) => <li key={r.url}>{r.provider} · {r.visibility} · {r.url}</li>)}</ul>
    </>
  );
}
