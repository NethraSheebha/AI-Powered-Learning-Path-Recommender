import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, BookOpen, Target, Code, Cloud, Database } from 'lucide-react';
import { submitGoal } from '../../api/goalApi';
import { useApp } from '../../context/AppContext';

// ============================================================
// Goal Intake — first screen
// ============================================================

const EXAMPLE_GOALS = [
  { label: 'Learn full-stack development', icon: Code },
  { label: 'Prepare for a data science role', icon: Database },
  { label: 'Master cloud engineering', icon: Cloud },
  { label: 'Build Android applications', icon: BookOpen },
];

export default function GoalIntake() {
  const navigate = useNavigate();
  const { learner, setLearner, setGraph } = useApp();
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!goal.trim()) {
      setError('Please enter a learning goal to get started.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const learnerId = learner?.id ?? `learner-${Math.random().toString(36).slice(2, 10)}`;
      const graph = await submitGoal({ learner_id: learnerId, goal_text: goal.trim() });
      setLearner({ id: learnerId, goal_text: goal.trim() });
      setGraph(graph);
      navigate('/learn');
    } catch {
      setError('Something went wrong building your path. Please try again.');
      setLoading(false);
    }
  }

  function useExample(text: string) {
    setGoal(text);
    setError(null);
  }

  return (
    <div className="min-h-screen bg-base-200 flex flex-col">
      {/* Top bar */}
      <header className="px-6 py-4 border-b border-slate-200 bg-white flex items-center gap-2">
        <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
          <Target size={14} className="text-white" />
        </div>
        <span className="font-semibold text-slate-900 text-sm">PathMind</span>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl">
          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-display mb-3">What do you want to learn?</h1>
            <p className="text-body max-w-md">
              Tell us your learning goal in plain language. PathMind will map out a personalized path showing exactly what to study, in what order, and how to get there.
            </p>
          </div>

          {/* Goal form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <textarea
                value={goal}
                onChange={e => { setGoal(e.target.value); setError(null); }}
                placeholder="I want to become a full-stack developer..."
                rows={3}
                className="pm-textarea text-base leading-relaxed pr-4"
                aria-label="Learning goal"
                aria-describedby={error ? 'goal-error' : undefined}
                disabled={loading}
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
                }}
              />
            </div>

            {error && (
              <p id="goal-error" className="text-xs text-red-600" role="alert">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !goal.trim()}
              className="w-full pm-btn-primary justify-center py-3 text-sm"
              aria-busy={loading}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Building your learning path...
                </>
              ) : (
                <>
                  Build my learning path
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Example suggestions */}
          {!loading && (
            <div className="mt-8">
              <p className="text-label mb-3">Or start with an example</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {EXAMPLE_GOALS.map(({ label, icon: Icon }) => (
                  <button
                    key={label}
                    onClick={() => useExample(label)}
                    className="flex items-center gap-2.5 px-4 py-3 bg-white border border-slate-200 rounded-xl text-left text-xs font-medium text-slate-700 hover:border-blue-200 hover:bg-blue-50/40 transition-all group"
                  >
                    <Icon size={14} className="text-slate-400 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* What PathMind does */}
          {!loading && (
            <div className="mt-10 pt-8 border-t border-slate-200">
              <p className="text-label mb-4">How it works</p>
              <div className="space-y-3">
                {[
                  { step: '1', text: 'You describe your learning goal' },
                  { step: '2', text: 'PathMind maps a personalized prerequisite graph' },
                  { step: '3', text: 'You progress through topics with quizzes and projects' },
                  { step: '4', text: 'The path adapts based on your assessment results' },
                ].map(({ step, text }) => (
                  <div key={step} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                      {step}
                    </div>
                    <p className="text-xs text-slate-600">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="mt-8 text-center animate-pulse">
              <Sparkles size={20} className="text-blue-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Mapping the concepts you need to reach your goal...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
