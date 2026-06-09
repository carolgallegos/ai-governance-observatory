# Getting started

The full project lives in this folder. To publish, see [GITHUB_PUBLISH.md](./GITHUB_PUBLISH.md).

## Option A — Docker (recommended)

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/).
2. Open PowerShell in this folder:

```powershell
cd C:\Users\carol\projects\ai-governance-observatory
docker compose up --build
```

3. Wait until you see the API and web containers running.
4. Open http://localhost:3000 and http://localhost:8000/docs

## Option B — Run API + web manually

**Terminal 1 — database only:**

```powershell
docker compose up db
```

**Terminal 2 — API:**

```powershell
cd C:\Users\carol\projects\ai-governance-observatory\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:DATABASE_URL="postgresql://agri:agri_secret@localhost:5432/ai_governance"
uvicorn app.main:app --reload --port 8000
```

**Terminal 3 — Frontend:**

```powershell
cd C:\Users\carol\projects\ai-governance-observatory\frontend
npm install
$env:NEXT_PUBLIC_API_URL="http://localhost:8000"
npm run dev
```

## Enable real AI

Edit `.env`:

```env
LLM_PROVIDER=openai
EMBEDDING_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

Restart the API.

## When your new GitHub account is ready

```powershell
cd C:\Users\carol\projects\ai-governance-observatory
git init
git add .
git commit -m "Initial commit: AI Governance Observatory MVP"
git remote add origin https://github.com/TU_USUARIO/ai-governance-observatory.git
git push -u origin main
```

Replace `TU_USUARIO` with your new username.
