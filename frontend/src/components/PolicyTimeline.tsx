"use client";

export type TimelineEvent = {
  year: number;
  title: string;
  description: string;
  event_type: string;
};

const TYPE_COLORS: Record<string, string> = {
  strategy: "#3b82f6",
  regulation: "#f59e0b",
  guideline: "#8b5cf6",
  investment: "#22c55e",
  research: "#ec4899",
};

export function PolicyTimeline({ events, countryName }: { events: TimelineEvent[]; countryName: string }) {
  if (!events.length) return null;

  return (
    <div className="card" style={{ marginBottom: "1.5rem" }}>
      <h3>AI Governance Timeline — {countryName}</h3>
      <div style={{ marginTop: "1.25rem", position: "relative", paddingLeft: "1.5rem" }}>
        <div
          style={{
            position: "absolute",
            left: "6px",
            top: 0,
            bottom: 0,
            width: "2px",
            background: "var(--border)",
          }}
        />
        {events.map((ev) => (
          <div key={`${ev.year}-${ev.title}`} style={{ position: "relative", marginBottom: "1.25rem", paddingLeft: "1rem" }}>
            <div
              style={{
                position: "absolute",
                left: "-1.35rem",
                top: "0.35rem",
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: TYPE_COLORS[ev.event_type] || "var(--accent)",
                border: "2px solid var(--bg)",
              }}
            />
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", flexWrap: "wrap" }}>
              <span className="badge">{ev.year}</span>
              <span className="badge" style={{ color: TYPE_COLORS[ev.event_type] }}>
                {ev.event_type}
              </span>
            </div>
            <p style={{ fontWeight: 600, marginTop: "0.35rem" }}>{ev.title}</p>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginTop: "0.25rem" }}>{ev.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
