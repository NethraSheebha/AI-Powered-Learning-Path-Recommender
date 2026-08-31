from typing import List, Optional, Any, Dict
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

class GoalRequest(BaseModel):
    learner_id: str = Field(..., example="learner-123-uuid")
<<<<<<< HEAD
    goal_text: str = Field(..., example="Become a Backend Developer")
=======
    name: Optional[str] = Field(None, example="Alex")
    goal_text: str = Field(..., example="Become a Backend Developer")
    experience_level: Optional[str] = Field(None, example="Complete beginner")


class QuizQuestionPublic(BaseModel):
    """Quiz item as returned to the client — never includes the correct index."""
    id: str
    prompt: str
    options: List[str]
>>>>>>> main

class RubricItem(BaseModel):
    id: str
    criterion: str
    max_points: float
    description: str

class ResourceItem(BaseModel):
    title: str
    url: str
    type: str  # video, documentation, course, article
    duration_minutes: Optional[int] = None

class NodeResponse(BaseModel):
    id: str
    graph_id: str
    label: str
    description: Optional[str] = None
    status: str  # locked | available | mastered
    p_init: float
    p_transit: float
    p_slip: float
    p_guess: float
    p_mastery: float
    rubric: Optional[List[Dict[str, Any]]] = None
    resources: Optional[List[Dict[str, Any]]] = None
<<<<<<< HEAD
=======
    quiz_questions: Optional[List[QuizQuestionPublic]] = None
    evidence_count: Optional[int] = None
>>>>>>> main

    model_config = ConfigDict(from_attributes=True)

class EdgeResponse(BaseModel):
    id: str
    graph_id: str
    from_node_id: str
    to_node_id: str
    edge_type: str  # prerequisite | remedial

    model_config = ConfigDict(from_attributes=True)

class GraphResponse(BaseModel):
    id: str
    learner_id: str
    goal_text: str
    created_at: datetime
    nodes: List[NodeResponse]
    edges: List[EdgeResponse]

    model_config = ConfigDict(from_attributes=True)
