from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field

class ExplainResponse(BaseModel):
    node_id: str
    learner_id: str
    explanation: str
    status: str
    status_reason: str
    recommended_action: str

class DashboardResponse(BaseModel):
    learner_id: str
    current_goal: str
    total_nodes: int
    mastered_count: int
    available_count: int
    locked_count: int
    skill_gap_distance: float  # e.g., 0.60 meaning 60% remaining gap
    streak_days: int

class GraphDiffResponse(BaseModel):
    id: str
    graph_id: str
    trigger_event_id: Optional[str] = None
    nodes_added: List[Dict[str, Any]]
    edges_added: List[Dict[str, Any]]
    created_at: datetime
