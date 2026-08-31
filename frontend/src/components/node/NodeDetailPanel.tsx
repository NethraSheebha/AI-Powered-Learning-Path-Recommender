import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, BookOpen, CheckCircle2, Lock,
  Brain, ClipboardCheck, HelpCircle, ArrowRight,
} from 'lucide-react';
import type { GraphNode } from '../../types';
import { getNode } from '../../api/nodeApi';
import ResourceCard from './ResourceCard';

// ============================================================
// NodeDetailPanel — slides in from the right when a node is selected
// ============================================================

interface Props {
  nodeId: string | null;
  onClose: () => void;
  onStartQuiz: (node: GraphNode) => void;
  onStartProject: (node: GraphNode) => void;
  onExplain: (node: GraphNode) => void;
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'mastered') return <CheckCircle2 size={16} className="text-emerald-500" />;
  if (status === 'locked') return <Lock size={16} className="text-slate-400" />;
  return <ArrowRight size={16} className="text-blue-500" />;
}

function StatusLabel({ status }: { status: string }) {
  if (status === 'mastered') return <span className="status-badge-mastered"><CheckCircle2 size={10} />Mastered</span>;
  if (status === 'locked') return <span className="status-badge-locked"><Lock size={10} />Locked</span>;
  return <span className="status-badge-available"><ArrowRight size={10} />Ready to learn</span>;
}

function SkeletonPanel() {
  return (
    <div className="p-5 space-y-4 animate-pulse">
      <div className="skeleton-line h-5 w-3/4" />
      <div className="skeleton-line h-3 w-full" />
      <div className="skeleton-line h-3 w-5/6" />
      <div className="skeleton-line h-24 w-full rounded-lg" />
      <div className="skeleton-line h-16 w-full rounded-lg" />
    </div>
  );
}

export default function NodeDetailPanel({ nodeId, onClose, onStartQuiz, onStartProject, onExplain }: Props) {
  const [node, setNode] = useState<GraphNode | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNode = useCallback(async () => {
    if (!nodeId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getNode(nodeId);
      setNode(data);
    } catch {
      setError('Unable to load this concept. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [nodeId]);

  useEffect(() => {
    setNode(null);
    fetchNode();
  }, [nodeId, fetchNode]);

  const masteryPct = node ? Math.round(node.p_mastery * 100) : 0;

  return (
    <AnimatePresence>
      {nodeId && (
        <motion.aside
          key="node-panel"
          initial={{ x: 320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 320, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="absolute right-0 top-0 bottom-0 w-80 bg-white border-l border-slate-200 shadow-xl z-30 flex flex-col overflow-hidden"
          aria-label="Node detail panel"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
            <div className="flex items-center gap-2">
              <BookOpen size={15} className="text-slate-500" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Concept</span>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              aria-label="Close panel"
            >
              <X size={15} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading && <SkeletonPanel />}

            {error && (
              <div className="p-5">
                <p className="text-sm text-red-600">{error}</p>
                <button onClick={fetchNode} className="pm-btn-secondary mt-3 text-xs py-1.5 px-3">
                  Try again
                </button>
              </div>
            )}

            {node && !loading && (
              <div className="p-5 space-y-5">
                <div>
                  <div className="flex items-start gap-2 mb-2">
                    <StatusIcon status={node.status} />
                    <h2 className="text-sm font-semibold text-slate-900 leading-snug">{node.label}</h2>
                  </div>
                  <StatusLabel status={node.status} />
                  {node.description && (
                    <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">{node.description}</p>
                  )}
                </div>

                {node.status !== 'locked' && (
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-label">Mastery</span>
                      <span className="text-xs font-semibold text-slate-600">{masteryPct}%</span>
                    </div>
                    <div className="mastery-bar-track">
                      <div
                        className={`mastery-bar-fill ${masteryPct >= 80 ? 'bg-emerald-500' : masteryPct >= 50 ? 'bg-blue-500' : 'bg-amber-400'}`}
                        style={{ width: `${masteryPct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {masteryPct >= 80 ? "Strong mastery — you've got this." : masteryPct >= 40 ? 'Making progress — keep practising.' : 'Just getting started.'}
                    </p>
                  </div>
                )}

                {node.resources && node.resources.length > 0 && (
                  <div>
                    <p className="text-label mb-2">Learning Resources</p>
                    <div className="space-y-2">
                      {node.resources.map((r, i) => <ResourceCard key={i} resource={r} />)}
                    </div>
                  </div>
                )}

                {node.rubric && node.rubric.length > 0 && (
                  <div>
                    <p className="text-label mb-2">Assessment Rubric</p>
                    <div className="space-y-1.5">
                      {node.rubric.map(r => (
                        <div key={r.id} className="flex justify-between items-center text-xs py-1.5 px-2 bg-slate-50 rounded-lg border border-slate-100">
                          <span className="text-slate-700 font-medium">{r.criterion}</span>
                          <span className="text-slate-500 font-mono text-[11px]">{r.max_points} pts</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-label mb-2">Actions</p>
                  <div className="space-y-2">
                    {node.status !== 'locked' && (
                      <>
                        <button onClick={() => onStartQuiz(node)} className="w-full pm-btn-primary justify-center text-xs py-2" aria-label="Take quiz">
                          <Brain size={14} />Take Quiz
                        </button>
                        <button onClick={() => onStartProject(node)} className="w-full pm-btn-secondary justify-center text-xs py-2" aria-label="Submit project">
                          <ClipboardCheck size={14} />Submit Project
                        </button>
                      </>
                    )}
                    <button onClick={() => onExplain(node)} className="w-full pm-btn-ghost justify-center text-xs py-1.5" aria-label="Why is this node in this state?">
                      <HelpCircle size={14} />Why is this here?
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
