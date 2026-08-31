import type { GoalRequest, Graph } from '../types';
import { apiFetch } from './client';
import { MOCK_GRAPH, MOCK_LEARNER_ID } from '../mocks/mockData';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false';

export async function submitGoal(payload: GoalRequest): Promise<Graph> {
  if (USE_MOCKS) {
    await new Promise(r => setTimeout(r, 1800));
    return {
      ...MOCK_GRAPH,
      learner_id: payload.learner_id || MOCK_LEARNER_ID,
      goal_text: payload.goal_text,
    };
  }
  return apiFetch<Graph>('/goal', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
