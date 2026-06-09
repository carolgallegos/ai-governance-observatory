export type Citation = {
  document: string;
  page: number | null;
  section: string;
  confidence: number;
  excerpt?: string;
};

function confidenceLabel(score: number) {
  if (score >= 80) return "High match";
  if (score >= 55) return "Moderate match";
  return "Low match";
}

export function CitationCards({ citations }: { citations: Citation[] }) {
  if (!citations?.length) return null;

  return (
    <div className="citations-block">
      <p className="citations-heading">Sources cited in this answer</p>
      <ol className="citations-list">
        {citations.map((c, i) => (
          <li key={`${c.document}-${c.page}-${i}`} className="citation-card">
            <div className="citation-index">[{i + 1}]</div>
            <div className="citation-body">
              <div className="citation-doc">{c.document}</div>
              <div className="citation-meta">
                {c.page != null && <span>Page {c.page}</span>}
                {c.section && (
                  <>
                    {c.page != null && <span className="citation-meta-sep">·</span>}
                    <span>{c.section}</span>
                  </>
                )}
              </div>
              <div className="citation-confidence">
                <span className={`citation-badge citation-badge-${c.confidence >= 80 ? "high" : c.confidence >= 55 ? "mid" : "low"}`}>
                  {confidenceLabel(c.confidence)}
                </span>
                <span className="citation-pct">{c.confidence}% retrieval score</span>
              </div>
              {c.excerpt && <blockquote className="citation-excerpt">{c.excerpt}</blockquote>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
