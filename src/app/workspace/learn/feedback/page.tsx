import { sendFeedback } from "@/app/actions/community";

export const metadata = { title: "Feedback" };

export default function FeedbackPage() {
  return (
    <>
      <p className="kicker">Learning</p>
      <h1>Programme feedback</h1>
      <form action={sendFeedback} className="panel">
        <div className="field"><label>About</label>
          <select name="related">
            <option value="platform">Platform</option>
            <option value="programme">Programme</option>
            <option value="studio">Studio</option>
            <option value="mentorship">Mentorship</option>
          </select>
        </div>
        <div className="field"><label>Rating 1–5</label><input name="rating" type="number" min={1} max={5} /></div>
        <div className="field"><label>Comments</label><textarea name="body" rows={5} required /></div>
        <button className="btn" type="submit">Send</button>
      </form>
    </>
  );
}
