import { HomeDashboard } from "@/components/HomeDashboard";
import { api } from "@/lib/api";

const FEATURES = [
  {
    title: "Compare two jurisdictions",
    desc: "Radar chart and short notes on where policies overlap or diverge.",
  },
  {
    title: "Ask over your documents",
    desc: "Upload a PDF; answers point to source text when retrieval finds a match.",
  },
  {
    title: "AGRI readiness index",
    desc: "A weighted score across regulation, investment, education, open data, and research.",
  },
] as const;

export default async function HomePage() {
  let countries: Awaited<ReturnType<typeof api.countries>> = [];
  let ranking: Awaited<ReturnType<typeof api.ranking>> = [];
  let trends: Awaited<ReturnType<typeof api.trends>> | null = null;
  let apiError = false;

  try {
    [countries, ranking, trends] = await Promise.all([api.countries(), api.ranking(), api.trends()]);
  } catch {
    apiError = true;
  }

  return (
    <>
      <section className="hero">
        <div className="hero-grid">
          <div className="hero-main">
            <p className="hero-eyebrow">AI Governance Observatory</p>
            <h1>Compare how countries govern artificial intelligence</h1>
            <p className="hero-lead">
              Profiles, timelines, and a compare view over a small set of national AI strategies — plus a desk
              where you can question uploaded policy PDFs.
            </p>
          </div>
          <div className="hero-features">
            {FEATURES.map((f) => (
              <div key={f.title} className="feature-card">
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="hero-note">
          Built by Carol V. Gallegos. AGRI is an author index, not an official UN/EU metric. Seed data from public
          sources — see methodology.
        </p>
      </section>

      <HomeDashboard countries={countries} ranking={ranking} trends={trends} apiError={apiError} />
    </>
  );
}
