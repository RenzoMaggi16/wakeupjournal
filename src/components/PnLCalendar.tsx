import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isThisMonth } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CalendarDisplayMode } from "@/components/Dashboard";

interface Trade {
  id: string;
  entry_time: string;
  pnl_neto: number;
}

interface Payout {
  id: string;
  payout_date: string;
  amount: number;
}

interface DayPnL {
  date: Date;
  pnl: number;
  tradeCount: number;
  winCount: number;
  payoutAmount: number;
}

interface PnLCalendarProps {
  trades: Trade[];
  payouts?: Payout[];
  displayMode?: CalendarDisplayMode;
  initialCapital?: number;
  onDayClick?: (date: Date, tradeIds: string[]) => void;
  onMonthChange?: (date: Date) => void;
  controlledMonth?: Date;
  embedded?: boolean;
}

export const PnLCalendar = ({ trades = [], payouts = [], displayMode = 'dollars', initialCapital = 0, onDayClick, onMonthChange, controlledMonth, embedded = false }: PnLCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(controlledMonth || new Date());

  const animateRef = useRef(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      animateRef.current = false;
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Sync with controlled month from parent (CalendarContainer)
  useEffect(() => {
    if (controlledMonth) {
      setCurrentMonth(controlledMonth);
    }
  }, [controlledMonth]);

  // Memoized daily PnL calculation
  const dailyPnL = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });

    return days.map(day => {
      const dayTrades = trades.filter(trade =>
        isSameDay(new Date(trade.entry_time), day)
      );

      const totalPnL = dayTrades.reduce(
        (sum, trade) => sum + Number(trade.pnl_neto),
        0
      );

      const winCount = dayTrades.filter(t => Number(t.pnl_neto) > 0).length;

      const dayPayouts = payouts.filter(p =>
        isSameDay(new Date(p.payout_date), day)
      );
      const totalPayout = dayPayouts.reduce(
        (sum, p) => sum + Number(p.amount),
        0
      );

      return {
        date: day,
        pnl: totalPnL,
        tradeCount: dayTrades.length,
        winCount,
        payoutAmount: totalPayout,
      };
    });
  }, [trades, payouts, currentMonth]);

  const goToPreviousMonth = () => {
    const prevMonth = new Date(currentMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    setCurrentMonth(prevMonth);
    onMonthChange?.(prevMonth);
  };

  const goToNextMonth = () => {
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setCurrentMonth(nextMonth);
    onMonthChange?.(nextMonth);
  };

  const DayContent = useCallback((props: any) => {
              const date = props.date;
              const dayPnL = dailyPnL.find(d => isSameDay(d.date, date));
              const hasTrades = dayPnL && dayPnL.tradeCount > 0;
              const isProfitable = hasTrades && dayPnL.pnl > 0;
              const isLoss = hasTrades && dayPnL.pnl < 0;
              const isNeutral = hasTrades && dayPnL.pnl === 0;
              const isCurrentDay = isToday(date);
              const hasPayout = dayPnL && dayPnL.payoutAmount > 0;

              // Winrate
              const winRate = hasTrades && dayPnL.tradeCount > 0
                ? ((dayPnL.winCount / dayPnL.tradeCount) * 100)
                : 0;

              // PnL display value
              const pnlDisplay = (() => {
                if (!hasTrades) return '';
                if (displayMode === 'percentage' && initialCapital > 0) {
                  return `${((dayPnL.pnl / initialCapital) * 100).toFixed(1)}%`;
                }
                const absVal = Math.abs(dayPnL.pnl);
                if (absVal >= 1000) {
                  return `$${(absVal / 1000).toFixed(1)}K`;
                }
                return `$${absVal.toFixed(0)}`;
              })();

              // Border + glow styles
              let borderStyle = "border border-border/40";
              let glowStyle = {};

              if (hasPayout && !hasTrades) {
                borderStyle = "border border-violet-500/50";
              } else if (isProfitable) {
                borderStyle = "border border-emerald-500/30";
                glowStyle = { boxShadow: '0 0 12px rgba(16, 185, 129, 0.12), inset 0 0 16px rgba(16, 185, 129, 0.06)' };
              } else if (isLoss) {
                borderStyle = "border border-red-500/30";
                glowStyle = { boxShadow: '0 0 12px rgba(239, 68, 68, 0.12), inset 0 0 16px rgba(239, 68, 68, 0.06)' };
              } else if (isNeutral) {
                borderStyle = "border border-neutral-600/30";
              }

              const bgClass = hasTrades
                ? (isProfitable ? 'bg-calendar-profit' : isLoss ? 'bg-calendar-loss' : 'bg-neutral-800/50')
                : hasPayout ? 'bg-violet-500/5' : 'bg-card/60';

              const handleDayClick = () => {
                if (onDayClick && hasTrades) {
                  const dayTradeIds = trades
                    .filter(t => isSameDay(new Date(t.entry_time), date))
                    .map(t => t.id);
                  onDayClick(date, dayTradeIds);
                }
              };

              const animateClass = animateRef.current ? 'calendar-cell-animate' : '';
              const animDelay = animateRef.current ? `${date.getDate() * 15}ms` : '0ms';

              return (
                <div
                  className={`rounded-lg ${borderStyle} relative flex flex-col items-center justify-center p-0.5 md:p-1.5 h-14 md:h-[7.2rem] w-full overflow-hidden ${bgClass} ${animateClass} ${hasTrades ? 'cursor-pointer group' : ''}`}
                  style={{
                    ...glowStyle,
                    animationDelay: animDelay,
                  }}
                  onClick={handleDayClick}
                >
                  {/* Day number — top-left */}
                  <div className="absolute top-0.5 left-0.5 md:top-1 md:left-1.5 z-10">
                    {isCurrentDay ? (
                      <span className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-3.5 h-3.5 md:w-5 md:h-5 text-[7px] md:text-[10px] font-bold shadow-[0_0_8px_rgba(139,92,246,0.3)]">
                        {format(date, "d")}
                      </span>
                    ) : (
                      <span className="text-[7px] md:text-[10px] text-muted-foreground/60 font-medium leading-none">
                        {format(date, "d")}
                      </span>
                    )}
                  </div>

                  {/* Main content */}
                  <div className="flex flex-col items-center justify-center gap-0 mt-1 w-full px-0.5">
                    {hasTrades ? (
                      <>
                        {/* PnL — MAIN FOCUS */}
                        <span
                          className={`text-[10px] md:text-lg font-bold leading-tight truncate max-w-full ${
                            isProfitable
                              ? 'text-emerald-400'
                              : isLoss
                                ? 'text-red-400'
                                : 'text-neutral-400'
                          }`}
                          style={
                            isProfitable
                              ? { textShadow: '0 0 10px rgba(16, 185, 129, 0.3)' }
                              : isLoss
                                ? { textShadow: '0 0 10px rgba(239, 68, 68, 0.3)' }
                                : {}
                          }
                        >
                          {isLoss ? '-' : isProfitable ? '+' : ''}{pnlDisplay}
                        </span>

                        {/* Trades count — hidden on very small screens */}
                        <span className="hidden md:inline text-[9px] text-muted-foreground/70 font-medium mt-0.5">
                          {dayPnL.tradeCount} {dayPnL.tradeCount === 1 ? 'trade' : 'trades'}
                        </span>

                        {/* Winrate — hidden on very small screens */}
                        <span className={`hidden md:inline text-[9px] font-medium ${
                          winRate >= 50 ? 'text-emerald-500/60' : 'text-red-400/50'
                        }`}>
                          {winRate.toFixed(0)}%
                        </span>
                      </>
                    ) : null}

                    {/* Payout badge */}
                    {hasPayout && (
                      <div className="absolute bottom-0.5 right-0.5 md:bottom-1 md:right-1.5">
                        <span className="text-[6px] md:text-[9px] font-semibold text-violet-400">
                          💸 -${dayPnL!.payoutAmount.toFixed(0)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
  }, [dailyPnL, displayMode, initialCapital, trades, onDayClick]);

  const components = useMemo(() => ({ DayContent }), [DayContent]);

  const calendarContent = (
      <div className={embedded ? '' : undefined}>
        <CardContent>
        <Calendar
          mode="single"
          month={currentMonth}
          onMonthChange={(m) => {
            setCurrentMonth(m);
            onMonthChange?.(m);
          }}
          disableNavigation={embedded}
          className="w-full"
          classNames={{
            caption: embedded ? "hidden" : "flex justify-center pt-1 relative items-center",
            nav: embedded ? "hidden" : undefined,
            head_row: "flex w-full",
            head_cell: "text-primary font-medium text-xs uppercase text-center flex-1",
            row: "flex w-full mt-1.5 gap-1",
            cell: "flex-1 relative p-0 mx-0.2",
            day: "h-full w-full p-0 font-normal",
            day_today: "",
            day_outside: "day-outside",
          }}
          components={components}
        />
        </CardContent>
      </div>
  );

  if (embedded) {
    return calendarContent;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">
          {format(currentMonth, "MMMM yyyy", { locale: es })}
        </CardTitle>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPreviousMonth}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={goToNextMonth}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      {calendarContent}
    </Card>
  );
};
