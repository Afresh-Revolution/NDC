export function PageHero({
  kicker,
  title,
  lede,
}: {
  kicker: string;
  title: string;
  lede: string;
}) {
  return (
    <section style={{ padding: "3.5rem 0 1.5rem" }}>
      <div className="container">
        <p className="kicker">{kicker}</p>
        <h1 style={{ fontSize: "clamp(2rem, 4vw, 3.4rem)", maxWidth: "18ch" }}>{title}</h1>
        <p className="lede">{lede}</p>
      </div>
    </section>
  );
}
