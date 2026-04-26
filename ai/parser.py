from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv
from ollama import Client
from pydantic import BaseModel, ConfigDict, Field, ValidationError, field_validator


def load_parser_env() -> None:
    load_dotenv()

    backend_env = Path(__file__).resolve().parent.parent / "backend" / ".env"
    if backend_env.exists():
        load_dotenv(backend_env, override=False)


load_parser_env()


DEFAULT_OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
DEFAULT_OLLAMA_LLM_MODEL = os.getenv("OLLAMA_LLM_MODEL", "qwen3:4b")


class ResumeProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")

    skills: list[str] = Field(default_factory=list)
    years_of_experience: float | None = None
    education: list[str] = Field(default_factory=list)
    job_titles: list[str] = Field(default_factory=list)

    @field_validator("skills", "education", "job_titles", mode="before")
    @classmethod
    def normalize_string_list(cls, value: object) -> list[str]:
        if value is None:
            return []
        if isinstance(value, str):
            value = [value]
        if not isinstance(value, list):
            raise TypeError("Expected a list of strings.")

        normalized: list[str] = []
        seen: set[str] = set()
        for item in value:
            text = str(item or "").strip()
            if not text:
                continue
            key = text.casefold()
            if key in seen:
                continue
            seen.add(key)
            normalized.append(text)
        return normalized


@dataclass(slots=True)
class ParseResult:
    profile: ResumeProfile
    raw_response: str
    model: str


PARSER_SYSTEM_PROMPT = """You extract structured resume data.
Return only valid JSON with these keys:
- skills: array of strings
- years_of_experience: number or null
- education: array of strings
- job_titles: array of strings

Rules:
- No markdown fences
- No explanations
- No extra prose
- Keep skills concise and deduplicated
- Use null when years_of_experience is unknown
"""


def build_resume_parser_prompt(resume_text: str) -> str:
    cleaned_text = resume_text.strip()
    if not cleaned_text:
        raise ValueError("Resume text is required for parsing.")

    return (
        "Extract the structured resume profile from the text below.\n\n"
        "Resume text:\n"
        f"{cleaned_text}\n"
    )


def create_ollama_client(base_url: str | None = None) -> Client:
    return Client(host=base_url or DEFAULT_OLLAMA_BASE_URL)


def extract_json_object(raw_text: str) -> str:
    text = raw_text.strip()
    if not text:
        raise ValueError("Ollama returned an empty response.")

    fenced_match = re.search(r"```(?:json)?\s*(\{.*\})\s*```", text, re.DOTALL)
    if fenced_match:
        return fenced_match.group(1).strip()

    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end < start:
        raise ValueError("No JSON object found in model response.")
    return text[start : end + 1].strip()


def extract_model_text(payload: dict[str, object]) -> str:
    message = payload.get("message")
    if isinstance(message, dict):
        content = str(message.get("content") or "").strip()
        if content:
            return content
        thinking = str(message.get("thinking") or "").strip()
        if thinking:
            return thinking

    response = str(payload.get("response") or "").strip()
    if response:
        return response

    thinking = str(payload.get("thinking") or "").strip()
    if thinking:
        return thinking

    raise ValueError("Ollama response did not contain any parsable text.")


def parse_resume_response(raw_response: str) -> ResumeProfile:
    json_payload = extract_json_object(raw_response)
    data = json.loads(json_payload)
    try:
        return ResumeProfile.model_validate(data)
    except ValidationError as error:
        raise ValueError(f"Structured resume validation failed: {error}") from error


def parse_resume_text(
    resume_text: str,
    *,
    client: Client | None = None,
    model: str | None = None,
) -> ParseResult:
    if not resume_text or not resume_text.strip():
        raise ValueError("Resume text is required for parsing.")

    active_model = model or DEFAULT_OLLAMA_LLM_MODEL
    active_client = client or create_ollama_client()
    response = active_client.generate(
        model=active_model,
        system=PARSER_SYSTEM_PROMPT,
        prompt=f"/no_think\n{build_resume_parser_prompt(resume_text)}",
        format="json",
        raw=False,
        options={"temperature": 0, "num_predict": 400},
    )
    raw_response = extract_model_text(response)
    profile = parse_resume_response(raw_response)
    return ParseResult(profile=profile, raw_response=raw_response, model=active_model)


__all__ = [
    "DEFAULT_OLLAMA_BASE_URL",
    "DEFAULT_OLLAMA_LLM_MODEL",
    "PARSER_SYSTEM_PROMPT",
    "ParseResult",
    "ResumeProfile",
    "build_resume_parser_prompt",
    "create_ollama_client",
    "extract_model_text",
    "extract_json_object",
    "parse_resume_response",
    "parse_resume_text",
]
