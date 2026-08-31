import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2, Check } from 'lucide-react';

function DotField() {
  const dots = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 1.5 + Math.random() * 2,
    opacity: 0.08 + Math.random() * 0.15,
    duration: 40 + Math.random() * 60,
  }));

  return (
    <div className="dot-field">
      {dots.map((d) => (
        <div
          key={d.id}
          className="dot"
          style={{
            left: `${d.x}%`,
            top: `${d.y}%`,
            width: d.size,
            height: d.size,
            opacity: d.opacity,
            animationDuration: `${d.duration}s`,
          }}
        />
      ))}
      <style>{`
        .dot-field {
          position: fixed; inset: 0;
          pointer-events: none; z-index: 0;
          overflow: hidden;
        }
        .dot {
          position: absolute;
          background: var(--pulsar);
          border-radius: 50%;
          animation: drift linear infinite alternate;
        }
        @keyframes drift {
          0%   { transform: translate(0, 0); }
          25%  { transform: translate(12px, -8px); }
          50%  { transform: translate(-6px, 14px); }
          75%  { transform: translate(8px, 6px); }
          100% { transform: translate(-10px, -12px); }
        }
      `}</style>
    </div>
  );
}

const EXPERIENCE_OPTIONS = [
  'Complete beginner',
  'Some experience',
  'Comfortable, want structure',
  'Advanced, filling gaps',
];

const stepTransition = {
  duration: 0.25,
  ease: [0, 0, 0.2, 1],
};

export default function GoalIntake() {
  const storedName = useStore((s) => s.learnerName);
  const storedExperience = useStore((s) => s.experienceLevel);

  const [step, setStep] = useState(1);
  const [name, setName] = useState(storedName || '');
  const [experienceLevel, setExperienceLevel] = useState(storedExperience || '');
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const ensureLearnerId = useStore((s) => s.ensureLearnerId);
  const persistLearnerProfile = useStore((s) => s.persistLearnerProfile);
  const setGraphData = useStore((s) => s.setGraphData);
  const setGoalText = useStore((s) => s.setGoalText);
  const navigate = useNavigate();

  function goNext(e) {
    e.preventDefault();
    if (step === 1 && name.trim()) setStep(2);
    else if (step === 2 && experienceLevel) setStep(3);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!goal.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const learnerId = ensureLearnerId();
      const trimmedName = name.trim();
      const result = await api.createGoal(
        learnerId,
        goal.trim(),
        experienceLevel,
        trimmedName,
      );
      persistLearnerProfile({
        learnerId,
        name: trimmedName,
        experienceLevel,
        graphId: result.id,
      });
      setGoalText(goal.trim());
      setGraphData(result.id, { nodes: result.nodes, edges: result.edges, goal_text: result.goal_text });
      navigate(`/graph/${result.id}`);
    } catch (err) {
      setError(err.message || 'Failed to generate learning path. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="goal-screen">
      <DotField />

      <div className="goal-content">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step-1"
              className="step-container"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={stepTransition}
            >
              <h1 className="goal-title">What should we call you?</h1>
              <form onSubmit={goNext} className="goal-form">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="goal-input"
                  autoFocus
                  autoComplete="name"
                />
                <button type="submit" className="goal-button" disabled={!name.trim()}>
                  Continue
                  <ArrowRight size={16} />
                </button>
              </form>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-2"
              className="step-container"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={stepTransition}
            >
              <h1 className="goal-title">What's your current level with this?</h1>
              <form onSubmit={goNext} className="goal-form">
                <div className="options-group">
                  {EXPERIENCE_OPTIONS.map((opt) => {
                    const isSelected = experienceLevel === opt;
                    return (
                      <button
                        type="button"
                        key={opt}
                        className={`option-btn ${isSelected ? 'selected' : ''}`}
                        onClick={() => setExperienceLevel(opt)}
                      >
                        <span>{opt}</span>
                        {isSelected && <Check size={16} className="check-icon" />}
                      </button>
                    );
                  })}
                </div>
                <button type="submit" className="goal-button" disabled={!experienceLevel}>
                  Continue
                  <ArrowRight size={16} />
                </button>
              </form>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step-3"
              className="step-container"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={stepTransition}
            >
              <h1 className="goal-title">What do you want to learn?</h1>
              <form onSubmit={handleSubmit} className="goal-form">
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder='e.g. "Become a backend developer"'
                  className="goal-input"
                  autoFocus
                />
                <button
                  type="submit"
                  className="goal-button"
                  disabled={!goal.trim() || loading}
                >
                  {loading ? (
                    <Loader2 size={18} className="spin-icon" />
                  ) : (
                    <>
                      Chart my path
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.p
            className="goal-error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {error}
          </motion.p>
        )}
      </div>

      <style>{`
        .goal-screen {
          height: 100%; width: 100%;
          display: flex; align-items: center; justify-content: center;
          background: var(--void);
          position: relative;
        }
        .goal-content {
          position: relative; z-index: 1;
          display: flex; flex-direction: column; align-items: center;
          max-width: 520px; width: 100%;
          padding: var(--space-6);
        }
        .step-container {
          width: 100%;
          display: flex; flex-direction: column; align-items: center;
        }
        .goal-title {
          font-size: 32px;
          margin-bottom: var(--space-8);
          text-align: center;
        }
        .goal-form {
          width: 100%;
          display: flex; flex-direction: column; gap: var(--space-4);
        }
        .goal-input {
          width: 100%;
          padding: var(--space-4) var(--space-5);
          font-size: 16px;
          background: var(--nebula);
          border: 1px solid var(--stardust-30);
          border-radius: var(--radius-md);
          color: var(--starlight);
          transition: border-color 200ms var(--ease-out), box-shadow 200ms var(--ease-out);
        }
        .goal-input:focus {
          border-color: var(--pulsar);
          box-shadow: 0 0 0 3px var(--pulsar-20);
          outline: none;
        }
        .options-group {
          display: flex; flex-direction: column; gap: var(--space-3);
          width: 100%;
        }
        .option-btn {
          display: flex; align-items: center; justify-content: space-between;
          padding: var(--space-4) var(--space-5);
          font-size: 15px;
          background: var(--nebula);
          border: 1px solid var(--stardust-30);
          border-radius: var(--radius-md);
          color: var(--stardust);
          text-align: left;
          cursor: pointer;
          transition: all 200ms var(--ease-out);
        }
        .option-btn:hover {
          border-color: var(--pulsar);
          color: var(--starlight);
        }
        .option-btn.selected {
          border-color: var(--pulsar);
          background: var(--pulsar-20);
          color: var(--starlight);
          font-weight: 500;
        }
        .check-icon { color: var(--pulsar); }
        .goal-button {
          display: flex; align-items: center; justify-content: center;
          gap: var(--space-2);
          width: 100%;
          padding: var(--space-3) var(--space-5);
          background: var(--pulsar);
          color: var(--void);
          font-weight: 500;
          font-size: 15px;
          border-radius: var(--radius-md);
          cursor: pointer;
          border: none;
          transition: background 200ms var(--ease-out), opacity 200ms;
        }
        .goal-button:hover:not(:disabled) { background: #5A8AEA; }
        .goal-button:disabled { opacity: 0.4; cursor: not-allowed; }
        .goal-error {
          margin-top: var(--space-4);
          color: var(--destructive);
          font-size: 13px;
          text-align: center;
        }
        .spin-icon { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
