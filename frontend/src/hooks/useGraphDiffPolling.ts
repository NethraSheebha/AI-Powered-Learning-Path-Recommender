import { useEffect, useRef, useCallback } from 'react';
import { getGraphDiff } from '../api/graphApi';
import { useApp } from '../context/AppContext';

const POLL_INTERVAL_MS = 8000;

/**
 * Polls /graph-diff/{graph_id}/latest and merges any new nodes/edges.
 * Cleans up on unmount. The context tracks seen diff IDs to prevent duplicates.
 */
export function useGraphDiffPolling(graph_id: string | null, enabled: boolean) {
  const { applyGraphDiff, seenDiffIds } = useApp();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFetchingRef = useRef(false);

  const pollOnce = useCallback(async () => {
    if (!graph_id || isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const diff = await getGraphDiff(graph_id);
      if (diff && !seenDiffIds.has(diff.id)) {
        if (diff.nodes_added.length > 0 || diff.edges_added.length > 0) {
          applyGraphDiff(diff);
        }
      }
    } catch {
      // Silently ignore polling errors
    } finally {
      isFetchingRef.current = false;
    }
  }, [graph_id, seenDiffIds, applyGraphDiff]);

  useEffect(() => {
    if (!enabled || !graph_id) return;
    intervalRef.current = setInterval(pollOnce, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, graph_id, pollOnce]);
}
