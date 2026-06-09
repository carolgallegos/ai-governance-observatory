from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.core.config import settings
from app.db.session import Base, SessionLocal, engine
from app.services.seed import load_seed, load_timelines


@asynccontextmanager
async def lifespan(app: FastAPI):
    from sqlalchemy import text

    try:
        with engine.connect() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            conn.commit()
    except Exception:
        pass  # SQLite / non-Postgres dev without extension
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        n = load_seed(db)
        if n:
            print(f"Seeded {n} countries from data/seed/countries.json")
        t = load_timelines(db)
        if t:
            print(f"Seeded {t} timeline events from data/seed/timelines.json")
    finally:
        db.close()
    Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
    yield


app = FastAPI(
    title="AI Governance Observatory API",
    description="Global AI Policy Intelligence Platform — compare countries, AGRI scores, RAG over policy documents.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
def root():
    return {
        "name": "AI Governance Observatory",
        "docs": "/docs",
        "health": "/api/v1/health",
    }
