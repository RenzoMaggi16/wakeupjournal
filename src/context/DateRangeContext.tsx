/**
 * DateRangeContext.tsx
 *
 * Shared date-range state between Dashboard and Reports.
 * Persists to localStorage so the active filter survives page refreshes.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { DateRange } from 'react-day-picker';

interface DateRangeContextType {
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
}

const DateRangeContext = createContext<DateRangeContextType | undefined>(undefined);

function deserializeDateRange(raw: string | null): DateRange | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.from) return undefined;
    return {
      from: new Date(parsed.from),
      to: parsed.to ? new Date(parsed.to) : undefined,
    };
  } catch {
    return undefined;
  }
}

function serializeDateRange(range: DateRange | undefined): string | null {
  if (!range || !range.from) return null;
  return JSON.stringify({
    from: range.from.toISOString(),
    to: range.to ? range.to.toISOString() : null,
  });
}

export const DateRangeProvider = ({ children }: { children: ReactNode }) => {
  const [dateRange, setDateRangeState] = useState<DateRange | undefined>(() => {
    return deserializeDateRange(localStorage.getItem('global-date-range'));
  });

  useEffect(() => {
    const serialized = serializeDateRange(dateRange);
    if (serialized) {
      localStorage.setItem('global-date-range', serialized);
    } else {
      localStorage.removeItem('global-date-range');
    }
  }, [dateRange]);

  const setDateRange = (range: DateRange | undefined) => {
    setDateRangeState(range);
  };

  return (
    <DateRangeContext.Provider value={{ dateRange, setDateRange }}>
      {children}
    </DateRangeContext.Provider>
  );
};

export const useDateRangeContext = () => {
  const context = useContext(DateRangeContext);
  if (context === undefined) {
    throw new Error('useDateRangeContext must be used within a DateRangeProvider');
  }
  return context;
};
