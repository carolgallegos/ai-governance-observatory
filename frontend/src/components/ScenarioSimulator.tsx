"use client";

import { useState } from "react";
import { api } from "@/lib/api";

const DIMENSIONS = ["education", "regulation", "investment", "open_data", "research"];

export function ScenarioSimulator({ countries }: { countries: { iso_code: string; name: string }[] }) {
  const [iso, setIso] = useState("MX");
  const [dimension, setDimension] = useState("education");
  const [result, setResult] = useState<Awaited<ReturnType<typeof api.scenario>> | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    try {
      const r = await api.scenario(iso, dimension, 0.5);
      setResult(r);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ marginTop: "2rem" }}>
      <h3>What-if on one AGRI input</h3>
      <p style={{ color: "var(--muted)", fontSize: "0.88rem", marginTop: "0.35rem" }}>
        Adds +0.5 on the 0–5 scale for a single dimension and recomputes the weighted total. Toy model, not a forecast.
      </p>
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "1rem", alignItems: "end" }}>
        <label>
          Country
          <select value={iso} onChange={(e) => setIso(e.target.value)} style={{ display: "block", marginTop: 4, padding: 8 }}>
            {countries.map((c) => (
              <option key={c.iso_code} value={c.iso_code}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Dimension
          <select
            value={dimension}
            onChange={(e) => setDimension(e.target.value)}
            style={{ display: "block", marginTop: 4, padding: 8 }}
          >
            {DIMENSIONS.map((d) => (
              <option key={d} value={d}>
                {d.replace("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="btn" onClick={run} disabled={loading}>
          {loading ? "…" : "Simulate +0.5"}
        </button>
      </div>
      {result && (
        <div style={{ marginTop: "1rem", padding: "1rem", background: "var(--bg)", borderRadius: 8 }}>
          <p className="score-pill">
            AGRI {result.agri_before} → {result.agri_after} ({result.delta > 0 ? "+" : ""}
            {result.delta})
          </p>
          <p style={{ marginTop: "0.5rem" }}>
            Maturity: {result.maturity_before} → {result.maturity_after}
          </p>
          <p style={{ color: "var(--muted)", marginTop: "0.5rem", fontSize: "0.9rem" }}>{result.narrative}</p>
        </div>
      )}
    </div>
  );
}
