import Link from "next/link";
import { readFile } from "fs/promises";
import path from "path";

export const metadata = {
  title: "Methodology — AI Governance Observatory",
};

function renderLine(line: string, key: number) {
  if (line.startsWith("# ")) {
    return null;
  }
  if (line.startsWith("## ")) {
    return (
      <h2 key={key} className="section-title" style={{ marginTop: key > 0 ? "1.75rem" : 0 }}>
        {line.replace(/^##\s+/, "")}
      </h2>
    );
  }
  if (line.startsWith("|")) {
    return (
      <code key={key} style={{ display: "block", fontSize: "0.82rem", marginBottom: "0.25rem" }}>
        {line}
      </code>
    );
  }
  if (line.startsWith("- ")) {
    return (
      <li key={key} style={{ marginLeft: "1.2rem", marginBottom: "0.35rem" }}>
        {line.replace(/^-\s+/, "")}
      </li>
    );
  }
  if (!line.trim()) return null;
  const bold = line.replace(/\*\*(.+?)\*\*/g, "$1");
  return (
    <p key={key} style={{ marginBottom: "0.65rem" }}>
      {bold}
    </p>
  );
}

export default async function MethodologyPage() {
  let body = "";
  try {
    body = await readFile(path.join(process.cwd(), "public", "methodology.md"), "utf-8");
  } catch {
    body = "Methodology content unavailable.";
  }

  const lines = body.split("\n");

  return (
    <>
      <section className="hero hero-compact">
        <p className="hero-eyebrow">Research notes</p>
        <h1>AGRI methodology</h1>
        <p className="hero-lead">
          How the Artificial Governance Readiness Index is built, what it measures, and what it does not claim.
        </p>
        <Link href="/" className="btn btn-secondary" style={{ marginTop: "1rem", display: "inline-block" }}>
          ← Back to overview
        </Link>
      </section>
      <article className="card methodology-prose">{lines.map((line, i) => renderLine(line, i))}</article>
    </>
  );
}
