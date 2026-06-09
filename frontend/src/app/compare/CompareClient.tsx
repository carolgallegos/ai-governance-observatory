"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AgriRadarChart } from "@/components/AgriRadarChart";
import { api, type CountryListItem } from "@/lib/api";

type Props = {
  countries: CountryListItem[];
  initialA: string;
  initialB: string;
};

export function CompareClient({ countries, initialA, initialB }: Props) {
  const router = useRouter();
  const [a, setA] = useState(initialA);
  const [b, setB] = useState(initialB);
  const [data, setData] = useState<Awaited<ReturnType<typeof api.compare>> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    api
      .compare(a, b)
      .then(setData)
      .catch(() => setError("Could not load comparison. Is the API running?"))
      .finally(() => setLoading(false));
  }, [a, b]);

  const runCompare = () => router.push(`/compare?a=${a}&b=${b}`);

  return (
    <>
      <div className="card" style={{ marginBottom: "1rem", display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "end" }}>
        <label>
          Country A
          <select value={a} onChange={(e) => setA(e.target.value)} style={{ display: "block", marginTop: 4, padding: 8 }}>
            {countries.map((c) => (
              <option key={c.iso_code} value={c.iso_code}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Country B
          <select value={b} onChange={(e) => setB(e.target.value)} style={{ display: "block", marginTop: 4, padding: 8 }}>
            {countries.map((c) => (
              <option key={c.iso_code} value={c.iso_code}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="btn" onClick={runCompare}>
          Compare
        </button>
      </div>

      {loading && <p style={{ color: "var(--muted)" }}>Loading…</p>}
      {error && <p style={{ color: "var(--warning)" }}>{error}</p>}

      {data && (
        <>
          <div className="grid-2" style={{ marginBottom: "1rem" }}>
            <div className="card">
              <h2>{data.country_a.name}</h2>
              {data.country_a.agri && <p className="score-pill">AGRI {data.country_a.agri.total_score}</p>}
              <p style={{ marginTop: 8, color: "var(--muted)" }}>{data.country_a.profile?.regulatory_approach}</p>
            </div>
            <div className="card">
              <h2>{data.country_b.name}</h2>
              {data.country_b.agri && <p className="score-pill">AGRI {data.country_b.agri.total_score}</p>}
              <p style={{ marginTop: 8, color: "var(--muted)" }}>{data.country_b.profile?.regulatory_approach}</p>
            </div>
          </div>

          {data.radar?.length > 0 && (
            <AgriRadarChart data={data.radar} nameA={data.country_a.name} nameB={data.country_b.name} />
          )}

          {data.policy_similarity && (
            <div className="card" style={{ marginBottom: "1rem" }}>
              <h3>Estimated policy overlap</h3>
              <p className="score-pill" style={{ marginTop: "0.5rem" }}>
                {data.policy_similarity.similarity_percent}% aligned
              </p>
              <ul style={{ marginTop: "0.75rem", paddingLeft: "1.25rem", color: "var(--muted)", fontSize: "0.92rem" }}>
                {data.policy_similarity.explanations.map((ex) => (
                  <li key={ex}>{ex}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="card">
            <table>
              <thead>
                <tr>
                  <th>Dimension</th>
                  <th>{data.country_a.name}</th>
                  <th>{data.country_b.name}</th>
                </tr>
              </thead>
              <tbody>
                {data.dimensions.map((d) => (
                  <tr key={d.key}>
                    <td>{d.label}</td>
                    <td>{d.country_a}</td>
                    <td>{d.country_b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
