import { useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { api } from '../services/api';
import ConstellationGraph from '../components/ConstellationGraph';
import NodeDetailPanel from '../components/NodeDetailPanel';
import { Loader2 } from 'lucide-react';

export default function GraphView() {
  const { graphId: routeGraphId } = useParams();
  const navigate = useNavigate();

  const graphId = useStore((s) => s.graphId);
  const graphData = useStore((s) => s.graphData);
  const setGoalText = useStore((s) => s.setGoalText);
  const setGraphData = useStore((s) => s.setGraphData);
  const selectNode = useStore((s) => s.selectNode);
  const isLoading = useStore((s) => s.isLoading);
  const setLoading = useStore((s) => s.setLoading);
  const setError = useStore((s) => s.setError);
  const startNewGoal = useStore((s) => s.startNewGoal);

  /* Fetch graph data if navigating directly or missing in store */
  useEffect(() => {
    const targetId = routeGraphId || graphId;
    if (!targetId) {
      navigate('/?new=1');
      return;
    }

    if (graphData && graphId === targetId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    api.getGraph(targetId)
      .then((data) => {
        if (cancelled) return;
        setGraphData(targetId, { nodes: data.nodes, edges: data.edges, goal_text: data.goal_text });
        if (data.goal_text) setGoalText(data.goal_text);
      })
      .catch((err) => {
        if (cancelled) return;
        startNewGoal(); // Reset stale localStorage graph ID
        setError(err.message || 'Graph not found. Please chart a new goal.');
        navigate('/?new=1');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [routeGraphId, graphId, graphData, setGraphData, setGoalText, setLoading, setError, startNewGoal, navigate]);

  const handleNodeClick = useCallback((node) => {
    selectNode(node.id, node);
  }, [selectNode]);

  if (isLoading || !graphData) {
    return (
      <div style={{
        height: '100%', width: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--void)', color: 'var(--stardust)',
        flexDirection: 'column', gap: '12px',
      }}>
        <Loader2 size={24} className="spin-icon" />
        <span style={{ fontSize: 14 }}>Loading constellation…</span>
        <style>{`.spin-icon { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <ConstellationGraph graphData={graphData} onNodeClick={handleNodeClick} />
      <NodeDetailPanel />
    </div>
  );
}
