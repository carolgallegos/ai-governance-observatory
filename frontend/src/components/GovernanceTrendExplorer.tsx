"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import type { GovernanceTrends } from "@/lib/api";

function TrendBars({ title, data }: { title: string; data: { label: string; count: number }[] }) {
  if (!data.length) return null;
  return (
    <div style={{ flex: "1 1 280px", minWidth: 260, height: 200 }}>
      <h4 style={{ marginBottom: "0.5rem", fontSize: "0.95rem" }}>{title}</h4>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 8 }}>
          <XAxis type="number" tick={{ fill: "#8fa3bf", fontSize: 10 }} />
          <YAxis type="category" dataKey="label" width={110} tick={{ fill: "#8fa3bf", fontSize: 10 }} />
          <Tooltip
            contentStyle={{ background: "#fffdf8", border: "1px solid #c9bfb0", fontSize: 12 }}
          />
          <Bar dataKey="count" fill="#059669" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const TIER_COLORS: Record<string, string> = {
  leading: "#22c55e",
  advanced: "#3b82f6",
  developing: "#f59e0b",
  emerging: "#ef4444",
};

export function GovernanceTrendExplorer({ trends }: { trends: GovernanceTrends }) {
  return (
    <section style={{ marginTop: "2.5rem" }}>
      <h2 className="section-title">What repeats across the sample?</h2>
      <p className="section-desc">
        Keyword counts from the eight jurisdiction profiles I loaded — not a global census.
      </p>

      <div className="card" style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", marginBottom: "1rem" }}>
        <TrendBars title="Most common priorities" data={trends.top_priorities} />
        <TrendBars title="Most common risks" data={trends.top_risks} />
        <TrendBars title="Governance models" data={trends.governance_models} />
      </div>

      <div className="card">
        <h4 style={{ marginBottom: "0.75rem" }}>AGRI maturity distribution</h4>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
          {["Emerging", "Developing", "Advanced", "Leading"].map((label) => (
            <span key={label} className="badge">
              {label}
            </span>
          ))}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {trends.maturity_distribution.map((m) => (
            <div
              key={m.iso_code}
              style={{
                padding: "0.4rem 0.65rem",
                borderRadius: 8,
                border: `1px solid ${TIER_COLORS[m.tier] || "#334155"}`,
                background: `${TIER_COLORS[m.tier]}22`,
                fontSize: "0.8rem",
              }}
            >
              <strong>{m.iso_code}</strong> {m.tier_label} ({m.score})
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
