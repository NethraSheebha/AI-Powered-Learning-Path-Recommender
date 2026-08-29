"""Graph Mutation Engine.

Trigger conditions (architecture doc, section 3.6):
  - A node's mastery fails its threshold after N attempts, OR
  - The Rubric Engine flags specific missing_concepts on a project submission

On trigger, this module:
  1. Matches each missing concept to a real node in the curated corpus
     (never invents new content -- see corpus_matcher.py)
  2. Inserts each matched concept as a remedial prerequisite node
  3. Re-locks the originally failed node behind its new prerequisite(s)
  4. Re-runs unlock propagation across the graph
  5. Writes a graph_diffs row for the frontend to animate

This is the module Member 2 calls from inside POST /quiz and
POST /submit-project, right after the Mastery Engine updates p_mastery.
"""

from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy.orm import Session

from backend.app.mutation_engine.corpus_matcher import ConceptMatch, load_corpus_index, match_all
from backend.app.mutation_engine.db_layer import (
    RemedialNodeInsert,
    insert_remedial_node,
    unlock_downstream_nodes,
    write_graph_diff,
)

MASTERY_FAIL_THRESHOLD = 0.5  # below this p_mastery after N attempts, treat as a hard fail
MAX_ATTEMPTS_BEFORE_REMEDIATION = 2


@dataclass(frozen=True)
class MutationResult:
    """What the caller (API handler) gets back to build the HTTP response."""

    mutated: bool
    graph_diff_id: str | None
    nodes_added: list[RemedialNodeInsert]
    unmatched_concepts: list[str]  # missing_concepts that had no corpus match -- surface these, don't hide them
    reason: str


def should_trigger_mutation(
    p_mastery: float,
    attempt_count: int,
    missing_concepts: list[str] | None,
) -> bool:
    """Decide whether this evidence event should mutate the graph.

    Two independent trigger paths per the architecture doc: a hard mastery
    fail after repeated attempts, or the rubric explicitly flagging gaps
    (which can fire even on attempt 1 -- a clearly-missing concept doesn't
    need N failed tries to justify a remedial node).
    """
    if missing_concepts:
        return True
    return p_mastery < MASTERY_FAIL_THRESHOLD and attempt_count >= MAX_ATTEMPTS_BEFORE_REMEDIATION


def mutate_graph(
    session: Session,
    graph_id: str,
    blocked_node_id: str,
    trigger_event_id: str,
    p_mastery: float,
    attempt_count: int,
    missing_concepts: list[str] | None = None,
    corpus_path: str | None = None,
) -> MutationResult:
    """Run one mutation cycle for a single failed evidence event.

    Idempotency note: this does not currently dedupe against remedial nodes
    already inserted for the same (blocked_node_id, concept_id) pair in an
    earlier attempt. For the demo's single-failure-path this is fine; if you
    have time, add a lookup against existing edges before inserting.
    """
    missing_concepts = missing_concepts or []

    if not should_trigger_mutation(p_mastery, attempt_count, missing_concepts):
        return MutationResult(
            mutated=False,
            graph_diff_id=None,
            nodes_added=[],
            unmatched_concepts=[],
            reason="threshold not met -- no remediation needed yet",
        )

    concepts = load_corpus_index(corpus_path) if corpus_path else load_corpus_index()
    matches: list[ConceptMatch] = match_all(missing_concepts, concepts)
    unmatched = [
        text for text in missing_concepts
        if not any(m.missing_text == text for m in matches)
    ]

    if not matches:
        # Nothing in the curated corpus covers the reported gap. Don't
        # silently fabricate a node -- report it so the team can decide
        # whether to extend the corpus.
        return MutationResult(
            mutated=False,
            graph_diff_id=None,
            nodes_added=[],
            unmatched_concepts=unmatched,
            reason="no corpus match for any reported gap",
        )

    nodes_added: list[RemedialNodeInsert] = []
    edges_added: list[dict[str, str]] = []

    try:
        for match in matches:
            inserted = insert_remedial_node(
                session,
                graph_id=graph_id,
                blocked_node_id=blocked_node_id,
                label=match.title,
                description=match.description,
                resources=[],  # course/video links: wire in once Member 1/3 confirm a resources source
            )
            nodes_added.append(inserted)
            edges_added.append(
                {"from_node_id": inserted.node_id, "to_node_id": blocked_node_id, "edge_type": "prerequisite"}
            )

        unlock_downstream_nodes(session, graph_id)
        diff_id = write_graph_diff(session, graph_id, trigger_event_id, nodes_added, edges_added)
    except Exception:
        session.rollback()
        raise

    return MutationResult(
        mutated=True,
        graph_diff_id=diff_id,
        nodes_added=nodes_added,
        unmatched_concepts=unmatched,
        reason=f"inserted {len(nodes_added)} remedial node(s) from corpus match",
    )
