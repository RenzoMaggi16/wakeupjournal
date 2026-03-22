/**
 * tradeStatsCalculations.ts
 * 
 * Pure utility functions for computing advanced trade statistics.
 * All functions are independently importable and testable.
 * No React or side-effect dependencies.
 */

import { format, getDay, parseISO, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';

// ─── Types ──────────────────────────────────────────────────
export interface TradeForStats {
  id: string;
  pnl_neto: number;
  entry_time: string | null;
  exit_time: string | null;
  par: string | null;
  trade_type: 'buy' | 'sell';
  riesgo: number | null;
  is_outside_plan?: boolean;
  setup_compliance?: string | null;
}

export interface PayoutData {
  id: string;
  amount: number;
  payout_date: string;
  notes: string | null;
}

export interface PayoutChartEntry {
  date: string;
  dateLabel: string;
  amount: number;
  cumulative: number;
}

export interface DayOfWeekStats {
  dayIndex: number;
  dayName: string;
  totalPnl: number;
  tradeCount: number;
}

export interface DurationBucket {
  label: string;
  minMinutes: number;
  maxMinutes: number;
  count: number;
  wins: number;
  losses: number;
  winRate: number;
}

export interface DailyPnlEntry {
  date: string;       // yyyy-MM-dd
  dateLabel: string;   // dd/MM
  pnl: number;
}

export interface CumulativePnlEntry {
  date: string;
  dateLabel: string;
  cumulativePnl: number;
  dailyPnl: number;
}

export interface AdvancedStats {
  // Top stats
  mostActiveDay: string;
  mostActiveDayCount: number;
  mostProfitableDay: string;
  mostProfitableDayPnl: number;
  leastProfitableDay: string;
  leastProfitableDayPnl: number;
  totalTrades: number;
  avgTradeDurationMinutes: number;
  avgWinDurationMinutes: number;
  avgLossDurationMinutes: number;

  // Trade performance
  avgWinningTrade: number;
  avgLosingTrade: number;
  bestTrade: number;
  worstTrade: number;

  // Direction
  longCount: number;
  shortCount: number;
  longPct: number;
  shortPct: number;

  // Duration distribution
  durationBuckets: DurationBucket[];

  // PnL charts
  dailyPnlData: DailyPnlEntry[];
  cumulativePnlData: CumulativePnlEntry[];

  // Discipline & Plan Adherence
  tradesInPlan: number;
  tradesOutOfPlan: number;
  planAdherencePct: number;

  // Setup Compliance (Execution Quality)
  complianceFull: number;
  compliancePartial: number;
  complianceNone: number;
  complianceFullPct: number;

  // Consistency (daily profit days vs loss days)
  profitDays: number;
  lossDays: number;
  breakEvenDays: number;
  consistencyPct: number;
}

// ─── Day-of-week names ──────────────────────────────────────
const DAY_NAMES_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// ─── Duration buckets definition ────────────────────────────
const DURATION_BUCKET_DEFS = [
  { label: '0-5 min', minMinutes: 0, maxMinutes: 5 },
  { label: '5-15 min', minMinutes: 5, maxMinutes: 15 },
  { label: '15-30 min', minMinutes: 15, maxMinutes: 30 },
  { label: '30-60 min', minMinutes: 30, maxMinutes: 60 },
  { label: '1-2 hrs', minMinutes: 60, maxMinutes: 120 },
  { label: '2+ hrs', minMinutes: 120, maxMinutes: Infinity },
];

// ─── Helper: compute trade duration in minutes ──────────────
function getTradeDurationMinutes(trade: TradeForStats): number | null {
  if (!trade.entry_time || !trade.exit_time) return null;
  const start = new Date(trade.entry_time).getTime();
  const end = new Date(trade.exit_time).getTime();
  if (!isFinite(start) || !isFinite(end) || end <= start) return null;
  return (end - start) / 60000;
}

// ─── Helper: format duration as human-readable ──────────────
export function formatDuration(minutes: number): string {
  const m = Math.round(minutes);
  if (m < 1) return '< 1m';
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (h > 0) return `${h}h ${rem}m`;
  return `${rem}m`;
}

// ─── Day-of-week aggregation ────────────────────────────────
function computeDayOfWeekStats(trades: TradeForStats[]): DayOfWeekStats[] {
  const stats: DayOfWeekStats[] = DAY_NAMES_ES.map((name, i) => ({
    dayIndex: i,
    dayName: name,
    totalPnl: 0,
    tradeCount: 0,
  }));

  trades.forEach(t => {
    if (!t.entry_time) return;
    const dayIndex = getDay(parseISO(t.entry_time));
    stats[dayIndex].totalPnl += Number(t.pnl_neto);
    stats[dayIndex].tradeCount += 1;
  });

  return stats;
}

// ─── Average duration (general / wins / losses) ─────────────
function computeAvgDuration(
  trades: TradeForStats[],
  filter?: 'win' | 'loss'
): number {
  let totalDuration = 0;
  let count = 0;

  trades.forEach(t => {
    if (filter === 'win' && t.pnl_neto <= 0) return;
    if (filter === 'loss' && t.pnl_neto >= 0) return;

    const dur = getTradeDurationMinutes(t);
    if (dur !== null) {
      totalDuration += dur;
      count++;
    }
  });

  return count > 0 ? totalDuration / count : 0;
}

// ─── Duration distribution ──────────────────────────────────
function computeDurationBuckets(trades: TradeForStats[]): DurationBucket[] {
  const buckets: DurationBucket[] = DURATION_BUCKET_DEFS.map(def => ({
    ...def,
    count: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
  }));

  trades.forEach(t => {
    const dur = getTradeDurationMinutes(t);
    if (dur === null) return;

    for (const bucket of buckets) {
      if (dur >= bucket.minMinutes && dur < bucket.maxMinutes) {
        bucket.count++;
        if (t.pnl_neto > 0) bucket.wins++;
        else if (t.pnl_neto < 0) bucket.losses++;
        break;
      }
    }
  });

  // Compute win rates
  buckets.forEach(b => {
    const decided = b.wins + b.losses;
    b.winRate = decided > 0 ? (b.wins / decided) * 100 : 0;
  });

  return buckets;
}

// ─── Daily PnL aggregation ──────────────────────────────────
function computeDailyPnl(trades: TradeForStats[]): DailyPnlEntry[] {
  const dailyMap = new Map<string, number>();

  trades.forEach(t => {
    if (!t.entry_time) return;
    const dateStr = t.entry_time.split('T')[0];
    dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + Number(t.pnl_neto));
  });

  return Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, pnl]) => ({
      date,
      dateLabel: `${date.slice(8, 10)}/${date.slice(5, 7)}`,
      pnl,
    }));
}

