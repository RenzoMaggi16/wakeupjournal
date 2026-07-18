import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { BarChart3, Plus, Table as TableIcon, FileBarChart, Banknote, TrendingUp, BookOpen, NotebookPen } from "lucide-react";
import { RecapCalendar } from "@/components/recap/RecapCalendar";
import { WeeklyNotesPanel } from "@/components/recap/WeeklyNotesPanel";
import { DailyRecapModal } from "@/components/recap/DailyRecapModal";
import { useMonthRecaps } from "@/hooks/useMonthRecaps";

const RecapPage = () => {
  const [userId, setUserId] = useState<string>();
  const [month, setMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  const { recapsByDate } = useMonthRecaps(userId, month);

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <main className="container mx-auto px-4 py-6 md:py-8 space-y-4 pb-24">
        <Tabs value="recap" className="space-y-4 sm:space-y-6">
          <TabsList className="flex w-full max-w-3xl mx-auto gap-1 bg-card/50 backdrop-blur-lg border border-border/30 rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.04)]">
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
            <TabsTrigger value="recap" asChild className="gap-1.5 sm:gap-2 flex-1 min-w-0 text-xs sm:text-sm px-2 sm:px-3">
              <Link to="/recap">
                <BookOpen className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Recap</span>
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
              <NotebookPen className="h-6 w-6 text-foreground" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Recap</h2>
          </div>
          <p className="text-sm text-muted-foreground pl-12">
            Registrá el contexto de cada sesión y tus reflexiones semanales, más allá de los trades individuales.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4 items-start">
          <RecapCalendar
            month={month}
            onMonthChange={setMonth}
            recapsByDate={recapsByDate}
            onDayClick={handleDayClick}
          />
          <WeeklyNotesPanel userId={userId} />
        </div>

        <DailyRecapModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          date={selectedDate}
          userId={userId}
        />
      </main>
    </div>
  );
};

export default RecapPage;
