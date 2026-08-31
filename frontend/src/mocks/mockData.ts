// ============================================================
// PathMind Mock Data
// Complete 11-node full-stack developer learning graph.
// ============================================================

import type {
  Graph,
  GraphNode,
  GraphDiffResponse,
  DashboardResponse,
  ExplainResponse,
  QuizResponse,
  ProjectSubmitResponse,
} from '../types';

export const MOCK_LEARNER_ID = 'learner-demo-001';
export const MOCK_GRAPH_ID = 'graph-fullstack-demo-001';

export const MOCK_NODES: GraphNode[] = [
  {
    id: 'node-html-001',
    graph_id: MOCK_GRAPH_ID,
    label: 'HTML & CSS Fundamentals',
    description: 'Learn the building blocks of web pages. Structure content with HTML5 semantics and style with modern CSS including flexbox and grid.',
    status: 'mastered',
    p_init: 0.20, p_transit: 0.25, p_slip: 0.05, p_guess: 0.10, p_mastery: 0.96,
    resources: [
      { title: 'MDN HTML Basics', url: 'https://developer.mozilla.org/en-US/docs/Learn/HTML/Introduction_to_HTML', type: 'documentation', duration_minutes: 60 },
      { title: 'CSS Tricks — Flexbox Guide', url: 'https://css-tricks.com/snippets/css/a-guide-to-flexbox/', type: 'article', duration_minutes: 25 },
    ],
    rubric: [
      { id: 'r-html-1', criterion: 'Semantic HTML Structure', max_points: 40, description: 'Correct use of HTML5 semantic elements.' },
      { id: 'r-html-2', criterion: 'Responsive Layout', max_points: 60, description: 'Page is usable across different screen widths.' },
    ],
  },
  {
    id: 'node-git-002',
    graph_id: MOCK_GRAPH_ID,
    label: 'Git & Version Control',
    description: 'Manage code history, collaborate via branches, and understand the commit/push/pull workflow.',
    status: 'mastered',
    p_init: 0.15, p_transit: 0.20, p_slip: 0.05, p_guess: 0.08, p_mastery: 0.92,
    resources: [
      { title: 'Pro Git Book', url: 'https://git-scm.com/book/en/v2', type: 'documentation', duration_minutes: 90 },
      { title: 'Learn Git Branching', url: 'https://learngitbranching.js.org/', type: 'course', duration_minutes: 45 },
    ],
    rubric: [
      { id: 'r-git-1', criterion: 'Commit Hygiene', max_points: 50, description: 'Clear, atomic commits with descriptive messages.' },
      { id: 'r-git-2', criterion: 'Branch Workflow', max_points: 50, description: 'Feature branches and clean merge strategy.' },
    ],
  },
  {
    id: 'node-js-003',
    graph_id: MOCK_GRAPH_ID,
    label: 'JavaScript Fundamentals',
    description: 'Understand variables, functions, closures, asynchronous patterns, and ES6+ syntax.',
    status: 'mastered',
    p_init: 0.15, p_transit: 0.18, p_slip: 0.08, p_guess: 0.12, p_mastery: 0.88,
    resources: [
      { title: 'JavaScript.info', url: 'https://javascript.info/', type: 'documentation', duration_minutes: 180 },
      { title: 'Eloquent JavaScript', url: 'https://eloquentjavascript.net/', type: 'course', duration_minutes: 120 },
    ],
    rubric: [
      { id: 'r-js-1', criterion: 'Async Patterns', max_points: 50, description: 'Proper use of Promises and async/await.' },
      { id: 'r-js-2', criterion: 'Module System', max_points: 50, description: 'Correct use of ES modules and imports.' },
    ],
  },
  {
    id: 'node-react-004',
    graph_id: MOCK_GRAPH_ID,
    label: 'React & Component Architecture',
    description: 'Build reactive UIs using React hooks, component composition, and client-side state.',
    status: 'available',
    p_init: 0.10, p_transit: 0.15, p_slip: 0.10, p_guess: 0.20, p_mastery: 0.55,
    resources: [
      { title: 'React Documentation', url: 'https://react.dev/learn', type: 'documentation', duration_minutes: 120 },
      { title: 'Scrimba — Learn React', url: 'https://scrimba.com/learn/learnreact', type: 'course', duration_minutes: 180 },
    ],
    rubric: [
      { id: 'r-react-1', criterion: 'Hooks Usage', max_points: 40, description: 'Effective use of useState, useEffect, useCallback.' },
      { id: 'r-react-2', criterion: 'Component Composition', max_points: 30, description: 'Reusable, well-structured components.' },
      { id: 'r-react-3', criterion: 'State Management', max_points: 30, description: 'Clean data flow with props and context.' },
    ],
  },
  {
    id: 'node-api-005',
    graph_id: MOCK_GRAPH_ID,
    label: 'REST APIs & HTTP',
    description: 'Design and consume RESTful APIs. Understand HTTP methods, status codes, and JSON payloads.',
    status: 'available',
    p_init: 0.10, p_transit: 0.15, p_slip: 0.10, p_guess: 0.20, p_mastery: 0.42,
    resources: [
      { title: 'MDN HTTP Overview', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview', type: 'documentation', duration_minutes: 60 },
      { title: 'RESTful API Design', url: 'https://restfulapi.net/', type: 'article', duration_minutes: 45 },
    ],
    rubric: [
      { id: 'r-api-1', criterion: 'Endpoint Design', max_points: 40, description: 'Clear, RESTful resource naming.' },
      { id: 'r-api-2', criterion: 'Error Handling', max_points: 30, description: 'Proper HTTP status codes and error payloads.' },
      { id: 'r-api-3', criterion: 'Authentication', max_points: 30, description: 'Token-based auth flow.' },
    ],
  },
  {
    id: 'node-db-006',
    graph_id: MOCK_GRAPH_ID,
    label: 'Databases & SQL',
    description: 'Model relational data, write SQL queries, and understand transactions, indices, and normalization.',
    status: 'locked',
    p_init: 0.10, p_transit: 0.12, p_slip: 0.08, p_guess: 0.15, p_mastery: 0.0,
    resources: [
      { title: 'PostgreSQL Tutorial', url: 'https://www.postgresqltutorial.com/', type: 'documentation', duration_minutes: 120 },
    ],
    rubric: [
      { id: 'r-db-1', criterion: 'Schema Design', max_points: 50, description: 'Normalized tables with proper constraints.' },
      { id: 'r-db-2', criterion: 'Query Optimization', max_points: 50, description: 'Complex queries with JOINs and indices.' },
    ],
  },
  {
    id: 'node-backend-007',
    graph_id: MOCK_GRAPH_ID,
    label: 'Backend Development',
    description: 'Build server-side applications, connect to databases, and implement business logic.',
    status: 'locked',
    p_init: 0.05, p_transit: 0.10, p_slip: 0.10, p_guess: 0.20, p_mastery: 0.0,
    resources: [
      { title: 'Node.js Guides', url: 'https://nodejs.org/en/learn', type: 'documentation', duration_minutes: 90 },
    ],
    rubric: [
      { id: 'r-be-1', criterion: 'Routing & Validation', max_points: 50, description: 'Correct endpoint design and input validation.' },
      { id: 'r-be-2', criterion: 'Database Integration', max_points: 50, description: 'ORM models and transaction safety.' },
    ],
  },
  {
    id: 'node-auth-008',
    graph_id: MOCK_GRAPH_ID,
    label: 'Authentication & Security',
    description: 'Implement JWT, OAuth, session management, and basic security hardening.',
    status: 'locked',
    p_init: 0.05, p_transit: 0.08, p_slip: 0.10, p_guess: 0.15, p_mastery: 0.0,
    resources: [
      { title: 'OWASP Auth Cheatsheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html', type: 'article', duration_minutes: 30 },
    ],
    rubric: [
      { id: 'r-auth-1', criterion: 'Token Strategy', max_points: 50, description: 'Correct JWT issuance and validation.' },
      { id: 'r-auth-2', criterion: 'Security Hardening', max_points: 50, description: 'Rate limiting, input sanitization, HTTPS.' },
    ],
  },
  {
    id: 'node-test-009',
    graph_id: MOCK_GRAPH_ID,
    label: 'Testing & Quality',
    description: 'Write unit and integration tests. Understand TDD, code coverage, and CI pipelines.',
    status: 'locked',
    p_init: 0.05, p_transit: 0.10, p_slip: 0.08, p_guess: 0.15, p_mastery: 0.0,
    resources: [
      { title: 'Vitest Documentation', url: 'https://vitest.dev/', type: 'documentation', duration_minutes: 60 },
    ],
    rubric: [
      { id: 'r-test-1', criterion: 'Unit Test Coverage', max_points: 60, description: 'Core logic covered with meaningful tests.' },
      { id: 'r-test-2', criterion: 'Integration Tests', max_points: 40, description: 'API endpoint tests with test database.' },
    ],
  },
  {
    id: 'node-deploy-010',
    graph_id: MOCK_GRAPH_ID,
    label: 'Deployment & DevOps',
    description: 'Deploy applications to production. CI/CD, Docker, environment configuration.',
    status: 'locked',
    p_init: 0.05, p_transit: 0.08, p_slip: 0.10, p_guess: 0.15, p_mastery: 0.0,
    resources: [
      { title: 'Docker Getting Started', url: 'https://docs.docker.com/get-started/', type: 'documentation', duration_minutes: 90 },
    ],
    rubric: [
      { id: 'r-deploy-1', criterion: 'Dockerfile Quality', max_points: 50, description: 'Efficient multi-stage build.' },
      { id: 'r-deploy-2', criterion: 'CI/CD Pipeline', max_points: 50, description: 'Automated build, test, deploy workflow.' },
    ],
  },
  {
    id: 'node-project-011',
    graph_id: MOCK_GRAPH_ID,
    label: 'Full-Stack Capstone Project',
    description: 'Build a complete, deployed full-stack application demonstrating mastery across the entire curriculum.',
    status: 'locked',
    p_init: 0.02, p_transit: 0.05, p_slip: 0.08, p_guess: 0.10, p_mastery: 0.0,
    resources: [
      { title: 'Full-Stack Open Course', url: 'https://fullstackopen.com/', type: 'course', duration_minutes: 600 },
    ],
    rubric: [
      { id: 'r-cap-1', criterion: 'Frontend Quality', max_points: 25, description: 'Responsive, accessible React application.' },
      { id: 'r-cap-2', criterion: 'Backend API', max_points: 25, description: 'RESTful API with authentication.' },
      { id: 'r-cap-3', criterion: 'Database Design', max_points: 25, description: 'Normalized schema with migrations.' },
      { id: 'r-cap-4', criterion: 'Deployment', max_points: 25, description: 'Live application with CI/CD.' },
    ],
  },
];

export const MOCK_EDGES = [
  { id: 'e-001-003', graph_id: MOCK_GRAPH_ID, from_node_id: 'node-html-001', to_node_id: 'node-js-003', edge_type: 'prerequisite' as const },
  { id: 'e-001-002', graph_id: MOCK_GRAPH_ID, from_node_id: 'node-html-001', to_node_id: 'node-git-002', edge_type: 'prerequisite' as const },
  { id: 'e-js-react', graph_id: MOCK_GRAPH_ID, from_node_id: 'node-js-003', to_node_id: 'node-react-004', edge_type: 'prerequisite' as const },
  { id: 'e-js-api', graph_id: MOCK_GRAPH_ID, from_node_id: 'node-js-003', to_node_id: 'node-api-005', edge_type: 'prerequisite' as const },
  { id: 'e-api-db', graph_id: MOCK_GRAPH_ID, from_node_id: 'node-api-005', to_node_id: 'node-db-006', edge_type: 'prerequisite' as const },
  { id: 'e-api-be', graph_id: MOCK_GRAPH_ID, from_node_id: 'node-api-005', to_node_id: 'node-backend-007', edge_type: 'prerequisite' as const },
  { id: 'e-db-be', graph_id: MOCK_GRAPH_ID, from_node_id: 'node-db-006', to_node_id: 'node-backend-007', edge_type: 'prerequisite' as const },
  { id: 'e-be-auth', graph_id: MOCK_GRAPH_ID, from_node_id: 'node-backend-007', to_node_id: 'node-auth-008', edge_type: 'prerequisite' as const },
  { id: 'e-be-test', graph_id: MOCK_GRAPH_ID, from_node_id: 'node-backend-007', to_node_id: 'node-test-009', edge_type: 'prerequisite' as const },
  { id: 'e-auth-deploy', graph_id: MOCK_GRAPH_ID, from_node_id: 'node-auth-008', to_node_id: 'node-deploy-010', edge_type: 'prerequisite' as const },
  { id: 'e-test-deploy', graph_id: MOCK_GRAPH_ID, from_node_id: 'node-test-009', to_node_id: 'node-deploy-010', edge_type: 'prerequisite' as const },
  { id: 'e-deploy-cap', graph_id: MOCK_GRAPH_ID, from_node_id: 'node-deploy-010', to_node_id: 'node-project-011', edge_type: 'prerequisite' as const },
  { id: 'e-react-cap', graph_id: MOCK_GRAPH_ID, from_node_id: 'node-react-004', to_node_id: 'node-project-011', edge_type: 'prerequisite' as const },
];

export const MOCK_GRAPH: Graph = {
  id: MOCK_GRAPH_ID,
  learner_id: MOCK_LEARNER_ID,
  goal_text: 'Become a full-stack developer',
  created_at: new Date().toISOString(),
  nodes: MOCK_NODES,
  edges: MOCK_EDGES,
};

export const MOCK_GRAPH_DIFF: GraphDiffResponse = {
  id: 'diff-demo-001',
  graph_id: MOCK_GRAPH_ID,
  trigger_event_id: 'event-project-fail-001',
  nodes_added: [
    {
      id: 'node-remedial-auth',
      label: 'API Authentication Deep Dive',
      description: 'A targeted refresher on token-based authentication, JWT structure, and OAuth flows.',
      status: 'available',
      p_mastery: 0.10,
    },
  ],
  edges_added: [
    {
      id: 'e-remedial-auth',
      from_node_id: 'node-remedial-auth',
      to_node_id: 'node-api-005',
      edge_type: 'remedial',
    },
  ],
  created_at: new Date().toISOString(),
};

export const MOCK_DASHBOARD: DashboardResponse = {
  learner_id: MOCK_LEARNER_ID,
  current_goal: 'Become a full-stack developer',
  total_nodes: 11,
  mastered_count: 3,
  available_count: 2,
  locked_count: 6,
  skill_gap_distance: 0.73,
  streak_days: 4,
};

export function getMockExplain(node_id: string): ExplainResponse {
  const node = MOCK_NODES.find(n => n.id === node_id);
  const status = node?.status ?? 'available';

  const explanations: Record<string, ExplainResponse> = {
    locked: {
      node_id,
      learner_id: MOCK_LEARNER_ID,
      explanation: `This topic is locked because it builds on concepts you haven't fully mastered yet. Work through the available prerequisite topics first and you'll unlock it automatically.`,
      status: 'locked',
      status_reason: 'One or more prerequisite nodes must be mastered first.',
      recommended_action: 'Complete the available prerequisite topics to unlock this module.',
    },
    available: {
      node_id,
      learner_id: MOCK_LEARNER_ID,
      explanation: `You've mastered all the prerequisites for this topic. It's ready for you to work on now.`,
      status: 'available',
      status_reason: 'All prerequisite concepts have been mastered.',
      recommended_action: 'Review the learning resources and then take the quiz or submit a project.',
    },
    mastered: {
      node_id,
      learner_id: MOCK_LEARNER_ID,
      explanation: `You've already demonstrated strong mastery of this topic through your assessments. Great work — this has unlocked dependent topics in your path.`,
      status: 'mastered',
      status_reason: 'Mastery threshold reached in previous assessments.',
      recommended_action: 'Move on to the next available topics in your path.',
    },
  };

  return explanations[status] ?? explanations['available'];
}

export function getMockQuizResponse(node_id: string, correct: boolean): QuizResponse {
  return {
    node_id,
    learner_id: MOCK_LEARNER_ID,
    raw_score: correct ? 0.85 : 0.40,
    correct,
    status: correct ? 'mastered' : 'available',
    p_mastery: correct ? 0.82 : 0.38,
    newly_unlocked: correct ? ['node-db-006'] : [],
    updated_at: new Date().toISOString(),
  };
}

export function getMockProjectResponse(node_id: string, passes: boolean): ProjectSubmitResponse {
  return {
    node_id,
    learner_id: MOCK_LEARNER_ID,
    status: passes ? 'mastered' : 'available',
    p_mastery: passes ? 0.87 : 0.28,
    raw_score: passes ? 0.78 : 0.34,
    rubric_result: [
      { criterion_id: 'r-api-1', criterion: 'Endpoint Design', passed: passes, score: passes ? 36 : 18, max_score: 40, feedback: passes ? 'Clear resource naming and correct HTTP verbs.' : "Some endpoints don't follow REST conventions." },
      { criterion_id: 'r-api-2', criterion: 'Error Handling', passed: passes, score: passes ? 28 : 12, max_score: 30, feedback: passes ? 'Proper status codes throughout.' : 'Missing error handling for several edge cases.' },
      { criterion_id: 'r-api-3', criterion: 'Authentication', passed: false, score: passes ? 14 : 4, max_score: 30, feedback: 'JWT implementation is incomplete — token refresh and expiry handling need work.' },
    ],
    graph_diff: passes ? null : MOCK_GRAPH_DIFF,
    updated_at: new Date().toISOString(),
  };
}
