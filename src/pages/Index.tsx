import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Auth } from "@/components/Auth";
import { Dashboard } from "@/components/Dashboard";
import { TradeForm } from "@/components/TradeForm";
import { TradesTable } from "@/components/TradesTable";
import { Navbar } from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Plus, Table, FileBarChart, Banknote } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { PayoutForm } from "@/components/PayoutForm";

const Index = () => {
  const { hash } = useLocation();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Quita el '#' del hash, o usa 'dashboard' como default
  const activeTab = hash ? hash.replace('#', '') : 'dashboard';

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <Tabs value={activeTab} className="space-y-4 sm:space-y-6">
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
                <Table className="h-4 w-4 shrink-0" />
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
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4 sm:space-y-6">
            <Dashboard />
          </TabsContent>

          <TabsContent value="add">
            <div className="max-w-2xl mx-auto">
              <TradeForm />
            </div>
          </TabsContent>

          <TabsContent value="trades">
            <TradesTable />
          </TabsContent>

          <TabsContent value="payout">
            <div className="max-w-2xl mx-auto">
              <PayoutForm />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
