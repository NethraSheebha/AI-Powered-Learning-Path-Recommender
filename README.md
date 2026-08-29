# AI-Powered-Learning-Path-Recommender (Backend Core)

AI-Powered-Learning-Path-Recommender is a personalized learning path recommender engine. This repository contains the Phase 1 Backend Core built with **FastAPI**, **SQLAlchemy**, **PostgreSQL**, and **Alembic**.

---

## 🏗️ Architecture & Database Schema

Phase 1 provides a fully specified database schema and a complete set of stub API endpoints returning strict, predictable mock responses so the React frontend team can integrate immediately.

### Database Tables (SQLAlchemy + Alembic)
- **`learners`**: `(id, name, goal_text, created_at)`
- **`graphs`**: `(id, learner_id, goal_text, created_at)`
- **`nodes`**: `(id, graph_id, label, description, rubric JSONB, resources JSONB, status TEXT, p_init FLOAT, p_transit FLOAT, p_slip FLOAT, p_guess FLOAT, p_mastery FLOAT DEFAULT 0)`
- **`edges`**: `(id, graph_id, from_node_id, to_node_id, edge_type TEXT)` — `edge_type`: `'prerequisite'` | `'remedial'`
- **`evidence_events`**: `(id, node_id, learner_id, type TEXT, raw_score FLOAT, correct BOOLEAN, rubric_result JSONB, created_at)` — `type`: `'quiz'` | `'project'`
- **`graph_diffs`**: `(id, graph_id, trigger_event_id, nodes_added JSONB, edges_added JSONB, created_at)`

---

## ⚡ Quick Start (Local Development)

### 1. Prerequisites
- Python 3.10+
- Docker & Docker Compose (or local PostgreSQL instance)

### 2. Environment Setup
Copy the sample environment configuration file:
```bash
cp .env.example .env
```

Create and activate a virtual environment, then install dependencies:
```bash
python -m venv venv
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Start PostgreSQL with Docker
Start the PostgreSQL container:
```bash
docker-compose up -d db
```

### 4. Run Database Migrations
Apply Alembic migrations to create all database tables and foreign key constraints:
```bash
alembic upgrade head
```

### 5. Start the FastAPI Development Server
Launch Uvicorn with auto-reload:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Access the interactive Swagger API documentation at:
👉 **[http://localhost:8000/docs](http://localhost:8000/docs)**

---

## 🐳 Running Entire Stack via Docker Compose

To start both PostgreSQL and the FastAPI application together:
```bash
docker-compose up --build
```
The API will be available at `http://localhost:8000`.

---

## 📡 API Contract Reference (Stub Endpoints)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/goal` | Accepts `{ learner_id, goal_text }`, returns created learning path graph (nodes + edges). |
| `GET` | `/graph/{graph_id}` | Returns full graph state with node statuses and edges. |
| `GET` | `/node/{node_id}` | Returns detailed node information (resources, rubric, status). |
| `POST` | `/quiz/{node_id}` | Accepts `{ learner_id, answers }`, returns mock updated `status` and `p_mastery`. |
| `POST` | `/submit-project/{node_id}` | Accepts `{ learner_id, submission }`, returns graded rubric results and updated status. |
| `GET` | `/explain/{node_id}` | Accepts `learner_id` query param, returns AI explanation string for node status. |
| `GET` | `/dashboard/{learner_id}` | Returns learner metrics (mastered count, skill gap distance, streak). |
| `GET` | `/graph-diff/{graph_id}/latest` | Returns latest graph modifications (`nodes_added`, `edges_added`). |