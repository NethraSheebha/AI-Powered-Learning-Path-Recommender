"""Postgres access for the Graph Mutation Engine -- SQLAlchemy version.

Written against SQLAlchemy Core (`text()` queries via a Session) rather than
the ORM, so it works regardless of Member 2's exact model class names/columns
-- it only assumes the table/column names from the architecture doc's schema:

  nodes(id, graph_id, label, description, rubric, resources, status,
        p_init, p_transit, p_slip, p_guess, p_mastery)
  edges(id, graph_id, from_node_id, to_node_id, edge_type)
  graph_diffs(id, graph_id, trigger_event_id, nodes_added, edges_added, created_at)

If Member 2 shares their models.py, this can be swapped to plain ORM
`session.add(Node(...))` calls -- functionally identical, just less
defensive about schema drift.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import Any

from sqlalchemy.orm import Session

from backend.app.models.graph import Edge, Node
from backend.app.models.graph_diff import GraphDiff

# Default BKT priors for freshly-inserted remedial nodes. Deliberately
# conservative (low p_init) so a remedial node starts locked behind
# quiz/project evidence rather than defaulting to "available"-ready.
DEFAULT_P_INIT = 0.15
DEFAULT_P_TRANSIT = 0.3
DEFAULT_P_SLIP = 0.1
DEFAULT_P_GUESS = 0.2


@dataclass(frozen=True)
class RemedialNodeInsert:
    """What gets written when a remedial node is inserted."""

    node_id: str
    label: str
    description: str
    resources: list[dict[str, str]]


def insert_remedial_node(
    session: Session,
    graph_id: str,
    blocked_node_id: str,
    label: str,
    description: str,
    resources: list[dict[str, str]] | None = None,
) -> RemedialNodeInsert:
    """Insert one remedial node and wire it as a prerequisite of the failed node.

    Does not commit -- caller controls the transaction boundary (see
    graph_mutation.py, which wraps a full mutation cycle in one commit).
    """
    node_id = str(uuid.uuid4())
    resources = resources or []

    remedial_node = Node(
        id=node_id,
        graph_id=graph_id,
        label=label,
        description=description,
        rubric=[],
        resources=resources,
        status="available",
        p_init=DEFAULT_P_INIT,
        p_transit=DEFAULT_P_TRANSIT,
        p_slip=DEFAULT_P_SLIP,
        p_guess=DEFAULT_P_GUESS,
        p_mastery=0.0,
    )
    session.add(remedial_node)

    remedial_edge = Edge(
        id=str(uuid.uuid4()),
        graph_id=graph_id,
        from_node_id=node_id,
        to_node_id=blocked_node_id,
        edge_type="prerequisite",
    )
    session.add(remedial_edge)

    # The remedial node becomes a prerequisite for the failed node, so the
    # target should stay locked until the new prerequisite is mastered.
    blocked_node = session.query(Node).filter(Node.id == blocked_node_id, Node.graph_id == graph_id).first()
    if blocked_node and blocked_node.status != "mastered":
        blocked_node.status = "locked"
        session.add(blocked_node)

    return RemedialNodeInsert(node_id=node_id, label=label, description=description, resources=resources)


def write_graph_diff(
    session: Session,
    graph_id: str,
    trigger_event_id: str,
    nodes_added: list[RemedialNodeInsert],
    edges_added: list[dict[str, str]],
) -> str:
    """Write one graph_diffs row summarizing everything this mutation added.

    The frontend polls GET /graph-diff/{graph_id}/latest and animates this
    payload directly, so nodes_added/edges_added must be self-contained.
    """
    diff_id = str(uuid.uuid4())
    graph_diff = GraphDiff(
        id=diff_id,
        graph_id=graph_id,
        trigger_event_id=trigger_event_id,
        nodes_added=[n.__dict__ for n in nodes_added],
        edges_added=edges_added,
    )
    session.add(graph_diff)
    session.flush()
    return diff_id


def unlock_downstream_nodes(session: Session, graph_id: str) -> int:
    """Re-run unlock propagation: flip locked->available where all direct
    prerequisite edges point to nodes with status='mastered'.

    Safe to call repeatedly (idempotent). Returns count of nodes unlocked.
    """
    edges = session.query(Edge).filter(Edge.graph_id == graph_id, Edge.edge_type == "prerequisite").all()
    nodes = session.query(Node).filter(Node.graph_id == graph_id).all()
    nodes_by_id = {node.id: node for node in nodes}

    unlocked = 0
    for edge in edges:
        child = nodes_by_id.get(edge.to_node_id)
        if not child or child.status != "locked":
            continue
        prereqs = [
            prereq for prereq in edges
            if prereq.to_node_id == child.id
        ]
        if prereqs and all(nodes_by_id.get(prereq.from_node_id) and nodes_by_id[prereq.from_node_id].status == "mastered" for prereq in prereqs):
            child.status = "available"
            session.add(child)
            unlocked += 1
    if unlocked:
        session.flush()
    return unlocked


def fetch_nodes_and_edges(session: Session, graph_id: str) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Fetch the full node/edge set for a graph -- used by skill_gap.py."""
    nodes = session.query(Node).filter(Node.graph_id == graph_id).all()
    edges = session.query(Edge).filter(Edge.graph_id == graph_id).all()
    return (
        [{"id": node.id, "label": node.label, "status": node.status} for node in nodes],
        [{"from_node_id": edge.from_node_id, "to_node_id": edge.to_node_id} for edge in edges],
    )
