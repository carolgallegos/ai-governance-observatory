"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";

type RadarPoint = { dimension: string; country_a: number; country_b: number };

export function AgriRadarChart({
  data,
  nameA,
  nameB,
}: {
  data: RadarPoint[];
  nameA: string;
  nameB: string;
}) {
  const chartData = data.map((d) => ({
    dimension: d.dimension,
    [nameA]: d.country_a,
    [nameB]: d.country_b,
  }));

  return (
    <div className="card agri-radar-card" style={{ marginBottom: "1rem" }}>
      <h3 style={{ marginBottom: "0.75rem" }}>AGRI dimensions (normalised %)</h3>
      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer width="100%" height={320}>
          <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="72%">
          <PolarGrid stroke="#c9bfb0" />
          <PolarAngleAxis dataKey="dimension" tick={{ fill: "#5c5348", fontSize: 11 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#5c5348", fontSize: 10 }} />
          <Radar name={nameA} dataKey={nameA} stroke="#059669" fill="#059669" fillOpacity={0.25} />
          <Radar name={nameB} dataKey={nameB} stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.2} />
          <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
