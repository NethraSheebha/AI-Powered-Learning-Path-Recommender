from collections import defaultdict, deque

from sqlalchemy.orm import Session

from backend.app.models.graph import Edge, Node

# STUB: Member 4 will replace internals only, do not change signature
def calculate_skill_gap_distance(graph_id: str, learner_id: str, db: Session) -> float:
    """
    Calculates the skill gap distance metric for a learner's graph.

    ================================================================================
    # STUB: Member 4 will replace internals only, do not change signature
    ================================================================================
    Computes a normalized shortest-path distance from the learner's mastered
    frontier to the terminal goal node, then scales it to a 0.0-1.0 score.
    """
    nodes = db.query(Node).filter(Node.graph_id == graph_id).all()
    edges = db.query(Edge).filter(Edge.graph_id == graph_id, Edge.edge_type == "prerequisite").all()
    total_nodes = len(nodes)
    if total_nodes == 0:
        return 0.0

    status_by_id = {node.id: node.status for node in nodes}
    mastered_count = sum(1 for status in status_by_id.values() if status == "mastered")

    adjacency: dict[str, list[str]] = defaultdict(list)
    outgoing_ids = set()
    incoming_counts: dict[str, int] = defaultdict(int)
    for edge in edges:
        adjacency[edge.from_node_id].append(edge.to_node_id)
        outgoing_ids.add(edge.from_node_id)
        incoming_counts[edge.to_node_id] += 1

    terminal_candidates = [node.id for node in nodes if node.id not in outgoing_ids]
    if not terminal_candidates:
        remaining_nodes = total_nodes - mastered_count
        return round(float(remaining_nodes / total_nodes), 2)

    terminal_id = max(terminal_candidates, key=lambda node_id: incoming_counts[node_id])
    frontier = [node.id for node in nodes if node.status == "mastered"] or [
        node.id for node in nodes if node.status == "available"
    ]

    if terminal_id in frontier:
        return 0.0

    visited = set(frontier)
    queue = deque((node_id, 0) for node_id in frontier)
    gap_steps = None

    while queue:
        current, cost = queue.popleft()
        for neighbor in adjacency.get(current, []):
            if neighbor in visited:
                continue
            next_cost = cost if status_by_id.get(neighbor) == "mastered" else cost + 1
            if neighbor == terminal_id:
                gap_steps = next_cost
                queue.clear()
                break
            visited.add(neighbor)
            queue.append((neighbor, next_cost))

    if gap_steps is None:
        gap_steps = total_nodes - mastered_count

    return round(float(gap_steps / total_nodes), 2)
