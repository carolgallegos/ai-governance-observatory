import Link from "next/link";
import { notFound } from "next/navigation";
import { PolicyTimeline } from "@/components/PolicyTimeline";
import { SimilarCountries } from "@/components/SimilarCountries";
import { api } from "@/lib/api";

export default async function CountryPage({ params }: { params: Promise<{ iso: string }> }) {
  const { iso } = await params;
  let country;
  try {
    country = await api.country(iso);
  } catch {
    notFound();
  }

  const p = country.profile;
  const agri = country.agri;

  return (
    <>
      <section className="hero">
        <p className="badge">{country.region}</p>
        <h1>{country.name}</h1>
        {agri && (
          <p className="score-pill">
            AGRI {agri.total_score}/100
            <span className="badge" style={{ marginLeft: 10, verticalAlign: "middle" }}>
              author index
            </span>
          </p>
        )}
      </section>

      <SimilarCountries iso={country.iso_code} countryName={country.name} />

      {country.timeline?.length > 0 && (
        <PolicyTimeline events={country.timeline} countryName={country.name} />
      )}

      {p && (
        <div className="grid-2" style={{ marginBottom: "1.5rem" }}>
          <div className="card">
            <h3>AI Strategy</h3>
            <p style={{ marginTop: "0.5rem" }}>{p.strategy_title}</p>
            {p.strategy_date && (
              <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Updated: {p.strategy_date}</p>
            )}
          </div>
          <div className="card">
            <h3>Regulation</h3>
            <p style={{ marginTop: "0.5rem" }}>{p.regulation_summary}</p>
          </div>
          <div className="card">
            <h3>Responsible bodies</h3>
            <p style={{ marginTop: "0.5rem" }}>{p.responsible_bodies}</p>
          </div>
          <div className="card">
            <h3>Priorities</h3>
            <ul style={{ marginTop: "0.5rem", paddingLeft: "1.25rem" }}>
              {p.priorities.map((pr) => (
                <li key={pr}>{pr}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {agri && (
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <h3>AGRI dimensions (0–5 raw, normalized in total)</h3>
          <table style={{ marginTop: "0.75rem" }}>
            <tbody>
              {(
                [
                  ["Regulation", agri.regulation],
                  ["Investment", agri.investment],
                  ["Education", agri.education],
                  ["Open data", agri.open_data],
                  ["Research", agri.research],
                ] as const
              ).map(([label, val]) => (
                <tr key={label}>
                  <td>{label}</td>
                  <td>{val}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ color: "var(--muted)", fontSize: "0.8rem", marginTop: "0.75rem" }}>{agri.methodology_note}</p>
        </div>
      )}

      {country.frameworks.length > 0 && (
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <h3>Key frameworks</h3>
          <ul style={{ marginTop: "0.75rem", paddingLeft: "1.25rem" }}>
            {country.frameworks.map((f) => (
              <li key={f.title}>
                <strong>{f.title}</strong> ({f.framework_type})
                {f.source_url && (
                  <>
                    {" "}
                    — <a href={f.source_url} target="_blank" rel="noreferrer">source</a>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link href={`/compare?a=${country.iso_code}&b=FR`} className="btn">
        Compare with France
      </Link>
    </>
  );
}
