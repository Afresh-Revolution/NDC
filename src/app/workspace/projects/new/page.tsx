import { createProject } from "@/app/actions/projects";

export const metadata = { title: "Create project" };

export default function NewProjectPage() {
  return (
    <>
      <p className="kicker">Stage 0 / Submission</p>
      <h1>Problem, users, originality, IP</h1>
      <form action={createProject} className="panel">
        <div className="field"><label>Product title</label><input name="title" required /></div>
        <div className="field"><label>Problem statement</label><textarea name="problem" rows={4} required /></div>
        <div className="field"><label>Target users</label><textarea name="targetUsers" rows={3} required /></div>
        <div className="field"><label>Market hypothesis</label><textarea name="market" rows={3} /></div>
        <div className="field"><label>Originality declaration</label><textarea name="originality" rows={3} required /></div>
        <div className="field">
          <label>Project type</label>
          <select name="projectType">
            <option value="prototype_mvp">Prototype / MVP — scoped microgrant</option>
            <option value="existing_revenue">Existing revenue — repayable only if legally permitted</option>
            <option value="open_source">Open-source infrastructure</option>
            <option value="community_benefit">Community-benefit — restricted donor funds</option>
            <option value="scalable_startup">Scalable startup — investor-readiness, not an unregistered portal</option>
          </select>
        </div>
        <button className="btn" type="submit">Open project file</button>
      </form>
    </>
  );
}
