import { useState, useEffect } from "react";
import { TrendingUp, ArrowDownLeft, ArrowUpRight, Scale, Percent, BarChart3, Plus, Table as TableIcon, FileBarChart, Banknote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useROIEntries } from "@/hooks/useROIEntries";
import { ROITable } from "@/components/roi/ROITable";
import { ROIEntryDialog } from "@/components/roi/ROIEntryDialog";
import { StatCard } from "@/components/dashboard/StatCard";
import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";
import { useColors } from "@/context/ColorProvider";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";


export const ROIPage = () => {
  const [userId, setUserId] = useState<string>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any | null>(null);
  const { currentTheme } = useColors();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  const {
    entries,
    summaryStats,
    isLoading,
    addEntry,
    updateEntry,
    deleteEntry,
  } = useROIEntries(userId);

  const handleAdd = () => {
    setEditingEntry(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (entry: any) => {
    setEditingEntry(entry);
    setIsDialogOpen(true);
  };

  const handleSave = async (entryData: any) => {
    try {
      if (editingEntry) {
        await updateEntry.mutateAsync({ id: editingEntry.id, ...entryData });
      } else {
        await addEntry.mutateAsync(entryData);
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving entry:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEntry.mutateAsync(id);
    } catch (error) {
      console.error("Error deleting entry:", error);
    }
  };

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(val);
  };

  // Animated values
  const animatedInversion = useAnimatedNumber(summaryStats.totalInversion);
  const animatedRetiros = useAnimatedNumber(summaryStats.totalRetiros);
  const animatedNeto = useAnimatedNumber(summaryStats.balanceNeto);
  const animatedRoi = useAnimatedNumber(summaryStats.roiPct);

  // Colors
  const netoColor = summaryStats.balanceNeto > 0 ? "var(--profit-color)" : summaryStats.balanceNeto < 0 ? "var(--loss-color)" : "inherit";
  const roiColor = summaryStats.roiPct > 0 ? "var(--profit-color)" : summaryStats.roiPct < 0 ? "var(--loss-color)" : "inherit";

  const isWakeupTheme = currentTheme === "wakeup";

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <main className="container mx-auto px-4 py-6 md:py-8 space-y-4 pb-24">
        <Tabs value="roi" className="space-y-4 sm:space-y-6">
          <TabsList className="flex w-full max-w-xl mx-auto bg-card/50 backdrop-blur-lg border border-border/30 rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.04)]">
            <TabsTrigger value="dashboard" asChild className="gap-1.5 sm:gap-2 flex-1 min-w-0 text-xs sm:text-sm px-2 sm:px-3">
              <Link to="/#dashboard">
                <BarChart3 className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
            </TabsTrigger>
            <TabsTrigger value="add" asChild className="gap-1.5 sm:gap-2 flex-1 min-w-0 text-xs sm:text-sm px-2 sm:px-3">
              <Link to="/#add">
                <Plus className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Nueva</span>
              </Link>
            </TabsTrigger>
            <TabsTrigger value="trades" asChild className="gap-1.5 sm:gap-2 flex-1 min-w-0 text-xs sm:text-sm px-2 sm:px-3">
              <Link to="/#trades">
                <TableIcon className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Trades</span>
              </Link>
            </TabsTrigger>
            <TabsTrigger value="reportes" asChild className="gap-1.5 sm:gap-2 flex-1 min-w-0 text-xs sm:text-sm px-2 sm:px-3">
              <Link to="/reportes">
                <FileBarChart className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Reportes</span>
              </Link>
            </TabsTrigger>
            <TabsTrigger value="payout" asChild className="gap-1.5 sm:gap-2 flex-1 min-w-0 text-xs sm:text-sm px-2 sm:px-3">
              <Link to="/#payout">
                <Banknote className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Retiro</span>
              </Link>
            </TabsTrigger>
            <TabsTrigger value="roi" asChild className="gap-1.5 sm:gap-2 flex-1 min-w-0 text-xs sm:text-sm px-2 sm:px-3">
              <Link to="/roi">
                <TrendingUp className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">ROI</span>
              </Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>

      {/* Page Header */}
      <div className="flex flex-col space-y-2 mb-8 mt-4">
        <div className="flex items-center space-x-3">
          <div className="bg-muted rounded-xl p-2.5">
            <TrendingUp className="h-6 w-6 text-foreground" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Return on Investment</h2>
        </div>
        <p className="text-sm text-muted-foreground pl-12">
          Registrá tu inversión en evaluaciones, retiros y ROI acumulado como trader de prop firms.
        </p>
      </div>

      {/* Summary Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Invertido"
          animationDelay={0.07}
          className="border-border/50 bg-card/50 backdrop-blur-sm"
          value={
            <div className="flex items-center text-[var(--loss-color)]">
              <ArrowDownLeft className="mr-2 h-4 w-4" />
              {formatCurrency(animatedInversion)}
            </div>
          }
        />
        <StatCard
          title="Total Retirado"
          animationDelay={0.14}
          className="border-border/50 bg-card/50 backdrop-blur-sm"
          value={
            <div className="flex items-center text-[var(--profit-color)]">
              <ArrowUpRight className="mr-2 h-4 w-4" />
              {formatCurrency(animatedRetiros)}
            </div>
          }
        />
        <StatCard
          title="Balance Neto"
          animationDelay={0.21}
          className="border-border/50 bg-card/50 backdrop-blur-sm"
          value={
            <div className="flex items-center" style={{ color: netoColor }}>
              <Scale className="mr-2 h-4 w-4" />
              {formatCurrency(animatedNeto)}
            </div>
          }
        />
        <StatCard
          title="ROI"
          animationDelay={0.28}
          className="border-border/50 bg-card/50 backdrop-blur-sm"
          value={
            <motion.div
              className="flex items-center font-mono"
              style={{ color: roiColor }}
              animate={
                summaryStats.roiPct > 0
                  ? { textShadow: ["0 0 8px var(--profit-color)", "0 0 0px transparent"] }
                  : {}
              }
              transition={
                summaryStats.roiPct > 0
                  ? { repeat: Infinity, duration: 2, ease: "easeInOut" }
                  : {}
              }
            >
              <Percent className="mr-2 h-4 w-4" />
              {animatedRoi.toFixed(2)}%
            </motion.div>
          }
        />
      </div>

      {/* Glassmorphism Header (if Wakeup Theme) */}
      <div className={`rounded-xl overflow-hidden ${isWakeupTheme ? 'bg-white/5 backdrop-blur-sm border border-white/10 p-4' : ''}`}>
        <ROITable
          entries={entries}
          isLoading={isLoading}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      <ROIEntryDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSave}
        entryToEdit={editingEntry}
      />
      </main>
    </div>
  );
};
