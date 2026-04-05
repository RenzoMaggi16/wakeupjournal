import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { getFirmsByMarket, getFirmLabel, marketHasFirms, type FundingFirmId } from "@/utils/firmConfig";

interface AccountFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveSuccess?: (newAccount?: { id: string; account_name: string }) => void;
}

export function AccountFormDialog({ isOpen, onOpenChange, onSaveSuccess }: AccountFormDialogProps) {
  const [saving, setSaving] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [assetClass, setAssetClass] = useState<'futures' | 'forex' | 'crypto' | 'stocks' | 'other'>("futures");
  const [accountType, setAccountType] = useState<'personal' | 'evaluation' | 'live'>("personal");
  const [fundingFirmId, setFundingFirmId] = useState<FundingFirmId | "">("");
  const [initialCapital, setInitialCapital] = useState("");
  const [fundingPhases, setFundingPhases] = useState(1);
  const [fundingTarget1, setFundingTarget1] = useState("");
  const [fundingTarget2, setFundingTarget2] = useState("");

  // Determine if the funding firm dropdown should be visible
  const showFirmDropdown =
    marketHasFirms(assetClass) && (accountType === 'evaluation' || accountType === 'live');

  // Get filtered firms for the current market
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

      // Validation: firm required for evaluation / live with firm markets
      if (showFirmDropdown && !fundingFirmId) {
        toast.error("Selecciona una empresa de fondeo");
        return;
      }

      // Validation for evaluation phases
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

      // Resolve funding_company from firm selection
      const resolvedFundingCompany = fundingFirmId
        ? getFirmLabel(fundingFirmId)
        : null;

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

      toast.success("Cuenta creada correctamente");
      onSaveSuccess?.(data || undefined);
      onOpenChange(false);
      // Reset
      setAccountName("");
      setInitialCapital("");
      setAssetClass('futures');
      setAccountType('personal');
      setFundingFirmId("");
      setFundingPhases(1);
      setFundingTarget1("");
      setFundingTarget2("");
    } catch (e: any) {
      console.error(e);
      toast.error("Error al crear la cuenta");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Cuenta</DialogTitle>
          <DialogDescription>Crea rápidamente una cuenta para registrar tu operación.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          {/* Account Name */}
          <div className="grid gap-2">
            <Label htmlFor="account_name_quick">Nombre de la Cuenta *</Label>
            <Input id="account_name_quick" value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Ej: Cuenta Rápida" />
          </div>

          {/* Step 1: Market Selection */}
          <div className="grid gap-2">
            <Label htmlFor="asset_class_quick">Mercado *</Label>
            <Select
              value={assetClass}
              onValueChange={(v) => setAssetClass(v as any)}
            >
              <SelectTrigger id="asset_class_quick">
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

          {/* Step 2: Account Category */}
          <div className="grid gap-2">
            <Label>Categoría de Cuenta *</Label>
            <RadioGroup
              value={accountType}
              onValueChange={(v: "personal" | "evaluation" | "live") => {
                setAccountType(v);
                if (v === 'personal') setFundingFirmId("");
              }}
              className="flex flex-wrap gap-2 sm:gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="evaluation" id="eval_quick" />
                <Label htmlFor="eval_quick">Evaluación</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="live" id="live_quick" />
                <Label htmlFor="live_quick">Fondeada (Live)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="personal" id="personal_quick" />
                <Label htmlFor="personal_quick">Personal</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Step 3: Conditional Funding Firm (market-filtered) */}
          {showFirmDropdown && (
            <div className="grid gap-2">
              <Label htmlFor="funding_firm_quick">Empresa de Fondeo *</Label>
              <Select
                value={fundingFirmId}
                onValueChange={(v) => setFundingFirmId(v as FundingFirmId)}
              >
                <SelectTrigger id="funding_firm_quick">
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

          {/* Capital Inicial */}
          <div className="grid gap-2">
            <Label htmlFor="initial_capital_quick">Capital Inicial *</Label>
            <Input
              id="initial_capital_quick"
              type="number"
              min="0"
              step="0.01"
              value={initialCapital}
              onChange={(e) => setInitialCapital(e.target.value)}
              placeholder="Ej: 50,000"
            />
          </div>

          {/* Evaluation Phase Config */}
          {accountType === 'evaluation' && (
            <div className="space-y-3 rounded-lg border border-border/30 bg-muted/10 p-3">
              <div className="grid gap-2">
                <Label>Fases de Evaluación</Label>
                <RadioGroup
                  value={fundingPhases.toString()}
                  onValueChange={(v) => setFundingPhases(parseInt(v))}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1" id="quick_fase1" />
                    <Label htmlFor="quick_fase1">1 Fase</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="2" id="quick_fase2" />
                    <Label htmlFor="quick_fase2">2 Fases</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className={`grid gap-3 ${fundingPhases === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                <div className="grid gap-2">
                  <Label htmlFor="quick_target1">Objetivo Fase 1 ($)</Label>
                  <Input
                    id="quick_target1"
                    type="number"
                    min="0"
                    step="0.01"
                    value={fundingTarget1}
                    onChange={(e) => setFundingTarget1(e.target.value)}
                    placeholder="Ej: 6,000"
                  />
                </div>
                {fundingPhases === 2 && (
                  <div className="grid gap-2">
                    <Label htmlFor="quick_target2">Objetivo Fase 2 ($)</Label>
                    <Input
                      id="quick_target2"
                      type="number"
                      min="0"
                      step="0.01"
                      value={fundingTarget2}
                      onChange={(e) => setFundingTarget2(e.target.value)}
                      placeholder="Ej: 3,000"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleCreate} disabled={saving}>{saving ? 'Creando...' : 'Crear'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AccountFormDialog;
