import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { BackToDashboard } from '@/components/BackToDashboard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Settings as SettingsIcon,
  Check,
  Moon,
  Sun,
  Zap,
  Plug,
  Wallet,
  Palette,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import ManageAccounts from './ManageAccounts';
import { useColors, THEMES, ThemeType } from '@/context/ColorProvider';
import { cn } from "@/lib/utils";
import { TradovateIntegration } from '@/components/TradovateIntegration';

// ─── Miniature theme preview mockup ─────────────────────────
const ThemePreviewMockup = ({
  background,
  card,
  profit,
  loss,
  foreground,
}: {
  background: string;
  card: string;
  profit: string;
  loss: string;
  foreground: string;
}) => (
  <div
    className="w-full aspect-video rounded-lg overflow-hidden flex flex-col gap-1 p-2"
    style={{ backgroundColor: background }}
  >
    {/* Two stat blocks */}
    <div className="flex gap-1 flex-1">
      <div className="flex-1 rounded-md flex flex-col justify-between p-1.5" style={{ backgroundColor: card }}>
        <div className="h-1.5 w-8 rounded-full" style={{ backgroundColor: foreground, opacity: 0.3 }} />
        <div className="h-3 w-10 rounded" style={{ backgroundColor: profit, opacity: 0.85 }} />
      </div>
      <div className="flex-1 rounded-md flex flex-col justify-between p-1.5" style={{ backgroundColor: card }}>
        <div className="h-1.5 w-8 rounded-full" style={{ backgroundColor: foreground, opacity: 0.3 }} />
        <div className="h-3 w-10 rounded" style={{ backgroundColor: loss, opacity: 0.85 }} />
      </div>
    </div>
    {/* Tiny line chart */}
    <div className="rounded-md p-1.5 flex items-end gap-0.5" style={{ backgroundColor: card, height: 28 }}>
      {[40, 55, 45, 70, 60, 80, 72].map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-sm"
          style={{
            height: `${h}%`,
            backgroundColor: profit,
            opacity: 0.7 + i * 0.04,
          }}
        />
      ))}
    </div>
  </div>
);

