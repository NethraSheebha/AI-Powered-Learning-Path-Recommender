import React from 'react';
import { useReactFlow } from '@xyflow/react';
import { ZoomIn, ZoomOut, Maximize2, RefreshCw } from 'lucide-react';

// ============================================================
// Graph controls — zoom, fit, reset
// ============================================================

export default function GraphControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <div className="absolute bottom-5 left-5 z-10 flex flex-col gap-1">
      <button
        onClick={() => zoomIn({ duration: 200 })}
        className="w-8 h-8 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
        aria-label="Zoom in"
        title="Zoom in"
      >
        <ZoomIn size={15} />
      </button>
      <button
        onClick={() => zoomOut({ duration: 200 })}
        className="w-8 h-8 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
        aria-label="Zoom out"
        title="Zoom out"
      >
        <ZoomOut size={15} />
      </button>
      <button
        onClick={() => fitView({ padding: 0.15, duration: 400 })}
        className="w-8 h-8 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
        aria-label="Fit view"
        title="Fit to view"
      >
        <Maximize2 size={15} />
      </button>
      <button
        onClick={() => fitView({ padding: 0.15, duration: 400 })}
        className="w-8 h-8 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
        aria-label="Reset view"
        title="Reset view"
      >
        <RefreshCw size={15} />
      </button>
    </div>
  );
}
