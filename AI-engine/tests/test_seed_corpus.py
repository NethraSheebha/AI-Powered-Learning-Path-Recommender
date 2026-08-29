from seed_corpus import build_chroma_records, load_seed_concepts


def test_seed_corpus_has_curated_acyclic_concepts() -> None:
    concepts = load_seed_concepts()
    assert 50 <= len(concepts) <= 150
    assert len({concept["id"] for concept in concepts}) == len(concepts)
    assert any(concept["id"] == "retrieval-augmented-generation" for concept in concepts)


def test_seed_corpus_builds_chroma_compatible_records() -> None:
    concepts = load_seed_concepts()
    documents, ids, metadatas = build_chroma_records(concepts)
    assert len(documents) == len(ids) == len(metadatas) == len(concepts)
    assert ids[0] == "computer-literacy"
    assert "Prerequisites:" in documents[0]
    assert all(isinstance(value, str) for metadata in metadatas for value in metadata.values())
