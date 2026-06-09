# Architecture notes

Three Docker services: `web` (Next.js), `api` (FastAPI), `db` (Postgres 16 + pgvector).

The API seeds countries on first boot from `data/seed/`. Uploaded PDFs land in `backend/uploads/`, get chunked in `app/services/rag.py`, and embeddings sit in `document_chunks`.

Server-side rendering in Next calls `http://api:8000` inside Compose; the browser uses `localhost:8000`.

For retrieval, I cosine-match query embeddings against stored chunks, pass the top five into the prompt, and return citation metadata from chunk scores.
