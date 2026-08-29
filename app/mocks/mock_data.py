from datetime import datetime, timezone

MOCK_GRAPH_ID = "graph-backend-dev-001"
MOCK_LEARNER_ID = "learner-dev-999"

MOCK_NODES = [
    {
        "id": "node-py-101",
        "graph_id": MOCK_GRAPH_ID,
        "label": "Python Fundamentals & Data Structures",
        "description": "Master core Python syntax, OOP concepts, list comprehensions, and error handling.",
        "status": "mastered",
        "p_init": 0.15,
        "p_transit": 0.20,
        "p_slip": 0.05,
        "p_guess": 0.10,
        "p_mastery": 0.95,
        "rubric": [
            {
                "id": "rubric-py-1",
                "criterion": "Control Flow & OOP Structure",
                "max_points": 50.0,
                "description": "Clean modular code using classes and proper exception handling."
            },
            {
                "id": "rubric-py-2",
                "criterion": "Data Manipulation",
                "max_points": 50.0,
                "description": "Efficient use of lists, dicts, sets, and list comprehensions."
            }
        ],
        "resources": [
            {
                "title": "Official Python 3 Documentation",
                "url": "https://docs.python.org/3/tutorial/",
                "type": "documentation",
                "duration_minutes": 120
            },
            {
                "title": "Python Data Structures In-Depth",
                "url": "https://realpython.com/python-data-structures/",
                "type": "article",
                "duration_minutes": 45
            }
        ]
    },
    {
        "id": "node-rest-102",
        "graph_id": MOCK_GRAPH_ID,
        "label": "HTTP Protocol & REST API Design",
        "description": "Understand HTTP verbs, headers, status codes, JSON payloads, and RESTful routing standards.",
        "status": "available",
        "p_init": 0.10,
        "p_transit": 0.15,
        "p_slip": 0.10,
        "p_guess": 0.20,
        "p_mastery": 0.45,
        "rubric": [
            {
                "id": "rubric-rest-1",
                "criterion": "HTTP Method Selection",
                "max_points": 40.0,
                "description": "Correct usage of GET, POST, PUT, DELETE semantics."
            },
            {
                "id": "rubric-rest-2",
                "criterion": "Response Format & Status Codes",
                "max_points": 60.0,
                "description": "Standardized JSON error and success payloads with proper HTTP status codes."
            }
        ],
        "resources": [
            {
                "title": "MDN HTTP Overview",
                "url": "https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview",
                "type": "documentation",
                "duration_minutes": 60
            },
            {
                "title": "RESTful API Best Practices",
                "url": "https://restfulapi.net/",
                "type": "course",
                "duration_minutes": 90
            }
        ]
    },
    {
        "id": "node-sql-103",
        "graph_id": MOCK_GRAPH_ID,
        "label": "Relational Databases & PostgreSQL Basics",
        "description": "Design relational schemas with SQL, primary/foreign keys, joins, indices, and transactions.",
        "status": "available",
        "p_init": 0.10,
        "p_transit": 0.12,
        "p_slip": 0.08,
        "p_guess": 0.15,
        "p_mastery": 0.20,
        "rubric": [
            {
                "id": "rubric-sql-1",
                "criterion": "Schema Normalization",
                "max_points": 50.0,
                "description": "Tables designed in 3NF with foreign keys and unique constraints."
            },
            {
                "id": "rubric-sql-2",
                "criterion": "Query Optimization",
                "max_points": 50.0,
                "description": "Complex JOINs and index strategies."
            }
        ],
        "resources": [
            {
                "title": "PostgreSQL Official Tutorial",
                "url": "https://www.postgresql.org/docs/current/tutorial.html",
                "type": "documentation",
                "duration_minutes": 150
            }
        ]
    },
    {
        "id": "node-fastapi-104",
        "graph_id": MOCK_GRAPH_ID,
        "label": "FastAPI & Pydantic Web Services",
        "description": "Build high-performance web applications using FastAPI, dependency injection, and Pydantic schemas.",
        "status": "locked",
        "p_init": 0.05,
        "p_transit": 0.10,
        "p_slip": 0.10,
        "p_guess": 0.25,
        "p_mastery": 0.0,
        "rubric": [
            {
                "id": "rubric-fa-1",
                "criterion": "Endpoint Routing & Validation",
                "max_points": 50.0,
                "description": "Typed Pydantic request/response models with standard error handlers."
            },
            {
                "id": "rubric-fa-2",
                "criterion": "Database Integration",
                "max_points": 50.0,
                "description": "Async/Sync SQLAlchemy sessions via dependency injection."
            }
        ],
        "resources": [
            {
                "title": "FastAPI Tutorial - User Guide",
                "url": "https://fastapi.tiangolo.com/tutorial/",
                "type": "documentation",
                "duration_minutes": 180
            }
        ]
    },
    {
        "id": "node-async-105",
        "graph_id": MOCK_GRAPH_ID,
        "label": "Async Python & Task Queues",
        "description": "Concurrently handle background jobs, websockets, asyncio loops, and Celery worker pools.",
        "status": "locked",
        "p_init": 0.05,
        "p_transit": 0.08,
        "p_slip": 0.10,
        "p_guess": 0.20,
        "p_mastery": 0.0,
        "rubric": [
            {
                "id": "rubric-async-1",
                "criterion": "Asyncio Event Loops",
                "max_points": 50.0,
                "description": "Non-blocking I/O routines using async/await."
            }
        ],
        "resources": [
            {
                "title": "Async IO in Python: A Complete Walkthrough",
                "url": "https://realpython.com/async-io-python/",
                "type": "article",
                "duration_minutes": 100
            }
        ]
    }
]

MOCK_EDGES = [
    {
        "id": "edge-101-102",
        "graph_id": MOCK_GRAPH_ID,
        "from_node_id": "node-py-101",
        "to_node_id": "node-rest-102",
        "edge_type": "prerequisite"
    },
    {
        "id": "edge-101-103",
        "graph_id": MOCK_GRAPH_ID,
        "from_node_id": "node-py-101",
        "to_node_id": "node-sql-103",
        "edge_type": "prerequisite"
    },
    {
        "id": "edge-102-104",
        "graph_id": MOCK_GRAPH_ID,
        "from_node_id": "node-rest-102",
        "to_node_id": "node-fastapi-104",
        "edge_type": "prerequisite"
    },
    {
        "id": "edge-103-104",
        "graph_id": MOCK_GRAPH_ID,
        "from_node_id": "node-sql-103",
        "to_node_id": "node-fastapi-104",
        "edge_type": "prerequisite"
    }
]

def get_mock_graph_response(learner_id: str, goal_text: str):
    return {
        "id": MOCK_GRAPH_ID,
        "learner_id": learner_id or MOCK_LEARNER_ID,
        "goal_text": goal_text or "Become a Backend Developer",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "nodes": MOCK_NODES,
        "edges": MOCK_EDGES
    }

def get_mock_node_detail(node_id: str):
    for node in MOCK_NODES:
        if node["id"] == node_id:
            return node
    # Fallback to first node if custom ID passed
    fallback = dict(MOCK_NODES[1])
    fallback["id"] = node_id
    return fallback
