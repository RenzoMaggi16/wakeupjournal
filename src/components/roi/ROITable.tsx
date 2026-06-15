import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Pencil, Trash2, TrendingUp, Plus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { ROIEntryRow } from "@/hooks/useROIEntries";

interface ROITableProps {
  entries: (ROIEntryRow & {
    balance_mensual: number;
    inversion_acumulada: number;
    retiros_acumulados: number;
    balance_acumulado: number;
  })[];
  isLoading: boolean;
  onAdd: () => void;
  onEdit: (entry: any) => void;
  onDelete: (id: string) => void;
}

export const ROITable = ({ entries, isLoading, onAdd, onEdit, onDelete }: ROITableProps) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const formatCurrency = (val: number | null | undefined) => {
    if (val == null) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(val);
  };

  const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 40%, 50%, 0.2)`;
  };

  const getTextColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 60%, 70%)`;
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-muted-foreground">
          {entries.length} {entries.length === 1 ? "entrada registrada" : "entradas registradas"}
        </div>
        <Button onClick={onAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Nueva Entrada
        </Button>
      </div>

      {/* Table Container */}
      <div className="border rounded-xl bg-card overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          <Table className="w-full">
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground h-12 whitespace-nowrap">Fecha</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground text-center h-12 whitespace-nowrap"># Cuentas Compradas</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground h-12 whitespace-nowrap">Inversión</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground text-center h-12 whitespace-nowrap"># Retiros</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground h-12 whitespace-nowrap">Monto Retiros</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground h-12 whitespace-nowrap">Balance Mensual</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground h-12 whitespace-nowrap">Empresa de Fondeo</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground h-12 hidden sm:table-cell whitespace-nowrap">Inversión Acumulada</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground h-12 hidden sm:table-cell whitespace-nowrap">Retiros Acumulados</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground h-12 whitespace-nowrap">Balance Acumulado</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground h-12 hidden sm:table-cell whitespace-nowrap">Observaciones</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground h-12 text-center whitespace-nowrap">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 12 }).map((_, j) => (
                      <TableCell key={j} className={j >= 7 && j !== 9 && j !== 11 ? 'hidden sm:table-cell' : ''}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="h-[300px] text-center align-middle">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <TrendingUp className="h-10 w-10 text-muted-foreground/50" />
                      <div className="text-lg font-medium">Sin registros aún</div>
                      <div className="text-sm text-muted-foreground">
                        Agregá tu primera entrada para empezar a trackear tu ROI como prop trader.
                      </div>
                      <Button onClick={onAdd} variant="outline" className="mt-4">
                        Agregar primera entrada
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <AnimatePresence>
                  {entries.map((entry) => {
                    const bm = entry.balance_mensual;
                    const bmPos = bm > 0;
                    const bmNeg = bm < 0;
                    const ba = entry.balance_acumulado;
                    const baPos = ba > 0;
                    const baNeg = ba < 0;

                    return (
                      <motion.tr
                        key={entry.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        className="h-12 border-b even:bg-muted/20 hover:bg-muted/40 transition-colors"
                      >
                        <TableCell className="py-3 px-4 whitespace-nowrap">
                          {format(new Date(`${entry.fecha}T00:00:00`), "MMM yyyy", { locale: es })}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-center">
                          {entry.cuentas_compradas ?? "-"}
                        </TableCell>
                        <TableCell className="py-3 px-4 font-mono whitespace-nowrap">
                          {formatCurrency(entry.inversion)}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-center">
                          {entry.retiros ?? "-"}
                        </TableCell>
                        <TableCell className="py-3 px-4 font-mono whitespace-nowrap">
                          {formatCurrency(entry.monto_retiros)}
                        </TableCell>
                        <TableCell
                          className="py-3 px-4 font-mono font-bold whitespace-nowrap"
                          style={{
                            backgroundColor: bmPos
                              ? "var(--calendar-profit-bg)"
                              : bmNeg
                              ? "var(--calendar-loss-bg)"
                              : "transparent",
                            color: bmPos
                              ? "var(--profit-color)"
                              : bmNeg
                              ? "var(--loss-color)"
                              : "inherit",
                          }}
                        >
                          {formatCurrency(bm)}
                        </TableCell>
                        <TableCell className="py-3 px-4 whitespace-nowrap">
                          {entry.empresa_fondeo ? (
                            <div className="flex gap-1 flex-wrap">
                              {entry.empresa_fondeo.split(" + ").map((firm, i) => (
                                <Badge
                                  key={i}
                                  className="rounded-full px-2 py-0.5 text-xs font-medium border-transparent"
                                  style={{
                                    backgroundColor: stringToColor(firm.trim()),
                                    color: getTextColor(firm.trim()),
                                  }}
                                  variant="outline"
                                >
                                  {firm.trim()}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="py-3 px-4 font-mono hidden sm:table-cell whitespace-nowrap">
                          {formatCurrency(entry.inversion_acumulada)}
                        </TableCell>
                        <TableCell className="py-3 px-4 font-mono hidden sm:table-cell whitespace-nowrap">
                          {formatCurrency(entry.retiros_acumulados)}
                        </TableCell>
                        <TableCell
                          className="py-3 px-4 font-mono font-bold whitespace-nowrap"
                          style={{
                            backgroundColor: baPos
                              ? "var(--calendar-profit-bg)"
                              : baNeg
                              ? "var(--calendar-loss-bg)"
                              : "transparent",
                            color: baPos
                              ? "var(--profit-color)"
                              : baNeg
                              ? "var(--loss-color)"
                              : "inherit",
                          }}
                        >
                          {formatCurrency(ba)}
                        </TableCell>
                        <TableCell className="py-3 px-4 hidden sm:table-cell">
                          {entry.observaciones ? (
                            entry.observaciones.length > 40 ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="cursor-help border-b border-dotted border-muted-foreground">
                                      {entry.observaciones.substring(0, 40)}...
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs">{entry.observaciones}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              <span>{entry.observaciones}</span>
                            )
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => onEdit(entry)}
                              className="p-2.5 rounded-md hover:bg-accent text-muted-foreground transition-colors"
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeletingId(entry.id)}
                              className="p-2.5 rounded-md hover:bg-destructive/10 text-destructive transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta entrada?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La entrada será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingId) onDelete(deletingId);
                setDeletingId(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
