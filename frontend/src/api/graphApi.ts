import type { Graph, GraphDiffResponse } from '../types';
import { apiFetch } from './client';
import { MOCK_GRAPH, MOCK_GRAPH_DIFF } from '../mocks/mockData';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false';

export async function getGraph(graph_id: string): Promise<Graph> {
  if (USE_MOCKS) {
    await new Promise(r => setTimeout(r, 600));
    return { ...MOCK_GRAPH, id: graph_id };
  }
  return apiFetch<Graph>(`/graph/${graph_id}`);
}

export async function getGraphDiff(graph_id: string): Promise<GraphDiffResponse> {
  if (USE_MOCKS) {
    await new Promise(r => setTimeout(r, 400));
    return { ...MOCK_GRAPH_DIFF, graph_id };
  }
  return apiFetch<GraphDiffResponse>(`/graph-diff/${graph_id}/latest`);
}
