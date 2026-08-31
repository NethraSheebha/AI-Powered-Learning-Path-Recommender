import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { BarChart3, ChevronLeft } from 'lucide-react';

export default function TopBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const goalText = useStore((s) => s.goalText);

  const isGraph = location.pathname.startsWith('/graph');
  const isDashboard = location.pathname === '/dashboard';

  if (!isGraph && !isDashboard) return null;

  return (
    <header className="top-bar glass-bar">
      <div className="top-bar-left">
        {isDashboard ? (
          <button className="top-bar-btn" onClick={() => navigate(-1)}>
            <ChevronLeft size={16} />
            Back to graph
          </button>
        ) : (
          <button
            className="top-bar-btn"
            onClick={() => {
              useStore.getState().startNewGoal();
              navigate('/?new=1');
            }}
          >
            <ChevronLeft size={16} />
            New goal
          </button>
        )}
      </div>

      <div className="top-bar-center">
        {goalText && <span className="top-bar-goal">{goalText}</span>}
      </div>

      <div className="top-bar-right">
        {isGraph && (
          <button className="top-bar-btn" onClick={() => navigate('/dashboard')}>
            <BarChart3 size={16} />
            Dashboard
          </button>
        )}
      </div>

      <style>{`
        .top-bar {
          position: fixed; top: 0; left: 0; right: 0;
          height: 48px;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 var(--space-5);
          z-index: 50;
          border-bottom: 1px solid var(--stardust-20);
        }
        .top-bar-left, .top-bar-right { flex: 0 0 auto; }
        .top-bar-center {
          flex: 1;
          text-align: center;
          overflow: hidden;
        }
        .top-bar-goal {
          font-family: var(--font-display);
          font-size: 13px; font-weight: 500;
          color: var(--stardust);
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          display: block;
        }
        .top-bar-btn {
          display: flex; align-items: center; gap: var(--space-2);
          background: transparent;
          color: var(--stardust);
          font-size: 13px; font-weight: 400;
          padding: var(--space-1) var(--space-2);
          border-radius: var(--radius-sm);
          border: none; cursor: pointer;
          transition: color 200ms, background 200ms;
        }
        .top-bar-btn:hover {
          color: var(--starlight);
          background: var(--stardust-20);
        }
      `}</style>
    </header>
  );
}
