from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import (
    goal_router,
    graph_router,
    node_router,
    assessment_router,
    dashboard_router,
)

app = FastAPI(
    title=settings.APP_NAME,
    description="AI-Powered Personalized Learning Path Recommender API (AI-Powered-Learning-Path-Recommender Backend)",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# 4. CORS Middleware allowing all origins (dev only for React frontend integration)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(goal_router)
app.include_router(graph_router)
app.include_router(node_router)
app.include_router(assessment_router)
app.include_router(dashboard_router)

@app.get("/", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": "0.1.0",
        "phase": "Phase 1 - Database Schema & Stub API"
    }
