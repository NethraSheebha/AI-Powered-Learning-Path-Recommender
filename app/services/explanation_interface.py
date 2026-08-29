from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.graph import Node, Edge

def build_graph_explanation_trace(node_id: str, db: Session) -> Dict[str, Any]:
    """
    Performs a deterministic graph traversal around node_id:
    - Backward traversal: Finds all direct prerequisite nodes pointing into node_id.
    - Forward traversal: Finds all downstream nodes that node_id unlocks.

    Returns a structured trace object:
    {
        "node_id": str,
        "node_label": str,
        "prerequisites": List[str],
        "unlocks": List[str]
    }
    """
    node = db.query(Node).filter(Node.id == node_id).first()
    node_label = node.label if node else "Selected Concept"

    # Backward traversal: incoming prerequisite edges
    incoming_edges = db.query(Edge).filter(
        Edge.to_node_id == node_id,
        Edge.edge_type == "prerequisite"
    ).all()
    
    prereq_labels: List[str] = []
    for edge in incoming_edges:
        parent_node = db.query(Node).filter(Node.id == edge.from_node_id).first()
        if parent_node:
            prereq_labels.append(parent_node.label)

    # Forward traversal: outgoing prerequisite edges
    outgoing_edges = db.query(Edge).filter(
        Edge.from_node_id == node_id,
        Edge.edge_type == "prerequisite"
    ).all()

    unlock_labels: List[str] = []
    for edge in outgoing_edges:
        child_node = db.query(Node).filter(Node.id == edge.to_node_id).first()
        if child_node:
            unlock_labels.append(child_node.label)

    return {
        "node_id": node_id,
        "node_label": node_label,
        "prerequisites": prereq_labels,
        "unlocks": unlock_labels
    }


# STUB: Member 3 will replace internals only, do not change signature
def format_explanation_phrasing(trace: Dict[str, Any]) -> str:
    """
    Formats the structured graph explanation trace into a human-readable string.

    ================================================================================
    # STUB: Member 3 will replace internals only, do not change signature
    ================================================================================
    Member 3 will later replace ONLY this templating step with a Gemini LLM phrasing call.
    The trace object structure passed to this function must not change.
    """
    node_label = trace.get("node_label", "this concept")
    prereqs = trace.get("prerequisites", [])
    unlocks = trace.get("unlocks", [])

    if prereqs:
        prereq_str = ", ".join(f"'{p}'" for p in prereqs)
    else:
        prereq_str = "foundational knowledge"

    if unlocks:
        unlock_str = ", ".join(f"'{u}'" for u in unlocks)
    else:
        unlock_str = "your target learning goal"

    return f"You're working on '{node_label}' because it builds on {prereq_str} and unlocks {unlock_str}."


def generate_explanation(node_id: str, db: Session) -> str:
    """
    Main entry point for generating a graph explanation for a node.
    Combines deterministic graph trace traversal with the phrasing engine.
    """
    trace = build_graph_explanation_trace(node_id, db)
    return format_explanation_phrasing(trace)
