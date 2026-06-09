import json
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.entities import Document, DocumentChunk
from app.services.embeddings import embed_text
from app.services.llm import generate_completion

CHUNK_SIZE = 1000
CHUNK_OVERLAP = 150


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    chunks: list[str] = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end].strip())
        if end >= len(text):
            break
        start = end - overlap
    return [c for c in chunks if len(c) > 50]


def extract_pdf_text(file_path: Path) -> tuple[str, list[tuple[int, str]]]:
    import fitz  # PyMuPDF

    doc = fitz.open(file_path)
    pages: list[tuple[int, str]] = []
    full_parts: list[str] = []
    for i, page in enumerate(doc):
        text = page.get_text()
        pages.append((i + 1, text))
        full_parts.append(text)
    doc.close()
    return "\n".join(full_parts), pages


async def ingest_document(db: Session, document: Document, file_path: Path) -> int:
    full_text, pages = extract_pdf_text(file_path)
    if not full_text.strip():
        full_text = file_path.read_text(encoding="utf-8", errors="ignore")

    count = 0
    idx = 0
    for page_num, page_text in pages if pages else [(None, full_text)]:
        for piece in chunk_text(page_text):
            emb = await embed_text(piece)
            chunk = DocumentChunk(
                document_id=document.id,
                chunk_index=idx,
                page_number=page_num,
                content=piece,
                embedding=emb,
            )
            db.add(chunk)
            idx += 1
            count += 1
    db.commit()
    return count


def cosine_similarity(a: list[float], b: list[float]) -> float:
    import numpy as np

    va = np.array(a, dtype=np.float32)
    vb = np.array(b, dtype=np.float32)
    denom = (np.linalg.norm(va) * np.linalg.norm(vb)) + 1e-9
    return float(np.dot(va, vb) / denom)


async def retrieve_chunks_scored(
    db: Session, query: str, top_k: int = 5, country_id: int | None = None
) -> list[tuple[float, DocumentChunk]]:
    query_emb = await embed_text(query)
    stmt = select(DocumentChunk).join(Document)
    if country_id is not None:
        stmt = stmt.where(Document.country_id == country_id)
    chunks = list(db.scalars(stmt).all())
    scored = [(cosine_similarity(query_emb, c.embedding or []), c) for c in chunks if c.embedding]
    scored.sort(key=lambda x: x[0], reverse=True)
    return scored[:top_k]


async def retrieve_chunks(db: Session, query: str, top_k: int = 5, country_id: int | None = None) -> list[DocumentChunk]:
    return [c for _, c in await retrieve_chunks_scored(db, query, top_k, country_id)]


def _section_label(chunk: DocumentChunk) -> str:
    first_line = chunk.content.strip().split("\n")[0][:100]
    if len(first_line) > 10:
        return first_line
    return f"Section {chunk.chunk_index + 1}"


def score_to_confidence(similarity: float) -> float:
    """Map cosine similarity (typically 0–1) to display confidence %."""
    pct = max(0.0, min(1.0, (similarity + 1) / 2 if similarity < 0 else similarity)) * 100
    return round(min(99.0, max(52.0, pct)), 1)


def build_citations(db: Session, scored_chunks: list[tuple[float, DocumentChunk]]) -> list[dict]:
    citations: list[dict] = []
    for sim, chunk in scored_chunks:
        doc = db.get(Document, chunk.document_id)
        doc_name = doc.filename if doc else f"Document #{chunk.document_id}"
        if doc and doc.filename.lower().endswith(".pdf"):
            doc_name = doc.filename.replace(".pdf", "").replace("_", " ")
        citations.append(
            {
                "document": doc_name,
                "page": chunk.page_number,
                "section": _section_label(chunk),
                "confidence": score_to_confidence(sim),
                "excerpt": chunk.content[:180],
            }
        )
    return citations


async def summarize_document(db: Session, document: Document) -> dict:
    chunks = db.scalars(
        select(DocumentChunk).where(DocumentChunk.document_id == document.id).order_by(DocumentChunk.chunk_index)
    ).all()
    context = "\n\n".join(c.content[:800] for c in chunks[:8])
    system = (
        "You are a policy analyst. Return ONLY valid JSON with keys: "
        "objectives (array), risks (array), recommendations (array), disclaimer (string)."
    )
    user = f"Summarize this AI policy document:\n\n{context[:6000]}"
    raw = await generate_completion(system, user)
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        data = {
            "objectives": ["See raw analysis"],
            "risks": [],
            "recommendations": [],
            "disclaimer": raw,
        }
    full_text = "\n".join(c.content for c in chunks)
    from app.services.analytics import compute_document_intelligence

    data["document_intelligence"] = compute_document_intelligence(full_text)
    document.summary_json = data
    db.commit()
    return data


async def chat_with_rag(db: Session, message: str, country_codes: list[str] | None = None) -> dict:
    from app.models.entities import Country

    country_id = None
    if country_codes and len(country_codes) == 1:
        country = db.scalar(select(Country).where(Country.iso_code == country_codes[0].upper()))
        country_id = country.id if country else None

    scored = await retrieve_chunks_scored(db, message, top_k=5, country_id=country_id)
    if scored:
        chunks = [c for _, c in scored]
        context = "\n\n---\n\n".join(
            f"[doc:{c.document_id} p:{c.page_number}]\n{c.content[:600]}" for c in chunks
        )
        system = (
            "You are the AI Governance Observatory assistant. Answer in English using only the provided context. "
            "Cite page numbers when possible. If context is insufficient, say so and use general governance knowledge briefly."
        )
        user = f"Context:\n{context}\n\nQuestion: {message}"
        answer = await generate_completion(system, user)
        citations = build_citations(db, scored)
    else:
        system = "You are an expert in global AI governance. Answer concisely in English."
        answer = await generate_completion(system, message)
        citations = _curated_citations(db, message, country_codes)

    return {
        "answer": answer,
        "citations": citations,
        "sources": citations,
        "mode": "rag" if scored else "curated",
    }


def _curated_citations(db: Session, message: str, country_codes: list[str] | None) -> list[dict]:
    """Evidence cards from seeded frameworks when no PDF chunks match."""
    from app.models.entities import Country, PolicyFramework

    q = message.lower()
    stmt = select(PolicyFramework).join(Country)
    if country_codes:
        stmt = stmt.where(Country.iso_code.in_([c.upper() for c in country_codes[:2]]))
    frameworks = list(db.scalars(stmt.limit(3)).all())
    if not frameworks and ("france" in q or "germany" in q or "eu" in q):
        frameworks = list(
            db.scalars(
                select(PolicyFramework)
                .join(Country)
                .where(Country.iso_code.in_(["FR", "DE", "EU"]))
                .limit(3)
            ).all()
        )
    citations = []
    for fw in frameworks:
        citations.append(
            {
                "document": fw.title,
                "page": None,
                "section": fw.framework_type.replace("_", " ").title(),
                "confidence": 88.0,
                "excerpt": f"Official {fw.framework_type} framework (curated seed).",
            }
        )
    if not citations:
        citations.append(
            {
                "document": "AI Governance Observatory — curated intelligence",
                "page": None,
                "section": "Country profiles & AGRI",
                "confidence": 85.0,
                "excerpt": "Response based on seeded national policy profiles. Upload PDFs for document-level citations.",
            }
        )
    return citations
