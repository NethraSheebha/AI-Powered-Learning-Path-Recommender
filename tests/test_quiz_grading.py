import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.database import Base, get_db
from app.models.learner import Learner
from app.models.graph import Graph, Node


SAMPLE_QUESTIONS = [
    {
        "id": "q1",
        "prompt": "What HTTP method is idempotent and safe?",
        "options": ["POST", "GET", "PATCH", "DELETE"],
        "correct_option_index": 1,
    },
    {
        "id": "q2",
        "prompt": "Which status code typically means created?",
        "options": ["200", "201", "400", "500"],
        "correct_option_index": 1,
    },
    {
        "id": "q3",
        "prompt": "REST APIs usually exchange which format?",
        "options": ["WAV", "JSON", "BMP", "MIDI"],
        "correct_option_index": 1,
    },
    {
        "id": "q4",
        "prompt": "Which header describes the body media type?",
        "options": ["Content-Type", "Host-Only", "X-Count", "Via-Only"],
        "correct_option_index": 0,
    },
]


@pytest.fixture
def client_and_session():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
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
    learner = Learner(id="l-quiz-1", name="Quiz Student", goal_text="HTTP")
    graph = Graph(id="g-quiz-1", learner_id=learner.id, goal_text="HTTP")
    node = Node(
        id="node-quiz-available",
        graph_id=graph.id,
        label="HTTP Protocol & REST API Design",
        description="Understand HTTP verbs and REST.",
        status="available",
        p_init=0.4,
        p_transit=0.1,
        p_slip=0.1,
        p_guess=0.2,
        p_mastery=0.4,
        quiz_questions=SAMPLE_QUESTIONS,
    )
    db.add_all([learner, graph, node])
    db.commit()
    db.close()

    client = TestClient(app)
    yield client, TestingSessionLocal
    app.dependency_overrides.clear()


def test_quiz_grading_mixed_answers_fails_below_threshold(client_and_session):
    client, TestingSessionLocal = client_and_session
    # 2 of 4 correct = 50% -> observation is incorrect for BKT
    response = client.post(
        "/quiz/node-quiz-available",
        json={
            "learner_id": "l-quiz-1",
            "answers": [
                {"question_id": "q1", "selected_option_index": 1},
                {"question_id": "q2", "selected_option_index": 0},
                {"question_id": "q3", "selected_option_index": 1},
                {"question_id": "q4", "selected_option_index": 2},
            ],
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["correct"] is False
    assert body["raw_score"] == pytest.approx(0.5)

    db = TestingSessionLocal()
    node = db.query(Node).filter(Node.id == "node-quiz-available").first()
    assert node.p_mastery != 0.4
    db.close()


def test_quiz_grading_pass_at_seventy_percent(client_and_session):
    client, _ = client_and_session
    # 3 of 4 = 75% -> correct observation
    response = client.post(
        "/quiz/node-quiz-available",
        json={
            "learner_id": "l-quiz-1",
            "answers": [
                {"question_id": "q1", "selected_option_index": 1},
                {"question_id": "q2", "selected_option_index": 1},
                {"question_id": "q3", "selected_option_index": 1},
                {"question_id": "q4", "selected_option_index": 3},
            ],
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["correct"] is True
    assert body["raw_score"] == pytest.approx(0.75)


def test_get_node_strips_correct_option_index(client_and_session):
    client, _ = client_and_session
    response = client.get("/node/node-quiz-available")
    assert response.status_code == 200
    body = response.json()
    raw = response.text
    assert "quiz_questions" in body
    assert len(body["quiz_questions"]) == 4
    assert "correct_option_index" not in raw
    assert body.get("evidence_count") == 0
    for question in body["quiz_questions"]:
        assert set(question.keys()) == {"id", "prompt", "options"}
        assert "correct_option_index" not in question
