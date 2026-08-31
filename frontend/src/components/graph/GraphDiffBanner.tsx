import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

// ============================================================
// Banner shown when a graph mutation occurs
// ============================================================

export default function GraphDiffBanner() {
  const { pendingGraphDiff, clearPendingDiff } = useApp();

  return (
    <AnimatePresence>
      {pendingGraphDiff && pendingGraphDiff.nodes_added.length > 0 && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-full max-w-xl px-4"
        >
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-md flex items-start gap-3">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles size={16} className="text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-900">
                Your learning path was updated
              </p>
              <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                {pendingGraphDiff.nodes_added.length > 0
                  ? `Your assessment revealed a gap — PathMind added "${pendingGraphDiff.nodes_added[0].label}" to help you build that foundation before continuing.`
                  : 'PathMind adapted your path based on your recent assessment.'}
              </p>
            </div>
            <button
              onClick={clearPendingDiff}
              className="text-amber-500 hover:text-amber-700 transition-colors flex-shrink-0 mt-0.5"
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