// ─── Cumulative PnL ─────────────────────────────────────────
function computeCumulativePnl(dailyPnl: DailyPnlEntry[]): CumulativePnlEntry[] {
  let cumulative = 0;
  return dailyPnl.map(entry => {
    cumulative += entry.pnl;
    return {
      date: entry.date,
      dateLabel: entry.dateLabel,
      cumulativePnl: cumulative,
      dailyPnl: entry.pnl,
    };
  });
}

// ─── Discipline & Compliance ────────────────────────────────
function computeDisciplineStats(trades: TradeForStats[]) {
  const tradesInPlan = trades.filter(t => !t.is_outside_plan).length;
  const tradesOutOfPlan = trades.filter(t => t.is_outside_plan).length;
  const total = trades.length;
  const planAdherencePct = total > 0 ? (tradesInPlan / total) * 100 : 0;

  // Setup compliance breakdown
  const complianceFull = trades.filter(t => t.setup_compliance === 'full').length;
  const compliancePartial = trades.filter(t => t.setup_compliance === 'partial').length;
  const complianceNone = trades.filter(t => t.setup_compliance === 'none').length;
  const complianceFullPct = total > 0 ? (complianceFull / total) * 100 : 0;

  return {
    tradesInPlan,
    tradesOutOfPlan,
    planAdherencePct,
    complianceFull,
    compliancePartial,
    complianceNone,
    complianceFullPct,
  };
}

// ─── Consistency (profit days vs loss days) ──────────────────
function computeConsistency(dailyPnl: DailyPnlEntry[]) {
  let profitDays = 0;
  let lossDays = 0;
  let breakEvenDays = 0;

  dailyPnl.forEach(d => {
    if (d.pnl > 0) profitDays++;
    else if (d.pnl < 0) lossDays++;
    else breakEvenDays++;
  });

  const totalDays = profitDays + lossDays + breakEvenDays;
  const consistencyPct = totalDays > 0 ? (profitDays / totalDays) * 100 : 0;

  return { profitDays, lossDays, breakEvenDays, consistencyPct };
}

