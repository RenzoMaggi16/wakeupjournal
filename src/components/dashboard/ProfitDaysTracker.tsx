import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarCheck, Flame, CheckCircle2, Pencil, X, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface Trade {
  pnl_neto: number;
  entry_time: string;
}

interface ProfitDaysTrackerProps {
  accountId: string;
  trades: Trade[];
  minProfitDays: number;
  withdrawalPct: number;
  initialCapital: number;
  currentBalance: number;
  minProfitThreshold?: number;
}

export const ProfitDaysTracker = ({
  accountId,
  trades,
  minProfitDays,
  withdrawalPct,
  initialCapital,
  currentBalance,
  minProfitThreshold = 0,
}: ProfitDaysTrackerProps) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editDays, setEditDays] = useState(minProfitDays);
  const [editPct, setEditPct] = useState(withdrawalPct);
  const [editThreshold, setEditThreshold] = useState(minProfitThreshold);

  const { profitDays, totalDays, isCompleted } = useMemo(() => {
    const dailyPnL = new Map<string, number>();
    trades.forEach(trade => {
      if (!trade.entry_time) return;
      const dateStr = new Date(trade.entry_time).toISOString().split('T')[0];
      dailyPnL.set(dateStr, (dailyPnL.get(dateStr) || 0) + Number(trade.pnl_neto ?? 0));
    });

    let totalProfitDays = 0;
    dailyPnL.forEach((pnl) => {
      if (minProfitThreshold > 0) {
        if (pnl >= minProfitThreshold) totalProfitDays++;
      } else {
        if (pnl > 0) totalProfitDays++;
      }
    });

    return {
      profitDays: totalProfitDays,
      totalDays: dailyPnL.size,
      isCompleted: totalProfitDays >= minProfitDays,
    };
  }, [trades, minProfitDays, minProfitThreshold]);

  const progressPct = Math.min(100, (profitDays / minProfitDays) * 100);
  const withdrawableProfit = Math.max(0, currentBalance - initialCapital);
  const nextWithdrawalEstimate = withdrawableProfit * (withdrawalPct / 100);

  const thresholdLabel = minProfitThreshold > 0 ? `≥ $${minProfitThreshold}` : '> $0';

  const handleStartEdit = () => {
    setEditDays(minProfitDays);
    setEditPct(withdrawalPct);
    setEditThreshold(minProfitThreshold);
    setIsEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('accounts')
        .update({
          consistency_min_profit_days: editDays,
          consistency_withdrawal_pct: editPct,
          min_profit_threshold: editThreshold > 0 ? editThreshold : null,
        })
        .eq('id', accountId);

      if (error) throw error;

      toast.success("Regla de consistencia actualizada");
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setIsEditing(false);
    } catch {
      toast.error("Error al guardar los cambios");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className={`border-t-2 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md ${isCompleted ? 'border-t-emerald-500' : 'border-t-sky-500'}`}>
      <CardHeader className="pb-2 pt-3 px-4 border-b border-border/50 bg-muted/20">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 uppercase tracking-wide">
            <CalendarCheck className="h-3.5 w-3.5" />
            Regla de Consistencia
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 border ${
              isCompleted
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                : 'bg-sky-500/10 text-sky-500 border-sky-500/30'
            }`}>
              {isCompleted ? <CheckCircle2 className="w-3 h-3" /> : <Flame className="w-3 h-3" />}
              {isCompleted ? 'Cumplida' : 'En Progreso'}
            </div>
            {!isEditing && (
              <button
                onClick={handleStartEdit}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Editar regla"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pt-4 pb-4 space-y-3">
        {isEditing ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Mínimo de días profit</Label>
              <Input
                type="number"
                min="1"
                max="30"
                value={editDays}
                onChange={(e) => setEditDays(parseInt(e.target.value) || 1)}
                className="h-8 bg-muted/30 border-border/40"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Mínimo de profit por día ($)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={editThreshold}
                onChange={(e) => setEditThreshold(parseFloat(e.target.value) || 0)}
                className="h-8 bg-muted/30 border-border/40"
                placeholder="0 = cualquier ganancia cuenta"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">% del profit retirable</Label>
              <Input
                type="number"
                min="1"
                max="100"
                value={editPct}
                onChange={(e) => setEditPct(parseInt(e.target.value) || 1)}
                className="h-8 bg-muted/30 border-border/40"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-7 text-xs gap-1"
                onClick={() => setIsEditing(false)}
                disabled={saving}
              >
                <X className="h-3 w-3" /> Cancelar
              </Button>
              <Button
                size="sm"
                className="flex-1 h-7 text-xs gap-1 bg-sky-600 hover:bg-sky-700 text-white border-0"
                onClick={handleSave}
                disabled={saving}
              >
                <Check className="h-3 w-3" />
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Days Profit Counter */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Días Profit</span>
              <div className="flex items-center gap-1.5">
                <span className={`text-2xl font-bold ${isCompleted ? 'text-emerald-400' : 'text-sky-400'}`}>
                  {profitDays}
                </span>
                <span className="text-sm text-muted-foreground font-medium">/ {minProfitDays}</span>
              </div>
            </div>

            {/* Threshold Info */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Mínimo por día</span>
              <span className="text-xs font-semibold text-amber-400/90 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                {thresholdLabel}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="w-full h-2.5 bg-muted/40 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-sky-500'}`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{progressPct.toFixed(0)}% completado</span>
                <span>{minProfitDays - profitDays > 0 ? `Faltan ${minProfitDays - profitDays} días` : '✓ Completado'}</span>
              </div>
            </div>

            {/* Withdrawal Percentage Info */}
            <div className="flex items-center justify-between pt-1 border-t border-border/30">
              <span className="text-xs text-muted-foreground">% retirable del profit</span>
              <span className="text-sm font-bold text-foreground">{withdrawalPct}%</span>
            </div>

            {/* Total trading days info */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Días operados totales</span>
              <span className="text-sm font-medium text-muted-foreground">{totalDays}</span>
            </div>

            <div className="border-t border-border/30 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Próximo retiro estimado</span>
                <span className="text-sm font-bold text-violet-400">{nextWithdrawalEstimate.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">Aplicando {withdrawalPct}% sobre el balance actual.</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
