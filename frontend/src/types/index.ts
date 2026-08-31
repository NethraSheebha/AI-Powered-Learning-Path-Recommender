// ============================================================
// PathMind Frontend — Shared TypeScript Types
// Mirrors backend Pydantic schemas exactly.
// ============================================================

// ---- Core graph types -----------------------------------------------

export type NodeStatus = 'locked' | 'available' | 'mastered';
export type EdgeType = 'prerequisite' | 'remedial';
export type ResourceType = 'video' | 'documentation' | 'course' | 'article';

export interface Resource {
  title: string;
  url: string;
  type: ResourceType;
  duration_minutes?: number;
}

export interface RubricItem {
  id: string;
  criterion: string;
  max_points: number;
  description: string;
}

export interface GraphNode {
  id: string;
  graph_id: string;
  label: string;
  description?: string;
  status: NodeStatus;
  p_init: number;
  p_transit: number;
  p_slip: number;
  p_guess: number;
  p_mastery: number;
  rubric?: RubricItem[];
  resources?: Resource[];
  // Frontend-only: whether this node was added via graph diff
  isNew?: boolean;
}

export interface GraphEdge {
  id: string;
  graph_id: string;
  from_node_id: string;
  to_node_id: string;
  edge_type: EdgeType;
  // Frontend-only: whether this edge was added via graph diff
  isNew?: boolean;
}

export interface Graph {
  id: string;
  learner_id: string;
  goal_text: string;
  created_at: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// ---- Goal request ---------------------------------------------------

export interface GoalRequest {
  learner_id: string;
  goal_text: string;
}

// ---- Node detail ----------------------------------------------------

// Same shape as GraphNode, aliased for clarity at the API boundary
export type NodeResponse = GraphNode;

// ---- Quiz -----------------------------------------------------------

export interface QuizRequest {
  learner_id: string;
  answers: Record<string, unknown>;
}

export interface QuizResponse {
  node_id: string;
  learner_id: string;
  raw_score: number;
  correct: boolean;
  status: NodeStatus;
  p_mastery: number;
  newly_unlocked: string[];
  updated_at: string;
}

// ---- Project submission ---------------------------------------------

export interface ProjectSubmitRequest {
  learner_id: string;
  submission: {
    github_repo: string;
    notes: string;
  };
}

export interface RubricResultItem {
  criterion_id: string;
  criterion: string;
  passed: boolean;
  score: number;
  max_score: number;
  feedback: string;
}

export interface ProjectSubmitResponse {
  node_id: string;
  learner_id: string;
  status: NodeStatus;
  p_mastery: number;
  raw_score: number;
  rubric_result: RubricResultItem[];
  graph_diff?: GraphDiffResponse | null;
  updated_at: string;
}

// ---- Explain --------------------------------------------------------

export interface ExplainResponse {
  node_id: string;
  learner_id: string;
  explanation: string;
  status: NodeStatus;
  status_reason: string;
  recommended_action: string;
}

// ---- Dashboard -------------------------------------------------------

export interface DashboardResponse {
  learner_id: string;
  current_goal: string;
  total_nodes: number;
  mastered_count: number;
  available_count: number;
  locked_count: number;
  skill_gap_distance: number;
  streak_days: number;
}

// ---- Graph diff / mutation ------------------------------------------

export interface GraphDiffNode {
  id: string;
  label: string;
  description?: string;
  status: NodeStatus;
  p_mastery: number;
}

export interface GraphDiffEdge {
  id: string;
  from_node_id: string;
  to_node_id: string;
  edge_type: EdgeType;
}

export interface GraphDiffResponse {
  id: string;
  graph_id: string;
  trigger_event_id?: string;
  nodes_added: GraphDiffNode[];
  edges_added: GraphDiffEdge[];
  created_at: string;
}

// ---- App state -------------------------------------------------------

export interface AppLearner {
  id: string;
  goal_text: string;
}