// ─── Payout chart data ──────────────────────────────────────
export function computePayoutChartData(payouts: PayoutData[]): PayoutChartEntry[] {
  const sorted = [...payouts].sort((a, b) => a.payout_date.localeCompare(b.payout_date));
  let cumulative = 0;
  return sorted.map(p => {
    cumulative += Number(p.amount);
    const d = p.payout_date;
    return {
      date: d,
      dateLabel: `${d.slice(8, 10)}/${d.slice(5, 7)}`,
      amount: Number(p.amount),
      cumulative,
    };
  });
}

export function computePayoutAverage(payouts: PayoutData[]): number {
  if (payouts.length === 0) return 0;
  return payouts.reduce((sum, p) => sum + Number(p.amount), 0) / payouts.length;
}

// ─── MAIN: Compute all advanced stats ───────────────────────
export function computeAdvancedStats(trades: TradeForStats[]): AdvancedStats {
  const validTrades = trades.filter(t => t.entry_time);

  // Basic counts
  const totalTrades = validTrades.length;
  const wins = validTrades.filter(t => t.pnl_neto > 0);
  const losses = validTrades.filter(t => t.pnl_neto < 0);

  // Day of week stats
  const dowStats = computeDayOfWeekStats(validTrades);
  
  // Most active day (by count)
  const activeDays = dowStats.filter(d => d.tradeCount > 0);
  const mostActive = activeDays.length > 0
    ? activeDays.reduce((best, d) => d.tradeCount > best.tradeCount ? d : best, activeDays[0])
    : null;

  // Most/Least profitable day
  const tradedDays = dowStats.filter(d => d.tradeCount > 0);
  const mostProfitable = tradedDays.length > 0
    ? tradedDays.reduce((best, d) => d.totalPnl > best.totalPnl ? d : best, tradedDays[0])
    : null;
  const leastProfitable = tradedDays.length > 0
    ? tradedDays.reduce((worst, d) => d.totalPnl < worst.totalPnl ? d : worst, tradedDays[0])
    : null;

  // Durations
  const avgTradeDuration = computeAvgDuration(validTrades);
  const avgWinDuration = computeAvgDuration(validTrades, 'win');
  const avgLossDuration = computeAvgDuration(validTrades, 'loss');

  // Trade performance
  const avgWinningTrade = wins.length > 0
    ? wins.reduce((sum, t) => sum + Number(t.pnl_neto), 0) / wins.length
    : 0;
  const avgLosingTrade = losses.length > 0
    ? losses.reduce((sum, t) => sum + Number(t.pnl_neto), 0) / losses.length
    : 0;
  const bestTrade = validTrades.length > 0
    ? Math.max(...validTrades.map(t => Number(t.pnl_neto)))
    : 0;
  const worstTrade = validTrades.length > 0
    ? Math.min(...validTrades.map(t => Number(t.pnl_neto)))
    : 0;

  // Direction
  const longCount = validTrades.filter(t => t.trade_type === 'buy').length;
  const shortCount = validTrades.filter(t => t.trade_type === 'sell').length;
  const longPct = totalTrades > 0 ? (longCount / totalTrades) * 100 : 0;
  const shortPct = totalTrades > 0 ? (shortCount / totalTrades) * 100 : 0;

  // Duration distribution
  const durationBuckets = computeDurationBuckets(validTrades);

  // PnL data
  const dailyPnlData = computeDailyPnl(validTrades);
  const cumulativePnlData = computeCumulativePnl(dailyPnlData);

  return {
    mostActiveDay: mostActive?.dayName ?? 'N/A',
    mostActiveDayCount: mostActive?.tradeCount ?? 0,
    mostProfitableDay: mostProfitable?.dayName ?? 'N/A',
    mostProfitableDayPnl: mostProfitable?.totalPnl ?? 0,
    leastProfitableDay: leastProfitable?.dayName ?? 'N/A',
    leastProfitableDayPnl: leastProfitable?.totalPnl ?? 0,
    totalTrades,
    avgTradeDurationMinutes: avgTradeDuration,
    avgWinDurationMinutes: avgWinDuration,
    avgLossDurationMinutes: avgLossDuration,

    avgWinningTrade,
    avgLosingTrade,
    bestTrade,
    worstTrade,

    longCount,
    shortCount,
    longPct,
    shortPct,

    durationBuckets,
    dailyPnlData,
    cumulativePnlData,

    // Discipline & compliance
    ...computeDisciplineStats(validTrades),

    // Consistency
    ...computeConsistency(dailyPnlData),
  };
}
