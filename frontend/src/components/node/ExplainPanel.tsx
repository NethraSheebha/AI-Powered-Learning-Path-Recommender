import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, HelpCircle, Lock, ArrowRight, CheckCircle2, Info } from 'lucide-react';
import type { GraphNode, ExplainResponse } from '../../types';
import { getExplanation } from '../../api/explainApi';
import { useApp } from '../../context/AppContext';

// ============================================================
// Explain Panel — "Why is this here?"
// ============================================================

interface Props {
  node: GraphNode | null;
  onClose: () => void;
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'mastered') return <CheckCircle2 size={16} className="text-emerald-500" />;
  if (status === 'locked') return <Lock size={16} className="text-slate-400" />;
  return <ArrowRight size={16} className="text-blue-500" />;
}

export default function ExplainPanel({ node, onClose }: Props) {
  const { learner } = useApp();
  const [data, setData] = useState<ExplainResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!node) return;
    setData(null);
    setLoading(true);
    setError(null);
    getExplanation(node.id, learner?.id)
      .then(setData)
      .catch(() => setError('Unable to load explanation.'))
      .finally(() => setLoading(false));
  }, [node?.id, learner?.id]);

  return (
    <AnimatePresence>
      {node && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Node explanation"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
                  <HelpCircle size={15} className="text-slate-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Explanation</p>
                  <h2 className="text-sm font-semibold text-slate-900 truncate max-w-48">{node.label}</h2>
                </div>
              </div>
              <button onClick={onClose} className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors" aria-label="Close">
                <X size={15} />
              </button>
            </div>

            <div className="p-6">
              {loading && (
                <div className="space-y-3 animate-pulse">
                  <div className="skeleton-line h-4 w-full" />
                  <div className="skeleton-line h-4 w-5/6" />
                  <div className="skeleton-line h-16 w-full rounded-xl" />
                </div>
              )}
              {error && <p className="text-sm text-red-600">{error}</p>}
              {data && !loading && (
                <div className="space-y-5 animate-fade-in">
                  <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <Info size={16} className="text-slate-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-700 leading-relaxed">{data.explanation}</p>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-label mb-1.5">Current Status</p>
                      <div className="flex items-center gap-2">
                        <StatusIcon status={data.status} />
                        <span className="text-sm font-medium text-slate-800 capitalize">{data.status}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-label mb-1.5">Reason</p>
                      <p className="text-sm text-slate-600 leading-relaxed">{data.status_reason}</p>
                    </div>
                    <div>
                      <p className="text-label mb-1.5">What to do next</p>
                      <p className="text-sm text-blue-700 font-medium leading-relaxed">{data.recommended_action}</p>
                    </div>
                  </div>
                  <button onClick={onClose} className="w-full pm-btn-ghost justify-center text-xs py-2 border border-slate-200">
                    Got it
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
