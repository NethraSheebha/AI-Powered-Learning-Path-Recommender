import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2, BookOpen, Lock, Flame, Target, ArrowRight,
  TrendingUp, RefreshCw,
} from 'lucide-react';
import type { DashboardResponse } from '../../types';
import { getDashboard } from '../../api/dashboardApi';
import { useApp } from '../../context/AppContext';

// ============================================================
// Dashboard view
// ============================================================

interface MetricCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  sub?: string;
}

function MetricCard({ label, value, icon: Icon, iconColor, iconBg, sub }: MetricCardProps) {
  return (
    <div className="pm-card flex items-start gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon size={16} className={iconColor} />
      </div>
      <div>
        <p className="text-label">{label}</p>
        <p className="text-xl font-semibold text-slate-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function SkeletonDashboard() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="skeleton-line h-8 w-64 mb-2" />
      <div className="skeleton-line h-4 w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {[1, 2, 3, 4].map(i => <div key={i} className="skeleton-line h-24 rounded-xl" />)}
      </div>
      <div className="skeleton-line h-4 w-full mt-4" />
      <div className="skeleton-line h-32 w-full rounded-xl" />
    </div>
  );
}

export default function DashboardView() {
  const { learner, graph } = useApp();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = () => {
    if (!learner?.id) return;
    setLoading(true);
    setError(null);
    getDashboard(learner.id)
      .then(setData)
      .catch(() => setError('Unable to load your dashboard. Check your connection.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboard();
  }, [learner?.id]);

  const masteryPct = data
    ? Math.round((data.mastered_count / Math.max(data.total_nodes, 1)) * 100)
    : 0;

  const gapPct = data ? Math.round(data.skill_gap_distance * 100) : 100;

  // Find the next available node
  const nextNode = graph?.nodes.find(n => n.status === 'available');

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-5 py-8 space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-display">Your Progress</h1>
          {data ? (
            <p className="text-body mt-1">
              Working towards: <span className="font-medium text-slate-700">{data.current_goal}</span>
            </p>
          ) : (
            <p className="text-body mt-1">Here's where you stand with your learning path.</p>
          )}
        </div>

        {loading && <SkeletonDashboard />}

        {error && (
          <div className="pm-card text-center space-y-3">
            <p className="text-sm text-slate-600">{error}</p>
            <button onClick={fetchDashboard} className="pm-btn-secondary text-xs py-1.5 px-3 gap-1.5">
              <RefreshCw size={13} />
              Try again
            </button>
          </div>
        )}

        {data && !loading && (
          <>
            {/* Metrics grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                label="Mastered"
                value={data.mastered_count}
                icon={CheckCircle2}
                iconColor="text-emerald-600"
                iconBg="bg-emerald-50"
                sub={`of ${data.total_nodes} topics`}
              />
              <MetricCard
                label="Available"
                value={data.available_count}
                icon={BookOpen}
                iconColor="text-blue-600"
                iconBg="bg-blue-50"
                sub="ready to learn"
              />
              <MetricCard
                label="Locked"
                value={data.locked_count}
                icon={Lock}
                iconColor="text-slate-500"
                iconBg="bg-slate-100"
                sub="pending prerequisites"
              />
              <MetricCard
                label="Streak"
                value={`${data.streak_days}d`}
                icon={Flame}
                iconColor="text-orange-500"
                iconBg="bg-orange-50"
                sub={data.streak_days > 1 ? 'Keep it going' : 'Start your streak'}
              />
            </div>

            {/* Skill gap & mastery */}
            <div className="pm-card space-y-5">
              <div className="flex items-center gap-2">
                <Target size={16} className="text-slate-500" />
                <h2 className="text-subheading">Path Completion</h2>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-500">Mastery progress</span>
                  <span className="font-semibold text-slate-700">{masteryPct}%</span>
                </div>
                <div className="mastery-bar-track">
                  <div
                    className="mastery-bar-fill bg-emerald-500"
                    style={{ width: `${masteryPct}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {data.mastered_count} of {data.total_nodes} topics mastered
                </p>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-500">Remaining skill gap</span>
                  <span className="font-semibold text-slate-700">{gapPct}%</span>
                </div>
                <div className="mastery-bar-track">
                  <div
                    className="mastery-bar-fill bg-slate-300"
                    style={{ width: `${gapPct}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {gapPct < 30
                    ? 'You\'re close to reaching your goal. Keep going.'
                    : gapPct < 60
                    ? 'You\'ve made solid progress. Stay consistent.'
                    : 'You\'re building your foundation. Every step counts.'}
                </p>
              </div>
            </div>

            {/* Next action card */}
            {nextNode && (
              <div>
                <p className="text-label mb-3">Continue Learning</p>
                <div
                  className="pm-card border-blue-200 hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => navigate('/learn')}
                  role="button"
                  tabIndex={0}
                  aria-label={`Continue with ${nextNode.label}`}
                  onKeyDown={e => e.key === 'Enter' && navigate('/learn')}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-blue-600 font-semibold mb-1">Up next</p>
                      <h3 className="text-sm font-semibold text-slate-900">{nextNode.label}</h3>
                      {nextNode.description && (
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                          {nextNode.description}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 mt-2.5">
                        <div className="mastery-bar-track flex-1 max-w-24">
                          <div
                            className="mastery-bar-fill bg-blue-400"
                            style={{ width: `${Math.round(nextNode.p_mastery * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 font-mono">
                          {Math.round(nextNode.p_mastery * 100)}% mastery
                        </span>
                      </div>
                    </div>
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <ArrowRight size={15} className="text-blue-600" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Go to learning path */}
            {!nextNode && data.available_count === 0 && (
              <div className="pm-card text-center space-y-2">
                <CheckCircle2 size={24} className="text-emerald-500 mx-auto" />
                <p className="text-sm font-semibold text-slate-800">All available topics completed.</p>
                <p className="text-xs text-slate-500">Check your learning path to see what unlocked next.</p>
                <button
                  onClick={() => navigate('/learn')}
                  className="pm-btn-primary mx-auto text-xs py-2"
                >
                  <TrendingUp size={14} />
                  View learning path
                </button>
              </div>
            )}
          </>
        )}

        {/* No learner state */}
        {!learner?.goal_text && !loading && (
          <div className="pm-card text-center space-y-4">
            <BookOpen size={28} className="text-slate-300 mx-auto" />
            <div>
              <p className="text-sm font-semibold text-slate-700">No learning path yet.</p>
              <p className="text-xs text-slate-500 mt-1">Enter a goal and we'll build your first path.</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="pm-btn-primary mx-auto text-xs py-2"
            >
              Build my path
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
