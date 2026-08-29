import pytest
from datetime import datetime, timezone, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.database import Base
from app.models.learner import Learner
from app.models.graph import Graph, Node, Edge
from app.models.evidence import EvidenceEvent
from app.services.goal_graph_interface import generate_graph_from_goal
from app.routers.dashboard import calculate_learner_streak
from app.services.skill_gap_interface import calculate_skill_gap_distance

@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    try:
        yield session
    finally:
        session.close()


def test_generate_graph_from_goal_persists_nodes_and_edges(db_session):
    """
    Verifies that generate_graph_from_goal creates a real 5-node graph with initial
    available/locked node states and BKT parameters in PostgreSQL/SQLite.
    """
    learner = Learner(id="l-goal-1", name="Goal Student", goal_text="DevOps Engineering")
    db_session.add(learner)
    db_session.commit()

    graph = generate_graph_from_goal("DevOps Engineering", learner.id, db_session)

    assert graph is not None
    assert graph.learner_id == learner.id
    assert graph.goal_text == "DevOps Engineering"

    # Query nodes created in DB
    nodes_in_db = db_session.query(Node).filter(Node.graph_id == graph.id).all()
    assert len(nodes_in_db) == 5

    # Root node (index 0) must be available, downstream nodes locked
    available_nodes = [n for n in nodes_in_db if n.status == "available"]
    locked_nodes = [n for n in nodes_in_db if n.status == "locked"]

    assert len(available_nodes) == 1
    assert len(locked_nodes) == 4

    # Verify BKT parameters initialized on all nodes
    for node in nodes_in_db:
        assert node.p_init == 0.4
        assert node.p_transit == 0.1
        assert node.p_slip == 0.1
        assert node.p_guess == 0.2

    # Query edges created in DB
    edges_in_db = db_session.query(Edge).filter(Edge.graph_id == graph.id).all()
    assert len(edges_in_db) == 5


def test_dashboard_streak_calculation(db_session):
    """
    Verifies that calculate_learner_streak counts consecutive days with EvidenceEvents.
    """
    learner = Learner(id="l-streak-1", name="Streak Learner", goal_text="Backend")
    db_session.add(learner)
    db_session.commit()

    now = datetime.now(timezone.utc)
    # Add events on 3 consecutive days: today, yesterday, and 2 days ago
    e1 = EvidenceEvent(node_id="n1", learner_id=learner.id, type="quiz", raw_score=1.0, correct=True, created_at=now)
    e2 = EvidenceEvent(node_id="n1", learner_id=learner.id, type="quiz", raw_score=1.0, correct=True, created_at=now - timedelta(days=1))
    e3 = EvidenceEvent(node_id="n1", learner_id=learner.id, type="quiz", raw_score=1.0, correct=True, created_at=now - timedelta(days=2))

    db_session.add_all([e1, e2, e3])
    db_session.commit()

    streak = calculate_learner_streak(learner.id, db_session)
    assert streak == 3
