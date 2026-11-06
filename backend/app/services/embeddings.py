import hashlib
import struct

import numpy as np

from app.core.config import settings


def _mock_embed_text(text: str, dim: int) -> list[float]:
    """Deterministic pseudo-embedding for offline demo."""
    digest = hashlib.sha256(text.encode("utf-8")).digest()
    rng_seed = struct.unpack("I", digest[:4])[0]
    rng = np.random.default_rng(rng_seed)
    vec = rng.standard_normal(dim).astype(np.float32)
    vec = vec / (np.linalg.norm(vec) + 1e-9)
    return vec.tolist()


def uses_live_embeddings() -> bool:
    return settings.embedding_provider == "openai" and bool(settings.openai_api_key)


async def embed_text(text: str) -> list[float]:
    dim = settings.embedding_dimensions
    if uses_live_embeddings():
        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=settings.openai_api_key)
        resp = await client.embeddings.create(
            model="text-embedding-3-small",
            input=text[:8000],
            dimensions=dim if dim != 1536 else 1536,
        )
        return resp.data[0].embedding
    return _mock_embed_text(text, dim)
