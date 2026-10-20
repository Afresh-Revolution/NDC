import { saveProjectSection } from "@/app/actions/projects";

export default async function ClosurePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <form action={saveProjectSection} className="panel">
      <input type="hidden" name="projectId" value={id} />
      <input type="hidden" name="section" value="advance" />
      <input type="hidden" name="stage" value="closed" />
      <p>Closeout records outcomes without erasing accounting history. Project losses stay in the project development / reserve pools — never against unrelated members’ withdrawable contributions.</p>
      <button className="btn" type="submit">Request closeout</button>
    </form>
  );
}
