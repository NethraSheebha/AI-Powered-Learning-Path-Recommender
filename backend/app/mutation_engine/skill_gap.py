"""Skill-gap distance for GET /dashboard/{learner_id}.

Per the architecture doc (section 6.6): "Dashboard recalculates skill-gap
distance (remaining unmastered nodes on shortest path to goal-terminal node
-- simple BFS/Dijkstra over the graph, no ML needed)."

Plain BFS is sufficient here since every edge has an implicit weight of 1
(one node = one unit of remaining work). No need for Dijkstra unless the
team later wants weighted edges (e.g. estimated hours per node).
"""

from __future__ import annotations

from collections import defaultdict, deque
from dataclasses import dataclass
from typing import Any

from sqlalchemy.orm import Session

from backend.app.mutation_engine.db_layer import fetch_nodes_and_edges


@dataclass(frozen=True)
class SkillGapResult:
    mastered_count: int
    total_nodes: int
    gap_distance: int  # unmastered nodes remaining on the shortest path to the goal-terminal node
    goal_node_id: str | None


def _find_goal_terminal_node(nodes: list[dict[str, Any]], edges: list[dict[str, Any]]) -> str | None:
    """The goal-terminal node is the one with no outgoing prerequisite edges
    to any other node in the graph, i.e. nothing depends on it further --
    it's the "end" of the path, not a node that unlocks something else.

    Concretely: a node with no incoming edges as a `from_node_id` for edges
    where it is NOT the `to_node_id` of a dead end... simpler framing: it's
    the node that appears as `to_node_id` most terminally, i.e. has no edges
    where it is the `from_node_id`. If several qualify, pick the one with
    the most prerequisites (deepest in the graph) as a reasonable default.
    """
    has_outgoing = {edge["from_node_id"] for edge in edges}
    candidates = [n for n in nodes if n["id"] not in has_outgoing]
    if not candidates:
        return None
    incoming_count = defaultdict(int)
    for edge in edges:
        incoming_count[edge["to_node_id"]] += 1
    return max(candidates, key=lambda n: incoming_count[n["id"]])["id"]


def compute_skill_gap(session: Session, graph_id: str, goal_node_id: str | None = None) -> SkillGapResult:
    """Compute mastered count and remaining BFS distance to the goal node.

    If goal_node_id isn't passed explicitly (e.g. stored on the `graphs` row
    by Member 2), this falls back to inferring it structurally -- confirm
    with Member 2 whether `graphs` already tracks an explicit goal node id,
    since that's more reliable than inference for a real graph with multiple
    dangling leaves.
    """
    nodes, edges = fetch_nodes_and_edges(session, graph_id)
    if not nodes:
        return SkillGapResult(mastered_count=0, total_nodes=0, gap_distance=0, goal_node_id=None)

    mastered_count = sum(1 for n in nodes if n["status"] == "mastered")
    total_nodes = len(nodes)

    terminal_id = goal_node_id or _find_goal_terminal_node(nodes, edges)
    if terminal_id is None:
        return SkillGapResult(mastered_count, total_nodes, gap_distance=total_nodes - mastered_count, goal_node_id=None)

    # Build adjacency for BFS from every mastered node outward, since we want
    # the shortest remaining path FROM the learner's current frontier TO the
    # goal node -- walk prerequisite edges forward (from_node_id -> to_node_id).
    adjacency: dict[str, list[str]] = defaultdict(list)
    for edge in edges:
        adjacency[edge["from_node_id"]].append(edge["to_node_id"])

    status_by_id = {n["id"]: n["status"] for n in nodes}
    mastered_frontier = [n["id"] for n in nodes if n["status"] == "mastered"] or [
        n["id"] for n in nodes if n["status"] == "available"
    ]

    distance = _bfs_shortest_distance(adjacency, mastered_frontier, terminal_id, status_by_id)

    return SkillGapResult(
        mastered_count=mastered_count,
        total_nodes=total_nodes,
        gap_distance=distance,
        goal_node_id=terminal_id,
    )


def _bfs_shortest_distance(
    adjacency: dict[str, list[str]],
    start_nodes: list[str],
    target: str,
    status_by_id: dict[str, str],
) -> int:
    """BFS counting only unmastered nodes along the shortest path to target."""
    if target in start_nodes:
        return 0

    visited = set(start_nodes)
    queue: deque[tuple[str, int]] = deque((n, 0) for n in start_nodes)

    while queue:
        current, dist = queue.popleft()
        for neighbor in adjacency.get(current, []):
            if neighbor in visited:
                continue
            increment = 0 if status_by_id.get(neighbor) == "mastered" else 1
            new_dist = dist + increment
            if neighbor == target:
                return new_dist
            visited.add(neighbor)
            queue.append((neighbor, new_dist))

    # Target unreachable from current frontier via forward edges -- fall back
    # to "everything remaining" so the dashboard shows a sane number instead
    # of crashing.
    return sum(1 for status in status_by_id.values() if status != "mastered")
