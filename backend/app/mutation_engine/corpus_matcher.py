"""Match free-text rubric gaps to nodes in the curated concept-prerequisite corpus.

This module never invents remedial content. It only maps a missing-concept
string (from RubricEngine's `missing_concepts` output) onto an existing,
seeded concept from `concept_prerequisites.json` -- the same corpus Member 3
loaded into ChromaDB. If no confident match exists, the gap is reported
unmatched rather than fabricated.
"""

from __future__ import annotations

import difflib
from dataclasses import dataclass
from pathlib import Path
from typing import Any

# Reuse the same loader/validator Member 3 wrote, so we're always reading
# the identical, already-validated corpus (acyclic, no dangling prereqs, etc).
# Assumes the project root is on PYTHONPATH so `ai_engine` is importable
# (true for both `uvicorn app.main:app` run from repo root and pytest).
from ai_engine.seed_corpus import DEFAULT_CORPUS_PATH, load_seed_concepts

# Points into ai_engine/data/, not a local copy -- single source of truth.
MATCH_CUTOFF = 0.72  # difflib similarity threshold for fuzzy title/keyword matches


@dataclass(frozen=True)
class ConceptMatch:
    """A missing-concept string resolved to a real corpus node."""

    concept_id: str
    title: str
    description: str
    domain: str
    level: str
    prerequisites: tuple[str, ...]
    matched_on: str  # "title" | "keyword" | "unmatched"
    missing_text: str  # original text from the rubric evaluation


def load_corpus_index(corpus_path: str | Path = DEFAULT_CORPUS_PATH) -> list[dict[str, Any]]:
    """Load and validate the corpus once; callers should cache/reuse this list."""
    return load_seed_concepts(corpus_path)


def match_missing_concept(missing_text: str, concepts: list[dict[str, Any]]) -> ConceptMatch | None:
    """Resolve one missing-concept string to a corpus node, or None if unmatched.

    Match order (cheapest/most-precise first):
      1. Exact/substring match against concept title
      2. Substring match against any concept keyword
      3. Fuzzy match against titles (handles LLM phrasing drift, e.g.
         "handling missing values" vs "Data Cleaning")
    """
    normalized = missing_text.strip().lower()
    if not normalized:
        return None

    for concept in concepts:
        title_lower = concept["title"].lower()
        if normalized in title_lower or title_lower in normalized:
            return _to_match(concept, "title", missing_text)

    for concept in concepts:
        for keyword in concept["keywords"]:
            keyword_lower = keyword.lower()
            if normalized in keyword_lower or keyword_lower in normalized:
                return _to_match(concept, "keyword", missing_text)

    titles = [concept["title"].lower() for concept in concepts]
    close = difflib.get_close_matches(normalized, titles, n=1, cutoff=MATCH_CUTOFF)
    if close:
        matched_title = close[0]
        concept = next(c for c in concepts if c["title"].lower() == matched_title)
        return _to_match(concept, "title", missing_text)

    return None


def match_all(missing_concepts: list[str], concepts: list[dict[str, Any]]) -> list[ConceptMatch]:
    """Match every missing-concept string; unmatched ones are dropped, not guessed.

    Logs (via return value inspection upstream) which strings failed to match --
    callers should surface these rather than silently skipping, so gaps in the
    corpus get noticed and curated in later iterations.
    """
    matches: list[ConceptMatch] = []
    for text in missing_concepts:
        match = match_missing_concept(text, concepts)
        if match is not None:
            matches.append(match)
    return matches


def _to_match(concept: dict[str, Any], matched_on: str, missing_text: str) -> ConceptMatch:
    return ConceptMatch(
        concept_id=concept["id"],
        title=concept["title"],
        description=concept["description"],
        domain=concept["domain"],
        level=concept["level"],
        prerequisites=tuple(concept["prerequisites"]),
        matched_on=matched_on,
        missing_text=missing_text,
    )
