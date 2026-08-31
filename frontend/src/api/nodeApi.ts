import type { NodeResponse } from '../types';
import { apiFetch } from './client';
import { MOCK_NODES } from '../mocks/mockData';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false';

export async function getNode(node_id: string): Promise<NodeResponse> {
  if (USE_MOCKS) {
    await new Promise(r => setTimeout(r, 300));
    const node = MOCK_NODES.find(n => n.id === node_id);
    return node ?? { ...MOCK_NODES[3], id: node_id };
  }
  return apiFetch<NodeResponse>(`/node/${node_id}`);
}
