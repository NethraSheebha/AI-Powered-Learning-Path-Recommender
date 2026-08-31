import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Brain, CheckCircle2, XCircle, Unlock,
} from 'lucide-react';
import type { GraphNode, QuizResponse } from '../../types';
import { submitQuiz } from '../../api/quizApi';
import { useApp } from '../../context/AppContext';

// ============================================================
// Quiz Modal
// ============================================================

interface QuizQuestion {
  id: string;
  text: string;
  options: { id: string; label: string; correct: boolean }[];
}

function buildQuizQuestions(node: GraphNode): QuizQuestion[] {
  const label = node.label;
  return [
    {
      id: 'q1',
      text: `What is the primary purpose of studying ${label}?`,
      options: [
        { id: 'a', label: 'To build foundational skills for more advanced topics', correct: true },
        { id: 'b', label: 'To memorize as many facts as possible', correct: false },
        { id: 'c', label: 'To replace all other knowledge areas', correct: false },
        { id: 'd', label: 'None of the above', correct: false },
      ],
    },
    {
      id: 'q2',
      text: `When working with ${label}, which approach best supports maintainability?`,
      options: [
        { id: 'a', label: 'Writing long, monolithic implementations', correct: false },
        { id: 'b', label: 'Following community conventions and patterns', correct: true },
        { id: 'c', label: 'Avoiding documentation', correct: false },
        { id: 'd', label: 'Hardcoding all values', correct: false },
      ],
    },
    {
      id: 'q3',
      text: `What is the most important skill when learning ${label}?`,
      options: [
        { id: 'a', label: 'Passive reading', correct: false },
        { id: 'b', label: 'Practising with real projects', correct: true },
        { id: 'c', label: 'Memorising syntax only', correct: false },
        { id: 'd', label: 'Avoiding mistakes', correct: false },
      ],
    },
  ];
}

interface Props {
  node: GraphNode | null;
  onClose: () => void;
  onComplete: (result: QuizResponse) => void;
}

type Phase = 'quiz' | 'submitting' | 'result';

export default function QuizModal({ node, onClose, onComplete }: Props) {
  const { learner, updateGraphNodes, graph } = useApp();
  const [phase, setPhase] = useState<Phase>('quiz');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!node) return null;

  const questions = buildQuizQuestions(node);

  function selectAnswer(questionId: string, optionId: string) {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  }

  async function handleSubmit() {
    const correctCount = questions.filter(q =>
      q.options.find(o => o.id === answers[q.id])?.correct
    ).length;
    const score = correctCount / questions.length;

    setPhase('submitting');
    setError(null);
    try {
      const res = await submitQuiz(node!.id, {
        learner_id: learner?.id ?? 'learner-demo',
        answers: { score, correct: score >= 0.70 },
      });
      setResult(res);
      setPhase('result');
      onComplete(res);

      if (graph && res.status !== node!.status) {
        const updatedNodes = graph.nodes.map(n =>
          n.id === node!.id ? { ...n, status: res.status, p_mastery: res.p_mastery } : n
        );
        updateGraphNodes(updatedNodes);
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setPhase('quiz');
    }
  }

  const allAnswered = questions.every(q => answers[q.id]);
  const answered = Object.keys(answers).length;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.94, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Quiz modal"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <Brain size={15} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Quiz</p>
                <h2 className="text-sm font-semibold text-slate-900">{node.label}</h2>
              </div>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors" aria-label="Close quiz">
              <X size={15} />
            </button>
          </div>

          <div className="p-6">
            {phase === 'quiz' && (
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>{answered} of {questions.length} answered</span>
                    <span>{Math.round((answered / questions.length) * 100)}%</span>
                  </div>
                  <div className="mastery-bar-track">
                    <div className="mastery-bar-fill bg-blue-400" style={{ width: `${(answered / questions.length) * 100}%` }} />
                  </div>
                </div>

                {questions.map((q, qi) => (
                  <div key={q.id} className="space-y-2">
                    <p className="text-sm font-medium text-slate-800">
                      <span className="text-blue-500 font-semibold mr-1">{qi + 1}.</span>
                      {q.text}
                    </p>
                    <div className="space-y-1.5">
                      {q.options.map(opt => {
                        const selected = answers[q.id] === opt.id;
                        return (
                          <button
                            key={opt.id}
                            onClick={() => selectAnswer(q.id, opt.id)}
                            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs border transition-all ${
                              selected
                                ? 'border-blue-400 bg-blue-50 text-blue-800 font-medium'
                                : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                            aria-pressed={selected}
                          >
                            <span className="font-semibold mr-2 text-slate-400">{opt.id.toUpperCase()}.</span>
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {error && <p className="text-xs text-red-600">{error}</p>}

                <button onClick={handleSubmit} disabled={!allAnswered} className="w-full pm-btn-primary justify-center py-2.5" aria-disabled={!allAnswered}>
                  Submit Answers
                </button>
              </div>
            )}

            {phase === 'submitting' && (
              <div className="py-10 text-center space-y-3">
                <div className="w-10 h-10 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto" />
                <p className="text-sm text-slate-600">Checking your answers...</p>
              </div>
            )}

            {phase === 'result' && result && (
              <div className="space-y-5 animate-fade-in">
                <div className={`flex items-center gap-3 p-4 rounded-xl ${result.correct ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                  {result.correct
                    ? <CheckCircle2 size={22} className="text-emerald-500 flex-shrink-0" />
                    : <XCircle size={22} className="text-red-400 flex-shrink-0" />
                  }
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{result.correct ? 'Good work.' : 'Not quite.'}</p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Score: {Math.round(result.raw_score * 100)}% — Mastery moved to {Math.round(result.p_mastery * 100)}%
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-label">Updated Mastery</span>
                    <span className="text-xs font-semibold">{Math.round(result.p_mastery * 100)}%</span>
                  </div>
                  <div className="mastery-bar-track">
                    <div
                      className={`mastery-bar-fill ${result.p_mastery >= 0.8 ? 'bg-emerald-500' : result.p_mastery >= 0.5 ? 'bg-blue-500' : 'bg-amber-400'}`}
                      style={{ width: `${result.p_mastery * 100}%` }}
                    />
                  </div>
                </div>

                {result.newly_unlocked.length > 0 && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Unlock size={14} className="text-blue-600" />
                      <span className="text-xs font-semibold text-blue-800">Newly unlocked</span>
                    </div>
                    <p className="text-xs text-blue-700">
                      You've unlocked {result.newly_unlocked.length} new topic{result.newly_unlocked.length > 1 ? 's' : ''} in your path.
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
