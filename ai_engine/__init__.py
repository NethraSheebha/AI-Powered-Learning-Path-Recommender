"""Compatibility package exposing the local AI engine helpers.

The repository already contains an `AI-engine/` directory for the member-3
implementation, but Python cannot import from a hyphenated directory name.
This package provides a stable import path for the backend mutation engine.
"""

from ai_engine.seed_corpus import build_chroma_records, load_seed_concepts, seed_collection
from ai_engine.chroma_service import ChromaService

__all__ = [
    "ChromaService",
    "build_chroma_records",
    "load_seed_concepts",
    "seed_collection",
]