import React from 'react';
import { CheckCircle2, ArrowRight, Lock, AlertTriangle } from 'lucide-react';

// ============================================================
// Graph legend — status key
// ============================================================

const items = [
  { icon: CheckCircle2, color: 'text-emerald-500', label: 'Mastered', borderColor: 'border-emerald-200' },
  { icon: ArrowRight, color: 'text-blue-500', label: 'Available', borderColor: 'border-blue-200' },
  { icon: Lock, color: 'text-slate-400', label: 'Locked', borderColor: 'border-slate-200' },
  { icon: AlertTriangle, color: 'text-amber-500', label: 'Remedial', borderColor: 'border-amber-300' },
];

export default function GraphLegend() {
  return (
    <div className="absolute top-4 right-4 z-10 bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
      <p className="text-label mb-2">Legend</p>
      <div className="flex flex-col gap-1.5">
        {items.map(({ icon: Icon, color, label, borderColor }) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-5 h-5 border rounded flex items-center justify-center ${borderColor}`}>
              <Icon size={11} className={color} />
            </div>
            <span className="text-xs text-slate-600">{label}</span>
          </div>
        ))}
      </div>
      <div className="mt-2.5 pt-2.5 border-t border-slate-100">
        <p className="text-label mb-1.5">Edges</p>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-[1.5px] bg-slate-400" />
            <span className="text-xs text-slate-600">Prerequisite</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 border-t-2 border-dashed border-amber-400" />
            <span className="text-xs text-slate-600">Remedial</span>
          </div>
        </div>
      </div>
    </div>
  );
}
