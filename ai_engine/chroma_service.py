"""Local persistent ChromaDB storage abstraction."""

from __future__ import annotations

from pathlib import Path
from typing import Any, Sequence


class ChromaService:
    """Manage one local persistent Chroma collection without a server."""

    def __init__(self, collection_name: str, persist_directory: str | Path = "data/chroma") -> None:
        if not collection_name.strip():
            raise ValueError("collection_name must not be empty")
        try:
            import chromadb
        except ImportError as exc:
            raise RuntimeError("chromadb must be installed to use ChromaService") from exc
        self.persist_directory = Path(persist_directory)
        self.persist_directory.mkdir(parents=True, exist_ok=True)
        self._client = chromadb.PersistentClient(path=str(self.persist_directory))
        self.collection = self._client.get_or_create_collection(name=collection_name)

    def add_documents(
        self,
        documents: Sequence[str],
        ids: Sequence[str],
        metadatas: Sequence[dict[str, Any]] | None = None,
    ) -> None:
        """Add documents, their stable IDs, and optional metadata to the collection."""
        if not documents or len(documents) != len(ids):
            raise ValueError("documents and ids must be non-empty and have equal length")
        if metadatas is not None and len(metadatas) != len(documents):
            raise ValueError("metadatas must match documents length")
        self.collection.upsert(documents=list(documents), ids=list(ids), metadatas=list(metadatas) if metadatas else None)

    def query(self, query_text: str, n_results: int = 3) -> dict[str, Any]:
        """Return Chroma's relevant-document query result for non-empty text."""
        if not query_text.strip() or n_results < 1:
            raise ValueError("query_text must be non-empty and n_results must be positive")
        return self.collection.query(query_texts=[query_text], n_results=n_results)
