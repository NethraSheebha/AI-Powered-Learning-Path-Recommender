import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.graph import Graph, Node, Edge
from app.services.mastery_engine import initialize_node_bkt_params


def _quiz_bank_for_node(label: str, description: str) -> list:
    """Stub 3–4 multiple-choice questions keyed to the node's topic. Not LLM-generated."""
    topic = f"{label} {description}".lower()

    if "persist" in topic or "sql" in topic or "database" in topic:
        return [
            {
                "id": "q1",
                "prompt": "Which SQL statement retrieves rows without modifying the table?",
                "options": ["INSERT", "SELECT", "UPDATE", "DROP"],
                "correct_option_index": 1,
            },
            {
                "id": "q2",
                "prompt": "What does a PRIMARY KEY uniquely identify?",
                "options": ["A database server", "Each row in a table", "A network port", "An HTTP header"],
                "correct_option_index": 1,
            },
            {
                "id": "q3",
                "prompt": "Which relationship is typically modeled with a foreign key?",
                "options": ["A row referencing another table's key", "Two identical primary keys", "A unique index only", "A full table lock"],
                "correct_option_index": 0,
            },
            {
                "id": "q4",
                "prompt": "Why are indexes used on frequently queried columns?",
                "options": ["To encrypt every row", "To speed up lookups", "To replace the primary key", "To delete unused tables"],
                "correct_option_index": 1,
            },
        ]

    if "framework" in topic or "service" in topic:
        return [
            {
                "id": "q1",
                "prompt": "What is dependency injection mainly used for?",
                "options": ["Inlining SQL", "Supplying collaborators without hard-wiring them", "Compressing JSON", "Opening TCP sockets"],
                "correct_option_index": 1,
            },
            {
                "id": "q2",
                "prompt": "A production service should typically return which kind of error payload to clients?",
                "options": ["A stack trace of every frame", "A structured error with a status code", "A raw database dump", "An empty 200 OK"],
                "correct_option_index": 1,
            },
            {
                "id": "q3",
                "prompt": "Which practice helps isolate failing request handling?",
                "options": ["Global mutable singletons only", "Centralized exception handlers", "Disabling logs", "Sharing one DB transaction across all users"],
                "correct_option_index": 1,
            },
        ]

    if "capstone" in topic or "distributed" in topic or "project" in topic:
        return [
            {
                "id": "q1",
                "prompt": "What does an end-to-end system typically include beyond a single function?",
                "options": ["Only a README", "Interfaces, persistence, and failure handling", "A CSS theme", "A single hardcoded list"],
                "correct_option_index": 1,
            },
            {
                "id": "q2",
                "prompt": "Why document service boundaries in a capstone system?",
                "options": ["To hide the goal text", "So teams know what each component owns", "To skip testing", "To disable logging"],
                "correct_option_index": 1,
            },
            {
                "id": "q3",
                "prompt": "Which check best signals production-readiness?",
                "options": ["The UI uses a dark theme", "Health checks, tests, and clear failure modes", "Every file is one line", "No README exists"],
                "correct_option_index": 1,
            },
            {
                "id": "q4",
                "prompt": "What is a common reason to split a monolith during a capstone?",
                "options": ["To add more fonts", "Independent scaling and failure isolation", "To remove HTTP", "To avoid databases"],
                "correct_option_index": 1,
            },
        ]

    if "protocol" in topic or "api" in topic or "http" in topic or "concept" in topic:
        return [
            {
                "id": "q1",
                "prompt": "What HTTP method is idempotent and safe?",
                "options": ["POST", "GET", "PATCH", "CONNECT"],
                "correct_option_index": 1,
            },
            {
                "id": "q2",
                "prompt": "Which status code typically means a resource was created?",
                "options": ["200", "201", "204", "400"],
                "correct_option_index": 1,
            },
            {
                "id": "q3",
                "prompt": "REST APIs usually exchange which payload format?",
                "options": ["WAV audio", "JSON", "Raw EEPROM dumps", "BMP images"],
                "correct_option_index": 1,
            },
            {
                "id": "q4",
                "prompt": "Which header commonly describes the body media type?",
                "options": ["Content-Type", "Host-Only", "X-Frame-Count", "Accept-Encoding-Only"],
                "correct_option_index": 0,
            },
        ]

    return [
        {
            "id": "q1",
            "prompt": f"What is the first practical step when starting '{label}'?",
            "options": ["Skip setup and guess APIs", "Learn core syntax and set up the environment", "Deploy to production immediately", "Delete documentation"],
            "correct_option_index": 1,
        },
        {
            "id": "q2",
            "prompt": "Why do foundational data structures matter early?",
            "options": ["They replace version control", "Later topics assume you can store and traverse data", "They disable HTTP", "They only apply to CSS"],
            "correct_option_index": 1,
        },
        {
            "id": "q3",
            "prompt": "Which habit reduces environment-related blockers?",
            "options": ["Never pin versions", "Reproduce the project with a documented setup", "Use a different language every file", "Ignore error messages"],
            "correct_option_index": 1,
        },
        {
            "id": "q4",
            "prompt": "What should you do when a basic example fails locally?",
            "options": ["Ignore it and move to distributed systems", "Read the error and fix the environment or syntax", "Comment out the interpreter", "Change the learning goal"],
            "correct_option_index": 1,
        },
    ]

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
            }],
            quiz_questions=_quiz_bank_for_node(tpl["label"], tpl["description"]),
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
