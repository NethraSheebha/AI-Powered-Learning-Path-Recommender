from sqlalchemy.orm import Session
from app.models.graph import Node

# STUB: Member 4 will replace internals only, do not change signature
def calculate_skill_gap_distance(graph_id: str, learner_id: str, db: Session) -> float:
    """
    Calculates the skill gap distance metric for a learner's graph.

    ================================================================================
    # STUB: Member 4 will replace internals only, do not change signature
    ================================================================================
    Currently returns the proportion of non-mastered nodes remaining in the graph.
    Member 4 will later replace this with a real Dijkstra/BFS shortest-path skill gap distance algorithm.
    """
    total_nodes = db.query(Node).filter(Node.graph_id == graph_id).count()
    if total_nodes == 0:
        return 0.0

    mastered_count = db.query(Node).filter(
        Node.graph_id == graph_id,
        Node.status == "mastered"
    ).count()

    remaining_nodes = total_nodes - mastered_count
    return round(float(remaining_nodes / total_nodes), 2)
