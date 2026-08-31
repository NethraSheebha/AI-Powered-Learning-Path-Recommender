import { create } from 'zustand';

const STORAGE = {
  learnerId: 'learner_id',
  graphId: 'graph_id',
  name: 'learner_name',
  experience: 'experience_level',
};

function readStored(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStored(key, value) {
  try {
    if (value == null || value === '') localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* ignore quota / private mode */
  }
}

function createLearnerId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export const useStore = create((set, get) => ({
  learnerId: readStored(STORAGE.learnerId),
  learnerName: readStored(STORAGE.name) || '',
  experienceLevel: readStored(STORAGE.experience) || '',

  graphId: readStored(STORAGE.graphId),
  graphData: null,
  goalText: '',

  ensureLearnerId: () => {
    let id = get().learnerId || readStored(STORAGE.learnerId);
    if (!id) {
      id = createLearnerId();
      writeStored(STORAGE.learnerId, id);
      set({ learnerId: id });
    }
    return id;
  },

  persistLearnerProfile: ({ learnerId, name, experienceLevel, graphId }) => {
    if (learnerId) writeStored(STORAGE.learnerId, learnerId);
    if (name != null) writeStored(STORAGE.name, name);
    if (experienceLevel != null) writeStored(STORAGE.experience, experienceLevel);
    if (graphId) writeStored(STORAGE.graphId, graphId);
    set((s) => ({
      learnerId: learnerId || s.learnerId,
      learnerName: name != null ? name : s.learnerName,
      experienceLevel: experienceLevel != null ? experienceLevel : s.experienceLevel,
      graphId: graphId || s.graphId,
    }));
  },

  startNewGoal: () => {
    writeStored(STORAGE.graphId, null);
    set({
      graphId: null,
      graphData: null,
      goalText: '',
      selectedNodeId: null,
      selectedNodeData: null,
    });
  },

  setGoalText: (text) => set({ goalText: text }),
  setGraphData: (graphId, data) => {
    if (graphId) writeStored(STORAGE.graphId, graphId);
    set({ graphId, graphData: data });
  },

  selectedNodeId: null,
  selectedNodeData: null,

  selectNode: (nodeId, nodeData) => set({ selectedNodeId: nodeId, selectedNodeData: nodeData }),
  clearSelection: () => set({ selectedNodeId: null, selectedNodeData: null }),

  isLoading: false,
  error: null,
  currentScreen: 'goal',

  setLoading: (v) => set({ isLoading: v }),
  setError: (e) => set({ error: e }),
  setScreen: (s) => set({ currentScreen: s }),

  pendingMutation: null,
  setPendingMutation: (m) => set({ pendingMutation: m }),
  clearPendingMutation: () => set({ pendingMutation: null }),

  dashboardData: null,
  setDashboardData: (d) => set({ dashboardData: d }),

  updateNodeInGraph: (nodeId, updates) => {
    const { graphData } = get();
    if (!graphData) return;
    const newNodes = graphData.nodes.map((n) =>
      n.id === nodeId ? { ...n, ...updates } : n
    );
    set({ graphData: { ...graphData, nodes: newNodes } });
  },

  addToGraph: (newNodes, newEdges) => {
    const { graphData } = get();
    if (!graphData) return;
    set({
      graphData: {
        ...graphData,
        nodes: [...graphData.nodes, ...newNodes],
        edges: [...graphData.edges, ...newEdges],
      },
    });
  },
}));