const Settings = () => {
  const { currentTheme, setTheme, isLoading } = useColors();
  const [isChanging, setIsChanging] = useState(false);

  // Fetch account count for collapsed preview
  const { data: accountCount, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['accounts-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('accounts')
        .select('*', { count: 'exact', head: true });
      return count ?? 0;
    },
  });

  // Fetch tradovate status for collapsed preview
  const { data: tradovateStatus, isLoading: isLoadingTradovate } = useQuery({
    queryKey: ['tradovate-status-preview'],
    queryFn: async () => {
      const { data } = await supabase
        .from('tradovate_connections')
        .select('status')
        .maybeSingle();
      return data?.status ?? null;
    },
  });

  const handleThemeChange = async (themeKey: ThemeType) => {
    setIsChanging(true);
    await setTheme(themeKey);
    setIsChanging(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-48 mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 overflow-x-hidden">
      <Navbar />
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-4xl">
        <BackToDashboard />

        {/* ── Premium Page Header ─────────────────────────── */}
        <div className="flex items-start gap-4 mb-8">
          <div className="p-2.5 rounded-xl bg-muted/60 border border-border/50 shadow-sm shrink-0">
            <SettingsIcon className="h-6 w-6 text-foreground/70" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Configuración</h1>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Personalizá la apariencia, gestioná tus cuentas y conectá tus brokers.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* ── SECTION 1: Apariencia y Temas ─────────────── */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-muted/50">
                  <Palette className="h-4 w-4 text-foreground/60" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">Apariencia y Temas</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Elegí el esquema de colores de tu journal.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {(Object.entries(THEMES) as [ThemeType, typeof THEMES[ThemeType]][]).map(([key, theme]) => {
                  const isActive = currentTheme === key;
                  const isDarkTheme = theme.colors.mode === 'dark';
                  const cardBg = isDarkTheme
                    ? (key === 'wakeup' ? '#110d1e' : '#1a1a1a')
                    : '#e8e8e8';
                  const cardFg = isDarkTheme ? '#ffffff' : '#111111';

                  return (
                    <button
                      key={key}
                      onClick={() => handleThemeChange(key)}
                      disabled={isChanging}
                      className={cn(
                        "relative rounded-xl border-2 text-left transition-all duration-200 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        "hover:border-primary/50 cursor-pointer",
                        isActive
                          ? "border-primary ring-2 ring-primary/20 ring-offset-2 ring-offset-background shadow-lg"
                          : "border-border/50 hover:shadow-md"
                      )}
                      aria-label={`Seleccionar tema ${theme.name}`}
                      aria-pressed={isActive}
                    >
                      {/* Selected indicator */}
                      {isActive && (
                        <div className="absolute top-2.5 right-2.5 z-10 bg-primary text-primary-foreground rounded-full p-0.5 shadow-sm">
                          <Check className="h-3 w-3" />
                        </div>
                      )}

                      {/* Preview window — contained, shows that theme's look */}
                      <div className="p-3 pb-0" style={{ backgroundColor: theme.colors.background }}>
                        <ThemePreviewMockup
                          background={theme.colors.background}
                          card={cardBg}
                          profit={theme.colors.profit}
                          loss={theme.colors.loss}
                          foreground={cardFg}
                        />
                      </div>

                      {/* Card info footer */}
                      <div className="p-4 bg-card">
                        <div className="flex items-center gap-2 mb-1">
                          {key === 'wakeup' && <Zap className="h-3.5 w-3.5 text-yellow-400 shrink-0" />}
                          {key === 'dark' && <Moon className="h-3.5 w-3.5 text-slate-400 shrink-0" />}
                          {key === 'light' && <Sun className="h-3.5 w-3.5 text-amber-400 shrink-0" />}
                          <span className="text-sm font-semibold">{theme.name}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
                          {key === 'wakeup' && "El tema original de Wakeup Journal. Alto contraste neón."}
                          {key === 'dark' && "Modo oscuro clásico, sobrio y profesional."}
                          {key === 'light' && "Modo claro limpio, ideal para ambientes iluminados."}
                        </p>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: theme.colors.profit }} />
                            <span className="text-[10px] text-muted-foreground">Ganancia</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: theme.colors.loss }} />
                            <span className="text-[10px] text-muted-foreground">Pérdida</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* ── SECTION 2: Gestionar Cuentas (Accordion) ──── */}
          <Card className="border-border/60 shadow-sm">
            <Accordion type="single" collapsible>
              <AccordionItem value="accounts" className="border-0">
                <AccordionTrigger className="px-6 py-4 hover:no-underline [&[data-state=open]>div>.chevron-hint]:hidden">
                  <div className="flex items-center gap-3 w-full min-w-0">
                    <div className="p-1.5 rounded-lg bg-muted/50 shrink-0">
                      <Wallet className="h-4 w-4 text-foreground/60" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <span className="text-base font-semibold">Gestionar Cuentas</span>
                    </div>
                    {/* Account count preview — hidden when expanded */}
                    <div className="chevron-hint shrink-0 mr-2">
                      {isLoadingAccounts ? (
                        <Skeleton className="h-4 w-20" />
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {accountCount === 0
                            ? 'Sin cuentas'
                            : `${accountCount} ${accountCount === 1 ? 'cuenta' : 'cuentas'}`}
                        </span>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-0 pb-0">
                  <div className="border-t border-border/30 pt-4">
                    <ManageAccounts />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>

          {/* ── SECTION 3: Conexión con Broker (Accordion) ── */}
          <Card className="border-border/60 shadow-sm opacity-70">
            <Accordion type="single" collapsible>
              <AccordionItem value="broker" className="border-0" disabled>
                <AccordionTrigger className="px-6 py-4 hover:no-underline [&[data-state=open]>div>.chevron-hint]:hidden cursor-not-allowed">
                  <div className="flex items-center gap-3 w-full min-w-0">
                    <div className="p-1.5 rounded-lg bg-muted/50 shrink-0">
                      <Plug className="h-4 w-4 text-foreground/60" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <span className="text-base font-semibold">Conexión con Broker</span>
                      <span className="text-muted-foreground font-normal text-sm ml-1">(Tradovate)</span>
                    </div>
                    {/* Status preview — hidden when expanded */}
                    <div className="chevron-hint shrink-0 mr-2 flex items-center gap-2">
                      {isLoadingTradovate ? (
                        <Skeleton className="h-4 w-24" />
                      ) : tradovateStatus === 'connected' ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] font-medium border-emerald-500/30 text-emerald-500 bg-emerald-500/10 px-2 py-0.5"
                        >
                          Conectado
                        </Badge>
                      ) : tradovateStatus === 'error' ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] font-medium border-destructive/30 text-destructive bg-destructive/10 px-2 py-0.5"
                        >
                          Error
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-[10px] font-medium border-muted-foreground/20 text-muted-foreground bg-muted/30 px-2 py-0.5"
                        >
                          En desarrollo
                        </Badge>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-0 pb-0">
                  <div className="border-t border-border/30 pt-4 px-6 pb-6">
                    <TradovateIntegration />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Settings;
