import type { ProjectSubmitRequest, ProjectSubmitResponse } from '../types';
import { apiFetch } from './client';
import { getMockProjectResponse } from '../mocks/mockData';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false';

export async function submitProject(
  node_id: string,
  payload: ProjectSubmitRequest
): Promise<ProjectSubmitResponse> {
  if (USE_MOCKS) {
    await new Promise(r => setTimeout(r, 2000));
    // Demo: short notes simulate a weak submission to trigger graph diff
    const passes = payload.submission.notes.length > 30;
    return getMockProjectResponse(node_id, passes);
  }
  return apiFetch<ProjectSubmitResponse>(`/submit-project/${node_id}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
