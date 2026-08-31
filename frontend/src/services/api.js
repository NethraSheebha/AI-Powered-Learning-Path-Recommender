const API_BASE = 'http://localhost:8000';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  createGoal: (learnerId, goalText, experienceLevel, name) =>
    request('/goal', {
      method: 'POST',
      body: JSON.stringify({
        learner_id: learnerId,
        name: name || undefined,
        goal_text: goalText,
        experience_level: experienceLevel || undefined,
      }),
    }),

  getGraph: (graphId) => request(`/graph/${graphId}`),

  getNode: (nodeId) => request(`/node/${nodeId}`),

  submitQuiz: (nodeId, learnerId, answers) =>
    request(`/quiz/${nodeId}`, {
      method: 'POST',
      body: JSON.stringify({ learner_id: learnerId, answers }),
    }),

  submitProject: (nodeId, learnerId, submission) =>
    request(`/submit-project/${nodeId}`, {
      method: 'POST',
      body: JSON.stringify({ learner_id: learnerId, submission }),
    }),

  getExplanation: (nodeId) => request(`/explain/${nodeId}`),

  getDashboard: (learnerId) => request(`/dashboard/${learnerId}`),

  getLatestGraphDiff: (graphId) => request(`/graph-diff/${graphId}/latest`),
};
