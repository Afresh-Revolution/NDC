import { savePortfolio } from "@/app/actions/onboarding";

export const metadata = { title: "Portfolio" };

export default function PortfolioOnboardingPage() {
  return (
    <div className="narrow">
      <p className="kicker">Onboarding · portfolio</p>
      <h1>Proof of work — without repository write access</h1>
      <p>Members can submit evidence without linking GitHub or GitLab. We never request repository write access by default, and we do not import private source into public profiles.</p>
      <form action={savePortfolio} className="panel">
        <div className="field"><label htmlFor="title">Evidence title</label><input id="title" name="title" required /></div>
        <div className="field"><label htmlFor="url">Public URL (optional)</label><input id="url" name="url" type="url" /></div>
        <div className="field"><label htmlFor="kind">Kind</label>
          <select id="kind" name="kind">
            <option value="project">Project</option>
            <option value="repo">Public repository</option>
            <option value="writing">Writing</option>
            <option value="talk">Talk</option>
            <option value="alternate">Alternate work evidence</option>
          </select>
        </div>
        <div className="field"><label htmlFor="description">What should reviewers look at?</label><textarea id="description" name="description" rows={5} /></div>
        <div className="field"><label htmlFor="github">GitHub profile URL (optional)</label><input id="github" name="github" /></div>
        <div className="field"><label htmlFor="gitlab">GitLab profile URL (optional)</label><input id="gitlab" name="gitlab" /></div>
        <div className="field"><label htmlFor="website">Website</label><input id="website" name="website" /></div>
        <button className="btn" type="submit">Save evidence</button>
      </form>
    </div>
  );
}
