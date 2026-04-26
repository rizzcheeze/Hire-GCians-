from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Iterable, Sequence


@dataclass(slots=True)
class MatchResult:
    similarity: float
    match_percentage: float
    dimensions: int


@dataclass(slots=True)
class RankedMatch:
    item_id: str
    similarity: float
    match_percentage: float


def normalize_vector(vector: Sequence[float]) -> list[float]:
    if not vector:
        raise ValueError("Vector must not be empty.")
    return [float(value) for value in vector]


def validate_same_dimensions(left: Sequence[float], right: Sequence[float]) -> None:
    if len(left) != len(right):
        raise ValueError(
            f"Vector dimensions must match. Got {len(left)} and {len(right)}."
        )


def vector_magnitude(vector: Sequence[float]) -> float:
    return math.sqrt(sum(float(value) ** 2 for value in vector))


def cosine_similarity(left: Sequence[float], right: Sequence[float]) -> float:
    left_vector = normalize_vector(left)
    right_vector = normalize_vector(right)
    validate_same_dimensions(left_vector, right_vector)

    left_magnitude = vector_magnitude(left_vector)
    right_magnitude = vector_magnitude(right_vector)
    if left_magnitude == 0 or right_magnitude == 0:
        raise ValueError("Cosine similarity is undefined for zero-magnitude vectors.")

    dot_product = sum(a * b for a, b in zip(left_vector, right_vector))
    similarity = dot_product / (left_magnitude * right_magnitude)
    return max(-1.0, min(1.0, similarity))


def similarity_to_match_percentage(similarity: float) -> float:
    clamped = max(-1.0, min(1.0, float(similarity)))
    return round(((clamped + 1.0) / 2.0) * 100.0, 2)


def match_vectors(left: Sequence[float], right: Sequence[float]) -> MatchResult:
    similarity = cosine_similarity(left, right)
    return MatchResult(
        similarity=similarity,
        match_percentage=similarity_to_match_percentage(similarity),
        dimensions=len(left),
    )


def rank_matches(
    source_vector: Sequence[float],
    candidates: Iterable[tuple[str, Sequence[float]]],
) -> list[RankedMatch]:
    source = normalize_vector(source_vector)
    ranked: list[RankedMatch] = []

    for item_id, candidate_vector in candidates:
        result = match_vectors(source, candidate_vector)
        ranked.append(
            RankedMatch(
                item_id=item_id,
                similarity=result.similarity,
                match_percentage=result.match_percentage,
            )
        )

    ranked.sort(key=lambda item: item.similarity, reverse=True)
    return ranked


__all__ = [
    "MatchResult",
    "RankedMatch",
    "cosine_similarity",
    "match_vectors",
    "normalize_vector",
    "rank_matches",
    "similarity_to_match_percentage",
    "validate_same_dimensions",
    "vector_magnitude",
]
