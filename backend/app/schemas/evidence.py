from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field

class QuizRequest(BaseModel):
    learner_id: str = Field(..., example="learner-123-uuid")
    answers: Dict[str, Any] = Field(..., example={"q1": "option_a", "q2": "option_c"})

class QuizResponse(BaseModel):
    node_id: str
    learner_id: str
    raw_score: float
    correct: bool
    status: str  # locked | available | mastered
    p_mastery: float
    newly_unlocked: List[str] = Field(default_factory=list)
    updated_at: datetime

class ProjectSubmitRequest(BaseModel):
    learner_id: str = Field(..., example="learner-123-uuid")
    submission: Dict[str, Any] = Field(
        ...,
        example={
            "github_repo": "https://github.com/example/fastapi-crud",
            "notes": "Implemented async endpoints and PostgreSQL models"
        }
    )

class RubricResultItem(BaseModel):
    criterion_id: str
    criterion: str
    passed: bool
    score: float
    max_score: float
    feedback: str

class ProjectSubmitResponse(BaseModel):
    node_id: str
    learner_id: str
    status: str  # locked | available | mastered
    p_mastery: float
    raw_score: float
    rubric_result: List[Dict[str, Any]]
    graph_diff: Optional[Dict[str, Any]] = None
    updated_at: datetime
