/**
 * useAdvancedTradeStats.ts
 * 
 * Memoized React hook that computes advanced trade statistics.
 * Wraps the pure utility functions with useMemo for efficient reactivity.
 */

import { useMemo } from 'react';
import {
  computeAdvancedStats,
  type TradeForStats,
  type AdvancedStats,
} from '@/utils/tradeStatsCalculations';

export function useAdvancedTradeStats(trades: TradeForStats[]): AdvancedStats | null {
  return useMemo(() => {
    if (!trades || trades.length === 0) return null;
    return computeAdvancedStats(trades);
  }, [trades]);
}
