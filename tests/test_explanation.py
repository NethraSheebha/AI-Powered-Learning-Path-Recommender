import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.database import Base
from app.models.learner import Learner
from app.models.graph import Graph, Node, Edge
from app.services.explanation_interface import (
    build_graph_explanation_trace,
    format_explanation_phrasing,
    generate_explanation,
)

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


def test_explanation_middle_node_with_prereqs_and_unlocks(db_session):
    """
    Setup Topology: Root (Node A) -> Middle (Node B) -> Leaf (Node C)
    Tests explanation trace & string generation for Node B.
    """
    learner = Learner(id="l-exp-1", name="Exp Learner", goal_text="Backend")
    graph = Graph(id="g-exp-1", learner_id=learner.id, goal_text="Backend")
    
    node_a = Node(id="node-a", graph_id=graph.id, label="Python Basics", status="mastered")
    node_b = Node(id="node-b", graph_id=graph.id, label="REST API Design", status="available")
    node_c = Node(id="node-c", graph_id=graph.id, label="FastAPI Services", status="locked")

    edge_ab = Edge(id="e-ab", graph_id=graph.id, from_node_id=node_a.id, to_node_id=node_b.id, edge_type="prerequisite")
    edge_bc = Edge(id="e-bc", graph_id=graph.id, from_node_id=node_b.id, to_node_id=node_c.id, edge_type="prerequisite")

    db_session.add_all([learner, graph, node_a, node_b, node_c, edge_ab, edge_bc])
    db_session.commit()

    trace = build_graph_explanation_trace(node_b.id, db_session)

    # Verify trace structure
    assert trace["node_label"] == "REST API Design"
    assert "Python Basics" in trace["prerequisites"]
    assert "FastAPI Services" in trace["unlocks"]

    # Verify phrasing string output
    exp_str = format_explanation_phrasing(trace)
    assert "REST API Design" in exp_str
    assert "Python Basics" in exp_str
    assert "FastAPI Services" in exp_str


def test_explanation_root_node_no_prerequisites(db_session):
    """
    Setup Topology: Root (Node A) -> Child (Node B)
    Tests explanation trace for Root node A (has 0 prerequisites).
    """
    learner = Learner(id="l-exp-2", name="Exp Learner", goal_text="Backend")
    graph = Graph(id="g-exp-2", learner_id=learner.id, goal_text="Backend")
    
    node_a = Node(id="node-root", graph_id=graph.id, label="Python Basics", status="available")
    node_b = Node(id="node-child", graph_id=graph.id, label="REST APIs", status="locked")
    edge_ab = Edge(id="e-root-child", graph_id=graph.id, from_node_id=node_a.id, to_node_id=node_b.id, edge_type="prerequisite")

    db_session.add_all([learner, graph, node_a, node_b, edge_ab])
    db_session.commit()

    trace = build_graph_explanation_trace(node_a.id, db_session)
    assert len(trace["prerequisites"]) == 0
    assert "REST APIs" in trace["unlocks"]

    exp_str = generate_explanation(node_a.id, db_session)
    assert "foundational knowledge" in exp_str
    assert "REST APIs" in exp_str


def test_explanation_leaf_node_nothing_downstream(db_session):
    """
    Setup Topology: Parent (Node A) -> Leaf (Node B)
    Tests explanation trace for Leaf node B (has 0 downstream unlocks).
    """
    learner = Learner(id="l-exp-3", name="Exp Learner", goal_text="Backend")
    graph = Graph(id="g-exp-3", learner_id=learner.id, goal_text="Backend")
    
    node_a = Node(id="node-parent", graph_id=graph.id, label="PostgreSQL", status="mastered")
    node_b = Node(id="node-leaf", graph_id=graph.id, label="Capstone Microservice", status="available")
    edge_ab = Edge(id="e-parent-leaf", graph_id=graph.id, from_node_id=node_a.id, to_node_id=node_b.id, edge_type="prerequisite")

    db_session.add_all([learner, graph, node_a, node_b, edge_ab])
    db_session.commit()

    trace = build_graph_explanation_trace(node_b.id, db_session)
    assert "PostgreSQL" in trace["prerequisites"]
    assert len(trace["unlocks"]) == 0

    exp_str = generate_explanation(node_b.id, db_session)
    assert "PostgreSQL" in exp_str
    assert "target learning goal" in exp_str
