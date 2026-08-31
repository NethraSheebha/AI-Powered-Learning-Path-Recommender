import { useMemo } from 'react';
import { MarkerType } from '@xyflow/react';
import type { Node as FlowNode, Edge as FlowEdge } from '@xyflow/react';
import type { GraphNode, GraphEdge } from '../types';

// ============================================================
// Layout engine: converts backend nodes/edges into React Flow
// positions using topological layer-based layout.
// ============================================================

const NODE_WIDTH = 220;
const NODE_HEIGHT = 120;
const H_SPACING = 90;
const V_SPACING = 60;

function buildAdjacency(edges: GraphEdge[]): Map<string, string[]> {
  const adj = new Map<string, string[]>();
  for (const e of edges) {
    if (!adj.has(e.from_node_id)) adj.set(e.from_node_id, []);
    adj.get(e.from_node_id)!.push(e.to_node_id);
  }
  return adj;
}

function topoSort(nodes: GraphNode[], edges: GraphEdge[]): string[] {
  const inDegree = new Map<string, number>();
  const adj = buildAdjacency(edges);

  for (const n of nodes) inDegree.set(n.id, 0);
  for (const e of edges) {
    inDegree.set(e.to_node_id, (inDegree.get(e.to_node_id) ?? 0) + 1);
  }

  const queue = nodes.filter(n => (inDegree.get(n.id) ?? 0) === 0).map(n => n.id);
  const order: string[] = [];

  while (queue.length > 0) {
    const curr = queue.shift()!;
    order.push(curr);
    for (const neighbor of adj.get(curr) ?? []) {
      inDegree.set(neighbor, (inDegree.get(neighbor) ?? 1) - 1);
      if (inDegree.get(neighbor) === 0) queue.push(neighbor);
    }
  }
  for (const n of nodes) {
    if (!order.includes(n.id)) order.push(n.id);
  }
  return order;
}

function assignLayers(nodes: GraphNode[], edges: GraphEdge[]): Map<string, number> {
  const layers = new Map<string, number>();
  const inDegree = new Map<string, number>();

  for (const n of nodes) inDegree.set(n.id, 0);
  for (const e of edges) {
    inDegree.set(e.to_node_id, (inDegree.get(e.to_node_id) ?? 0) + 1);
  }

  const queue = nodes.filter(n => (inDegree.get(n.id) ?? 0) === 0).map(n => n.id);
  for (const id of queue) layers.set(id, 0);

  const sorted = topoSort(nodes, edges);
  const adj = buildAdjacency(edges);

  for (const id of sorted) {
    const layer = layers.get(id) ?? 0;
    for (const neighbor of adj.get(id) ?? []) {
      layers.set(neighbor, Math.max(layers.get(neighbor) ?? 0, layer + 1));
    }
  }

  return layers;
}

export interface LayoutResult {
  flowNodes: FlowNode[];
  flowEdges: FlowEdge[];
}

export function useGraphLayout(
  nodes: GraphNode[],
  edges: GraphEdge[]
): LayoutResult {
  return useMemo<LayoutResult>(() => {
    if (nodes.length === 0) return { flowNodes: [], flowEdges: [] };

    const layers = assignLayers(nodes, edges);

    const byLayer = new Map<number, string[]>();
    for (const [id, layer] of layers.entries()) {
      if (!byLayer.has(layer)) byLayer.set(layer, []);
      byLayer.get(layer)!.push(id);
    }

    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const positions = new Map<string, { x: number; y: number }>();

    for (const [layer, ids] of byLayer.entries()) {
      const totalH = ids.length * NODE_HEIGHT + (ids.length - 1) * V_SPACING;
      ids.forEach((id, idx) => {
        positions.set(id, {
          x: layer * (NODE_WIDTH + H_SPACING),
          y: idx * (NODE_HEIGHT + V_SPACING) - totalH / 2,
        });
      });
    }

    const flowNodes: FlowNode[] = nodes.map(n => ({
      id: n.id,
      type: 'pathNode',
      position: positions.get(n.id) ?? { x: 0, y: 0 },
      data: n as unknown as Record<string, unknown>,
      className: n.isNew ? 'node-new-enter' : '',
    }));

    const flowEdges: FlowEdge[] = edges.map(e => ({
      id: e.id,
      source: e.from_node_id,
      target: e.to_node_id,
      type: 'smoothstep',
      animated: e.isNew ?? false,
      className: e.edge_type === 'remedial'
        ? `remedial ${e.isNew ? 'new-edge' : ''}`
        : `prerequisite ${e.isNew ? 'new-edge' : ''}`,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: e.edge_type === 'remedial' ? '#f59e0b' : '#94a3b8',
        width: 16,
        height: 16,
      },
      style: {
        strokeWidth: e.edge_type === 'remedial' ? 2 : 1.5,
        stroke: e.edge_type === 'remedial' ? '#f59e0b' : '#94a3b8',
        strokeDasharray: e.edge_type === 'remedial' ? '6 4' : undefined,
      },
    }));

    return { flowNodes, flowEdges };
  }, [nodes, edges]);
}
