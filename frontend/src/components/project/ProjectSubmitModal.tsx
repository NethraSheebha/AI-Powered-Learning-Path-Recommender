import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ClipboardCheck, CheckCircle2,
  AlertTriangle, ChevronDown, ChevronUp, Link,
} from 'lucide-react';
import type { GraphNode, ProjectSubmitResponse, RubricResultItem } from '../../types';
import { submitProject } from '../../api/projectApi';
import { useApp } from '../../context/AppContext';

// ============================================================
// Project Submission Modal
// ============================================================

interface Props {
  node: GraphNode | null;
  onClose: () => void;
  onComplete: (result: ProjectSubmitResponse) => void;
}

type Phase = 'form' | 'submitting' | 'result';

function RubricRow({ item }: { item: RubricResultItem }) {
  const pct = (item.score / item.max_score) * 100;
  return (
    <div className="py-2.5 border-b border-slate-100 last:border-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-slate-700">{item.criterion}</span>
        <span className="text-xs font-mono text-slate-500">{item.score} / {item.max_score}</span>
      </div>
      <div className="mastery-bar-track mb-1">
        <div className={`mastery-bar-fill ${item.passed ? 'bg-emerald-400' : 'bg-red-400'}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[10px] text-slate-500">{item.feedback}</p>
    </div>
  );
}

function RubricPreview({ node }: { node: GraphNode }) {
  const [expanded, setExpanded] = useState(false);
  if (!node.rubric?.length) return null;

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <span>Assessment Rubric ({node.rubric.length} criteria)</span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {expanded && (
        <div className="px-4 bg-white">
          {node.rubric.map(r => (
            <div key={r.id} className="py-2.5 border-b border-slate-100 last:border-0">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-slate-700">{r.criterion}</span>
                <span className="text-xs font-mono text-slate-500">{r.max_points} pts</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">{r.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProjectSubmitModal({ node, onClose, onComplete }: Props) {
  const { learner, updateGraphNodes, graph, applyGraphDiff } = useApp();
  const [phase, setPhase] = useState<Phase>('form');
  const [repoUrl, setRepoUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState<ProjectSubmitResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!node) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!repoUrl.trim() || !node) return;

    setPhase('submitting');
    setError(null);
    try {
      const res = await submitProject(node.id, {
        learner_id: learner?.id ?? 'learner-demo',
        submission: { github_repo: repoUrl, notes },
      });
      setResult(res);
      setPhase('result');
      onComplete(res);

      if (graph && res.status !== node.status) {
        const updatedNodes = graph.nodes.map(n =>
          n.id === node.id ? { ...n, status: res.status, p_mastery: res.p_mastery } : n
        );
        updateGraphNodes(updatedNodes);
      }

      if (res.graph_diff) {
        applyGraphDiff(res.graph_diff);
      }
    } catch {
      setError('Submission failed. Please check your connection and try again.');
      setPhase('form');
    }
  }

  const totalScore = result ? result.rubric_result.reduce((s, r) => s + r.score, 0) : 0;
  const totalMax = result ? result.rubric_result.reduce((s, r) => s + r.max_score, 0) : 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.94, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden my-4"
          role="dialog"
          aria-modal="true"
          aria-label="Project submission modal"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
                <ClipboardCheck size={15} className="text-slate-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Project Submission</p>
                <h2 className="text-sm font-semibold text-slate-900">{node.label}</h2>
              </div>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors" aria-label="Close modal">
              <X size={15} />
            </button>
          </div>

          <div className="p-6">
            {phase === 'form' && (
              <form onSubmit={handleSubmit} className="space-y-5">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Submit your project for grading. Your submission will be evaluated against the rubric criteria below.
                </p>

                <RubricPreview node={node} />

                <div>
                  <label className="text-label block mb-1.5" htmlFor="repo-url">
                    GitHub Repository URL
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <Link size={14} />
                    </div>
                    <input
                      id="repo-url"
                      type="url"
                      value={repoUrl}
                      onChange={e => setRepoUrl(e.target.value)}
                      placeholder="https://github.com/your-name/project"
                      className="pm-input pl-9"
                      required
                      aria-required="true"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-label block mb-1.5" htmlFor="notes">
                    Notes for Reviewer
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Describe your implementation approach, challenges you encountered, and what you're most proud of..."
                    rows={4}
                    className="pm-textarea"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">More detail helps the evaluator understand your decisions.</p>
                </div>

                {error && <p className="text-xs text-red-600">{error}</p>}

                <button type="submit" disabled={!repoUrl.trim()} className="w-full pm-btn-primary justify-center py-2.5">
                  Submit Project
                </button>
              </form>
            )}

            {phase === 'submitting' && (
              <div className="py-10 text-center space-y-3">
                <div className="w-10 h-10 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin mx-auto" />
                <p className="text-sm text-slate-600">Evaluating your submission...</p>
                <p className="text-xs text-slate-400">This may take a moment</p>
              </div>
            )}

            {phase === 'result' && result && (
              <div className="space-y-5 animate-fade-in">
                <div className={`flex items-start gap-3 p-4 rounded-xl ${result.raw_score >= 0.70 ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
                  {result.raw_score >= 0.70
                    ? <CheckCircle2 size={20} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                    : <AlertTriangle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  }
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {result.raw_score >= 0.70 ? 'Project passed.' : 'Project needs more work.'}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Score: {totalScore} / {totalMax} — Mastery: {Math.round(result.p_mastery * 100)}%
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-label mb-2">Criterion Results</p>
                  <div className="border border-slate-200 rounded-xl px-4 overflow-hidden">
                    {result.rubric_result.map(item => <RubricRow key={item.criterion_id} item={item} />)}
                  </div>
                </div>

                {result.graph_diff && result.graph_diff.nodes_added.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle size={14} className="text-amber-600" />
                      <span className="text-xs font-semibold text-amber-900">Your path was updated</span>
                    </div>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Your project showed a gap in <strong>{result.graph_diff.nodes_added[0]?.label ?? 'a key area'}</strong>. PathMind added a targeted step to help you build that foundation.
                    </p>
                  </div>
                )}

                <button onClick={onClose} className="w-full pm-btn-secondary justify-center py-2">Close</button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
