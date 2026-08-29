import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.database import Base
from app.models.learner import Learner
from app.models.graph import Graph, Node, Edge
from app.models.evidence import EvidenceEvent
from app.models.graph_diff import GraphDiff
from app.services.rubric_interface import score_submission_against_rubric
from app.services.mutation_interface import trigger_remedial_mutation

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


def test_score_submission_against_rubric_passing():
    """
    Verifies rubric scoring for a passing submission.
    """
    node = {"label": "FastAPI CRUD Project"}
    submission = {"github_repo": "https://github.com/test/repo", "notes": "All features implemented"}
    result = score_submission_against_rubric(node, submission)

    assert result.meets_threshold is True
    assert result.overall_score >= 0.70
    assert len(result.criteria_results) > 0


def test_score_submission_against_rubric_failing():
    """
    Verifies rubric scoring for a failing submission.
    """
    node = {"label": "FastAPI CRUD Project"}
    submission = {"fail": True}
    result = score_submission_against_rubric(node, submission)

    assert result.meets_threshold is False
    assert result.overall_score < 0.70


def test_trigger_remedial_mutation_inserts_node_edge_diff(db_session):
    """
    Verifies that trigger_remedial_mutation inserts a remedial node, a prerequisite edge,
    and a GraphDiff record into the DB.
    """
    # 1. Seed base graph and failed node
    learner = Learner(id="learner-mut-1", name="Test Learner", goal_text="Backend")
    graph = Graph(id="graph-mut-1", learner_id=learner.id, goal_text="Backend")
    failed_node = Node(id="node-failed-1", graph_id=graph.id, label="SQL Joins", status="available")
    
    db_session.add_all([learner, graph, failed_node])
    db_session.commit()

    # 2. Trigger remedial mutation
    failed_criteria = ["Core Architecture & Modularity"]
    diff = trigger_remedial_mutation(
        graph_id=graph.id,
        node_id=failed_node.id,
        failed_criteria=failed_criteria,
        db=db_session
    )

    # 3. Verify GraphDiff record created
    assert diff is not None
    assert diff.graph_id == graph.id
    assert len(diff.nodes_added) == 1
    assert len(diff.edges_added) == 1

    # 4. Verify remedial Node created in DB
    remedial_node_id = diff.nodes_added[0]["id"]
    remedial_node_in_db = db_session.query(Node).filter(Node.id == remedial_node_id).first()
    assert remedial_node_in_db is not None
    assert "Remedial:" in remedial_node_in_db.label
    assert remedial_node_in_db.status == "available"

    # 5. Verify prerequisite Edge created in DB pointing from remedial node -> failed node
    remedial_edge_id = diff.edges_added[0]["id"]
    remedial_edge_in_db = db_session.query(Edge).filter(Edge.id == remedial_edge_id).first()
    assert remedial_edge_in_db is not None
    assert remedial_edge_in_db.from_node_id == remedial_node_id
    assert remedial_edge_in_db.to_node_id == failed_node.id
    assert remedial_edge_in_db.edge_type == "prerequisite"
