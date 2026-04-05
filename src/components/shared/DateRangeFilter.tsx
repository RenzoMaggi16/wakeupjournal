/**
 * DateRangeFilter.tsx
 *
 * Reusable date range picker with preset shortcuts.
 * Used in both Dashboard and Reports to ensure consistent filtering UX.
 */

import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import type { DateRange } from "react-day-picker";
import {
  format,
  subDays,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
  startOfDay,
  endOfDay,
} from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface DateRangeFilterProps {
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  className?: string;
}

export const DateRangeFilter = ({
  dateRange,
  setDateRange,
  className,
}: DateRangeFilterProps) => {
  const handlePresetChange = (preset: string) => {
    const today = new Date();
    switch (preset) {
      case "today":
        setDateRange({ from: startOfDay(today), to: endOfDay(today) });
        break;
      case "last_7_days":
        setDateRange({ from: subDays(today, 7), to: today });
        break;
      case "last_30_days":
        setDateRange({ from: subDays(today, 30), to: today });
        break;
      case "this_month":
        setDateRange({ from: startOfMonth(today), to: endOfMonth(today) });
        break;
      case "last_month": {
        const lastMonth = subMonths(today, 1);
        setDateRange({
          from: startOfMonth(lastMonth),
          to: endOfMonth(lastMonth),
        });
        break;
      }
      case "this_year":
        setDateRange({ from: startOfYear(today), to: endOfYear(today) });
        break;
    }
  };

  const presets = [
    { key: "today", label: "Hoy" },
    { key: "last_7_days", label: "7 días" },
    { key: "last_30_days", label: "30 días" },
    { key: "this_month", label: "Este mes" },
    { key: "last_month", label: "Mes pasado" },
    { key: "this_year", label: "Este año" },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id="date-range-filter"
          variant="outline"
          className={cn(
            "justify-start text-left font-normal bg-card border-border/50 col-span-2 sm:col-span-1 w-full sm:w-auto sm:min-w-[240px] text-xs sm:text-sm",
            !dateRange && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-blue-500 shrink-0" />
          {dateRange?.from ? (
            dateRange.to ? (
              <>
                {format(dateRange.from, "LLL dd, y", { locale: es })} -{" "}
                {format(dateRange.to, "LLL dd, y", { locale: es })}
              </>
            ) : (
              format(dateRange.from, "LLL dd, y", { locale: es })
            )
          ) : (
            <span>Filtrar por fecha</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 max-w-[95vw]" align="start">
        <div className="flex flex-col sm:flex-row">
          <div className="p-2 border-b sm:border-b-0 sm:border-r border-border space-y-1 sm:space-y-2 sm:min-w-[140px]">
            <div className="text-xs font-semibold text-muted-foreground mb-1 sm:mb-2 px-2">
              Predefinidos
            </div>
            <div className="flex flex-wrap sm:flex-col gap-1">
              {presets.map((preset) => (
                <Button
                  key={preset.key}
                  variant="ghost"
                  size="sm"
                  className="justify-start text-xs flex-1 sm:flex-none sm:w-full"
                  onClick={() => handlePresetChange(preset.key)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            <div className="border-t border-border my-1 sm:my-2" />
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs text-destructive hover:text-destructive"
              onClick={() => setDateRange(undefined)}
            >
              <X className="mr-2 h-3 w-3" /> Limpiar filtro
            </Button>
          </div>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={setDateRange}
            numberOfMonths={1}
            locale={es}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
};
