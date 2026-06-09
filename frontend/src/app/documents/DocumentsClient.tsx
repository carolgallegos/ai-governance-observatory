"use client";

import { useCallback, useEffect, useState } from "react";
import { DocumentIntelligencePanel } from "@/components/DocumentIntelligencePanel";
import { EmptyState, LoadingBlock } from "@/components/ui/LoadingBlock";
import { api, summarizeDoc, uploadPdf } from "@/lib/api";

export function DocumentsClient() {
  const [docs, setDocs] = useState<{ id: number; filename: string; summary_json: Record<string, unknown> | null }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [countryIso, setCountryIso] = useState("");
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoadingList(true);
    api
      .documents()
      .then(setDocs)
      .catch(() => setDocs([]))
      .finally(() => setLoadingList(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const doc = await uploadPdf(file, countryIso || undefined);
      await summarizeDoc(doc.id);
      refresh();
    } catch {
      setError("Upload failed. Check that the API is running and the file is a valid PDF.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <>
      <div className="card" style={{ marginBottom: "1rem" }}>
        <h3>Upload policy PDF</h3>
        <p className="section-desc" style={{ marginTop: "0.35rem" }}>
          Text is extracted, chunked, embedded in Postgres, and analysed. Focus scores are generated automatically
          after upload.
        </p>
        <div className="form-row" style={{ marginTop: "1rem" }}>
          <label className="form-label">
            Country ISO <span className="form-optional">(optional)</span>
            <input
              className="form-input"
              value={countryIso}
              onChange={(e) => setCountryIso(e.target.value.toUpperCase())}
              placeholder="MX"
              maxLength={3}
            />
          </label>
          <label className="btn btn-secondary" style={{ cursor: uploading ? "wait" : "pointer" }}>
            {uploading ? "Analysing…" : "Choose PDF"}
            <input type="file" accept=".pdf" onChange={onFile} disabled={uploading} hidden />
          </label>
        </div>
        {uploading && <LoadingBlock label="Extracting text and computing focus scores…" />}
        {error && <p className="form-error">{error}</p>}
      </div>

      <div className="card">
        <h3>Document library</h3>
        {loadingList ? (
          <LoadingBlock label="Loading documents…" />
        ) : docs.length === 0 ? (
          <EmptyState
            title="No documents yet"
            description="Upload a national AI strategy, white paper, or regulatory PDF to see governance focus scores and summaries."
          />
        ) : (
          <ul className="doc-list">
            {docs.map((d) => (
              <li key={d.id} className="doc-list-item">
                <header className="doc-list-header">
                  <strong>{d.filename}</strong>
                </header>
                {d.summary_json && (
                  <div className="doc-summary">
                    {d.summary_json.document_intelligence &&
                      typeof d.summary_json.document_intelligence === "object" && (
                        <DocumentIntelligencePanel
                          scores={d.summary_json.document_intelligence as Record<string, number>}
                        />
                      )}
                    <div className="doc-summary-text">
                      <p>
                        <strong>Objectives</strong>
                        <br />
                        {Array.isArray(d.summary_json.objectives)
                          ? (d.summary_json.objectives as string[]).join(" · ")
                          : "—"}
                      </p>
                      <p>
                        <strong>Risks</strong>
                        <br />
                        {Array.isArray(d.summary_json.risks)
                          ? (d.summary_json.risks as string[]).join(" · ")
                          : "—"}
                      </p>
                      <p>
                        <strong>Recommendations</strong>
                        <br />
                        {Array.isArray(d.summary_json.recommendations)
                          ? (d.summary_json.recommendations as string[]).join(" · ")
                          : "—"}
                      </p>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
