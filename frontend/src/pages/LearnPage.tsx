import { useState, useCallback } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { useApp } from '../context/AppContext';
import GraphView from '../components/graph/GraphView';
import NodeDetailPanel from '../components/node/NodeDetailPanel';
import QuizModal from '../components/quiz/QuizModal';
import ProjectSubmitModal from '../components/project/ProjectSubmitModal';
import ExplainPanel from '../components/node/ExplainPanel';
import type { GraphNode, QuizResponse, ProjectSubmitResponse } from '../types';
import { Target, BookOpen, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ============================================================
// Learn Page — central graph screen
// ============================================================

export default function LearnPage() {
  const { graph, selectedNodeId, setSelectedNodeId } = useApp();
  const navigate = useNavigate();

  const [quizNode, setQuizNode] = useState<GraphNode | null>(null);
  const [projectNode, setProjectNode] = useState<GraphNode | null>(null);
  const [explainNode, setExplainNode] = useState<GraphNode | null>(null);

  const handleNodeSelect = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
  }, [setSelectedNodeId]);

  const handlePanelClose = useCallback(() => {
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  const handleStartQuiz = useCallback((node: GraphNode) => { setQuizNode(node); }, []);
  const handleStartProject = useCallback((node: GraphNode) => { setProjectNode(node); }, []);
  const handleExplain = useCallback((node: GraphNode) => { setExplainNode(node); }, []);
  const handleQuizComplete = useCallback((_result: QuizResponse) => {}, []);
  const handleProjectComplete = useCallback((_result: ProjectSubmitResponse) => {}, []);

  if (!graph) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-6 space-y-5">
        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center">
          <BookOpen size={22} className="text-slate-400" />
        </div>
        <div>
          <h2 className="text-heading">No learning path yet.</h2>
          <p className="text-body mt-1 max-w-xs mx-auto">
            Enter your learning goal and PathMind will build a personalized path for you.
          </p>
        </div>
        <button onClick={() => navigate('/')} className="pm-btn-primary text-sm">
          <Target size={15} />Set a goal
        </button>
      </div>
    );
  }

  const masteredCount = graph.nodes.filter(n => n.status === 'mastered').length;
  const totalCount = graph.nodes.length;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 bg-white border-b border-slate-200">
        <div className="flex items-center gap-3 min-w-0">
          <div>
            <p className="text-xs text-slate-500 truncate max-w-72">{graph.goal_text}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="mastery-bar-track w-20">
                <div className="mastery-bar-fill bg-emerald-500" style={{ width: `${(masteredCount / Math.max(totalCount, 1)) * 100}%` }} />
              </div>
              <span className="text-[10px] text-slate-500">{masteredCount} / {totalCount} mastered</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 flex-shrink-0">
          <span className="hidden sm:inline">{graph.nodes.filter(n => n.status === 'available').length} available</span>
          {selectedNodeId && (
            <span className="flex items-center gap-1 text-blue-600 font-medium">
              <ArrowRight size={11} />Node selected
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <ReactFlowProvider>
          <GraphView onNodeSelect={handleNodeSelect} />
          <NodeDetailPanel
            nodeId={selectedNodeId}
            onClose={handlePanelClose}
            onStartQuiz={handleStartQuiz}
            onStartProject={handleStartProject}
            onExplain={handleExplain}
          />
        </ReactFlowProvider>
      </div>

      {quizNode && (
        <QuizModal node={quizNode} onClose={() => setQuizNode(null)} onComplete={handleQuizComplete} />
      )}
      {projectNode && (
        <ProjectSubmitModal node={projectNode} onClose={() => setProjectNode(null)} onComplete={handleProjectComplete} />
      )}
      <ExplainPanel node={explainNode} onClose={() => setExplainNode(null)} />
    </div>
  );
}
