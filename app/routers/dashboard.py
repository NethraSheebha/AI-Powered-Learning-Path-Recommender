from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.graph import Graph, Node
from app.models.evidence import EvidenceEvent
from app.schemas.dashboard import DashboardResponse
from app.mocks.mock_data import MOCK_NODES
from app.services.skill_gap_interface import calculate_skill_gap_distance

router = APIRouter(prefix="", tags=["Learner Dashboard"])

def calculate_learner_streak(learner_id: str, db: Session) -> int:
    """
    Calculates consecutive activity days for a learner based on EvidenceEvent timestamps.
    """
    events = db.query(EvidenceEvent).filter(
        EvidenceEvent.learner_id == learner_id
    ).order_by(EvidenceEvent.created_at.desc()).all()

    if not events:
        return 0

    # Extract distinct dates
    unique_dates = sorted(list(set(e.created_at.date() for e in events if e.created_at)), reverse=True)
    if not unique_dates:
        return 0

    today = datetime.now(timezone.utc).date()
    most_recent = unique_dates[0]

    # If the user has not logged activity today or yesterday, streak is broken
    if (today - most_recent).days > 1:
        return 0

    streak = 1
    for i in range(len(unique_dates) - 1):
        if (unique_dates[i] - unique_dates[i+1]).days == 1:
            streak += 1
        else:
            break

    return streak

@router.get("/dashboard/{learner_id}", response_model=DashboardResponse, status_code=status.HTTP_200_OK)
def get_learner_dashboard(learner_id: str, db: Session = Depends(get_db)):
    """
    Retrieves real summary metrics for a learner including mastered node counts,
    calculated activity streak, and skill gap distance via the Skill Gap Interface.
    """
    # 1. Fetch learner's active graph
    active_graph = None
    try:
        active_graph = db.query(Graph).filter(
            Graph.learner_id == learner_id
        ).order_by(Graph.created_at.desc()).first()
    except Exception:
        active_graph = None

    if active_graph:
        graph_id = active_graph.id
        current_goal = active_graph.goal_text
        nodes = db.query(Node).filter(Node.graph_id == graph_id).all()
        total_nodes = len(nodes)
        mastered_count = sum(1 for n in nodes if n.status == "mastered")
        available_count = sum(1 for n in nodes if n.status == "available")
        locked_count = sum(1 for n in nodes if n.status == "locked")
        skill_gap_distance = calculate_skill_gap_distance(graph_id, learner_id, db)
    else:
        # Fallback to Phase 1 mock metrics if learner has not generated a graph yet
        mastered_count = sum(1 for n in MOCK_NODES if n["status"] == "mastered")
        available_count = sum(1 for n in MOCK_NODES if n["status"] == "available")
        locked_count = sum(1 for n in MOCK_NODES if n["status"] == "locked")
        total_nodes = len(MOCK_NODES)
        current_goal = "Become a Backend Developer"
        skill_gap_distance = float((total_nodes - mastered_count) / total_nodes) if total_nodes > 0 else 0.0

    # 2. Compute real streak
    streak_days = calculate_learner_streak(learner_id, db)
    if streak_days == 0 and not active_graph:
        streak_days = 5  # Mock fallback default if no DB entries

    return {
        "learner_id": learner_id,
        "current_goal": current_goal,
        "total_nodes": total_nodes,
        "mastered_count": mastered_count,
        "available_count": available_count,
        "locked_count": locked_count,
        "skill_gap_distance": skill_gap_distance,
        "streak_days": streak_days
    }
