"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { api } from "@/lib/api";

type Rec = {
  iso_code: string;
  name: string;
  similarity_percent: number;
  explanations: string[];
};

export function SimilarCountries({ iso, countryName }: { iso: string; countryName: string }) {
  const [recs, setRecs] = useState<Rec[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    api
      .similarCountries(iso)
      .then((r) => setRecs(r.recommendations))
      .catch(() => {
        setRecs([]);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [iso]);

  if (loading) {
    return (
      <div className="card similar-countries-card">
        <LoadingBlock label="Finding similar jurisdictions…" />
      </div>
    );
  }

  if (error || !recs.length) {
    return (
      <div className="card similar-countries-card">
        <h3>Countries most similar to {countryName}</h3>
        <p className="section-desc">No recommendations available yet for this jurisdiction.</p>
      </div>
    );
  }

  return (
    <div className="card similar-countries-card">
      <h3>Countries most similar to {countryName}</h3>
      <p className="section-desc">
        Ranked by AGRI dimension alignment and overlap in regulatory language from curated profiles.
      </p>
      <ul className="similar-list">
        {recs.map((r, idx) => (
          <li key={r.iso_code} className="similar-item">
            <div className="similar-item-head">
              <span className="similar-rank">{idx + 1}</span>
              <div>
                <Link href={`/countries/${r.iso_code}`} className="similar-name">
                  {r.name}
                </Link>
                <span className="similar-pct">{r.similarity_percent}% alignment</span>
              </div>
              <Link href={`/compare?a=${iso}&b=${r.iso_code}`} className="btn btn-secondary similar-compare-btn">
                Compare
              </Link>
            </div>
            {r.explanations?.length > 0 && (
              <ul className="similar-reasons">
                {r.explanations.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
