# Publish to GitHub — carolgallegos

One-time setup for `https://github.com/carolgallegos/ai-governance-observatory`.

## Before you push

1. **Screenshots** — add these PNGs (see `docs/screenshots/README.md`):
   - `dashboard-map.png`
   - `compare-radar.png`
   - `chat-citations.png`
   - `country-timeline.png`

2. **Secrets** — never commit `.env`. Use a GitHub Personal Access Token (not your account password) when Git asks for credentials.

3. **Name** — confirm Carol V. Gallegos in `README.md`, `ABOUT.md`, and the site footer.

## Commands (PowerShell)

```powershell
cd C:\Users\carol\projects\ai-governance-observatory

# If not already a repo:
git init
git branch -M main

git add .
git status   # verify .env is NOT listed

git commit -m "AI Governance Observatory — comparative policy research platform"
```

Create the empty repository on GitHub (no README license tick — you already have one locally), then:

```powershell
git remote add origin https://github.com/carolgallegos/ai-governance-observatory.git
git push -u origin main
```

When prompted for password, use a **Personal Access Token** with `repo` scope:  
GitHub → Settings → Developer settings → Personal access tokens.

## Optional: natural commit history

If you prefer several commits instead of one:

```text
git add backend/ data/ docker-compose.yml .env.example
git commit -m "Backend: FastAPI, AGRI scoring, RAG, seed data"

git add frontend/
git commit -m "Frontend: observatory UI, map, compare, documents, chat"

git add README.md METHODOLOGY.md ARCHITECTURE.md docs/
git commit -m "Docs: methodology, architecture, publish guide"
```

## After push

- Enable GitHub Pages only if you deploy a static export (not required for this Docker app).
- Pin the repo on your profile if it is portfolio work.
- Link `http://localhost:3000` only in README as local demo unless you deploy elsewhere.
