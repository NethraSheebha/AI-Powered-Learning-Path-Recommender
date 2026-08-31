from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.graph import Node
from backend.app.schemas.graph import NodeResponse
from backend.app.schemas.dashboard import ExplainResponse
from backend.app.mocks.mock_data import get_mock_node_detail, MOCK_LEARNER_ID
from backend.app.services.explanation_interface import generate_explanation

router = APIRouter(prefix="", tags=["Nodes & Explanations"])

@router.get("/node/{node_id}", response_model=NodeResponse, status_code=status.HTTP_200_OK)
def get_node_detail(node_id: str):
    """
    Fetches detailed metadata for a single node, including resources, grading rubric, and status.
    """
    return get_mock_node_detail(node_id)

@router.get("/explain/{node_id}", response_model=ExplainResponse, status_code=status.HTTP_200_OK)
def explain_node(
    node_id: str,
    learner_id: Optional[str] = Query(default=MOCK_LEARNER_ID),
    db: Session = Depends(get_db)
):
    """
    Provides a pedagogical graph explanation for why a node has a specific status,
    using deterministic backward & forward graph traversal and the explanation phrasing interface.
    """
    # 1. Try fetching node from DB
    db_node = None
    try:
        db_node = db.query(Node).filter(Node.id == node_id).first()
    except Exception:
        db_node = None

    if db_node:
        explanation_text = generate_explanation(db_node.id, db)
        node_status = db_node.status
    else:
        # Fallback to deterministic trace on mock data node label
        node = get_mock_node_detail(node_id)
        node_label = node.get("label", "Selected Skill")
        node_status = node.get("status", "available")
        explanation_text = f"You're working on '{node_label}' because it builds on foundational knowledge and unlocks your target learning goal."

    if node_status == "mastered":
        reason = "Demonstrated mastery in previous assessments."
        action = "Move forward to dependent available topics."
    elif node_status == "available":
        reason = "All prerequisite concepts have been mastered."
        action = "Review resources and attempt the quiz or project submission."
    else:
        reason = "Prerequisite nodes must be mastered first."
        action = "Complete available prerequisite nodes to unlock this module."

    return {
        "node_id": node_id,
        "learner_id": learner_id or MOCK_LEARNER_ID,
        "explanation": explanation_text,
        "status": node_status,
        "status_reason": reason,
        "recommended_action": action
    }
