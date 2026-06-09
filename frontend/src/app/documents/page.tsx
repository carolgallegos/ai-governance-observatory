import { DocumentsClient } from "./DocumentsClient";

export default function DocumentsPage() {
  return (
    <>
      <section className="hero">
        <p className="hero-eyebrow">Document desk</p>
        <h1>Upload a policy PDF</h1>
        <p className="hero-lead">
          I chunk the text, store embeddings in Postgres (pgvector), and pull out a short structured summary.
          You also get four focus scores — innovation, risk, governance, research — based on term frequency in
          the file.
        </p>
      </section>
      <DocumentsClient />
    </>
  );
}
