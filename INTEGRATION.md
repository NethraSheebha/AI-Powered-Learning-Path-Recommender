# AI-Powered-Learning-Path-Recommender Backend Teammate Integration Guide & Interface Checklist

This document serves as the single source of truth for **Member 3** and **Member 4** when integrating real LLM generation, project evaluation, remedial mapping, and skill gap distance logic into the AI-Powered-Learning-Path-Recommender Backend Core.

---

## 🎯 Important Rules for Integration

1. **Do NOT alter function signatures or return types**: The FastAPI endpoints and database routers rely directly on these interfaces. Modify **ONLY** the internal function logic.
2. **Look for the STUB Comment**: Every interface function is marked with:
   ```python
   # STUB: Member X will replace internals only, do not change signature
   ```
3. **Database Access**: All functions receive an active SQLAlchemy `Session` (`db`) parameter. Ensure all created or modified entities are added to `db`.

---

## 📋 Teammate Interface Checklist

### 👤 Member 3 Responsibilities (LLM & Goal-to-Graph Generation)

#### 1. Goal-to-Graph Generator
- **File**: [`app/services/goal_graph_interface.py`](file:///e:/AI-Powered-Learning-Path-Recommender/app/services/goal_graph_interface.py)
- **Signature**:
  ```python
  def generate_graph_from_goal(goal_text: str, learner_id: str, db: Session) -> Graph:
  ```
- **Description**: Accepts the learner's natural language goal text (e.g. *"Become a Backend Developer"*), generates a directed acyclic learning graph with nodes and prerequisite edges, initializes BKT parameters (`initialize_node_bkt_params(node)`), sets the root node(s) to `status='available'` and downstream nodes to `'locked'`, persists them to PostgreSQL, and returns the `Graph` SQLAlchemy model.

#### 2. Project Rubric Evaluation Engine
- **File**: [`app/services/rubric_interface.py`](file:///e:/AI-Powered-Learning-Path-Recommender/app/services/rubric_interface.py)
- **Signature**:
  ```python
  def score_submission_against_rubric(node: Any, submission: Dict[str, Any]) -> RubricResult:
  ```
- **Description**: Accepts the target concept `node` and learner's project `submission` dictionary (e.g. GitHub repository URL, code artifacts, or submission notes). Grades the submission against the node's rubric criteria and returns a `RubricResult` Pydantic model (`overall_score: float`, `criteria_results: List[RubricCriterionResult]`, `meets_threshold: bool`).

#### 3. LLM Explanation Phrasing Engine
- **File**: [`app/services/explanation_interface.py`](file:///e:/AI-Powered-Learning-Path-Recommender/app/services/explanation_interface.py)
- **Signature**:
  ```python
  def format_explanation_phrasing(trace: Dict[str, Any]) -> str:
  ```
- **Description**: Accepts a structured trace dictionary containing deterministic graph traversal results (`{"node_label": str, "prerequisites": List[str], "unlocks": List[str]}`). Generates a natural language explanation string explaining why this node occupies its current position in the learner's path.

---

### 👤 Member 4 Responsibilities (Remedial Mutation & Skill Gap Graph Analytics)

#### 4. Remedial Graph Mutation Engine
- **File**: [`app/services/mutation_interface.py`](file:///e:/AI-Powered-Learning-Path-Recommender/app/services/mutation_interface.py)
- **Signature**:
  ```python
  def trigger_remedial_mutation(
      graph_id: str,
      node_id: str,
      failed_criteria: List[str],
      db: Session,
      trigger_event_id: Optional[str] = None
  ) -> GraphDiff:
  ```
- **Description**: Called when a learner fails a project assessment multiple times ($\ge 2$). Selects or generates a remedial refresher node addressing `failed_criteria`, creates a prerequisite edge pointing from the remedial node to the failed node, persists both entities in DB, records a `GraphDiff` entry, and returns the `GraphDiff` model.

#### 5. Shortest-Path Skill Gap Distance Engine
- **File**: [`app/services/skill_gap_interface.py`](file:///e:/AI-Powered-Learning-Path-Recommender/app/services/skill_gap_interface.py)
- **Signature**:
  ```python
  def calculate_skill_gap_distance(graph_id: str, learner_id: str, db: Session) -> float:
  ```
- **Description**: Computes the topological skill gap distance metric (e.g. using Dijkstra or BFS shortest-path algorithms over unmastered nodes remaining in the graph) and returns a normalized float score.
