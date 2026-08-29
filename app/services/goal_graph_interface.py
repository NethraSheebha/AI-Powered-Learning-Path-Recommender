import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.graph import Graph, Node, Edge
from app.services.mastery_engine import initialize_node_bkt_params

# STUB: Member 3 will replace internals only, do not change signature
def generate_graph_from_goal(goal_text: str, learner_id: str, db: Session) -> Graph:
    """
    Generates a personalized learning path graph (nodes and prerequisite edges) for a learner goal.

    ================================================================================
    # STUB: Member 3 will replace internals only, do not change signature
    ================================================================================
    Currently creates a realistic 5-node learning path graph with initial available/locked node statuses
    and BKT parameters initialized via mastery_engine.py, persisting it to PostgreSQL.
    Member 3 will later replace the internal graph-generation logic with a real Gemini LLM engine.
    """
    graph_id = f"graph-{uuid.uuid4().hex[:8]}"
    clean_goal = goal_text.strip() if goal_text else "Backend Engineering"

    # 1. Instantiate Graph
    graph = Graph(
        id=graph_id,
        learner_id=learner_id,
        goal_text=clean_goal,
        created_at=datetime.now(timezone.utc)
    )
    db.add(graph)

    # 2. Define 5 structured nodes
    node_templates = [
        {
            "id": f"node-{uuid.uuid4().hex[:6]}",
            "label": f"{clean_goal}: Core Fundamentals",
            "description": "Master basic syntax, foundational data structures, and environmental setup.",
            "status": "available",  # First node with no prerequisites is available
        },
        {
            "id": f"node-{uuid.uuid4().hex[:6]}",
            "label": f"{clean_goal}: Core Concepts & Protocols",
            "description": "Understand communication protocols, APIs, and key programmatic abstractions.",
            "status": "locked",
        },
        {
            "id": f"node-{uuid.uuid4().hex[:6]}",
            "label": f"{clean_goal}: Data Persistence & SQL",
            "description": "Design relational schemas, manage databases, and optimize query execution.",
            "status": "locked",
        },
        {
            "id": f"node-{uuid.uuid4().hex[:6]}",
            "label": f"{clean_goal}: Advanced Frameworks & Services",
            "description": "Build production-grade web services with dependency injection and error handling.",
            "status": "locked",
        },
        {
            "id": f"node-{uuid.uuid4().hex[:6]}",
            "label": f"{clean_goal}: System Capstone Project",
            "description": "Implement a full end-to-end distributed system matching industry standards.",
            "status": "locked",
        },
    ]

    nodes_created = []
    for tpl in node_templates:
        node = Node(
            id=tpl["id"],
            graph_id=graph_id,
            label=tpl["label"],
            description=tpl["description"],
            status=tpl["status"],
            p_init=0.4,
            p_transit=0.1,
            p_slip=0.1,
            p_guess=0.2,
            p_mastery=0.0,
            rubric=[{
                "id": f"rubric-{uuid.uuid4().hex[:4]}",
                "criterion": "Core Modularity & Implementation",
                "max_points": 100.0,
                "description": "Clean implementation adhering to target architectural standards."
            }],
            resources=[{
                "title": f"Guide to {tpl['label']}",
                "url": "https://docs.ai-learning-path.ai/guide",
                "type": "documentation",
                "duration_minutes": 60
            }]
        )
        # Initialize BKT parameters using mastery_engine service function
        initialize_node_bkt_params(node)
        db.add(node)
        nodes_created.append(node)

    # 3. Define prerequisite edges connecting nodes
    # Node 0 -> Node 1, Node 0 -> Node 2, Node 1 -> Node 3, Node 2 -> Node 3, Node 3 -> Node 4
    edge_pairs = [
        (nodes_created[0].id, nodes_created[1].id),
        (nodes_created[0].id, nodes_created[2].id),
        (nodes_created[1].id, nodes_created[3].id),
        (nodes_created[2].id, nodes_created[3].id),
        (nodes_created[3].id, nodes_created[4].id),
    ]

    for from_id, to_id in edge_pairs:
        edge = Edge(
            id=f"edge-{uuid.uuid4().hex[:6]}",
            graph_id=graph_id,
            from_node_id=from_id,
            to_node_id=to_id,
            edge_type="prerequisite"
        )
        db.add(edge)

    db.commit()
    db.refresh(graph)

    return graph
