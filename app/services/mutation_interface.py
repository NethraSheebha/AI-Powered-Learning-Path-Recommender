import uuid
from typing import List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.graph import Node, Edge
from app.models.graph_diff import GraphDiff

# STUB: Member 4 will replace internals only, do not change signature
def trigger_remedial_mutation(
    graph_id: str,
    node_id: str,
    failed_criteria: List[str],
    db: Session,
    trigger_event_id: Optional[str] = None
) -> GraphDiff:
    """
    Triggers a dynamic graph adaptation/mutation when a learner fails a project assessment multiple times.

    ================================================================================
    # STUB: Member 4 will replace internals only, do not change signature
    ================================================================================
    Currently inserts one hardcoded mock remedial node into the database,
    adds a prerequisite edge to the failed node, logs a GraphDiff, and returns it.
    Member 4 will later replace the internal node-selection logic with a real remedial-mapping engine.
    """
    # 1. Fetch target failed node
    failed_node = db.query(Node).filter(Node.id == node_id).first()
    node_label = failed_node.label if failed_node else "Concept"

    # 2. Create new Remedial Node
    remedial_node_id = f"node-remedial-{uuid.uuid4().hex[:8]}"
    criteria_str = ", ".join(failed_criteria) if failed_criteria else "foundational gaps"
    
    remedial_node = Node(
        id=remedial_node_id,
        graph_id=graph_id,
        label=f"Remedial: {node_label} fundamentals",
        description=f"Targeted refresher module addressing identified gaps: {criteria_str}.",
        status="available",
        p_init=0.4,
        p_transit=0.1,
        p_slip=0.1,
        p_guess=0.2,
        p_mastery=0.10,
        rubric=[{
            "id": f"rubric-rem-{uuid.uuid4().hex[:4]}",
            "criterion": "Remedial Fundamentals Mastery",
            "max_points": 100.0,
            "description": "Demonstrate understanding of fundamental prerequisites."
        }],
        resources=[{
            "title": f"Refresher: {node_label} Fundamentals",
            "url": "https://docs.ai-learning-path.ai/remedial-guide",
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

    db.commit()
    db.refresh(graph_diff)

    return graph_diff
