import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.database import Base
from backend.app.models.learner import Learner
from backend.app.models.graph import Graph, Node, Edge
from backend.app.services.unlock_engine import propagate_unlocks

@pytest.fixture
def db_session():
    # Use SQLite in-memory database for unit tests
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    try:
        yield session
    finally:
        session.close()


def test_unlock_propagation_requires_all_prerequisites(db_session):
    """
    Setup Graph topology:
      Node A (Prereq 1) ---\
                            ---> Node C (Target, locked)
      Node B (Prereq 2) ---/

    Test Scenario 1: Only Node A is mastered -> Node C remains LOCKED.
    Test Scenario 2: Node B is ALSO mastered -> Node C flips to AVAILABLE.
    """
    # 1. Seed Learner & Graph
    learner = Learner(id="test-learner-1", name="Test Student", goal_text="Master Backend")
    graph = Graph(id="test-graph-1", learner_id=learner.id, goal_text="Master Backend")
    db_session.add_all([learner, graph])
    db_session.commit()

    # 2. Seed Nodes
    node_a = Node(id="node-a", graph_id=graph.id, label="Python Fundamentals", status="mastered")
    node_b = Node(id="node-b", graph_id=graph.id, label="REST APIs", status="available")
    node_c = Node(id="node-c", graph_id=graph.id, label="FastAPI Advanced", status="locked")

    # 3. Seed Edges (Node A -> Node C, Node B -> Node C)
    edge_a_c = Edge(id="edge-ac", graph_id=graph.id, from_node_id=node_a.id, to_node_id=node_c.id, edge_type="prerequisite")
    edge_b_c = Edge(id="edge-bc", graph_id=graph.id, from_node_id=node_b.id, to_node_id=node_c.id, edge_type="prerequisite")

    db_session.add_all([node_a, node_b, node_c, edge_a_c, edge_b_c])
    db_session.commit()

    # --- SCENARIO 1: Propagate unlock from Node A (Node B is still not mastered) ---
    unlocked_1 = propagate_unlocks(graph.id, node_a.id, db_session)
    db_session.refresh(node_c)

    # Node C must NOT be in unlocked list and MUST remain 'locked'
    assert "node-c" not in unlocked_1
    assert node_c.status == "locked"

    # --- SCENARIO 2: Mark Node B as mastered and propagate unlock from Node B ---
    node_b.status = "mastered"
    db_session.add(node_b)
    db_session.commit()

    unlocked_2 = propagate_unlocks(graph.id, node_b.id, db_session)
    db_session.refresh(node_c)

    # Node C MUST now be unlocked and flipped to 'available'
    assert "node-c" in unlocked_2
    assert node_c.status == "available"
