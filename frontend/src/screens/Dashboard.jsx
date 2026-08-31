import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { api } from '../services/api';
import { Loader2, Star, Unlock, Flame, Ruler } from 'lucide-react';

function MetricCard({ icon: Icon, label, value, accent }) {
  return (
    <motion.div
      className="dash-card glass-panel"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="dash-card-icon" style={{ color: accent }}>
        <Icon size={20} />
      </div>
      <div className="dash-card-value" style={{ color: accent }}>{value}</div>
      <div className="dash-card-label">{label}</div>
    </motion.div>
  );
}

export default function Dashboard() {
  const learnerId = useStore((s) => s.learnerId);
  const learnerName = useStore((s) => s.learnerName);
  const goalText = useStore((s) => s.goalText);
  const graphData = useStore((s) => s.graphData);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    api.getDashboard(learnerId)
      .then((data) => { if (!cancelled) setDashboard(data); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [learnerId]);

  if (loading) {
    return (
      <div className="dash-screen">
        <div className="dash-loading">
          <Loader2 size={24} className="spin-icon" />
          <span>Loading dashboard…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dash-screen">
        <div className="dash-loading" style={{ color: 'var(--destructive)' }}>
          {error}
        </div>
      </div>
    );
  }

  const d = dashboard || {};
  const totalNodes = d.total_nodes || graphData?.nodes?.length || 0;
  const mastered = d.mastered_count || 0;
  const progressPct = totalNodes > 0 ? Math.round((mastered / totalNodes) * 100) : 0;
  const nameToDisplay = learnerName || 'Learner';

  return (
    <div className="dash-screen">
      <motion.div
        className="dash-content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="dash-welcome">
          <h1 className="dash-welcome-title">Welcome back, {nameToDisplay}</h1>
        </div>

        <div className="dash-cards">
          <MetricCard icon={Star} label="Mastered" value={mastered} accent="var(--nova)" />
          <MetricCard icon={Unlock} label="Available" value={d.available_count || 0} accent="var(--pulsar)" />
          <MetricCard icon={Flame} label="Streak" value={`${d.streak_days || 0}d`} accent="#F97316" />
          <MetricCard icon={Ruler} label="Skill gap" value={(d.skill_gap_distance ?? 1).toFixed(2)} accent="var(--stardust)" />
        </div>

        <div className="dash-progress-section glass-panel">
          <div className="dash-progress-header">
            <h3>Current goal</h3>
            <span className="dash-progress-pct">{progressPct}%</span>
          </div>
          <p className="dash-goal-text">{d.current_goal || goalText || 'No goal set'}</p>
          <div className="dash-progress-track">
            <div className="dash-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <p className="dash-progress-detail">
            {mastered} of {totalNodes} nodes mastered
          </p>
        </div>
      </motion.div>

      <style>{`
        .dash-screen {
          height: 100%; width: 100%;
          background: var(--void);
          display: flex; align-items: flex-start; justify-content: center;
          padding-top: 80px;
          overflow-y: auto;
        }
        .dash-loading {
          display: flex; flex-direction: column; align-items: center;
          gap: var(--space-3);
          color: var(--stardust); font-size: 14px;
          margin-top: 120px;
        }
        .dash-content {
          max-width: 680px; width: 100%;
          padding: 0 var(--space-5) var(--space-8);
          display: flex; flex-direction: column; gap: var(--space-6);
        }
        .dash-welcome-title {
          font-family: var(--font-display);
          font-size: 26px; font-weight: 600;
          color: var(--starlight);
        }
        .dash-cards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--space-4);
        }
        @media (max-width: 640px) {
          .dash-cards { grid-template-columns: repeat(2, 1fr); }
        }
        .dash-card {
          display: flex; flex-direction: column; align-items: center;
          padding: var(--space-5) var(--space-4);
          gap: var(--space-2);
          text-align: center;
        }
        .dash-card-icon { opacity: 0.8; }
        .dash-card-value {
          font-family: var(--font-display);
          font-size: 28px; font-weight: 600;
          line-height: 1;
        }
        .dash-card-label {
          font-size: 12px; color: var(--stardust);
          font-weight: 500;
        }
        .dash-progress-section {
          padding: var(--space-5);
          display: flex; flex-direction: column; gap: var(--space-3);
        }
        .dash-progress-header {
          display: flex; justify-content: space-between; align-items: center;
        }
        .dash-progress-header h3 {
          font-size: 15px; font-weight: 500;
        }
        .dash-progress-pct {
          font-family: var(--font-display);
          font-size: 15px; font-weight: 600;
          color: var(--nova);
        }
        .dash-goal-text {
          font-size: 14px; color: var(--starlight);
          font-style: italic;
        }
        .dash-progress-track {
          height: 6px; border-radius: 3px;
          background: var(--stardust-20);
          overflow: hidden;
        }
        .dash-progress-fill {
          height: 100%; border-radius: 3px;
          background: linear-gradient(90deg, var(--pulsar), var(--nova));
          transition: width 600ms var(--ease-out);
        }
        .dash-progress-detail {
          font-size: 12px; color: var(--stardust);
        }
        .spin-icon { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
