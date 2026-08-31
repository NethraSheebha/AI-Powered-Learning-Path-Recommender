from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.database import Base
from backend.app.models.graph import Edge, Graph, Node
from backend.app.services.mutation_interface import trigger_remedial_mutation
from backend.app.services.skill_gap_interface import calculate_skill_gap_distance


def _session():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(bind=engine)
    return sessionmaker(bind=engine)()


def test_trigger_remedial_mutation_locks_target_node():
    session = _session()
    graph = Graph(id="graph-mutation-1", learner_id="learner-1", goal_text="Backend")
    target = Node(id="node-target-1", graph_id=graph.id, label="API Design", status="available", p_mastery=0.2)
    session.add_all([graph, target])
    session.commit()

    diff = trigger_remedial_mutation(
        graph_id=graph.id,
        node_id=target.id,
        failed_criteria=["API contract design"],
        db=session,
        trigger_event_id="event-1",
    )

    refreshed_target = session.query(Node).filter(Node.id == target.id).first()
    created_node = session.query(Node).filter(Node.id == diff.nodes_added[0]["id"]).first()
    created_edge = session.query(Edge).filter(Edge.id == diff.edges_added[0]["id"]).first()

    assert diff.graph_id == graph.id
    assert refreshed_target.status == "locked"
    assert created_node is not None
    assert created_edge is not None
    assert created_edge.edge_type == "prerequisite"
    session.close()


def test_skill_gap_distance_uses_shortest_prerequisite_path():
    session = _session()
    graph = Graph(id="graph-gap-1", learner_id="learner-2", goal_text="Backend")
    nodes = [
        Node(id="node-a", graph_id=graph.id, label="A", status="mastered"),
        Node(id="node-b", graph_id=graph.id, label="B", status="available"),
        Node(id="node-c", graph_id=graph.id, label="C", status="locked"),
        Node(id="node-d", graph_id=graph.id, label="D", status="locked"),
    ]
    edges = [
        Edge(id="edge-ab", graph_id=graph.id, from_node_id="node-a", to_node_id="node-b", edge_type="prerequisite"),
        Edge(id="edge-bd", graph_id=graph.id, from_node_id="node-b", to_node_id="node-d", edge_type="prerequisite"),
        Edge(id="edge-ac", graph_id=graph.id, from_node_id="node-a", to_node_id="node-c", edge_type="prerequisite"),
        Edge(id="edge-cd", graph_id=graph.id, from_node_id="node-c", to_node_id="node-d", edge_type="prerequisite"),
    ]
    session.add(graph)
    session.add_all(nodes + edges)
    session.commit()

    gap = calculate_skill_gap_distance(graph.id, "learner-2", session)

    assert gap == 0.5
    session.close()
