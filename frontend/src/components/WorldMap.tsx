"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import type { CountryListItem } from "@/lib/api";

const MAP_WIDTH = 950;
const MAP_HEIGHT = 620;

/** Calibrated for public/maps/world-light.svg (950×620) */
const MAP_BOUNDS = {
  lonMin: -168,
  lonMax: 192,
  latMax: 78,
  latMin: -58,
  padX: 18,
  padY: 12,
};

/** Capital coordinates for marker placement on the flat map */
const MARKER_COORDS: Record<string, [number, number]> = {
  MX: [-99.1332, 19.4326],
  US: [-77.0369, 38.9072],
  CA: [-75.6972, 45.4215],
  BR: [-47.8825, -15.7942],
  FR: [2.3522, 48.8566],
  DE: [13.405, 52.52],
  GB: [-0.1278, 51.5074],
  EU: [4.3517, 50.8503],
};

function project(lon: number, lat: number): [number, number] {
  const innerW = MAP_WIDTH - MAP_BOUNDS.padX * 2;
  const innerH = MAP_HEIGHT - MAP_BOUNDS.padY * 2;
  const x = MAP_BOUNDS.padX + ((lon - MAP_BOUNDS.lonMin) / (MAP_BOUNDS.lonMax - MAP_BOUNDS.lonMin)) * innerW;
  const y = MAP_BOUNDS.padY + ((MAP_BOUNDS.latMax - lat) / (MAP_BOUNDS.latMax - MAP_BOUNDS.latMin)) * innerH;
  return [x, y];
}

function markerLonLat(country: CountryListItem): [number, number] {
  const cap = MARKER_COORDS[country.iso_code];
  return cap ?? [country.longitude, country.latitude];
}

const TIER_COLORS: Record<string, string> = {
  leading: "#059669",
  advanced: "#0d9488",
  developing: "#d97706",
  emerging: "#dc2626",
  unknown: "#64748b",
};

const LEGEND = [
  { tier: "leading", label: "Leading", range: "AGRI 85+" },
  { tier: "advanced", label: "Advanced", range: "75–84" },
  { tier: "developing", label: "Developing", range: "65–74" },
  { tier: "emerging", label: "Emerging", range: "<65" },
] as const;

type TierKey = (typeof LEGEND)[number]["tier"] | "all";

type Props = {
  countries: CountryListItem[];
};

