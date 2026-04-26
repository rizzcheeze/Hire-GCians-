from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from ollama import Client, ResponseError

try:
    from ai.parser import ResumeProfile
except ImportError:  # pragma: no cover
    ResumeProfile = None  # type: ignore[assignment]


def load_embedder_env() -> None:
    load_dotenv()

    backend_env = Path(__file__).resolve().parent.parent / "backend" / ".env"
    if backend_env.exists():
        load_dotenv(backend_env, override=False)


load_embedder_env()


DEFAULT_OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
DEFAULT_OLLAMA_EMBED_MODEL = os.getenv("OLLAMA_EMBED_MODEL", "qwen3:0.6b")


@dataclass(slots=True)
class EmbeddingResult:
    vector: list[float]
    dimensions: int
    model: str


def create_ollama_client(base_url: str | None = None) -> Client:
    return Client(host=base_url or DEFAULT_OLLAMA_BASE_URL)


def profile_to_embedding_text(profile: ResumeProfile | dict[str, Any]) -> str:
    if hasattr(profile, "model_dump"):
        payload = profile.model_dump()
    else:
        payload = dict(profile)

    skills = ", ".join(payload.get("skills") or [])
    education = "; ".join(payload.get("education") or [])
    job_titles = ", ".join(payload.get("job_titles") or [])
    years_of_experience = payload.get("years_of_experience")
    years_text = "unknown" if years_of_experience is None else str(years_of_experience)

    sections = [
        f"Skills: {skills}" if skills else "",
        f"Years of experience: {years_text}",
        f"Education: {education}" if education else "",
        f"Job titles: {job_titles}" if job_titles else "",
    ]
    text = "\n".join(section for section in sections if section).strip()
    if not text:
        raise ValueError("Profile data is empty; cannot create embedding text.")
    return text


def extract_vector(payload: dict[str, Any]) -> list[float]:
    if "embedding" in payload and isinstance(payload["embedding"], list):
        return [float(value) for value in payload["embedding"]]

    embeddings = payload.get("embeddings")
    if isinstance(embeddings, list) and embeddings:
        first = embeddings[0]
        if isinstance(first, list):
            return [float(value) for value in first]

    raise ValueError("Ollama embedding response did not contain an embedding vector.")


def embed_text(
    text: str,
    *,
    client: Client | None = None,
    model: str | None = None,
) -> EmbeddingResult:
    cleaned = text.strip()
    if not cleaned:
        raise ValueError("Embedding text is required.")

    active_model = model or DEFAULT_OLLAMA_EMBED_MODEL
    active_client = client or create_ollama_client()

    try:
        payload = active_client.embed(
            model=active_model,
            input=cleaned,
            options={"temperature": 0},
        )
    except ResponseError as error:
        message = str(error)
        if "does not support embeddings" in message.lower():
            raise RuntimeError(
                f"Ollama model '{active_model}' does not support embeddings. "
                "Configure OLLAMA_EMBED_MODEL to a real embedding-capable model."
            ) from error
        raise

    vector = extract_vector(payload)
    return EmbeddingResult(
        vector=vector,
        dimensions=len(vector),
        model=active_model,
    )


def embed_profile(
    profile: ResumeProfile | dict[str, Any],
    *,
    client: Client | None = None,
    model: str | None = None,
) -> EmbeddingResult:
    return embed_text(
        profile_to_embedding_text(profile),
        client=client,
        model=model,
    )


__all__ = [
    "DEFAULT_OLLAMA_BASE_URL",
    "DEFAULT_OLLAMA_EMBED_MODEL",
    "EmbeddingResult",
    "create_ollama_client",
    "embed_profile",
    "embed_text",
    "extract_vector",
    "profile_to_embedding_text",
]
