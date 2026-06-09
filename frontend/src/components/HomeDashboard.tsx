"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { GovernanceTrendExplorer } from "@/components/GovernanceTrendExplorer";
import { ScenarioSimulator } from "@/components/ScenarioSimulator";
import type { CountryListItem, GovernanceTrends, RankingItem } from "@/lib/api";

const WorldMap = dynamic(() => import("@/components/WorldMap").then((m) => m.WorldMap), {
  ssr: false,
  loading: () => (
    <div className="card" style={{ minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "var(--muted)" }}>Loading map…</p>
    </div>
  ),
});

type Props = {
  countries: CountryListItem[];
  ranking: RankingItem[];
  trends: GovernanceTrends | null;
  apiError: boolean;
};

export function HomeDashboard({ countries, ranking, trends, apiError }: Props) {
  return (
    <>
      {apiError && (
        <div className="card" style={{ borderColor: "var(--warning)", marginBottom: "1rem" }}>
          <p>
            Backend unreachable — run <code>docker compose up</code> from the project folder, then reload.
          </p>
        </div>
      )}

      <WorldMap countries={countries} />

      <section style={{ marginTop: "2.5rem" }}>
        <h2 className="section-title">AGRI ranking</h2>
        <p className="section-desc">
          Ordered by my composite score (regulation, investment, education, open data, research). Raw dimension
          values are on each country page.
        </p>
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Jurisdiction</th>
                <th>Region</th>
                <th>Score</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((r, i) => (
                <tr key={r.iso_code}>
                  <td>{i + 1}</td>
                  <td>{r.name}</td>
                  <td>{r.region}</td>
                  <td>
                    <span className="score-pill">{r.total_score}</span>
                    {countries.find((c) => c.iso_code === r.iso_code)?.maturity_label && (
                      <span className="badge" style={{ marginLeft: 8 }}>
                        {countries.find((c) => c.iso_code === r.iso_code)?.maturity_label}
                      </span>
                    )}
                  </td>
                  <td>
                    <Link href={`/countries/${r.iso_code}`}>Open profile</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {trends && <GovernanceTrendExplorer trends={trends} />}

      <ScenarioSimulator countries={countries.map((c) => ({ iso_code: c.iso_code, name: c.name }))} />

      <section style={{ marginTop: "2.5rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <Link href="/compare?a=MX&b=FR" className="btn">
          Mexico ↔ France
        </Link>
        <Link href="/chat" className="btn btn-secondary">
          Analyst desk
        </Link>
      </section>
    </>
  );
}
