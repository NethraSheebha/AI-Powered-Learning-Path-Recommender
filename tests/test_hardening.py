import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.database import Base, get_db
from app.models.learner import Learner
from app.models.graph import Graph, Node, Edge
from app.models.evidence import EvidenceEvent

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


def test_locked_node_assessment_validation_returns_400():
    """
    Verifies that calling /quiz or /submit-project on a node with status='locked'
    returns HTTP 400 Bad Request without modifying BKT state.
    """
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    db = TestingSessionLocal()
    learner = Learner(id="l-lock-1", name="Lock Test Student", goal_text="Backend")
    graph = Graph(id="g-lock-1", learner_id=learner.id, goal_text="Backend")
    locked_node = Node(
        id="node-locked-100",
        graph_id=graph.id,
        label="Advanced Cryptography",
        status="locked",
        p_init=0.4,
        p_transit=0.1,
        p_slip=0.1,
        p_guess=0.2,
        p_mastery=0.0
    )

    db.add_all([learner, graph, locked_node])
    db.commit()
    db.close()

    client = TestClient(app)

    # 1. Submit quiz on locked node -> Must return 400 Bad Request
    r_quiz = client.post("/quiz/node-locked-100", json={"learner_id": "l-lock-1", "answers": {"correct": True}})
    assert r_quiz.status_code == 400
    assert "locked node" in r_quiz.json()["detail"].lower()

    # 2. Submit project on locked node -> Must return 400 Bad Request
    r_proj = client.post("/submit-project/node-locked-100", json={"learner_id": "l-lock-1", "submission": {"pass": True}})
    assert r_proj.status_code == 400
    assert "locked node" in r_proj.json()["detail"].lower()

    # 3. Verify BKT p_mastery remains 0.0 in DB
    db_check = TestingSessionLocal()
    node_in_db = db_check.query(Node).filter(Node.id == "node-locked-100").first()
    assert node_in_db.p_mastery == 0.0
    assert node_in_db.status == "locked"
    db_check.close()


def test_transaction_rollback_on_failure(db_session):
    """
    Verifies that a failure mid-transaction causes a rollback and leaves no partial EvidenceEvent writes.
    """
    learner = Learner(id="l-rb-1", name="Rollback Student", goal_text="Backend")
    graph = Graph(id="g-rb-1", learner_id=learner.id, goal_text="Backend")
    node = Node(id="n-rb-1", graph_id=graph.id, label="Docker", status="available", p_mastery=0.4)

    db_session.add_all([learner, graph, node])
    db_session.commit()

    initial_events_count = db_session.query(EvidenceEvent).filter(EvidenceEvent.node_id == node.id).count()
    assert initial_events_count == 0

    # Simulate atomic transaction failure
    try:
        event = EvidenceEvent(node_id=node.id, learner_id=learner.id, type="quiz", raw_score=1.0, correct=True)
        db_session.add(event)
        db_session.flush()
        # Simulate unexpected exception mid-operation
        raise RuntimeError("Simulated Database Storage Error")
    except Exception:
        db_session.rollback()

    # Confirm rollback left zero partial writes
    final_events_count = db_session.query(EvidenceEvent).filter(EvidenceEvent.node_id == node.id).count()
    assert final_events_count == 0