export function WorldMap({ countries }: Props) {
  const router = useRouter();
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [activeTier, setActiveTier] = useState<TierKey>("all");
  const [showHeat, setShowHeat] = useState(true);
  const dragRef = useRef<{ active: boolean; startX: number; startY: number; ox: number; oy: number } | null>(
    null,
  );

  const tierCounts = useMemo(() => {
    const counts: Record<string, number> = { leading: 0, advanced: 0, developing: 0, emerging: 0 };
    for (const c of countries) {
      const t = c.maturity_tier || "emerging";
      if (t in counts) counts[t] += 1;
    }
    return counts;
  }, [countries]);

  const visible = useMemo(
    () =>
      countries.filter((c) => activeTier === "all" || (c.maturity_tier || "unknown") === activeTier),
    [countries, activeTier],
  );

  const clampScale = (s: number) => Math.min(4, Math.max(1, s));

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setScale((s) => clampScale(s * (e.deltaY > 0 ? 0.92 : 1.08)));
  }, []);

  const isMarkerTarget = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return false;
    return Boolean(target.closest(".country-marker"));
  };

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      if (isMarkerTarget(e.target)) return;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      dragRef.current = {
        active: true,
        startX: e.clientX,
        startY: e.clientY,
        ox: offset.x,
        oy: offset.y,
      };
    },
    [offset],
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d?.active) return;
    setOffset({
      x: d.ox + (e.clientX - d.startX),
      y: d.oy + (e.clientY - d.startY),
    });
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (dragRef.current) dragRef.current.active = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }, []);

  const resetView = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  return (
    <div className="card map-card">
      <div className="map-toolbar">
        <div>
          <h2 className="section-title">Governance maturity heatmap</h2>
          <p className="section-desc" style={{ marginBottom: 0 }}>
            AGRI tiers as regional heat layers · click a marker for the country profile
          </p>
        </div>
        <div className="map-controls">
          <button
            type="button"
            className={`btn btn-secondary ${showHeat ? "map-toggle-active" : ""}`}
            onClick={() => setShowHeat((v) => !v)}
          >
            Heat {showHeat ? "on" : "off"}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setScale((s) => clampScale(s * 1.2))}>
            +
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setScale((s) => clampScale(s / 1.2))}>
            −
          </button>
          <button type="button" className="btn btn-secondary" onClick={resetView}>
            Reset
          </button>
        </div>
      </div>

      <div className="map-tier-toolbar">
        <button
          type="button"
          className={`badge map-tier-filter ${activeTier === "all" ? "map-tier-active" : ""}`}
          onClick={() => setActiveTier("all")}
        >
          All ({countries.length})
        </button>
        {LEGEND.map((item) => (
          <button
            key={item.tier}
            type="button"
            className={`badge map-tier-filter ${activeTier === item.tier ? "map-tier-active" : ""}`}
            style={{ borderColor: TIER_COLORS[item.tier], color: TIER_COLORS[item.tier] }}
            onClick={() => setActiveTier(item.tier)}
          >
            {item.label} {item.range} ({tierCounts[item.tier] ?? 0})
          </button>
        ))}
      </div>

      <div
        className="governance-map-viewport"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <div
          className="governance-map-stage"
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
        >
          <svg
            viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
            width={MAP_WIDTH}
            height={MAP_HEIGHT}
            className="governance-map-svg"
            role="img"
            aria-label="World map with AI governance maturity heatmap"
          >
            <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="#e8f4fc" style={{ pointerEvents: "none" }} />
            <image
              href="/maps/world-light.svg"
              width={MAP_WIDTH}
              height={MAP_HEIGHT}
              preserveAspectRatio="xMidYMid meet"
              style={{ pointerEvents: "none", opacity: 0.92 }}
            />
            {showHeat &&
              visible.map((c) => {
                const [lon, lat] = markerLonLat(c);
                const [cx, cy] = project(lon, lat);
                const color = TIER_COLORS[c.maturity_tier || "unknown"];
                return (
                  <circle
                    key={`heat-${c.iso_code}`}
                    cx={cx}
                    cy={cy}
                    r={38}
                    fill={color}
                    fillOpacity={0.22}
                    stroke={color}
                    strokeOpacity={0.35}
                    strokeWidth={1}
                    style={{ pointerEvents: "none" }}
                  />
                );
              })}
            {visible.map((c) => {
              const [lon, lat] = markerLonLat(c);
              const [cx, cy] = project(lon, lat);
              const color = TIER_COLORS[c.maturity_tier || "unknown"];
              const r = 6 + (c.agri_score ?? 50) / 22;
              const hitR = Math.max(r + 10, 16);
              const goToCountry = () => router.push(`/countries/${c.iso_code}`);
              return (
                <g
                  key={c.iso_code}
                  className="country-marker"
                  style={{ cursor: "pointer" }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    goToCountry();
                  }}
                >
                  <circle cx={cx} cy={cy} r={hitR} fill="transparent" stroke="none" className="country-marker-hit" />
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r + 3}
                    fill="rgba(255,255,255,0.9)"
                    stroke="none"
                    style={{ pointerEvents: "none" }}
                  />
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill={color}
                    stroke="#ffffff"
                    strokeWidth={2}
                    style={{ pointerEvents: "none" }}
                  />
                  <title>
                    {c.name} — {c.maturity_label ?? "—"} · AGRI {c.agri_score ?? "n/a"}
                  </title>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      <p className="map-hint" style={{ marginTop: "0.65rem" }}>
        Showing {visible.length} of {countries.length} jurisdictions. Heat radius reflects AGRI maturity tier at each
        capital / bloc centroid.
      </p>

      <div className="map-country-chips">
        {visible.map((c) => (
          <button
            key={c.iso_code}
            type="button"
            className="btn btn-secondary map-chip"
            onClick={() => router.push(`/countries/${c.iso_code}`)}
          >
            {c.name}
          </button>
        ))}
      </div>
    </div>
  );
}
