import uuid
from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy.orm import Session

from backend.app.mutation_engine.corpus_matcher import load_corpus_index, match_all
from backend.app.models.graph import Edge, Node
from backend.app.models.graph_diff import GraphDiff
from backend.app.services.mastery_engine import DEFAULT_P_INIT, DEFAULT_P_GUESS, DEFAULT_P_SLIP, DEFAULT_P_TRANSIT

# STUB: Member 4 will replace internals only, do not change signature
def trigger_remedial_mutation(
    graph_id: str,
    node_id: str,
    failed_criteria: List[str],
    db: Session,
    trigger_event_id: Optional[str] = None
) -> GraphDiff:
    """Trigger a remedial graph mutation driven by the curated concept corpus."""
    # 1. Fetch target failed node
    failed_node = db.query(Node).filter(Node.id == node_id).first()
    node_label = failed_node.label if failed_node else "Concept"
    criteria_text = [criterion.strip() for criterion in failed_criteria if criterion and criterion.strip()]
    corpus_index = None
    matched_concepts = []
    try:
        corpus_index = load_corpus_index()
        matched_concepts = match_all(criteria_text, corpus_index) if criteria_text else []
    except Exception:
        corpus_index = None
        matched_concepts = []

    matched_titles = list({match.title for match in matched_concepts})
    criteria_str = ", ".join(criteria_text) if criteria_text else "foundational gaps"
    remedial_focus = ", ".join(matched_titles) if matched_titles else criteria_str

    # 2. Create new Remedial Node
    remedial_node_id = f"node-remedial-{uuid.uuid4().hex[:8]}"
    remedial_node = Node(
        id=remedial_node_id,
        graph_id=graph_id,
        label=f"Remedial: {node_label} fundamentals",
        description=f"Targeted refresher module addressing identified gaps: {criteria_str}. Matched corpus focus: {remedial_focus}.",
        status="available",
        p_init=DEFAULT_P_INIT,
        p_transit=DEFAULT_P_TRANSIT,
        p_slip=DEFAULT_P_SLIP,
        p_guess=DEFAULT_P_GUESS,
        p_mastery=0.10,
        rubric=[{
            "id": f"rubric-rem-{uuid.uuid4().hex[:4]}",
            "criterion": "Remedial Fundamentals Mastery",
            "max_points": 100.0,
            "description": "Demonstrate understanding of fundamental prerequisites."
        }],
        resources=[{
            "title": f"Refresher: {node_label} Fundamentals",
            "url": f"local-corpus://{matched_concepts[0].concept_id}" if matched_concepts else "https://docs.ai-learning-path.ai/remedial-guide",
            "type": "documentation",
            "duration_minutes": 30
        }]
    )
    db.add(remedial_node)

    # 3. Add prerequisite edge from Remedial Node -> Failed Node
    remedial_edge_id = f"edge-remedial-{uuid.uuid4().hex[:8]}"
    remedial_edge = Edge(
        id=remedial_edge_id,
        graph_id=graph_id,
        from_node_id=remedial_node_id,
        to_node_id=node_id,
        edge_type="prerequisite"
    )
    db.add(remedial_edge)

    if failed_node and failed_node.status != "mastered":
        failed_node.status = "locked"
        db.add(failed_node)

    # 4. Record GraphDiff entry
    diff_id = f"diff-{uuid.uuid4().hex[:8]}"
    nodes_added_payload = [{
        "id": remedial_node.id,
        "label": remedial_node.label,
        "description": remedial_node.description,
        "status": remedial_node.status,
        "p_mastery": remedial_node.p_mastery
    }]
    edges_added_payload = [{
        "id": remedial_edge.id,
        "from_node_id": remedial_edge.from_node_id,
        "to_node_id": remedial_edge.to_node_id,
        "edge_type": remedial_edge.edge_type
    }]

    graph_diff = GraphDiff(
        id=diff_id,
        graph_id=graph_id,
        trigger_event_id=trigger_event_id,
        nodes_added=nodes_added_payload,
        edges_added=edges_added_payload,
        created_at=datetime.now(timezone.utc)
    )
    db.add(graph_diff)
    db.flush()

    return graph_diff
