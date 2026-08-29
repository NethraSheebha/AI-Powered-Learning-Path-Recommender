"""
================================================================================
AI-Powered-Learning-Path-Recommender Unlock Engine - Prerequisite & Remedial Graph Unlock Propagation
================================================================================
"""

from typing import List, Set, Any
from sqlalchemy.orm import Session
from backend.app.models.graph import Node, Edge

def propagate_unlocks(graph_id: str, node_id: str, db: Session) -> List[str]:
    """
    After a node crosses the mastery threshold and is marked 'mastered', checks all downstream
    nodes where this node is a prerequisite ('from_node_id').

    For each downstream child node:
      - Checks if ALL its prerequisite edges point from nodes with status == 'mastered'.
      - If ALL prerequisites are mastered, flips the child node's status from 'locked' to 'available'.
      - Handles recursive unlock cascades if newly unlocked nodes trigger further downstream unlocks.

    Returns a list of newly unlocked node IDs.
    """
    newly_unlocked_ids: List[str] = []
    visited_nodes: Set[str] = set()

    def _unlock_recursive(current_node_id: str):
        if current_node_id in visited_nodes:
            return
        visited_nodes.add(current_node_id)

        # 1. Find outgoing prerequisite edges from current_node_id
        outgoing_edges = db.query(Edge).filter(
            Edge.graph_id == graph_id,
            Edge.from_node_id == current_node_id,
            Edge.edge_type == "prerequisite"
        ).all()

        for edge in outgoing_edges:
            child_node_id = edge.to_node_id
            child_node = db.query(Node).filter(
                Node.id == child_node_id,
                Node.graph_id == graph_id
            ).first()

            if not child_node or child_node.status != "locked":
                continue

            # 2. Check ALL incoming prerequisite edges for child_node
            prereq_edges = db.query(Edge).filter(
                Edge.graph_id == graph_id,
                Edge.to_node_id == child_node_id,
                Edge.edge_type == "prerequisite"
            ).all()

            all_prereqs_mastered = True
            for prereq in prereq_edges:
                parent_node = db.query(Node).filter(
                    Node.id == prereq.from_node_id,
                    Node.graph_id == graph_id
                ).first()

                if not parent_node or parent_node.status != "mastered":
                    all_prereqs_mastered = False
                    break

            # 3. If ALL prerequisites are mastered, unlock the child node
            if all_prereqs_mastered:
                child_node.status = "available"
                db.add(child_node)
                newly_unlocked_ids.append(child_node.id)

                # 4. Recurse in case this newly available node triggers downstream cascades
                _unlock_recursive(child_node.id)

    _unlock_recursive(node_id)
    
    if newly_unlocked_ids:
        db.commit()

    return newly_unlocked_ids
