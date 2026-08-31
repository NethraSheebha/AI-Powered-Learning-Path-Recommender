# PathMind Integration Guide

This document outlines how the PathMind frontend application integrates with the backend API and AI engine.

## The `VITE_USE_MOCKS` Flag

The frontend is built to run fully autonomously for demo purposes without the backend. This is controlled by the `.env` variable `VITE_USE_MOCKS`.

- When `VITE_USE_MOCKS=true`: The frontend intercepts API calls in `src/api/` and resolves them using an embedded demo graph (`src/mocks/mockData.ts`). It simulates realistic network latency.
- When `VITE_USE_MOCKS=false`: The frontend communicates with the real backend running at `VITE_API_URL` using standard `fetch` wrappers.

**Important for Integration:** Before deploying alongside the backend, ensure `.env` or the CI/CD pipeline sets `VITE_USE_MOCKS=false`.

## API Contracts

The frontend expects the backend to adhere to the following REST contracts:

### 1. Goal Intake
- **Endpoint:** `POST /goal`
- **Request Payload:** `{ learner_id: string, goal_text: string }`
- **Response Payload:** `Graph` schema. The initial topological graph mapped to the goal.

### 2. Fetch Graph
- **Endpoint:** `GET /graph/{graph_id}`
- **Response Payload:** `Graph` schema. The entire graph including nodes and edges.

### 3. Fetch Node Detail
- **Endpoint:** `GET /node/{node_id}`
- **Response Payload:** `GraphNode` schema (includes dynamic arrays for `resources` and `rubric`).

### 4. Submit Quiz
- **Endpoint:** `POST /quiz/{node_id}`
- **Request Payload:** `{ learner_id: string, answers: Record<string, any> }`
- **Response Payload:** `QuizResponse` schema. The frontend reads `newly_unlocked` to notify the user.

### 5. Submit Project
- **Endpoint:** `POST /submit-project/{node_id}`
- **Request Payload:** `{ learner_id: string, submission: { github_repo: string, notes: string } }`
- **Response Payload:** `ProjectSubmitResponse` schema.
- **Note on Graph Diffs:** If a project fails, the backend may attach a `graph_diff` object containing `nodes_added` and `edges_added`. The frontend immediately applies these to the canvas.

### 6. Node Explanation
- **Endpoint:** `GET /explain/{node_id}?learner_id={id}`
- **Response Payload:** `ExplainResponse` schema. Displays the AI's reasoning for why a node is locked, available, or mastered.

### 7. Graph Diff Polling
- **Endpoint:** `GET /graph-diff/{graph_id}/latest`
- **Behavior:** The frontend polls this endpoint every 8 seconds via `hooks/useGraphDiffPolling.ts`. It prevents duplicates by tracking the `diff.id` locally. If new nodes/edges are returned, they are dynamically merged into the React Flow state.

### 8. Dashboard
- **Endpoint:** `GET /dashboard/{learner_id}`
- **Response Payload:** `DashboardResponse` schema.

## Types

The single source of truth for frontend API contracts is `src/types/index.ts`. If backend schemas change, this file must be updated, and TypeScript will catch any cascading component errors.

## Cross-Origin Resource Sharing (CORS)

The frontend dev server runs on `http://localhost:5173`. The backend FastAPI app must configure its CORS middleware to allow origins from the frontend:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://your-production-url.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```
