"""Load the curated concept-prerequisite corpus into local ChromaDB storage."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from .chroma_service import ChromaService


DEFAULT_CORPUS_PATH = Path(__file__).resolve().parents[1] / "AI-engine" / "data" / "concept_prerequisites.json"
REQUIRED_CONCEPT_FIELDS = {"id", "title", "description", "domain", "level", "prerequisites", "keywords"}


def load_seed_concepts(corpus_path: str | Path = DEFAULT_CORPUS_PATH) -> list[dict[str, Any]]:
    """Load and validate the versioned curated concept corpus."""
    with Path(corpus_path).open(encoding="utf-8") as corpus_file:
        payload = json.load(corpus_file)
    concepts = payload.get("concepts") if isinstance(payload, dict) else None
    if not isinstance(concepts, list) or not 50 <= len(concepts) <= 150:
        raise ValueError("corpus must contain between 50 and 150 concepts")

    concept_ids: set[str] = set()
    for concept in concepts:
        if not isinstance(concept, dict) or not REQUIRED_CONCEPT_FIELDS.issubset(concept):
            raise ValueError("each concept must include all required fields")
        if not all(isinstance(concept[field], str) and concept[field].strip() for field in ("id", "title", "description", "domain", "level")):
            raise ValueError("concept text fields must be non-empty strings")
        if concept["id"] in concept_ids:
            raise ValueError(f"duplicate concept id: {concept['id']}")
        if not all(isinstance(item, str) and item.strip() for item in concept["prerequisites"]):
            raise ValueError(f"invalid prerequisites for concept: {concept['id']}")
        if not all(isinstance(item, str) and item.strip() for item in concept["keywords"]):
            raise ValueError(f"invalid keywords for concept: {concept['id']}")
        concept_ids.add(concept["id"])

    for concept in concepts:
        unknown = set(concept["prerequisites"]) - concept_ids
        if unknown:
            raise ValueError(f"unknown prerequisites for concept {concept['id']}: {sorted(unknown)}")
        if concept["id"] in concept["prerequisites"]:
            raise ValueError(f"concept cannot require itself: {concept['id']}")
    _validate_acyclic(concepts)
    return concepts


def build_chroma_records(concepts: list[dict[str, Any]]) -> tuple[list[str], list[str], list[dict[str, str]]]:
    """Convert concepts into Chroma document, ID, and scalar-metadata records."""
    documents = [
        "\n".join(
            (
                f"Concept: {concept['title']}",
                f"Domain: {concept['domain']}",
                f"Level: {concept['level']}",
                f"Description: {concept['description']}",
                f"Prerequisites: {', '.join(concept['prerequisites']) or 'None'}",
                f"Keywords: {', '.join(concept['keywords'])}",
            )
        )
        for concept in concepts
    ]
    ids = [concept["id"] for concept in concepts]
    metadatas = [
        {
            "title": concept["title"],
            "domain": concept["domain"],
            "level": concept["level"],
            "prerequisites": ",".join(concept["prerequisites"]),
        }
        for concept in concepts
    ]
    return documents, ids, metadatas


def seed_collection(
    collection_name: str = "learning_concepts",
    persist_directory: str | Path = "data/chroma",
    corpus_path: str | Path = DEFAULT_CORPUS_PATH,
) -> int:
    """Upsert all curated concepts through the existing local ``ChromaService``."""
    concepts = load_seed_concepts(corpus_path)
    documents, ids, metadatas = build_chroma_records(concepts)
    service = ChromaService(collection_name, persist_directory)
    service.add_documents(documents=documents, ids=ids, metadatas=metadatas)
    return len(concepts)


def _validate_acyclic(concepts: list[dict[str, Any]]) -> None:
    prerequisites_by_id = {concept["id"]: concept["prerequisites"] for concept in concepts}
    visited: set[str] = set()
    active: set[str] = set()

    def visit(concept_id: str) -> None:
        if concept_id in active:
            raise ValueError("corpus contains a circular prerequisite dependency")
        if concept_id in visited:
            return
        active.add(concept_id)
        for prerequisite_id in prerequisites_by_id[concept_id]:
            visit(prerequisite_id)
        active.remove(concept_id)
        visited.add(concept_id)

    for concept_id in prerequisites_by_id:
        visit(concept_id)


def main() -> None:
    """Seed the selected local collection from the bundled corpus."""
    parser = argparse.ArgumentParser(description="Seed local ChromaDB with learning concepts.")
    parser.add_argument("--collection", default="learning_concepts")
    parser.add_argument("--persist-directory", default="data/chroma")
    arguments = parser.parse_args()
    count = seed_collection(arguments.collection, arguments.persist_directory)
    print(f"Seeded {count} concepts into collection '{arguments.collection}'.")


if __name__ == "__main__":
    main()
