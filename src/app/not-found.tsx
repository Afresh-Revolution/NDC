import Link from "next/link";

export default function NotFound() {
  return (
    <div className="narrow" style={{ padding: "6rem 0" }}>
      <p className="kicker">404</p>
      <h1>This page is not on the map.</h1>
      <Link href="/" className="btn">Return home</Link>
    </div>
  );
}
