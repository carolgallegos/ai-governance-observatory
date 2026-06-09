"use client";

import {
  Bar,
  BarChart,
  Cell,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type DocIntelligence = Record<string, number>;

const SCORE_META: Record<string, { key: string; color: string; desc: string }> = {
  "Governance Focus": {
    key: "governance",
    color: "#059669",
    desc: "Regulation, accountability, oversight",
  },
  "Innovation Focus": {
    key: "innovation",
    color: "#0369a1",
    desc: "R&D, sandboxes, industry adoption",
  },
  "Risk Focus": {
    key: "risk",
    color: "#b45309",
    desc: "Safety, bias, systemic harms",
  },
  "Research Focus": {
    key: "research",
    color: "#7c3aed",
    desc: "Academic output, labs, standards",
  },
};

function orderedScores(scores: DocIntelligence) {
  const order = Object.keys(SCORE_META);
  return order
    .filter((label) => typeof scores[label] === "number")
    .map((label) => ({
      label,
      short: label.replace(" Focus", ""),
      value: scores[label],
      ...SCORE_META[label],
    }));
}

export function DocumentIntelligencePanel({ scores }: { scores: DocIntelligence }) {
  const items = orderedScores(scores);
  if (!items.length) return null;

  const chartData = items.map((i) => ({ name: i.short, score: i.value, fill: i.color }));

  return (
    <section className="doc-intel-panel" aria-labelledby="doc-intel-heading">
      <div className="doc-intel-header">
        <h4 id="doc-intel-heading">Document intelligence</h4>
        <p>Focus scores derived from term distribution in the uploaded PDF (0–100).</p>
      </div>

      <div className="doc-intel-cards">
        {items.map((item) => (
          <div key={item.label} className="doc-intel-card">
            <div className="doc-intel-card-top">
              <span className="doc-intel-dot" style={{ background: item.color }} />
              <span className="doc-intel-card-label">{item.label}</span>
            </div>
            <p className="doc-intel-score" style={{ color: item.color }}>
              {item.value}
            </p>
            <p className="doc-intel-desc">{item.desc}</p>
            <div className="doc-intel-meter">
              <div className="doc-intel-meter-fill" style={{ width: `${item.value}%`, background: item.color }} />
            </div>
          </div>
        ))}
      </div>

      <div className="doc-intel-charts">
        <div className="doc-intel-chart-box">
          <p className="doc-intel-chart-title">Focus profile (radar)</p>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="72%">
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted)" }} />
              <Radar dataKey="score" stroke="#059669" fill="#059669" fillOpacity={0.28} />
              <Tooltip formatter={(v: number) => [`${v}`, "Score"]} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="doc-intel-chart-box">
          <p className="doc-intel-chart-title">Focus comparison (bar)</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--muted)" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="var(--muted)" />
              <Tooltip formatter={(v: number) => [`${v}`, "Score"]} />
              <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                {chartData.map((row) => (
                  <Cell key={row.name} fill={row.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
