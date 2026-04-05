import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { getFirmsByMarket, getFirmLabel, marketHasFirms, type FundingFirmId } from "@/utils/firmConfig";
import { Rocket, ArrowRight, ArrowLeft, CheckCircle2, Sparkles, TrendingUp } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAccountContext } from "@/context/AccountContext";

interface WelcomeOnboardingModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAccountCreated?: (newAccount: { id: string; account_name: string }) => void;
}

export function WelcomeOnboardingModal({ isOpen, onOpenChange, onAccountCreated }: WelcomeOnboardingModalProps) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();
  const { setAccount } = useAccountContext();

  // Form state
  const [accountName, setAccountName] = useState("");
  const [assetClass, setAssetClass] = useState<'futures' | 'forex' | 'crypto' | 'stocks' | 'other'>("futures");
  const [accountType, setAccountType] = useState<'personal' | 'evaluation' | 'live'>("evaluation");
  const [fundingFirmId, setFundingFirmId] = useState<FundingFirmId | "">("");
  const [initialCapital, setInitialCapital] = useState("");
  const [fundingPhases, setFundingPhases] = useState(1);
  const [fundingTarget1, setFundingTarget1] = useState("");
  const [fundingTarget2, setFundingTarget2] = useState("");

  // Derived: should show firm dropdown?
  const showFirmDropdown =
    marketHasFirms(assetClass) && (accountType === 'evaluation' || accountType === 'live');

  const firmList = getFirmsByMarket(assetClass);

  // Reset firm when market changes
  useEffect(() => {
    setFundingFirmId("");
  }, [assetClass]);

  const handleCreate = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Usuario no autenticado");
        return;
      }

      if (!accountName.trim()) {
        toast.error("El nombre de la cuenta es requerido");
        return;
      }

      const capital = parseFloat(initialCapital);
      if (!capital || capital <= 0) {
        toast.error("El capital inicial debe ser mayor a 0");
        return;
      }

      if (showFirmDropdown && !fundingFirmId) {
        toast.error("Selecciona una empresa de fondeo");
        return;
      }

      if (accountType === 'evaluation') {
        const t1 = parseFloat(fundingTarget1);
        if (!t1 || t1 <= 0) {
          toast.error("Objetivo Fase 1 debe ser mayor a 0");
          return;
        }
        if (fundingPhases === 2) {
          const t2 = parseFloat(fundingTarget2);
          if (!t2 || t2 <= 0) {
            toast.error("Objetivo Fase 2 debe ser mayor a 0");
            return;
          }
        }
      }

      const resolvedFundingCompany = fundingFirmId ? getFirmLabel(fundingFirmId) : null;

      const { data, error } = await supabase
        .from('accounts')
        .insert({
          user_id: user.id,
          account_name: accountName.trim(),
          account_type: accountType,
          asset_class: assetClass,
          initial_capital: capital,
          current_capital: capital,
          highest_balance: capital,
          funding_company: accountType !== 'personal' ? resolvedFundingCompany : null,
          funding_firm_id: accountType !== 'personal' ? (fundingFirmId || null) : null,
          funding_phases: accountType === 'evaluation' ? fundingPhases : null,
          funding_target_1: accountType === 'evaluation' ? (parseFloat(fundingTarget1) || null) : null,
          funding_target_2: accountType === 'evaluation' && fundingPhases === 2 ? (parseFloat(fundingTarget2) || null) : null,
        })
        .select('id, account_name')
        .single();

      if (error) throw error;

      // Mark onboarding as done
      localStorage.setItem('onboarding-first-account-done', 'true');

      // Move to success step
      setStep(3);

      // Invalidate and select the new account
      await queryClient.invalidateQueries({ queryKey: ['accounts'] });
      if (data) {
        setAccount(data.id);
        onAccountCreated?.(data);
      }

      toast.success("🎉 ¡Tu primera cuenta fue creada exitosamente!");
    } catch (e: any) {
      console.error(e);
      toast.error("Error al crear la cuenta");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (step === 3) {
      localStorage.setItem('onboarding-first-account-done', 'true');
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[580px] max-h-[92vh] overflow-y-auto p-0 border-border/40 bg-gradient-to-b from-card via-card to-background/95 backdrop-blur-xl shadow-2xl">

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 pt-6 pb-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  s === step
                    ? 'w-8 bg-gradient-to-r from-cyan-400 to-violet-500 shadow-[0_0_12px_rgba(0,242,255,0.4)]'
                    : s < step
                    ? 'w-2.5 bg-emerald-500'
                    : 'w-2.5 bg-border/50'
                }`}
              />
            </div>
          ))}
        </div>

        {/* ──── STEP 1: Welcome ──── */}
        {step === 1 && (
          <div className="px-6 pb-6 pt-2 text-center space-y-6">
            {/* Animated Icon */}
            <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500/20 via-violet-500/20 to-transparent animate-pulse" />
              <div className="absolute inset-2 rounded-full bg-gradient-to-br from-cyan-500/10 to-violet-500/10 backdrop-blur-sm border border-white/5" />
              <Rocket className="h-10 w-10 text-cyan-400 relative z-10 animate-bounce" style={{ animationDuration: '2s' }} />
              <Sparkles className="h-4 w-4 text-violet-400 absolute top-2 right-2 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                ¡Bienvenido a Wakeup Journal!
              </h2>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                Configuremos tu primera cuenta de trading para comenzar a registrar y analizar tus operaciones.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              {[
                { icon: "📊", label: "Dashboard en tiempo real" },
                { icon: "🧠", label: "Análisis psicológico" },
                { icon: "📈", label: "Métricas avanzadas" },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border/30 bg-muted/20 p-3 text-center space-y-1 hover:border-cyan-500/30 transition-colors"
                  style={{ animationDelay: `${i * 100}ms`, animation: 'calendarCellFadeIn 0.4s ease-out both' }}
                >
                  <span className="text-2xl">{feature.icon}</span>
                  <p className="text-[10px] text-muted-foreground leading-tight">{feature.label}</p>
                </div>
              ))}
            </div>

            <Button
              onClick={() => setStep(2)}
              className="w-full gap-2 bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white shadow-lg shadow-cyan-500/20 border-0"
              size="lg"
            >
              Configurar mi cuenta
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* ──── STEP 2: Account Setup ──── */}
        {step === 2 && (
          <div className="px-6 pb-6 pt-2 space-y-5">
            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold text-foreground">Configura tu cuenta</h2>
              <p className="text-xs text-muted-foreground">Completa los datos para registrar tu primera cuenta de trading</p>
            </div>

            <div className="grid gap-4">
              {/* Account Name */}
              <div className="grid gap-1.5">
                <Label htmlFor="onb_name" className="text-xs font-medium">Nombre de la Cuenta *</Label>
                <Input
                  id="onb_name"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Ej: Mi Cuenta FTMO"
                  className="bg-muted/30 border-border/40 focus:border-cyan-500/50"
                />
              </div>

              {/* Market */}
              <div className="grid gap-1.5">
                <Label className="text-xs font-medium">Mercado *</Label>
                <Select
                  value={assetClass}
                  onValueChange={(v) => setAssetClass(v as any)}
                >
                  <SelectTrigger className="bg-muted/30 border-border/40">
                    <SelectValue placeholder="Selecciona mercado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="futures">Futuros</SelectItem>
                    <SelectItem value="forex">Forex</SelectItem>
                    <SelectItem value="crypto">Criptomonedas</SelectItem>
                    <SelectItem value="stocks">Acciones</SelectItem>
                    <SelectItem value="other">Otros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Account Category */}
              <div className="grid gap-1.5">
                <Label className="text-xs font-medium">Categoría *</Label>
                <RadioGroup
                  value={accountType}
                  onValueChange={(v: "personal" | "evaluation" | "live") => {
                    setAccountType(v);
                    if (v === 'personal') setFundingFirmId("");
                  }}
                  className="flex flex-wrap gap-2"
                >
                  {[
                    { value: "evaluation", label: "Evaluación", icon: "🧪" },
                    { value: "live", label: "Fondeada (Live)", icon: "🏦" },
                    { value: "personal", label: "Personal", icon: "👤" },
                  ].map((opt) => (
                    <div key={opt.value} className="flex items-center space-x-1.5">
                      <RadioGroupItem value={opt.value} id={`onb_${opt.value}`} />
                      <Label htmlFor={`onb_${opt.value}`} className="text-xs cursor-pointer">
                        {opt.icon} {opt.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Funding Firm (conditional) */}
              {showFirmDropdown && (
                <div className="grid gap-1.5" style={{ animation: 'calendarCellFadeIn 0.3s ease-out both' }}>
                  <Label className="text-xs font-medium">Empresa de Fondeo *</Label>
                  <Select
                    value={fundingFirmId}
                    onValueChange={(v) => setFundingFirmId(v as FundingFirmId)}
                  >
                    <SelectTrigger className="bg-muted/30 border-border/40">
                      <SelectValue placeholder="Selecciona empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {firmList.map((firm) => (
                        <SelectItem key={firm.id} value={firm.id}>
                          {firm.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Initial Capital */}
              <div className="grid gap-1.5">
                <Label htmlFor="onb_capital" className="text-xs font-medium">Capital Inicial *</Label>
                <Input
                  id="onb_capital"
                  type="number"
                  min="0"
                  step="0.01"
                  value={initialCapital}
                  onChange={(e) => setInitialCapital(e.target.value)}
                  placeholder="Ej: 50,000"
                  className="bg-muted/30 border-border/40 focus:border-cyan-500/50"
                />
              </div>

              {/* Evaluation Phase Config */}
              {accountType === 'evaluation' && (
                <div className="space-y-3 rounded-lg border border-border/30 bg-muted/10 p-3" style={{ animation: 'calendarCellFadeIn 0.3s ease-out both' }}>
                  <div className="grid gap-1.5">
                    <Label className="text-xs font-medium">Fases de Evaluación</Label>
                    <RadioGroup
                      value={fundingPhases.toString()}
                      onValueChange={(v) => setFundingPhases(parseInt(v))}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-1.5">
                        <RadioGroupItem value="1" id="onb_phase1" />
                        <Label htmlFor="onb_phase1" className="text-xs cursor-pointer">1 Fase</Label>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <RadioGroupItem value="2" id="onb_phase2" />
                        <Label htmlFor="onb_phase2" className="text-xs cursor-pointer">2 Fases</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className={`grid gap-3 ${fundingPhases === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    <div className="grid gap-1.5">
                      <Label htmlFor="onb_target1" className="text-xs font-medium">Objetivo Fase 1 ($)</Label>
                      <Input
                        id="onb_target1"
                        type="number"
                        min="0"
                        step="0.01"
                        value={fundingTarget1}
                        onChange={(e) => setFundingTarget1(e.target.value)}
                        placeholder="Ej: 6,000"
                        className="bg-muted/30 border-border/40"
                      />
                    </div>
                    {fundingPhases === 2 && (
                      <div className="grid gap-1.5" style={{ animation: 'calendarCellFadeIn 0.3s ease-out both' }}>
                        <Label htmlFor="onb_target2" className="text-xs font-medium">Objetivo Fase 2 ($)</Label>
                        <Input
                          id="onb_target2"
                          type="number"
                          min="0"
                          step="0.01"
                          value={fundingTarget2}
                          onChange={(e) => setFundingTarget2(e.target.value)}
                          placeholder="Ej: 3,000"
                          className="bg-muted/30 border-border/40"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-1">
              <Button variant="outline" onClick={() => setStep(1)} className="gap-1.5">
                <ArrowLeft className="h-3.5 w-3.5" />
                Atrás
              </Button>
              <Button
                onClick={handleCreate}
                disabled={saving}
                className="flex-1 gap-2 bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white shadow-lg shadow-cyan-500/20 border-0"
              >
                {saving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Creando...
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4" />
                    Crear Cuenta
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ──── STEP 3: Success ──── */}
        {step === 3 && (
          <div className="px-6 pb-8 pt-4 text-center space-y-6">
            <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-500/20 via-cyan-500/15 to-transparent animate-pulse" />
              <div className="absolute inset-2 rounded-full bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/20" />
              <CheckCircle2 className="h-12 w-12 text-emerald-400 relative z-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-emerald-400">¡Todo listo!</h2>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                Tu cuenta <span className="font-semibold text-foreground">{accountName}</span> fue creada exitosamente. Ya puedes comenzar a registrar tus operaciones.
              </p>
            </div>

            <div className="space-y-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 max-w-xs mx-auto">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Mercado:</span>
                <span className="font-medium text-foreground">
                  {assetClass === 'futures' ? 'Futuros' :
                   assetClass === 'forex' ? 'Forex' :
                   assetClass === 'crypto' ? 'Criptomonedas' :
                   assetClass === 'stocks' ? 'Acciones' : 'Otros'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Tipo:</span>
                <span className="font-medium text-foreground">
                  {accountType === 'evaluation' ? 'Evaluación' :
                   accountType === 'live' ? 'Fondeada' : 'Personal'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Capital:</span>
                <span className="font-medium text-foreground">${parseFloat(initialCapital || '0').toLocaleString('en-US')}</span>
              </div>
            </div>

            <Button
              onClick={handleClose}
              className="w-full gap-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-lg shadow-emerald-500/20 border-0"
              size="lg"
            >
              Ir al Dashboard
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default WelcomeOnboardingModal;
