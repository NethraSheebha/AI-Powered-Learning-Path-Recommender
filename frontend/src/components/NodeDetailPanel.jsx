import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  BookOpen,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Loader2,
  Check,
  AlertCircle,
  Send,
  HelpCircle,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { api } from '../services/api';

const panelVariants = {
  hidden: { x: '100%', opacity: 0.8 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } },
  exit: { x: '100%', opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } },
};

function MasteryDisplay({ pMastery, evidenceCount }) {
  const hasEvidence = (evidenceCount ?? 0) > 0;
  const pct = Math.round((pMastery || 0) * 100);
  const isMastered = pct >= 85;

  if (!hasEvidence) {
    return (
      <div className="ndp-mastery">
        <div className="ndp-mastery-label">
          <span>Mastery</span>
          <span className="ndp-badge-muted">Not yet started</span>
        </div>
        <div className="ndp-mastery-track">
          <div
            className="ndp-mastery-fill muted"
            style={{ width: `${Math.max(pct, 6)}%` }}
          />
        </div>
        <div className="ndp-mastery-subtext">Starting estimate</div>
      </div>
    );
  }

  return (
    <div className="ndp-mastery">
      <div className="ndp-mastery-label">
        <span>Mastery</span>
        <span style={{ color: isMastered ? 'var(--nova)' : 'var(--starlight)', fontWeight: 600 }}>
          {pct}%
        </span>
      </div>
      <div className="ndp-mastery-track">
        <div
          className="ndp-mastery-fill"
          style={{
            width: `${pct}%`,
            background: isMastered ? 'var(--nova)' : 'var(--pulsar)',
          }}
        />
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    locked: { bg: 'rgba(42,48,64,0.6)', text: '#8B95A5' },
    available: { bg: 'var(--pulsar-20)', text: 'var(--pulsar)' },
    mastered: { bg: 'var(--nova-20)', text: 'var(--nova)' },
  };
  const c = colors[status] || colors.locked;
  return (
    <span className="ndp-badge" style={{ background: c.bg, color: c.text }}>
      {status}
    </span>
  );
}

