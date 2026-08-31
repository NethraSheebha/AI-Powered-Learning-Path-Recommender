from datetime import datetime, timezone
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.learner import Learner
from app.schemas.graph import GoalRequest, GraphResponse
from app.services.goal_graph_interface import generate_graph_from_goal

router = APIRouter(prefix="", tags=["Goal & Path Generation"])

@router.post("/goal", response_model=GraphResponse, status_code=status.HTTP_201_CREATED)
def create_learning_goal(payload: GoalRequest, db: Session = Depends(get_db)):
    """
    Accepts a learner ID and goal text, auto-creates the learner profile if missing,
    and invokes generate_graph_from_goal (Member 3 stub interface) to persist a real learning graph in PostgreSQL.
    """
    # 1. Check/auto-create learner record for foreign key safety
    learner = None
    try:
        learner = db.query(Learner).filter(Learner.id == payload.learner_id).first()
    except Exception:
        learner = None

<<<<<<< HEAD
    if not learner:
        learner = Learner(
            id=payload.learner_id,
            name="Learner Profile",
=======
    display_name = (payload.name or "").strip()

    if not learner:
        learner = Learner(
            id=payload.learner_id,
            name=display_name or "Learner Profile",
>>>>>>> main
            goal_text=payload.goal_text,
            created_at=datetime.now(timezone.utc)
        )
        db.add(learner)
        db.commit()
<<<<<<< HEAD
=======
    else:
        if display_name:
            learner.name = display_name
        learner.goal_text = payload.goal_text
        db.add(learner)
        db.commit()
>>>>>>> main

    # 2. Generate and persist graph in DB
    graph = generate_graph_from_goal(payload.goal_text, payload.learner_id, db)
    return graph
