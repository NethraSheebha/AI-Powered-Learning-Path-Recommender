import type { ExplainResponse } from '../types';
import { apiFetch } from './client';
import { getMockExplain, MOCK_LEARNER_ID } from '../mocks/mockData';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false';

export async function getExplanation(node_id: string, learner_id?: string): Promise<ExplainResponse> {
  if (USE_MOCKS) {
    await new Promise(r => setTimeout(r, 500));
    return getMockExplain(node_id);
  }
  const query = learner_id
    ? `?learner_id=${encodeURIComponent(learner_id)}`
    : `?learner_id=${MOCK_LEARNER_ID}`;
  return apiFetch<ExplainResponse>(`/explain/${node_id}${query}`);
}
