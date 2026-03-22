/**
 * AdvancedReports.tsx
 *
 * Comprehensive analytics dashboard page at /reportes.
 * Displays advanced trading statistics, charts, discipline, payouts and trade history.
 */

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { BackToDashboard } from '@/components/BackToDashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdvancedTradeStats } from '@/hooks/useAdvancedTradeStats';
import {
  formatDuration,
  computePayoutChartData,
  computePayoutAverage,
} from '@/utils/tradeStatsCalculations';
import type { TradeForStats, PayoutData } from '@/utils/tradeStatsCalculations';

// Report components
import { ReportStatCard } from '@/components/reports/ReportStatCard';
import { StatGrid } from '@/components/reports/StatGrid';
import { ChartCard } from '@/components/reports/ChartCard';
import { TradeHistoryTable } from '@/components/reports/TradeHistoryTable';

// Recharts
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Legend,
} from 'recharts';

const AdvancedReports = () => {
  const [trades, setTrades] = useState<TradeForStats[]>([]);
  const [payouts, setPayouts] = useState<PayoutData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch trades (with discipline and compliance fields)
        const { data: tradesData, error: tradesError } = await supabase
          .from('trades')
          .select(
            'id, pnl_neto, entry_time, exit_time, par, trade_type, riesgo, is_outside_plan, setup_compliance'
          )
          .eq('user_id', user.id)
          .order('entry_time', { ascending: true });

        if (tradesError) throw tradesError;
        setTrades(
          ((tradesData || []) as TradeForStats[]).filter((t) => t.entry_time)
        );

        // Fetch payouts
        const { data: payoutsData, error: payoutsError } = await supabase
          .from('payouts')
          .select('id, amount, payout_date, notes')
          .eq('user_id', user.id)
          .order('payout_date', { ascending: true });

        if (payoutsError) throw payoutsError;
        setPayouts((payoutsData || []) as PayoutData[]);
      } catch (err) {
        console.error('Error fetching data for advanced reports:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const stats = useAdvancedTradeStats(trades);

  // Payout data
  const payoutChartData = useMemo(
    () => computePayoutChartData(payouts),
    [payouts]
  );
  const payoutAverage = useMemo(
    () => computePayoutAverage(payouts),
    [payouts]
  );
  const payoutTotal = useMemo(
    () => payouts.reduce((s, p) => s + Number(p.amount), 0),
    [payouts]
  );

  // Chart tooltip style
  const chartTooltipStyle = {
    backgroundColor: 'hsl(240 10% 8%)',
    border: '1px solid hsl(240 6% 18%)',
    borderRadius: '8px',
    color: '#e5e7eb',
    fontSize: '12px',
  };

  // Direction chart data
  const directionData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'Long', value: stats.longCount, color: 'var(--profit-color)' },
      { name: 'Short', value: stats.shortCount, color: 'var(--loss-color)' },
    ];
  }, [stats]);

  // Setup compliance donut data
  const complianceData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'Completo', value: stats.complianceFull, color: 'var(--profit-color)' },
      { name: 'Parcial', value: stats.compliancePartial, color: '#facc15' },
      { name: 'No cumple', value: stats.complianceNone, color: 'var(--loss-color)' },
    ].filter(d => d.value > 0);
  }, [stats]);

  // Consistency donut data
  const consistencyData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'Días verdes', value: stats.profitDays, color: 'var(--profit-color)' },
      { name: 'Días rojos', value: stats.lossDays, color: 'var(--loss-color)' },
      { name: 'Breakeven', value: stats.breakEvenDays, color: '#6b7280' },
    ].filter(d => d.value > 0);
  }, [stats]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8 max-w-7xl">
          <Skeleton className="h-10 w-56 mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-80 w-full" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
        <BackToDashboard />

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-1">Reportes</h1>
          <p className="text-muted-foreground">
            Análisis detallado de rendimiento, disciplina, retiros y comportamiento.
          </p>
        </div>

        {!stats ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">No hay operaciones registradas aún.</p>
            <p className="text-sm mt-1">Registra trades para ver las estadísticas.</p>
          </div>
        ) : (
          <>
            {/* ─── 1. Top Stats ──────────────────────────────── */}
            <StatGrid title="📊 Estadísticas Generales" columns={4}>
              <ReportStatCard
                title="Día Más Activo"
                tooltip="El día de la semana en el que realizas más operaciones."
                value={stats.mostActiveDay}
                subtext={`${stats.mostActiveDayCount} operaciones`}
                animationDelay={0}
              />
              <ReportStatCard
                title="Día Más Rentable"
                tooltip="El día de la semana con mayor ganancia acumulada."
                value={stats.mostProfitableDay}
                subtext={`$${stats.mostProfitableDayPnl.toFixed(2)}`}
                valueColor={stats.mostProfitableDayPnl >= 0 ? 'positive' : 'negative'}
                animationDelay={0.05}
              />
              <ReportStatCard
                title="Día Menos Rentable"
                tooltip="El día de la semana con menor ganancia (o mayor pérdida) acumulada."
                value={stats.leastProfitableDay}
                subtext={`$${stats.leastProfitableDayPnl.toFixed(2)}`}
                valueColor={stats.leastProfitableDayPnl >= 0 ? 'positive' : 'negative'}
                animationDelay={0.1}
              />
              <ReportStatCard
                title="Total de Operaciones"
                tooltip="Número total de trades registrados."
                value={stats.totalTrades}
                animationDelay={0.15}
              />
              <ReportStatCard
                title="Duración Promedio"
                tooltip="Duración promedio de todas las operaciones."
                value={formatDuration(stats.avgTradeDurationMinutes)}
                animationDelay={0.2}
              />
              <ReportStatCard
                title="Duración Promedio (Win)"
                tooltip="Duración promedio de las operaciones ganadoras."
                value={formatDuration(stats.avgWinDurationMinutes)}
                valueColor="positive"
                animationDelay={0.25}
              />
              <ReportStatCard
                title="Duración Promedio (Loss)"
                tooltip="Duración promedio de las operaciones perdedoras."
                value={formatDuration(stats.avgLossDurationMinutes)}
                valueColor="negative"
                animationDelay={0.3}
              />
            </StatGrid>

            {/* ─── 2. Trade Performance ─────────────────────── */}
            <StatGrid title="💰 Rendimiento por Operación" columns={4}>
              <ReportStatCard
                title="Promedio Ganancia"
                tooltip="El beneficio promedio de todas las operaciones ganadoras."
                value={`$${stats.avgWinningTrade.toFixed(2)}`}
                valueColor="positive"
                animationDelay={0}
              />
              <ReportStatCard
                title="Promedio Pérdida"
                tooltip="La pérdida promedio de todas las operaciones perdedoras."
                value={`$${stats.avgLosingTrade.toFixed(2)}`}
                valueColor="negative"
                animationDelay={0.05}
              />
              <ReportStatCard
                title="Mejor Operación"
                tooltip="El mayor resultado positivo en un solo trade."
                value={`$${stats.bestTrade.toFixed(2)}`}
                valueColor={stats.bestTrade >= 0 ? 'positive' : 'negative'}
                animationDelay={0.1}
              />
              <ReportStatCard
                title="Peor Operación"
                tooltip="El resultado más negativo en un solo trade."
                value={`$${stats.worstTrade.toFixed(2)}`}
                valueColor={stats.worstTrade >= 0 ? 'positive' : 'negative'}
                animationDelay={0.15}
              />
            </StatGrid>

            {/* ─── 3. Discipline & Compliance ───────────────── */}
            <StatGrid title="🎯 Disciplina y Apego al Plan" columns={4}>
              <ReportStatCard
                title="Trades Dentro del Plan"
                tooltip="Cantidad de operaciones que cumplieron con tu plan de trading."
                value={stats.tradesInPlan}
                subtext={`de ${stats.totalTrades} totales`}
                valueColor="positive"
                animationDelay={0}
              />
              <ReportStatCard
                title="Trades Fuera del Plan"
                tooltip="Cantidad de operaciones que NO cumplieron con tu plan de trading."
                value={stats.tradesOutOfPlan}
                valueColor={stats.tradesOutOfPlan > 0 ? 'negative' : 'positive'}
                animationDelay={0.05}
              />
              <ReportStatCard
                title="Apego al Plan"
                tooltip="Porcentaje de trades que se ejecutaron dentro del plan de trading."
                value={`${stats.planAdherencePct.toFixed(1)}%`}
                valueColor={stats.planAdherencePct >= 80 ? 'positive' : stats.planAdherencePct >= 50 ? 'neutral' : 'negative'}
                animationDelay={0.1}
              />
              <ReportStatCard
                title="Calidad de Ejecución"
                tooltip="Porcentaje de trades con compliance 'Completo' (setup cumplido al 100%)."
                value={`${stats.complianceFullPct.toFixed(1)}%`}
                valueColor={stats.complianceFullPct >= 80 ? 'positive' : stats.complianceFullPct >= 50 ? 'neutral' : 'negative'}
                animationDelay={0.15}
              />
            </StatGrid>

            {/* ─── 4. Direction, Compliance & Consistency Charts */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">📈 Dirección, Ejecución y Consistencia</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Trade Direction */}
                <ChartCard
                  title="Dirección de Trades"
                  tooltip="Porcentaje de operaciones Long vs Short."
                  height="h-[220px]"
                  animationDelay={0}
                >
                  <div className="flex items-center h-full">
                    <div className="w-1/2 h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={directionData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius="55%"
                            outerRadius="85%"
                            strokeWidth={0}
                          >
                            {directionData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={chartTooltipStyle}
                            formatter={(value: number, name: string) => [
                              `${value} trades`,
                              name,
                            ]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-1/2 flex flex-col gap-3 pl-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--profit-color)' }} />
                        <div>
                          <div className="text-sm font-semibold">Long</div>
                          <div className="text-xs text-muted-foreground">
                            {stats.longPct.toFixed(1)}% ({stats.longCount})
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--loss-color)' }} />
                        <div>
                          <div className="text-sm font-semibold">Short</div>
                          <div className="text-xs text-muted-foreground">
                            {stats.shortPct.toFixed(1)}% ({stats.shortCount})
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </ChartCard>

                {/* Setup Compliance Donut */}
                <ChartCard
                  title="Calidad de Ejecución (Setup)"
                  tooltip="Distribución de la calidad de ejecución: Completo, Parcial y No cumple."
                  height="h-[220px]"
                  animationDelay={0.1}
                >
                  {complianceData.length > 0 ? (
                    <div className="flex items-center h-full">
                      <div className="w-1/2 h-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={complianceData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius="55%"
                              outerRadius="85%"
                              strokeWidth={0}
                            >
                              {complianceData.map((entry, i) => (
                                <Cell key={i} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={chartTooltipStyle}
                              formatter={(value: number, name: string) => [
                                `${value} trades`,
                                name,
                              ]}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="w-1/2 flex flex-col gap-2 pl-2">
                        {complianceData.map((d) => (
                          <div key={d.name} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                            <div>
                              <div className="text-sm font-semibold">{d.name}</div>
                              <div className="text-xs text-muted-foreground">{d.value} trades</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                      Sin datos de compliance
                    </div>
                  )}
                </ChartCard>

                {/* Consistency Donut */}
                <ChartCard
                  title="Consistencia"
                  tooltip="Proporción de días con ganancia vs pérdida. Mide qué tan consistente sos operando."
                  height="h-[220px]"
                  animationDelay={0.2}
                >
                  {consistencyData.length > 0 ? (
                    <div className="flex items-center h-full">
                      <div className="w-1/2 h-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={consistencyData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius="55%"
                              outerRadius="85%"
                              strokeWidth={0}
                            >
                              {consistencyData.map((entry, i) => (
                                <Cell key={i} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={chartTooltipStyle}
                              formatter={(value: number, name: string) => [
                                `${value} días`,
                                name,
                              ]}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="w-1/2 flex flex-col gap-2 pl-2">
                        {consistencyData.map((d) => (
                          <div key={d.name} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                            <div>
                              <div className="text-sm font-semibold">{d.name}</div>
                              <div className="text-xs text-muted-foreground">{d.value}</div>
                            </div>
                          </div>
                        ))}
                        <div className="mt-1 pt-1 border-t border-border/30">
                          <div className="text-xs text-muted-foreground">
                            Consistencia: <span className="font-semibold" style={{ color: stats.consistencyPct >= 50 ? 'var(--profit-color)' : 'var(--loss-color)' }}>{stats.consistencyPct.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                      Sin datos de consistencia
                    </div>
                  )}
                </ChartCard>
              </div>
            </div>

            {/* ─── 5. Duration Charts ───────────────────────── */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">⏱️ Distribución de Duración</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Duration Distribution */}
                <ChartCard
                  title="Trades por Duración"
                  tooltip="Cantidad de trades agrupados por rango de duración."
                  height="h-[260px]"
                  animationDelay={0}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.durationBuckets} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.12} />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={chartTooltipStyle}
                        formatter={(value: number) => [`${value} trades`, 'Cantidad']}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {stats.durationBuckets.map((_, i) => (
                          <Cell key={i} fill="var(--accent-gradient-from)" opacity={0.8} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>

                {/* Win Rate by Duration */}
                <ChartCard
                  title="Win Rate por Duración"
                  tooltip="Porcentaje de operaciones ganadoras en cada rango de duración."
                  height="h-[260px]"
                  animationDelay={0.1}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.durationBuckets} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.12} />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                      <YAxis
                        tick={{ fontSize: 10 }}
                        domain={[0, 100]}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip
                        contentStyle={chartTooltipStyle}
                        formatter={(value: number) => [`${value.toFixed(1)}%`, 'Win Rate']}
                      />
                      <Bar dataKey="winRate" radius={[4, 4, 0, 0]}>
                        {stats.durationBuckets.map((bucket, i) => (
                          <Cell
                            key={i}
                            fill={bucket.winRate >= 50 ? 'var(--profit-color)' : 'var(--loss-color)'}
                            opacity={0.75}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            </div>

            {/* ─── 6. PnL Charts ────────────────────────────── */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">📉 PnL Charts</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Cumulative PnL */}
                <ChartCard
                  title="PnL Neto Acumulado"
                  tooltip="Evolución del beneficio/pérdida acumulado día a día."
                  height="h-[280px]"
                  animationDelay={0}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={stats.cumulativePnlData}
                      margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="cumPnlGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--accent-gradient-from)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="var(--accent-gradient-from)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.12} />
                      <XAxis dataKey="dateLabel" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip
                        contentStyle={chartTooltipStyle}
                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'PnL Acumulado']}
                      />
                      <Area
                        type="monotone"
                        dataKey="cumulativePnl"
                        stroke="var(--accent-gradient-from)"
                        strokeWidth={2}
                        fill="url(#cumPnlGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>

                {/* Net Daily PnL */}
                <ChartCard
                  title="PnL Neto Diario"
                  tooltip="Ganancia o pérdida neta de cada día de trading."
                  height="h-[280px]"
                  animationDelay={0.1}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stats.dailyPnlData}
                      margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.12} />
                      <XAxis dataKey="dateLabel" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip
                        contentStyle={chartTooltipStyle}
                        formatter={(value: number) => [`$${Number(value).toFixed(2)}`, 'PnL']}
                      />
                      <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
                        {stats.dailyPnlData.map((entry, i) => (
                          <Cell
                            key={i}
                            fill={entry.pnl >= 0 ? 'var(--profit-color)' : 'var(--loss-color)'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            </div>

            {/* ─── 7. Payouts (Retiros) ─────────────────────── */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">💸 Retiros (Payouts)</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <ReportStatCard
                  title="Total Retirado"
                  tooltip="Suma total de todos los retiros realizados."
                  value={`$${payoutTotal.toFixed(2)}`}
                  valueColor={payoutTotal > 0 ? 'positive' : 'neutral'}
                  animationDelay={0}
                />
                <ReportStatCard
                  title="Promedio de Retiro"
                  tooltip="Monto promedio por retiro."
                  value={`$${payoutAverage.toFixed(2)}`}
                  animationDelay={0.05}
                />
                <ReportStatCard
                  title="Total de Retiros"
                  tooltip="Cantidad total de retiros realizados."
                  value={payouts.length}
                  animationDelay={0.1}
                />
              </div>

              {payoutChartData.length > 0 ? (
                <ChartCard
                  title="Histórico de Retiros"
                  tooltip="Evolución de los retiros a lo largo del tiempo."
                  height="h-[280px]"
                  animationDelay={0.15}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={payoutChartData}
                      margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="payoutGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--profit-color)" stopOpacity={0.6} />
                          <stop offset="95%" stopColor="var(--profit-color)" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.12} />
                      <XAxis dataKey="dateLabel" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip
                        contentStyle={chartTooltipStyle}
                        formatter={(value: number, name: string) => [
                          `$${value.toFixed(2)}`,
                          name === 'amount' ? 'Retiro' : 'Acumulado',
                        ]}
                      />
                      <Bar dataKey="amount" fill="url(#payoutGrad)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              ) : (
                <ChartCard
                  title="Histórico de Retiros"
                  tooltip="Evolución de los retiros a lo largo del tiempo."
                  height="h-[100px]"
                  animationDelay={0.15}
                >
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    No hay retiros registrados aún.
                  </div>
                </ChartCard>
              )}
            </div>

            {/* ─── 8. Trade History ──────────────────────────── */}
            <TradeHistoryTable trades={trades} />
          </>
        )}
      </main>
    </div>
  );
};

export default AdvancedReports;
