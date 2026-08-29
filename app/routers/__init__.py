from app.routers.goal import router as goal_router
from app.routers.graph import router as graph_router
from app.routers.node import router as node_router
from app.routers.assessment import router as assessment_router
from app.routers.dashboard import router as dashboard_router

__all__ = [
    "goal_router",
    "graph_router",
    "node_router",
    "assessment_router",
    "dashboard_router",
]
