import type { DashboardResponse } from '../types';
import { apiFetch } from './client';
import { MOCK_DASHBOARD } from '../mocks/mockData';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false';

export async function getDashboard(learner_id: string): Promise<DashboardResponse> {
  if (USE_MOCKS) {
    await new Promise(r => setTimeout(r, 600));
    return { ...MOCK_DASHBOARD, learner_id };
  }
  return apiFetch<DashboardResponse>(`/dashboard/${learner_id}`);
}
