import { sql } from "@/db";
import { SCORE_THRESHOLD, SCORE_WEIGHTS } from "@/lib/funding";

export default async function ScoringPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scores = await sql<{ dimension: string; score: string; weight_pct: string }[]>`
    SELECT dimension, score::text, weight_pct::text FROM project_scores WHERE project_id = ${id}
  `;
  return (
    <div className="panel">
      <p>Weights require a member-approved policy. Suggested threshold {SCORE_THRESHOLD}/100 to reach committee discussion.</p>
      <ul>
        {SCORE_WEIGHTS.map((w) => (
          <li key={w.dimension}>{w.label} — {w.weight}%</li>
        ))}
      </ul>
      <div className="table-wrap">
        <table className="data">
          <thead><tr><th>Dimension</th><th>Weight</th><th>Score</th></tr></thead>
          <tbody>
            {scores.map((s, i) => <tr key={i}><td>{s.dimension}</td><td>{s.weight_pct}%</td><td>{s.score}</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
