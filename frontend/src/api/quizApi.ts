import type { QuizRequest, QuizResponse } from '../types';
import { apiFetch } from './client';
import { getMockQuizResponse } from '../mocks/mockData';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false';

export async function submitQuiz(node_id: string, payload: QuizRequest): Promise<QuizResponse> {
  if (USE_MOCKS) {
    await new Promise(r => setTimeout(r, 1200));
    const correct = payload.answers?.correct === true ||
      (typeof payload.answers?.score === 'number' && (payload.answers.score as number) >= 0.70);
    return getMockQuizResponse(node_id, correct as boolean);
  }
  return apiFetch<QuizResponse>(`/quiz/${node_id}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
