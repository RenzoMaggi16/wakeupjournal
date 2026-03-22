import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDuration } from '@/utils/tradeStatsCalculations';
import type { TradeForStats } from '@/utils/tradeStatsCalculations';

interface TradeHistoryTableProps {
  trades: TradeForStats[];
  pageSize?: number;
}

export const TradeHistoryTable = ({ trades, pageSize = 20 }: TradeHistoryTableProps) => {
  const [currentPage, setCurrentPage] = useState(0);

  // Sort trades by entry_time descending (most recent first)
  const sortedTrades = useMemo(() => {
    return [...trades]
      .filter(t => t.entry_time)
      .sort((a, b) => new Date(b.entry_time!).getTime() - new Date(a.entry_time!).getTime());
  }, [trades]);

  const totalPages = Math.max(1, Math.ceil(sortedTrades.length / pageSize));
  const paginatedTrades = sortedTrades.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  const getDuration = (t: TradeForStats): string => {
    if (!t.entry_time || !t.exit_time) return '—';
    const start = new Date(t.entry_time).getTime();
    const end = new Date(t.exit_time).getTime();
    if (!isFinite(start) || !isFinite(end) || end <= start) return '—';
    return formatDuration((end - start) / 60000);
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Card className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />

        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Historial de Operaciones
            </CardTitle>
            <span className="text-xs text-muted-foreground">
              {sortedTrades.length} operaciones
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {sortedTrades.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No hay operaciones registradas.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="trade-history-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Par</th>
                      <th>Dirección</th>
                      <th>PnL</th>
                      <th>Duración</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTrades.map((trade, index) => {
                      const pnl = Number(trade.pnl_neto);
                      const isBuy = trade.trade_type === 'buy';
                      return (
                        <tr key={trade.id} className="trade-history-row">
                          <td className="text-muted-foreground">
                            {formatDate(trade.entry_time)}
                          </td>
                          <td className="font-medium">{trade.par || '—'}</td>
                          <td>
                            <span
                              className={`trade-direction-badge ${
                                isBuy ? 'trade-direction-long' : 'trade-direction-short'
                              }`}
                            >
                              {isBuy ? '▲ Long' : '▼ Short'}
                            </span>
                          </td>
                          <td
                            className="font-semibold"
                            style={{
                              color: pnl > 0
                                ? 'var(--profit-color)'
                                : pnl < 0
                                  ? 'var(--loss-color)'
                                  : undefined,
                            }}
                          >
                            {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                          </td>
                          <td className="text-muted-foreground">{getDuration(trade)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/30">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={currentPage === 0}
                    onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                    className="gap-1 text-xs"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Anterior
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Página {currentPage + 1} de {totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={currentPage >= totalPages - 1}
                    onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                    className="gap-1 text-xs"
                  >
                    Siguiente
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
