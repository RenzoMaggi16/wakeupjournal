import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Pencil, Trash2, TrendingUp, Plus, ChevronDown, ChevronUp } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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

const fmt = (val: number | null | undefined) => {
  if (val == null) return <span className="text-muted-foreground/40">—</span>;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(val);
};

const fmtNum = (val: number | null | undefined) => {
  if (val == null) return <span className="text-muted-foreground/40">—</span>;
  return val;
};

function ValueCell({ value, positive }: { value: number; positive?: boolean }) {
  const isPos = value > 0;
  const isNeg = value < 0;
  return (
    <span
      className="font-mono font-semibold tabular-nums"
      style={{
        color: isPos
          ? "var(--profit-color)"
          : isNeg
          ? "var(--loss-color)"
          : "inherit",
      }}
    >
      {new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
      }).format(value)}
    </span>
  );
}

type SortKey = "fecha" | "inversion" | "monto_retiros" | "balance_mensual" | "balance_acumulado";

export const ROITable = ({ entries, isLoading, onAdd, onEdit, onDelete }: ROITableProps) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("fecha");
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((a) => !a);
    else { setSortKey(key); setSortAsc(true); }
  };

  const sorted = [...entries].sort((a, b) => {
    const av = a[sortKey] ?? 0;
    const bv = b[sortKey] ?? 0;
    const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
    return sortAsc ? cmp : -cmp;
  });

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortKey === col ? (
      sortAsc ? <ChevronUp className="h-3 w-3 ml-1 inline opacity-70" /> : <ChevronDown className="h-3 w-3 ml-1 inline opacity-70" />
    ) : (
      <ChevronDown className="h-3 w-3 ml-1 inline opacity-20" />
    );

  const thClass = "h-10 px-4 text-left text-sm font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors";
  const thCenterClass = "h-10 px-4 text-center text-sm font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors";

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-muted-foreground">
          {entries.length === 0
            ? "Sin entradas aún"
            : `${entries.length} ${entries.length === 1 ? "entrada" : "entradas"}`}
        </p>
        <Button onClick={onAdd} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva entrada
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border/50 hover:bg-transparent">
                <th className={thClass} onClick={() => handleSort("fecha")}>
                  Período <SortIcon col="fecha" />
                </th>
                <th className={thCenterClass}>
                  Empresa
                </th>
                <th className={thCenterClass}>
                  Cuentas
                </th>
                <th className={thClass} onClick={() => handleSort("inversion")}>
                  Inversión <SortIcon col="inversion" />
                </th>
                <th className={thCenterClass}>
                  Retiros
                </th>
                <th className={thClass} onClick={() => handleSort("monto_retiros")}>
                  Monto retiros <SortIcon col="monto_retiros" />
                </th>
                <th className={thClass} onClick={() => handleSort("balance_mensual")}>
                  Balance mes <SortIcon col="balance_mensual" />
                </th>
                <th className={`${thClass} hidden lg:table-cell`} onClick={() => handleSort("balance_acumulado")}>
                  Balance acum. <SortIcon col="balance_acumulado" />
                </th>
                <th className="h-10 px-4 text-center text-sm font-medium text-muted-foreground w-20">
                  Acciones
                </th>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i} className="border-b border-border/30">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <TableCell key={j} className={j === 7 ? "hidden lg:table-cell" : ""}>
                        <Skeleton className="h-5 w-full rounded" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-52 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                      <div className="rounded-full bg-muted/50 p-4">
                        <TrendingUp className="h-6 w-6 opacity-40" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Sin registros aún</p>
                        <p className="text-sm mt-0.5">Agregá tu primera entrada para trackear tu ROI como prop trader.</p>
                      </div>
                      <Button onClick={onAdd} variant="outline" size="sm" className="mt-1">
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar primera entrada
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <AnimatePresence initial={false}>
                  {sorted.map((entry, idx) => (
                    <motion.tr
                      key={entry.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="border-b border-border/30 hover:bg-muted/30 transition-colors group"
                    >
                      {/* Período */}
                      <TableCell className="px-4 py-3 font-medium whitespace-nowrap">
                        {format(new Date(`${entry.fecha}T00:00:00`), "MMM yyyy", { locale: es })}
                      </TableCell>

                      {/* Empresa */}
                      <TableCell className="px-4 py-3 text-center">
                        {entry.empresa_fondeo ? (
                          <span className="text-sm text-foreground/80">{entry.empresa_fondeo}</span>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </TableCell>

                      {/* Cuentas compradas */}
                      <TableCell className="px-4 py-3 text-center font-mono text-sm">
                        {fmtNum(entry.cuentas_compradas)}
                      </TableCell>

                      {/* Inversión */}
                      <TableCell className="px-4 py-3 font-mono text-sm whitespace-nowrap text-muted-foreground">
                        {fmt(entry.inversion)}
                      </TableCell>

                      {/* Retiros (cantidad) */}
                      <TableCell className="px-4 py-3 text-center font-mono text-sm">
                        {fmtNum(entry.retiros)}
                      </TableCell>

                      {/* Monto retiros */}
                      <TableCell className="px-4 py-3 font-mono text-sm whitespace-nowrap text-muted-foreground">
                        {fmt(entry.monto_retiros)}
                      </TableCell>

                      {/* Balance mensual */}
                      <TableCell className="px-4 py-3 whitespace-nowrap">
                        <ValueCell value={entry.balance_mensual} />
                      </TableCell>

                      {/* Balance acumulado */}
                      <TableCell className="px-4 py-3 whitespace-nowrap hidden lg:table-cell">
                        <div className="flex flex-col gap-0.5">
                          <ValueCell value={entry.balance_acumulado} />
                          {entry.observaciones && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-xs text-muted-foreground/60 truncate max-w-[140px] cursor-help">
                                    {entry.observaciones.substring(0, 28)}{entry.observaciones.length > 28 ? "…" : ""}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="left">
                                  <p className="max-w-xs text-sm">{entry.observaciones}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </TableCell>

                      {/* Acciones */}
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onEdit(entry)}
                            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                            title="Editar"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingId(entry.id)}
                            className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
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
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deletingId) { onDelete(deletingId); setDeletingId(null); } }}
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
