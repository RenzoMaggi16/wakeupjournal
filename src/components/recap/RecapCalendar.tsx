import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  format,
  isToday,
  isSameMonth,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  getDay,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CheckCircle2, Newspaper } from "lucide-react";
import type { DailyRecapRow } from "@/hooks/useDailyRecap";

interface RecapCalendarProps {
  month: Date;
  onMonthChange: (date: Date) => void;
  recapsByDate: Map<string, DailyRecapRow>;
  onDayClick: (date: Date) => void;
}

const WEEKDAY_LABELS = ["LU", "MA", "MI", "JU", "VI"];

export const RecapCalendar = ({ month, onMonthChange, recapsByDate, onDayClick }: RecapCalendarProps) => {
  const goToPreviousMonth = () => {
    const prev = new Date(month);
    prev.setMonth(prev.getMonth() - 1);
    onMonthChange(prev);
  };

  const goToNextMonth = () => {
    const next = new Date(month);
    next.setMonth(next.getMonth() + 1);
    onMonthChange(next);
  };

  const weeks = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    const weekdays = eachDayOfInterval({ start: gridStart, end: gridEnd }).filter((d) => {
      const day = getDay(d);
      return day !== 0 && day !== 6;
    });

    const rows: Date[][] = [];
    for (let i = 0; i < weekdays.length; i += 5) {
      rows.push(weekdays.slice(i, i + 5));
    }
    return rows;
  }, [month]);

  const renderDay = (date: Date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    const recap = recapsByDate.get(dateKey);
    const isCurrentDay = isToday(date);
    const isOutsideMonth = !isSameMonth(date, month);

    const hasRecap = !!recap;
    const followedPlan = recap?.followed_plan;

    let borderStyle = "border border-border/40";
    let bgClass = "bg-card/60";

    if (hasRecap) {
      if (followedPlan === true) {
        borderStyle = "border border-emerald-500/30";
        bgClass = "bg-calendar-profit";
      } else if (followedPlan === false) {
        borderStyle = "border border-red-500/30";
        bgClass = "bg-calendar-loss";
      } else {
        borderStyle = "border border-violet-500/30";
        bgClass = "bg-violet-500/5";
      }
    }

    return (
      <button
        type="button"
        key={dateKey}
        className={`rounded-lg ${borderStyle} relative flex flex-col items-center justify-center p-0.5 md:p-1.5 h-14 md:h-[7.2rem] flex-1 overflow-hidden ${bgClass} ${
          isOutsideMonth ? "opacity-40" : ""
        } cursor-pointer group hover:ring-1 hover:ring-violet-500/40 transition-all`}
        onClick={() => onDayClick(date)}
      >
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

        <div className="flex flex-col items-center justify-center gap-1 mt-1 w-full px-0.5">
          {hasRecap ? (
            <>
              <CheckCircle2
                className={`h-4 w-4 md:h-6 md:w-6 ${
                  followedPlan === true
                    ? "text-emerald-400"
                    : followedPlan === false
                      ? "text-red-400"
                      : "text-violet-400"
                }`}
              />
              {recap?.had_news && (
                <Newspaper className="hidden md:inline h-3 w-3 text-amber-400/80" />
              )}
            </>
          ) : (
            <span className="hidden md:inline text-[9px] text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors">
              + recap
            </span>
          )}
        </div>
      </button>
    );
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium capitalize">
          {format(month, "MMMM yyyy", { locale: es })}
        </CardTitle>
        <div className="flex space-x-2">
          <Button variant="outline" size="icon" onClick={goToPreviousMonth} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextMonth} className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex w-full">
          {WEEKDAY_LABELS.map((label) => (
            <span key={label} className="text-primary font-medium text-xs uppercase text-center flex-1">
              {label}
            </span>
          ))}
        </div>
        {weeks.map((week, i) => (
          <div key={i} className="flex w-full mt-1.5 gap-1">
            {week.map((date) => renderDay(date))}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
