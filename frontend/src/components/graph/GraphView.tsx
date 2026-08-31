import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
} from '@xyflow/react';
import type { Node, Edge, NodeMouseHandler } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useApp } from '../../context/AppContext';
import { useGraphLayout } from '../../hooks/useGraphLayout';
import { useGraphDiffPolling } from '../../hooks/useGraphDiffPolling';
import PathNode from './CustomNode';
import GraphControls from './GraphControls';
import GraphLegend from './GraphLegend';
import GraphDiffBanner from './GraphDiffBanner';

const nodeTypes = { pathNode: PathNode };

interface GraphViewProps {
  onNodeSelect: (nodeId: string) => void;
}

export default function GraphView({ onNodeSelect }: GraphViewProps) {
  const { graph, selectedNodeId, setSelectedNodeId } = useApp();

  const nodes = useMemo(() => graph?.nodes ?? [], [graph]);
  const edges = useMemo(() => graph?.edges ?? [], [graph]);

  const { flowNodes, flowEdges } = useGraphLayout(nodes, edges);

  const styledNodes = useMemo<Node[]>(() => (
    flowNodes.map(n => ({
      ...n,
      selected: n.id === selectedNodeId,
    }))
  ), [flowNodes, selectedNodeId]);

  const handleNodeClick: NodeMouseHandler = useCallback((_, node) => {
    setSelectedNodeId(node.id);
    onNodeSelect(node.id);
  }, [setSelectedNodeId, onNodeSelect]);

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  useGraphDiffPolling(graph?.id ?? null, !!graph);

  if (!graph) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        <p className="text-sm">No learning path loaded.</p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <GraphDiffBanner />
      <ReactFlow
        nodes={styledNodes}
        edges={flowEdges as Edge[]}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.3}
        maxZoom={2}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#e2e8f0" />
        <GraphControls />
        <GraphLegend />
      </ReactFlow>
    </div>
  );
}
