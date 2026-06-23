import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TradingPlan } from "@/hooks/useTradingPlan";
import { BookOpen, Shield, Target, Clock, TrendingUp, AlertTriangle, Pencil, Plus } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface TradingPlanCardProps {
    plan: TradingPlan | null;
    isLoading: boolean;
    onEdit: () => void;
}

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex items-center justify-between py-1.5 text-sm border-b border-border/30 last:border-0">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground text-right">{value}</span>
    </div>
);

const Section = ({ icon: Icon, label }: { icon: React.ElementType; label: string }) => (
    <div className="flex items-center gap-2 pt-1 pb-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold text-muted-foreground">{label}</span>
    </div>
);

export const TradingPlanCard = ({ plan, isLoading, onEdit }: TradingPlanCardProps) => {
    if (isLoading) {
        return (
            <Card className="border-border/50 bg-card/50">
                <CardContent className="p-5 space-y-3 animate-pulse">
                    <div className="h-5 bg-muted rounded w-2/3" />
                    <div className="h-4 bg-muted rounded w-full" />
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                </CardContent>
            </Card>
        );
    }

    if (!plan) {
        return (
            <Card className="border-border/50 border-dashed bg-card/30">
                <CardContent className="p-8 flex flex-col items-center justify-center text-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="font-semibold text-foreground">Sin Trading Plan</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Define tu plan para mejorar la disciplina y consistencia.
                        </p>
                    </div>
                    <Button onClick={onEdit} size="sm" className="gap-2">
                        <Plus className="h-4 w-4" />
                        Crear plan
                    </Button>
                </CardContent>
            </Card>
        );
    }

    const tradingTypeLabels: Record<string, string> = {
        scalping: "Scalping",
        intraday: "Intraday",
        swing: "Swing",
    };

    const activeRules = (plan.psychological_rules || []).filter((r: any) => r.active);
    const setupRules = plan.setup_rules || [];

    return (
        <Card className="border-border/50 bg-card/50">
            <CardHeader className="px-5 pt-5 pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-muted/70 flex items-center justify-center">
                            <BookOpen className="h-3.5 w-3.5 text-foreground/70" />
                        </div>
                        <span className="font-semibold text-sm">Trading Plan</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onEdit} className="h-7 w-7 text-muted-foreground hover:text-foreground">
                        <Pencil className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="px-5 pb-5 space-y-4">
                {/* General */}
                <div>
                    {plan.market && <Row label="Mercado" value={plan.market} />}
                    {plan.instrument && <Row label="Instrumento" value={plan.instrument} />}
                    {plan.trading_type && (
                        <Row label="Tipo" value={
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted border border-border/60">
                                {tradingTypeLabels[plan.trading_type] || plan.trading_type}
                            </span>
                        } />
                    )}
                    {plan.session && <Row label="Sesión" value={plan.session} />}
                    {(plan.allowed_hours_start || plan.allowed_hours_end) && (
                        <Row
                            label={<span className="flex items-center gap-1"><Clock className="h-3 w-3" />Horario</span> as any}
                            value={`${plan.allowed_hours_start?.substring(0, 5) || '--:--'} – ${plan.allowed_hours_end?.substring(0, 5) || '--:--'}`}
                        />
                    )}
                </div>

                {/* Risk */}
                {(plan.risk_per_trade != null || plan.max_daily_risk != null || plan.max_trades_per_day != null || plan.min_rr != null || plan.stop_after_consecutive_losses != null) && (
                    <>
                        <Separator className="bg-border/40" />
                        <div>
                            <Section icon={Shield} label="Gestión de riesgo" />
                            {plan.risk_per_trade != null && <Row label="Riesgo / trade" value={<span style={{ color: 'var(--loss-color)' }}>{plan.risk_per_trade}%</span>} />}
                            {plan.max_daily_risk != null && <Row label="Riesgo diario máx." value={<span style={{ color: 'var(--loss-color)' }}>{plan.max_daily_risk}%</span>} />}
                            {plan.max_trades_per_day != null && <Row label="Max trades / día" value={plan.max_trades_per_day} />}
                            {plan.min_rr != null && <Row label="R:R mínimo" value={<span style={{ color: 'var(--profit-color)' }}>1:{plan.min_rr}</span>} />}
                            {plan.stop_after_consecutive_losses != null && <Row label="Stop tras pérdidas" value={`${plan.stop_after_consecutive_losses} consecutivas`} />}
                        </div>
                    </>
                )}

                {/* Psychological rules */}
                {activeRules.length > 0 && (
                    <>
                        <Separator className="bg-border/40" />
                        <div>
                            <Section icon={AlertTriangle} label="Reglas psicológicas" />
                            <ul className="space-y-1.5">
                                {activeRules.map((rule: any, i: number) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                                        <span className="mt-1 w-1 h-1 rounded-full bg-muted-foreground/50 shrink-0" />
                                        {rule.rule}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </>
                )}

                {/* Setups */}
                {setupRules.length > 0 && (
                    <>
                        <Separator className="bg-border/40" />
                        <div>
                            <Section icon={Target} label="Setups" />
                            <div className="space-y-2">
                                {setupRules.map((setup: any, i: number) => (
                                    <div key={i} className="rounded-lg border border-border/40 bg-muted/20 p-3">
                                        <p className="text-sm font-medium text-foreground mb-1">{setup.name}</p>
                                        {setup.conditions?.length > 0 && (
                                            <ul className="space-y-1">
                                                {setup.conditions.map((c: string, j: number) => (
                                                    <li key={j} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                                        <TrendingUp className="h-3 w-3 mt-0.5 shrink-0 opacity-50" />
                                                        {c}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* Monthly goals */}
                {plan.monthly_goals && Object.keys(plan.monthly_goals).some(k => (plan.monthly_goals as any)[k]) && (
                    <>
                        <Separator className="bg-border/40" />
                        <div>
                            <Section icon={Target} label="Objetivos mensuales" />
                            <div className="space-y-1.5 text-sm">
                                {(plan.monthly_goals as any).discipline_goal && (
                                    <p className="text-foreground/80">
                                        <span className="text-muted-foreground">Disciplina: </span>
                                        {(plan.monthly_goals as any).discipline_goal}
                                    </p>
                                )}
                                {(plan.monthly_goals as any).performance_goal && (
                                    <p className="text-foreground/80">
                                        <span className="text-muted-foreground">Rendimiento: </span>
                                        {(plan.monthly_goals as any).performance_goal}
                                    </p>
                                )}
                                {(plan.monthly_goals as any).consistency_goal && (
                                    <p className="text-foreground/80">
                                        <span className="text-muted-foreground">Consistencia: </span>
                                        {(plan.monthly_goals as any).consistency_goal}
                                    </p>
                                )}
                            </div>
                        </div>
                    </>
                )}

                <Separator className="bg-border/40" />
                <Button onClick={onEdit} variant="outline" size="sm" className="w-full gap-2">
                    <Pencil className="h-3.5 w-3.5" />
                    Editar plan
                </Button>
            </CardContent>
        </Card>
    );
};
