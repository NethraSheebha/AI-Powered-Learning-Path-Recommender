import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { Lock, CheckCircle2, BookOpen, AlertTriangle, ArrowRight } from 'lucide-react';
import type { GraphNode } from '../../types';

// ============================================================
// Custom React Flow node for PathMind
// ============================================================

function MasteryBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  let barColor = 'bg-slate-300';
  if (value >= 0.8) barColor = 'bg-emerald-500';
  else if (value >= 0.5) barColor = 'bg-blue-500';
  else if (value >= 0.2) barColor = 'bg-amber-400';

  return (
    <div className="mt-2">
      <div className="flex justify-between items-center mb-0.5">
        <span className="text-[10px] text-slate-400 font-medium">Mastery</span>
        <span className="text-[10px] font-semibold text-slate-500">{pct}%</span>
      </div>
      <div className="mastery-bar-track">
        <div className={`mastery-bar-fill ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function NodeIcon({ status, isNew }: { status: string; isNew?: boolean }) {
  if (isNew) return <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />;
  if (status === 'mastered') return <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />;
  if (status === 'locked') return <Lock size={14} className="text-slate-400 flex-shrink-0" />;
  return <ArrowRight size={14} className="text-blue-500 flex-shrink-0" />;
}

function StatusChip({ status, isNew }: { status: string; isNew?: boolean }) {
  if (isNew) return <span className="status-badge-remedial">New</span>;
  if (status === 'mastered') return <span className="status-badge-mastered">Mastered</span>;
  if (status === 'locked') return <span className="status-badge-locked">Locked</span>;
  return <span className="status-badge-available">Ready</span>;
}

function PathNode({ data, selected }: NodeProps) {
  const node = data as unknown as GraphNode;

  const borderClass = {
    locked: 'border-slate-200',
    available: 'border-blue-200',
    mastered: 'border-emerald-200',
  }[node.status] ?? 'border-slate-200';

  const bgClass = {
    locked: 'bg-slate-50',
    available: 'bg-white',
    mastered: 'bg-white',
  }[node.status] ?? 'bg-white';

  const isNew = node.isNew;

  const containerClass = [
    'graph-node relative',
    borderClass,
    bgClass,
    isNew ? 'graph-node-remedial border-amber-300' : '',
    selected ? 'graph-node-selected' : '',
    node.status === 'locked' ? 'graph-node-locked' : '',
  ].filter(Boolean).join(' ');

  return (
    <>
      <Handle type="target" position={Position.Left} />
      <div className={containerClass}>
        {isNew && (
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
            <span className="text-white text-[9px] font-bold">!</span>
          </div>
        )}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <NodeIcon status={node.status} isNew={isNew} />
            <span className="text-xs font-semibold text-slate-800 leading-tight truncate" title={node.label}>
              {node.label}
            </span>
          </div>
          <StatusChip status={node.status} isNew={isNew} />
        </div>

        {node.description && (
          <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-2">
            {node.description}
          </p>
        )}

        {node.status !== 'locked' && <MasteryBar value={node.p_mastery} />}

        {node.status === 'locked' && (
          <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
            <BookOpen size={10} />
            Complete prerequisites first
          </p>
        )}
      </div>
      <Handle type="source" position={Position.Right} />
    </>
  );
}

export default memo(PathNode);