export default function NodeDetailPanel() {
  const selectedNodeId = useStore((s) => s.selectedNodeId);
  const selectedNodeData = useStore((s) => s.selectedNodeData);
  const clearSelection = useStore((s) => s.clearSelection);
  const learnerId = useStore((s) => s.learnerId);
  const graphId = useStore((s) => s.graphId);
  const graphData = useStore((s) => s.graphData);
  const updateNodeInGraph = useStore((s) => s.updateNodeInGraph);
  const addToGraph = useStore((s) => s.addToGraph);
  const setPendingMutation = useStore((s) => s.setPendingMutation);

  const [nodeDetail, setNodeDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Explanation state + cache
  const [explanationsCache, setExplanationsCache] = useState({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [loadingExplanation, setLoadingExplanation] = useState(false);

  // Quiz state
  const [quizActive, setQuizActive] = useState(false);
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [unlockedLabels, setUnlockedLabels] = useState([]);

  // Project state
  const [projectLoading, setProjectLoading] = useState(false);
  const [projectUrl, setProjectUrl] = useState('');
  const [feedback, setFeedback] = useState(null);

  // Reset internal state when node selection changes
  useEffect(() => {
    setNodeDetail(null);
    setShowExplanation(false);
    setQuizActive(false);
    setQuizStep(0);
    setQuizAnswers({});
    setQuizResult(null);
    setUnlockedLabels([]);
    setFeedback(null);
    setProjectUrl('');

    if (!selectedNodeId) return;

    let cancelled = false;
    setLoadingDetail(true);

    api.getNode(selectedNodeId)
      .then((data) => { if (!cancelled) setNodeDetail(data); })
      .catch(() => { if (!cancelled) setNodeDetail(selectedNodeData); })
      .finally(() => { if (!cancelled) setLoadingDetail(false); });

    return () => { cancelled = true; };
  }, [selectedNodeId, selectedNodeData]);

  // Fetch explanation with caching
  const handleToggleExplanation = useCallback(() => {
    const nextShow = !showExplanation;
    setShowExplanation(nextShow);

    if (nextShow && selectedNodeId && !explanationsCache[selectedNodeId]) {
      setLoadingExplanation(true);
      api.getExplanation(selectedNodeId)
        .then((res) => {
          setExplanationsCache((prev) => ({ ...prev, [selectedNodeId]: res }));
        })
        .catch(() => {
          setExplanationsCache((prev) => ({
            ...prev,
            [selectedNodeId]: { explanation: 'Explanation currently unavailable.' },
          }));
        })
        .finally(() => setLoadingExplanation(false));
    }
  }, [showExplanation, selectedNodeId, explanationsCache]);

  const node = nodeDetail || selectedNodeData || {};
  const resources = node.resources || [];
  const quizQuestions = node.quiz_questions || [];
  const isLocked = node.status === 'locked';

  // Start Quiz
  const handleStartQuiz = () => {
    setQuizActive(true);
    setQuizStep(0);
    setQuizAnswers({});
    setQuizResult(null);
    setUnlockedLabels([]);
    setFeedback(null);
  };

  // Select Option for Quiz Question
  const handleSelectOption = (questionId, optionIndex) => {
    setQuizAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  // Submit Quiz
  const handleSubmitQuiz = async () => {
    if (quizSubmitting || !selectedNodeId) return;
    setQuizSubmitting(true);
    try {
      const payloadAnswers = Object.entries(quizAnswers).map(([qid, idx]) => ({
        question_id: qid,
        selected_option_index: idx,
      }));

      const res = await api.submitQuiz(selectedNodeId, learnerId, payloadAnswers);

      // Resolve unlocked node labels if any
      const newlyUnlockedIds = res.newly_unlocked || [];
      const labels = [];
      if (newlyUnlockedIds.length > 0 && graphData?.nodes) {
        newlyUnlockedIds.forEach((id) => {
          const match = graphData.nodes.find((n) => n.id === id);
          if (match) labels.push(match.label || id);
          else labels.push(id);
        });
      }
      setUnlockedLabels(labels);

      // Update graph state
      updateNodeInGraph(selectedNodeId, {
        status: res.status,
        p_mastery: res.p_mastery,
        evidence_count: (node.evidence_count || 0) + 1,
      });

      setNodeDetail((prev) => ({
        ...prev,
        status: res.status,
        p_mastery: res.p_mastery,
        evidence_count: (prev?.evidence_count || 0) + 1,
      }));

      setQuizResult(res);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Quiz submission failed.' });
    } finally {
      setQuizSubmitting(false);
    }
  };

  // Project Submit
  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    if (isLocked || projectLoading || !projectUrl.trim()) return;
    setProjectLoading(true);
    setFeedback(null);

    try {
      const result = await api.submitProject(selectedNodeId, learnerId, { repo_url: projectUrl.trim() });
      updateNodeInGraph(selectedNodeId, {
        status: result.status,
        p_mastery: result.p_mastery,
        evidence_count: (node.evidence_count || 0) + 1,
      });
      setNodeDetail((prev) => ({
        ...prev,
        status: result.status,
        p_mastery: result.p_mastery,
        evidence_count: (prev?.evidence_count || 0) + 1,
      }));

      const passed = result.raw_score >= 0.7;
      setFeedback({
        type: passed ? 'success' : 'error',
        message: passed
          ? `Project passed! Score: ${Math.round(result.raw_score * 100)}%`
          : `Project needs iteration. Score: ${Math.round(result.raw_score * 100)}%`,
      });

      if (result.graph_diff) {
        try {
          const diff = await api.getLatestGraphDiff(graphId);
          if (diff && diff.nodes_added?.length) {
            addToGraph(
              diff.nodes_added.map((n) => ({ ...n, status: n.status || 'available' })),
              diff.edges_added || []
            );
            setPendingMutation({ nodesAdded: diff.nodes_added, edgesAdded: diff.edges_added });
          }
        } catch { /* diff fetch non-critical */ }
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setProjectLoading(false);
    }
  };

  const currentExplanation = explanationsCache[selectedNodeId];

  return (
    <AnimatePresence>
      {selectedNodeId && (
        <motion.aside
          className="ndp"
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          key="node-detail-panel"
        >
          {/* Header */}
          <div className="ndp-header">
            <div className="ndp-header-top">
              <h3 className="ndp-title">{node.label || selectedNodeId}</h3>
              <button className="ndp-close" onClick={clearSelection} aria-label="Close panel">
                <X size={18} />
              </button>
            </div>
            <div className="ndp-header-meta">
              <StatusBadge status={node.status || 'locked'} />
            </div>
          </div>

          {loadingDetail ? (
            <div className="ndp-loading">
              <Loader2 size={22} className="spin-icon" />
            </div>
          ) : (
            <div className="ndp-body">
              {/* Mastery section */}
              <MasteryDisplay
                pMastery={node.p_mastery}
                evidenceCount={node.evidence_count}
              />

              {/* Description */}
              {node.description && <p className="ndp-desc">{node.description}</p>}

              {/* Resources */}
              {resources.length > 0 && (
                <div className="ndp-section">
                  <h4 className="ndp-section-title">
                    <BookOpen size={14} /> Resources
                  </h4>
                  <ul className="ndp-resources">
                    {resources.map((r, i) => (
                      <li key={i}>
                        <a href={r.url} target="_blank" rel="noopener noreferrer">
                          <span>{r.title || r.url}</span>
                          <ExternalLink size={12} />
                        </a>
                        {r.duration_minutes && (
                          <span className="ndp-res-meta">{r.duration_minutes} min</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Assessment / Quiz Section */}
              {!isLocked && (
                <div className="ndp-section">
                  <h4 className="ndp-section-title">
                    <HelpCircle size={14} /> Knowledge Check
                  </h4>

                  {!quizActive ? (
                    <div className="ndp-quiz-launch">
                      <button
                        className="ndp-action-btn ndp-quiz-btn"
                        onClick={handleStartQuiz}
                        disabled={quizQuestions.length === 0}
                      >
                        <Sparkles size={15} />
                        {quizQuestions.length > 0
                          ? `Take Quiz (${quizQuestions.length} questions)`
                          : 'No Quiz Available'}
                      </button>
                    </div>
                  ) : (
                    <div className="ndp-quiz-box glass-panel">
                      {quizResult ? (
                        /* Quiz Finished View */
                        <div className="ndp-quiz-result">
                          <div
                            className={`quiz-result-header ${
                              quizResult.correct ? 'pass' : 'fail'
                            }`}
                          >
                            {quizResult.correct ? (
                              <>
                                <CheckCircle2 size={24} className="icon-pass" />
                                <div>
                                  <h5>Assessment Passed</h5>
                                  <span>Score: {Math.round(quizResult.raw_score * 100)}%</span>
                                </div>
                              </>
                            ) : (
                              <>
                                <XCircle size={24} className="icon-fail" />
                                <div>
                                  <h5>Needs Review</h5>
                                  <span>Score: {Math.round(quizResult.raw_score * 100)}%</span>
                                </div>
                              </>
                            )}
                          </div>

                          <div className="quiz-result-mastery">
                            <span>Updated Mastery</span>
                            <strong>{Math.round(quizResult.p_mastery * 100)}%</strong>
                          </div>

                          {/* Unlocked Nodes Payoff Banner */}
                          {unlockedLabels.length > 0 && (
                            <motion.div
                              className="ndp-unlock-card"
                              initial={{ scale: 0.95, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                            >
                              <Sparkles size={16} className="sparkle-icon" />
                              <div>
                                <h6>New Node Unlocked!</h6>
                                <p>{unlockedLabels.join(', ')}</p>
                              </div>
                            </motion.div>
                          )}

                          <button
                            className="ndp-action-btn ndp-project-btn"
                            style={{ marginTop: 'var(--space-2)' }}
                            onClick={() => {
                              setQuizActive(false);
                              setQuizResult(null);
                            }}
                          >
                            Close Quiz
                          </button>
                        </div>
                      ) : (
                        /* Active Quiz Question View */
                        <div className="ndp-quiz-question-view">
                          <div className="quiz-progress-bar">
                            <span>
                              Question {quizStep + 1} of {quizQuestions.length}
                            </span>
                            <div className="quiz-progress-track">
                              <div
                                className="quiz-progress-fill"
                                style={{
                                  width: `${((quizStep + 1) / quizQuestions.length) * 100}%`,
                                }}
                              />
                            </div>
                          </div>

                          {quizQuestions[quizStep] && (
                            <div className="quiz-q-body">
                              <p className="quiz-prompt">
                                {quizQuestions[quizStep].prompt}
                              </p>

                              <div className="quiz-options">
                                {quizQuestions[quizStep].options?.map((opt, oIdx) => {
                                  const qId = quizQuestions[quizStep].id;
                                  const isSelected = quizAnswers[qId] === oIdx;
                                  return (
                                    <button
                                      key={oIdx}
                                      type="button"
                                      className={`quiz-option-btn ${
                                        isSelected ? 'selected' : ''
                                      }`}
                                      onClick={() => handleSelectOption(qId, oIdx)}
                                    >
                                      <span className="opt-radio">
                                        {isSelected && <span className="opt-dot" />}
                                      </span>
                                      <span className="opt-text">{opt}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          <div className="quiz-nav-btns">
                            <button
                              className="ndp-btn-secondary"
                              onClick={() => {
                                setQuizActive(false);
                              }}
                            >
                              Cancel
                            </button>

                            {quizStep < quizQuestions.length - 1 ? (
                              <button
                                className="ndp-action-btn ndp-quiz-btn inline-btn"
                                disabled={
                                  quizAnswers[quizQuestions[quizStep]?.id] == null
                                }
                                onClick={() => setQuizStep(quizStep + 1)}
                              >
                                Next
                                <ArrowRight size={14} />
                              </button>
                            ) : (
                              <button
                                className="ndp-action-btn ndp-quiz-btn inline-btn"
                                disabled={
                                  quizAnswers[quizQuestions[quizStep]?.id] == null ||
                                  quizSubmitting
                                }
                                onClick={handleSubmitQuiz}
                              >
                                {quizSubmitting ? (
                                  <Loader2 size={16} className="spin-icon" />
                                ) : (
                                  'Finish Quiz'
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Project Repo Submission */}
                  <form onSubmit={handleProjectSubmit} className="ndp-project-form">
                    <input
                      type="text"
                      placeholder="Project repo URL"
                      value={projectUrl}
                      onChange={(e) => setProjectUrl(e.target.value)}
                      className="ndp-project-input"
                    />
                    <button
                      type="submit"
                      className="ndp-action-btn ndp-project-btn"
                      disabled={projectLoading || !projectUrl.trim()}
                    >
                      {projectLoading ? (
                        <Loader2 size={16} className="spin-icon" />
                      ) : (
                        <>
                          <Send size={14} /> Submit project
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {isLocked && (
                <div className="ndp-locked-msg">
                  <AlertCircle size={14} />
                  Master prerequisite nodes first to unlock.
                </div>
              )}

              {/* Feedback messages */}
              <AnimatePresence>
                {feedback && (
                  <motion.div
                    className={`ndp-feedback ndp-feedback-${feedback.type}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {feedback.type === 'success' ? (
                      <Check size={14} />
                    ) : (
                      <AlertCircle size={14} />
                    )}
                    {feedback.message}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Explanation Section */}
              <div className="ndp-section">
                <button
                  className="ndp-explain-toggle"
                  onClick={handleToggleExplanation}
                >
                  <span>Why is this node here?</span>
                  {showExplanation ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                <AnimatePresence>
                  {showExplanation && (
                    <motion.div
                      className="ndp-explanation"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {loadingExplanation ? (
                        <div className="ndp-explain-loading">
                          <Loader2 size={16} className="spin-icon" />
                          <span>Generating pedagogical explanation...</span>
                        </div>
                      ) : (
                        <p>{currentExplanation?.explanation || 'Explanation loaded.'}</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          <style>{`
            .ndp {
              position: fixed; top: 0; right: 0; bottom: 0;
              width: 380px; max-width: 90vw;
              background: var(--nebula-92);
              backdrop-filter: blur(16px);
              -webkit-backdrop-filter: blur(16px);
              border-left: 1px solid var(--stardust-20);
              z-index: 100;
              display: flex; flex-direction: column;
              overflow-y: auto;
              box-sizing: border-box;
            }
            .ndp-header {
              padding: var(--space-5) var(--space-5) var(--space-4);
              border-bottom: 1px solid var(--stardust-20);
              flex-shrink: 0;
            }
            .ndp-header-top {
              display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-3);
            }
            .ndp-title {
              font-family: var(--font-display);
              font-size: 18px; font-weight: 600;
              color: var(--starlight);
              flex: 1; word-break: break-word;
            }
            .ndp-close {
              background: transparent; color: var(--stardust);
              padding: var(--space-1); border-radius: var(--radius-sm);
              display: flex; align-items: center; justify-content: center;
            }
            .ndp-close:hover { color: var(--starlight); background: var(--stardust-20); }
            .ndp-header-meta { margin-top: var(--space-2); }
            .ndp-badge {
              display: inline-block;
              padding: 2px 10px; border-radius: 100px;
              font-size: 12px; font-weight: 500;
              text-transform: capitalize;
            }
            .ndp-loading {
              flex: 1; display: flex; align-items: center; justify-content: center;
              color: var(--stardust); padding: var(--space-8);
            }
            .ndp-body {
              flex: 1; padding: var(--space-5);
              display: flex; flex-direction: column; gap: var(--space-5);
            }
            .ndp-mastery { display: flex; flex-direction: column; gap: var(--space-2); }
            .ndp-mastery-label {
              display: flex; justify-content: space-between; align-items: center;
              font-size: 13px; color: var(--stardust); font-weight: 500;
            }
            .ndp-badge-muted {
              font-size: 11px; color: var(--stardust);
              background: var(--stardust-20);
              padding: 2px 8px; border-radius: 100px;
            }
            .ndp-mastery-track {
              height: 6px; border-radius: 3px;
              background: var(--stardust-20);
              overflow: hidden;
            }
            .ndp-mastery-fill {
              height: 100%; border-radius: 3px;
              transition: width 400ms var(--ease-out), background 400ms;
            }
            .ndp-mastery-fill.muted {
              background: var(--stardust); opacity: 0.35;
            }
            .ndp-mastery-subtext {
              font-size: 11px; color: var(--stardust); opacity: 0.7; font-style: italic;
            }
            .ndp-desc {
              font-size: 13px; color: var(--stardust); line-height: 1.6;
            }
            .ndp-section {
              display: flex; flex-direction: column; gap: var(--space-3);
            }
            .ndp-section-title {
              font-size: 13px; font-weight: 500;
              color: var(--stardust);
              display: flex; align-items: center; gap: var(--space-2);
            }
            .ndp-resources {
              list-style: none; padding: 0;
              display: flex; flex-direction: column; gap: var(--space-2);
            }
            .ndp-resources li a {
              display: flex; align-items: center; justify-content: space-between;
              gap: var(--space-2); font-size: 13px; color: var(--pulsar);
              padding: var(--space-2) var(--space-3);
              background: var(--stardust-20); border-radius: var(--radius-sm);
              transition: background 200ms;
            }
            .ndp-resources li a:hover { background: var(--pulsar-20); }
            .ndp-res-meta {
              font-size: 11px; color: var(--stardust); margin-left: auto;
            }
            .ndp-quiz-launch { width: 100%; }
            .ndp-action-btn {
              display: flex; align-items: center; justify-content: center; gap: var(--space-2);
              width: 100%; padding: var(--space-3);
              border-radius: var(--radius-sm);
              font-size: 14px; font-weight: 500;
              cursor: pointer; border: none;
              transition: background 200ms var(--ease-out), opacity 200ms;
            }
            .ndp-action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
            .ndp-quiz-btn { background: var(--pulsar); color: var(--void); }
            .ndp-quiz-btn:hover:not(:disabled) { background: #5A8AEA; }
            .ndp-btn-secondary {
              background: transparent; color: var(--stardust);
              border: 1px solid var(--stardust-30); border-radius: var(--radius-sm);
              padding: var(--space-2) var(--space-3); font-size: 13px; cursor: pointer;
            }
            .ndp-btn-secondary:hover { color: var(--starlight); border-color: var(--stardust); }
            .ndp-quiz-box {
              padding: var(--space-4); border-radius: var(--radius-md);
              display: flex; flex-direction: column; gap: var(--space-3);
              background: rgba(11, 14, 20, 0.6); border: 1px solid var(--stardust-30);
            }
            .quiz-progress-bar {
              display: flex; flex-direction: column; gap: var(--space-1);
              font-size: 12px; color: var(--stardust);
            }
            .quiz-progress-track {
              height: 4px; border-radius: 2px; background: var(--stardust-20); overflow: hidden;
            }
            .quiz-progress-fill {
              height: 100%; background: var(--pulsar); transition: width 300ms var(--ease-out);
            }
            .quiz-q-body { display: flex; flex-direction: column; gap: var(--space-3); }
            .quiz-prompt { font-size: 14px; color: var(--starlight); font-weight: 500; line-height: 1.4; }
            .quiz-options { display: flex; flex-direction: column; gap: var(--space-2); }
            .quiz-option-btn {
              display: flex; align-items: center; gap: var(--space-3);
              padding: var(--space-3); border-radius: var(--radius-sm);
              background: var(--nebula); border: 1px solid var(--stardust-30);
              color: var(--starlight); font-size: 13px; text-align: left; cursor: pointer;
              transition: all 200ms var(--ease-out);
            }
            .quiz-option-btn:hover { border-color: var(--pulsar); }
            .quiz-option-btn.selected {
              border-color: var(--pulsar); background: var(--pulsar-20); font-weight: 500;
            }
            .opt-radio {
              width: 14px; height: 14px; border-radius: 50%; border: 1.5px solid var(--stardust);
              display: flex; align-items: center; justify-content: center; flex-shrink: 0;
            }
            .quiz-option-btn.selected .opt-radio { border-color: var(--pulsar); }
            .opt-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--pulsar); }
            .quiz-nav-btns { display: flex; justify-content: space-between; gap: var(--space-2); margin-top: var(--space-2); }
            .inline-btn { width: auto; padding: var(--space-2) var(--space-4); }
            .ndp-quiz-result { display: flex; flex-direction: column; gap: var(--space-3); }
            .quiz-result-header {
              display: flex; align-items: center; gap: var(--space-3);
              padding: var(--space-3); border-radius: var(--radius-sm);
            }
            .quiz-result-header.pass { background: rgba(34,197,94,0.12); color: #4ADE80; }
            .quiz-result-header.fail { background: rgba(239,68,68,0.12); color: #EF4444; }
            .quiz-result-header h5 { font-size: 14px; font-weight: 600; color: inherit; }
            .quiz-result-header span { font-size: 12px; opacity: 0.9; }
            .quiz-result-mastery {
              display: flex; justify-content: space-between; font-size: 13px; color: var(--stardust);
            }
            .ndp-unlock-card {
              display: flex; align-items: flex-start; gap: var(--space-3);
              padding: var(--space-3); background: var(--nova-20);
              border: 1px solid var(--nova); border-radius: var(--radius-sm);
              color: var(--nova);
            }
            .ndp-unlock-card h6 { font-size: 13px; font-weight: 600; color: var(--nova); }
            .ndp-unlock-card p { font-size: 12px; color: var(--starlight); margin-top: 2px; }
            .sparkle-icon { flex-shrink: 0; margin-top: 2px; }
            .ndp-project-form { display: flex; flex-direction: column; gap: var(--space-2); margin-top: var(--space-2); }
            .ndp-project-input {
              width: 100%; padding: var(--space-2) var(--space-3);
              font-size: 13px; background: var(--void);
              border: 1px solid var(--stardust-30); border-radius: var(--radius-sm);
              color: var(--starlight);
            }
            .ndp-project-input:focus { border-color: var(--pulsar); outline: none; box-shadow: 0 0 0 2px var(--pulsar-20); }
            .ndp-project-btn { background: transparent; border: 1px solid var(--stardust-30); color: var(--starlight); }
            .ndp-project-btn:hover:not(:disabled) { border-color: var(--pulsar); background: var(--pulsar-20); }
            .ndp-locked-msg {
              display: flex; align-items: center; gap: var(--space-2);
              font-size: 13px; color: var(--stardust); padding: var(--space-3);
              background: var(--stardust-20); border-radius: var(--radius-sm);
            }
            .ndp-feedback {
              display: flex; align-items: center; gap: var(--space-2);
              padding: var(--space-3); border-radius: var(--radius-sm);
              font-size: 13px; font-weight: 500;
            }
            .ndp-feedback-success { background: rgba(34,197,94,0.12); color: #4ADE80; }
            .ndp-feedback-error { background: rgba(239,68,68,0.12); color: #EF4444; }
            .ndp-explain-toggle {
              display: flex; align-items: center; justify-content: space-between;
              width: 100%; background: transparent; color: var(--stardust);
              font-size: 13px; padding: var(--space-2) 0; border: none; cursor: pointer;
            }
            .ndp-explain-toggle:hover { color: var(--starlight); }
            .ndp-explanation { overflow: hidden; }
            .ndp-explanation p { font-size: 13px; color: var(--stardust); line-height: 1.6; padding: var(--space-2) 0; }
            .ndp-explain-loading {
              display: flex; align-items: center; gap: var(--space-2);
              font-size: 12px; color: var(--stardust); padding: var(--space-2) 0;
            }
            .spin-icon { animation: spin 1s linear infinite; }
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
