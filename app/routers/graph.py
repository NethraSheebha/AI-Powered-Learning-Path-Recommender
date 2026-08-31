from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.graph import Graph
from app.models.graph_diff import GraphDiff
from app.schemas.graph import GraphResponse
from app.schemas.dashboard import GraphDiffResponse
from app.mocks.mock_data import (
    get_mock_graph_response,
    MOCK_GRAPH_ID,
    MOCK_LEARNER_ID,
)

router = APIRouter(prefix="", tags=["Graph State & Diffs"])

@router.get("/graph/{graph_id}", response_model=GraphResponse, status_code=status.HTTP_200_OK)
def get_graph(graph_id: str, db: Session = Depends(get_db)):
    """
    Fetches the full learning path graph state including nodes, edges, and node statuses.
    """
    db_graph = None
    try:
        db_graph = db.query(Graph).filter(Graph.id == graph_id).first()
    except Exception:
        db_graph = None

    if db_graph:
        return db_graph

    mock_data = get_mock_graph_response(
        learner_id=MOCK_LEARNER_ID,
        goal_text="Become a Backend Developer"
    )
    mock_data["id"] = graph_id
    return mock_data

@router.get("/graph-diff/{graph_id}/latest", response_model=GraphDiffResponse, status_code=status.HTTP_200_OK)
def get_latest_graph_diff(graph_id: str, db: Session = Depends(get_db)):
    """
    Retrieves the latest dynamic graph adaptations (nodes and edges added/modified).
    Queries live GraphDiff table from PostgreSQL, falling back to mock data if no diff exists yet.
    """
    latest_diff = None
    try:
        latest_diff = db.query(GraphDiff).filter(
            GraphDiff.graph_id == graph_id
        ).order_by(GraphDiff.created_at.desc()).first()
    except Exception:
        latest_diff = None

    if latest_diff:
        return {
            "id": latest_diff.id,
            "graph_id": latest_diff.graph_id,
            "trigger_event_id": latest_diff.trigger_event_id,
            "nodes_added": latest_diff.nodes_added or [],
            "edges_added": latest_diff.edges_added or [],
            "created_at": latest_diff.created_at
        }

    return {
        "id": f"diff-{graph_id}-001",
        "graph_id": graph_id,
        "trigger_event_id": "event-quiz-888",
        "nodes_added": [
            {
                "id": "node-remedial-101b",
                "label": "Remedial: Python References & Memory Management",
                "description": "Targeted sub-concept to address identified knowledge gap.",
                "status": "available",
                "p_mastery": 0.10
            }
        ],
        "edges_added": [
            {
                "id": "edge-remedial-001",
                "from_node_id": "node-py-101",
                "to_node_id": "node-remedial-101b",
                "edge_type": "remedial"
            }
        ],
        "created_at": datetime.now(timezone.utc)
    }
