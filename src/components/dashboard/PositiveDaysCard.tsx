/**
 * PositiveDaysCard.tsx
 *
 * Premium card that displays the "Positive Days %" metric with an SVG circular
 * progress ring. Groups trades by day, counts days with net profit > 0, and
 * renders the percentage with dynamic color coding.
 *
 * Color scale: Green (>50%), Amber (40-50%), Red (<40%)
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Trade {
  pnl_neto: number;
  entry_time: string;
}

interface PositiveDaysCardProps {
  trades: Trade[];
  className?: string;
}

export const PositiveDaysCard = ({ trades, className }: PositiveDaysCardProps) => {
  const { positiveDays, totalDays, percentage } = useMemo(() => {
    if (!trades || trades.length === 0) {
      return { positiveDays: 0, totalDays: 0, percentage: 0 };
    }

    // Group trades by date and compute daily net PnL
    const dailyPnl = new Map<string, number>();
    trades.forEach((t) => {
      if (!t.entry_time) return;
      const dateStr = t.entry_time.split('T')[0];
      dailyPnl.set(dateStr, (dailyPnl.get(dateStr) || 0) + Number(t.pnl_neto));
    });

    let positive = 0;
    dailyPnl.forEach((pnl) => {
      if (pnl > 0) positive++;
    });

    const total = dailyPnl.size;
    const pct = total > 0 ? (positive / total) * 100 : 0;

    return { positiveDays: positive, totalDays: total, percentage: pct };
  }, [trades]);

  // Color logic
  const getColor = (pct: number) => {
    if (pct > 50) return { main: '#10b981', glow: 'rgba(16, 185, 129, 0.25)', bg: 'rgba(16, 185, 129, 0.08)' };
    if (pct >= 40) return { main: '#f59e0b', glow: 'rgba(245, 158, 11, 0.25)', bg: 'rgba(245, 158, 11, 0.08)' };
    return { main: '#ef4444', glow: 'rgba(239, 68, 68, 0.25)', bg: 'rgba(239, 68, 68, 0.08)' };
  };

  const colors = getColor(percentage);

  // SVG ring calculations
  const size = 110;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = totalDays > 0 ? (percentage / 100) * circumference : 0;
  const dashOffset = circumference - progress;

  return (
    <Card
      className={`group relative transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${className || ''}`}
      style={{ overflow: 'hidden' }}
    >
      {/* Gradient accent line */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(to right, transparent, ${colors.main}60, transparent)`,
        }}
      />

      <CardHeader className="pb-1">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Días Positivos %
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col items-center gap-3 pt-0">
        {/* SVG Circular Progress Ring */}
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="transform -rotate-90"
          >
            {/* Background ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-border/30"
            />
            {/* Progress ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={colors.main}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{
                transition: 'stroke-dashoffset 1s ease-out, stroke 0.3s ease',
                filter: `drop-shadow(0 0 6px ${colors.glow})`,
              }}
            />
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-2xl font-bold tabular-nums"
              style={{ color: colors.main, textShadow: `0 0 12px ${colors.glow}` }}
            >
              {totalDays > 0 ? percentage.toFixed(1) : '—'}
            </span>
            {totalDays > 0 && (
              <span className="text-[10px] font-semibold text-muted-foreground -mt-0.5">%</span>
            )}
          </div>
        </div>

        {/* Info row */}
        <div className="flex items-center justify-center gap-3 w-full">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold"
            style={{
              backgroundColor: colors.bg,
              color: colors.main,
            }}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: colors.main }}
            />
            {positiveDays} {positiveDays === 1 ? 'día' : 'días'} positivos
          </div>
        </div>

        <div className="text-[11px] text-muted-foreground text-center">
          {totalDays > 0
            ? `${positiveDays} de ${totalDays} días operados`
            : 'Sin datos de trading'}
        </div>
      </CardContent>
    </Card>
  );
};
