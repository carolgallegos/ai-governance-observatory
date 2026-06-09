# About

I'm **Carol V. Gallegos**, a computer science student. I like building things, but I'm not only interested in code — I want to understand how technology lands on institutions, law, and everyday life. This repo is part of that path.

## Why I built this

I kept running into the same problem: national AI strategies are long, scattered across government sites, and hard to compare fairly. EU portals, OECD notes, UNESCO frameworks, NIST guides, country PDFs — none of them sit in one place.

I built the observatory because I needed a **small dataset I could explain in an interview**, not because I wanted another generic dashboard.

Three things I cared about:

1. **Comparable country notes** I wrote myself from public sources (see `data/sources.md`).
2. **A visible index (AGRI)** where the weights are in the open — not a black-box score.
3. **A document flow I can demo live**: PDF in → chunks in Postgres → answers with page references.

I'm still exploring where this goes (policy, security, international programs). The project is honest about that: eight jurisdictions, hand-curated, will age.

## What I'm working toward

I'm trying to connect **AI systems, governance, and international work** — not all at once, but deliberately. I tend to find programs and opportunities on my own rather than wait for a syllabus to mention them. This repo is evidence that I can take a messy real-world topic and turn it into something runnable.

## Technical notes (if you review the code)

- Backend: FastAPI, PostgreSQL + pgvector, Docker.
- Frontend: Next.js. Light layout on purpose — I didn't want the usual dark "AI product" skin.
- LLM features are optional; mock mode works without API keys for demos.
- Ask me about AGRI weights, the similarity heuristic, or retrieval confidence. I should answer without slides.

## Contact

GitHub: [carolgallegos](https://github.com/carolgallegos)
