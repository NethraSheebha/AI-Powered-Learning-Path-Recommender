import type {
  Graph,
  GraphNode,
  AppLearner,
  GraphDiffResponse,
} from '../types';
import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

// ============================================================
// AppContext — centralized application state
// ============================================================

interface AppState {
  learner: AppLearner | null;
  graph: Graph | null;
  selectedNodeId: string | null;
  pendingGraphDiff: GraphDiffResponse | null;
  seenDiffIds: Set<string>;
  useMocks: boolean;
}

interface AppContextValue extends AppState {
  setLearner: (l: AppLearner) => void;
  setGraph: (g: Graph) => void;
  updateGraphNodes: (nodes: GraphNode[]) => void;
  setSelectedNodeId: (id: string | null) => void;
  applyGraphDiff: (diff: GraphDiffResponse) => void;
  clearPendingDiff: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

// ---- Helpers --------------------------------------------------------

function generateLearnerId(): string {
  return `learner-${Math.random().toString(36).slice(2, 10)}`;
}

function getOrCreateLearnerId(): string {
  const stored = localStorage.getItem('pm_learner_id');
  if (stored) return stored;
  const id = generateLearnerId();
  localStorage.setItem('pm_learner_id', id);
  return id;
}

// ---- Provider -------------------------------------------------------

export function AppProvider({ children }: { children: ReactNode }) {
  const [learner, setLearnerState] = useState<AppLearner | null>(() => {
    const id = getOrCreateLearnerId();
    const goal = localStorage.getItem('pm_goal_text');
    return { id, goal_text: goal ?? '' };
  });

  const [graph, setGraphState] = useState<Graph | null>(() => {
    const stored = localStorage.getItem('pm_graph');
    try { return stored ? (JSON.parse(stored) as Graph) : null; } catch { return null; }
  });

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [pendingGraphDiff, setPendingGraphDiff] = useState<GraphDiffResponse | null>(null);
  const [seenDiffIds, setSeenDiffIds] = useState<Set<string>>(new Set());

  const useMocks = import.meta.env.VITE_USE_MOCKS !== 'false';

  const setLearner = useCallback((l: AppLearner) => {
    setLearnerState(l);
    localStorage.setItem('pm_learner_id', l.id);
    localStorage.setItem('pm_goal_text', l.goal_text);
  }, []);

  const setGraph = useCallback((g: Graph) => {
    setGraphState(g);
    try { localStorage.setItem('pm_graph', JSON.stringify(g)); } catch { /* quota */ }
  }, []);

  const updateGraphNodes = useCallback((nodes: GraphNode[]) => {
    setGraphState(prev => {
      if (!prev) return prev;
      const updated = { ...prev, nodes };
      try { localStorage.setItem('pm_graph', JSON.stringify(updated)); } catch { /* quota */ }
      return updated;
    });
  }, []);

  const applyGraphDiff = useCallback((diff: GraphDiffResponse) => {
    setSeenDiffIds(prev => {
      if (prev.has(diff.id)) return prev;
      return new Set([...prev, diff.id]);
    });

    setPendingGraphDiff(prev => {
      if (prev?.id === diff.id) return prev;
      return diff;
    });

    setGraphState(prev => {
      if (!prev) return prev;

      const existingNodeIds = new Set(prev.nodes.map(n => n.id));
      const newNodes: GraphNode[] = diff.nodes_added
        .filter(n => !existingNodeIds.has(n.id))
        .map(n => ({
          id: n.id,
          graph_id: prev.id,
          label: n.label,
          description: n.description,
          status: n.status,
          p_init: 0.10,
          p_transit: 0.10,
          p_slip: 0.10,
          p_guess: 0.10,
          p_mastery: n.p_mastery,
          isNew: true,
        }));

      const existingEdgeIds = new Set(prev.edges.map(e => e.id));
      const newEdges = diff.edges_added
        .filter(e => !existingEdgeIds.has(e.id))
        .map(e => ({
          id: e.id,
          graph_id: prev.id,
          from_node_id: e.from_node_id,
          to_node_id: e.to_node_id,
          edge_type: e.edge_type,
          isNew: true,
        }));

      const updated = {
        ...prev,
        nodes: [...prev.nodes, ...newNodes],
        edges: [...prev.edges, ...newEdges],
      };
      try { localStorage.setItem('pm_graph', JSON.stringify(updated)); } catch { /* quota */ }
      return updated;
    });
  }, []);

  const clearPendingDiff = useCallback(() => {
    setPendingGraphDiff(null);
  }, []);

  return (
    <AppContext.Provider
      value={{
        learner,
        graph,
        selectedNodeId,
        pendingGraphDiff,
        seenDiffIds,
        useMocks,
        setLearner,
        setGraph,
        updateGraphNodes,
        setSelectedNodeId,
        applyGraphDiff,
        clearPendingDiff,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
