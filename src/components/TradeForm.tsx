import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Combobox } from "@/components/ui/combobox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Plus, AlertTriangle, Star, Upload, Link, X, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AccountFormDialog } from "@/components/AccountFormDialog";
import { useTradingPlan } from "@/hooks/useTradingPlan";
import { EntryTypeManager } from "@/components/EntryTypeManager";
import { useAccountContext } from "@/context/AccountContext";


// Lista de símbolos predefinidos
const simbolosOptions = [
  { value: "NAS100", label: "NAS100" },
  { value: "SP500", label: "SP500" },
  { value: "US30", label: "US30" },
  { value: "RTY", label: "Russell 2K" },
  { value: "XAUUSD", label: "XAUUSD" },
  { value: "EURUSD", label: "EURUSD" },
  { value: "GBPUSD", label: "GBPUSD" },
  { value: "AUDUSD", label: "AUDUSD" },
];

// Opciones para Emoción
const emocionOptions = [
  { value: "Confianza", label: "Confianza" },
  { value: "Paciencia", label: "Paciencia" },
  { value: "Euforia", label: "Euforia" },
  { value: "Neutral", label: "Neutral" },
  { value: "Ansiedad", label: "Ansiedad" },
  { value: "Miedo", label: "Miedo" },
  { value: "Frustración", label: "Frustración" },
  { value: "Venganza", label: "Venganza" },
  { value: "FOMO", label: "FOMO" },
  { value: "Duda", label: "Duda" },
  { value: "Exceso de confianza", label: "Exceso de confianza" },
];

// Entry types are now dynamic — managed by EntryTypeManager component

interface TradeFormProps {
  tradeToEdit?: any; // Trade a editar (opcional)
  onSaveSuccess?: () => void; // Callback cuando se guarda exitosamente
}

export const TradeForm = ({ tradeToEdit, onSaveSuccess }: TradeFormProps = {}) => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  // Estados para fecha y hora
  const [tradeDate, setTradeDate] = useState<Date | undefined>(new Date());
  const [entryTimeString, setEntryTimeString] = useState<string>('09:00:00');
  const [exitTimeString, setExitTimeString] = useState<string>('10:00:00');

  // Estados para notas y calificación
  const [preTradeNotes, setPreTradeNotes] = useState<string>('');
  const [postTradeNotes, setPostTradeNotes] = useState<string>('');
  const [setupRating, setSetupRating] = useState<string>(''); // Estado para Setup Rating

  // Estados para cuentas
  const [accounts, setAccounts] = useState<any[]>([]);
  const { lastSpecificAccountId, setAccount } = useAccountContext();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(lastSpecificAccountId);
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);

  // Estado para evaluación de setup compliance
  const [setupCompliance, setSetupCompliance] = useState<'full' | 'partial' | 'none'>('full');
  const [outsidePlanWarning, setOutsidePlanWarning] = useState(false);

  // Trading Plan hook
  const { plan: tradingPlan } = useTradingPlan();

  // Estados unificado para otros campos del formulario
  const [formData, setFormData] = useState({
    par: "",
    pnl_neto: "",
    riesgo: "",
    emocion: "",
    trade_type: "buy" as "buy" | "sell",
  });

  // Estados para URLs de imágenes de gráficos
  const [imageUrlM1, setImageUrlM1] = useState('');
  const [imageUrlM5, setImageUrlM5] = useState('');
  const [imageUrlM15, setImageUrlM15] = useState('');

  // Modos de entrada de imagen: 'url' | 'file'
  const [imageInputModeM1, setImageInputModeM1] = useState<'url' | 'file'>('url');
  const [imageInputModeM5, setImageInputModeM5] = useState<'url' | 'file'>('url');
  const [imageInputModeM15, setImageInputModeM15] = useState<'url' | 'file'>('url');

  // Estados de carga de archivos
  const [uploadingM1, setUploadingM1] = useState(false);
  const [uploadingM5, setUploadingM5] = useState(false);
  const [uploadingM15, setUploadingM15] = useState(false);

  // Estados para Trade del Día
  const [isTradeOfDay, setIsTradeOfDay] = useState(false);
  const [tradeOfDayImage, setTradeOfDayImage] = useState('');
  const [tradeOfDayNotes, setTradeOfDayNotes] = useState('');

  // Estado para Tipo de Entrada (multi-select)
  const [selectedEntryTypes, setSelectedEntryTypes] = useState<string[]>([]);

  // Estado para is_be (Break-Even manual flag)
  const [isBreakEven, setIsBreakEven] = useState(false);

  // --- Handlers ---
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleComboboxChange = (id: string, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleRadioChange = (value: "buy" | "sell") => {
    setFormData((prev) => ({ ...prev, trade_type: value }));
  };

  // --- Función para subir imagen a Supabase Storage ---
  const uploadImageToStorage = async (
    file: File,
    timeframe: 'M1' | 'M5' | 'M15',
    setUploading: (v: boolean) => void,
    setUrl: (url: string) => void
  ) => {
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const ext = file.name.split('.').pop();
      const fileName = `${user.id}/${timeframe}_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('trade-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('trade-images')
        .getPublicUrl(fileName);

      if (publicUrlData?.publicUrl) {
        setUrl(publicUrlData.publicUrl);
        toast.success(`Imagen ${timeframe} subida correctamente`);
      } else {
        throw new Error('No se pudo obtener la URL pública');
      }
    } catch (err: any) {
      toast.error('Error al subir la imagen: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  // --- Fin Handlers ---

  const fetchAccounts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('accounts')
      .select('id, account_name')
      .eq('user_id', user.id)
      .order('account_name');

    if (error) {
      console.error("Error fetching accounts:", error);
      toast.error("No se pudieron cargar las cuentas");
    } else {
      setAccounts(data || []);

      // Auto-select first account if not editing and no account selected
      if (!tradeToEdit && !selectedAccountId && data && data.length > 0) {
        const defaultId = lastSpecificAccountId || data[0].id;
        setSelectedAccountId(defaultId);
        setAccount(defaultId);
      }
    }
  };

  // Efecto para cargar cuentas
  useEffect(() => {
    fetchAccounts();
  }, []);


  // Efecto para cargar datos del trade a editar
  useEffect(() => {
    // Si estamos en modo EDICIÓN
    if (tradeToEdit) {
      // 1. Rellenar campos de formData
      setFormData({
        par: tradeToEdit.par || '',
        pnl_neto: tradeToEdit.pnl_neto?.toString() || '',
        riesgo: tradeToEdit.riesgo?.toString() || '',
        emocion: tradeToEdit.emocion || '',
        trade_type: tradeToEdit.trade_type || 'buy',
      });

      // 2. Rellenar estados separados (Fechas, Notas, Imágenes, Calificación)
      setTradeDate(tradeToEdit.entry_time ? new Date(tradeToEdit.entry_time) : new Date());
      setEntryTimeString(tradeToEdit.entry_time ? format(new Date(tradeToEdit.entry_time), 'HH:mm:ss') : '09:00:00');
      setExitTimeString(tradeToEdit.exit_time ? format(new Date(tradeToEdit.exit_time), 'HH:mm:ss') : '10:00:00');

      setPreTradeNotes(tradeToEdit.pre_trade_notes || '');
      setPostTradeNotes(tradeToEdit.post_trade_notes || '');
      setSetupRating(tradeToEdit.setup_rating || '');

      setImageUrlM1(tradeToEdit.image_url_m1 || '');
      setImageUrlM5(tradeToEdit.image_url_m5 || '');
      setImageUrlM15(tradeToEdit.image_url_m15 || '');

      // 3. Rellenar Dropdowns
      setSelectedAccountId(tradeToEdit.account_id || null);

      // Setup compliance
      setSetupCompliance(tradeToEdit.setup_compliance || 'full');
      setOutsidePlanWarning(tradeToEdit.is_outside_plan || false);

      // Trade del Día
      setIsTradeOfDay(tradeToEdit.is_trade_of_day || false);
      setTradeOfDayImage(tradeToEdit.trade_of_day_image || '');
      setTradeOfDayNotes(tradeToEdit.trade_of_day_notes || '');

      // Break-Even flag
      setIsBreakEven(tradeToEdit.is_be ?? false);

      // Entry Types
      setSelectedEntryTypes(tradeToEdit.entry_types || []);

    } else {
      // Lógica para resetear el formulario si estamos en modo "NUEVO TRADE"
      setFormData({
        par: '',
        pnl_neto: '',
        riesgo: '',
        emocion: '',
        trade_type: 'buy',
      });
      setTradeDate(new Date());
      setEntryTimeString('09:00:00');
      setExitTimeString('10:00:00');
      setPreTradeNotes('');
      setPostTradeNotes('');
      setSetupRating('');
      setImageUrlM1('');
      setImageUrlM5('');
      setImageUrlM15('');
      setImageInputModeM1('url');
      setImageInputModeM5('url');
      setImageInputModeM15('url');
      setSetupCompliance('full');
      setOutsidePlanWarning(false);
      setIsTradeOfDay(false);
      setTradeOfDayImage('');
      setTradeOfDayNotes('');
      setSelectedEntryTypes([]);
      setIsBreakEven(false);

      // Auto-seleccionar cuenta si hay cuentas disponibles
      if (accounts.length > 0) {
        const defaultId = lastSpecificAccountId || accounts[0].id;
        setSelectedAccountId(defaultId);
        setAccount(defaultId);
      } else {
        setSelectedAccountId(null);
      }
    }
  }, [tradeToEdit, accounts]);

  // --- handleSubmit Corregido ---
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      // Validaciones
      if (!selectedAccountId) {
        toast.error("Debes seleccionar una cuenta.");
        setLoading(false);
        return;
      }
      if (!tradeDate || !entryTimeString || !exitTimeString) {
        toast.error("Faltan datos de fecha/hora.");
        setLoading(false);
        return;
      }

      // Combinar Fechas y Horas
      const [entryHours, entryMinutes, entrySeconds] = entryTimeString.split(':').map(Number);
      const entryTimestamp = new Date(tradeDate);
      entryTimestamp.setHours(entryHours, entryMinutes, entrySeconds || 0);

      const [exitHours, exitMinutes, exitSeconds] = exitTimeString.split(':').map(Number);
      const exitTimestamp = new Date(tradeDate);
      exitTimestamp.setHours(exitHours, exitMinutes, exitSeconds || 0);
      if (exitTimestamp < entryTimestamp) {
        exitTimestamp.setDate(exitTimestamp.getDate() + 1);
      }

      // Objeto de datos comunes (lo que se va a guardar)
      const pnlValue = formData.pnl_neto === "" ? 0 : parseFloat(formData.pnl_neto);
      const riesgoValue = parseFloat(formData.riesgo) || null;

      // --- Validación contra Trading Plan ---
      // is_outside_plan is determined solely by the user's setup compliance answer.
      // Automatic plan validations only trigger warnings, they do NOT override the user's answer.
      const isOutsidePlan = setupCompliance !== 'full';

      try {
        const { data: planData } = await (supabase as any)
          .from("trading_plans")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (planData) {
          let planWarning = false;

          // Check max_trades_per_day
          if (planData.max_trades_per_day != null && !tradeToEdit) {
            const todayStr = entryTimestamp.toISOString().split('T')[0];
            const { count } = await supabase
              .from("trades")
              .select("*", { count: "exact", head: true })
              .eq("user_id", user.id)
              .gte("entry_time", todayStr + "T00:00:00")
              .lte("entry_time", todayStr + "T23:59:59");

            if ((count || 0) >= planData.max_trades_per_day) {
              planWarning = true;
            }
          }

          // Check min_rr
          if (planData.min_rr != null && riesgoValue && riesgoValue > 0) {
            const rr = pnlValue / riesgoValue;
            if (rr < planData.min_rr && pnlValue > 0) {
              planWarning = true;
            }
          }

          // Check risk_per_trade (percentage-based)
          if (planData.risk_per_trade != null && riesgoValue && riesgoValue > 0) {
            // Get account initial capital to calculate percentage
            const acct = await supabase
              .from('accounts')
              .select('initial_capital')
              .eq('id', selectedAccountId)
              .single();
            if (acct.data && acct.data.initial_capital > 0) {
              const riskPct = (riesgoValue / acct.data.initial_capital) * 100;
              if (riskPct > planData.risk_per_trade) {
                planWarning = true;
              }
            }
          }

          // Check stop_after_consecutive_losses
          if (planData.stop_after_consecutive_losses != null && !tradeToEdit) {
            const { data: recentTrades } = await supabase
              .from("trades")
              .select("pnl_neto")
              .eq("user_id", user.id)
              .order("entry_time", { ascending: false })
              .limit(planData.stop_after_consecutive_losses);

            if (recentTrades && recentTrades.length >= planData.stop_after_consecutive_losses) {
              const allLosses = recentTrades.every((t: any) => t.pnl_neto < 0);
              if (allLosses) {
                planWarning = true;
              }
            }
          }

          // Show warning if automatic validations detect issues, but do NOT change is_outside_plan
          if (planWarning && setupCompliance === 'full') {
            console.warn("Plan validation warning: Some plan rules were violated, but user confirmed full setup compliance.");
          }
        }
      } catch (planError) {
        console.error("Error validating against trading plan:", planError);
      }

      const tradeDataObject = {
        user_id: user.id,
        account_id: selectedAccountId,
        strategy_id: null,
        par: formData.par.toUpperCase() || null,
        pnl_neto: pnlValue,
        riesgo: riesgoValue,
        trade_type: formData.trade_type,
        emocion: formData.emocion || null,
        setup_rating: setupRating || null,
        entry_time: entryTimestamp.toISOString(),
        exit_time: exitTimestamp.toISOString(),
        pre_trade_notes: preTradeNotes || null,
        post_trade_notes: postTradeNotes || null,
        image_url_m1: imageUrlM1?.trim() || null,
        image_url_m5: imageUrlM5?.trim() || null,
        image_url_m15: imageUrlM15?.trim() || null,
        is_outside_plan: isOutsidePlan,
        setup_compliance: setupCompliance,
        is_trade_of_day: isTradeOfDay,
        trade_of_day_image: isTradeOfDay ? (tradeOfDayImage?.trim() || null) : null,
        trade_of_day_notes: isTradeOfDay ? (tradeOfDayNotes?.trim() || null) : null,
        entry_types: selectedEntryTypes.length > 0 ? selectedEntryTypes : null,
        is_be: isBreakEven,
      };

      let tradeId: string | number; // Para guardar el ID del trade

      if (tradeToEdit) {
        // --- MODO EDICIÓN ---
        const { data: updatedTrade, error: updateError } = await supabase
          .from('trades')
          .update(tradeDataObject)
          .eq('id', tradeToEdit.id)
          .select('id') // Pedir el ID de vuelta
          .single();

        if (updateError) throw updateError;
        tradeId = updatedTrade.id;

        // Recalcular capital y highest_balance al editar
        const oldPnl = parseFloat(tradeToEdit.pnl_neto) || 0;
        const newPnl = pnlValue;
        const pnlDelta = newPnl - oldPnl;

        if (pnlDelta !== 0) {
          const { data: accountData, error: accountError } = await supabase
            .from('accounts')
            .select('current_capital, highest_balance, initial_capital')
            .eq('id', selectedAccountId)
            .single();

          if (!accountError && accountData) {
            const currentCap = accountData.current_capital || 0;
            const initialCap = accountData.initial_capital || 0;
            const newCapital = currentCap + pnlDelta;

            const currentHighest = accountData.highest_balance ?? Math.max(currentCap, initialCap);
            const newHighestBalance = Math.max(currentHighest, newCapital);

            await supabase
              .from('accounts')
              .update({
                current_capital: newCapital,
                highest_balance: newHighestBalance
              })
              .eq('id', selectedAccountId);
          }
        }

        toast.success("Trade actualizado con éxito");

      } else {
        // --- MODO CREACIÓN ---
        const { data: newTrade, error: insertError } = await supabase
          .from('trades')
          .insert(tradeDataObject)
          .select('id')
          .single();

        if (insertError) throw insertError;
        if (!newTrade?.id) throw new Error("No se pudo crear el trade.");

        tradeId = newTrade.id;



        // Actualizar Current Capital de la cuenta
        const { data: accountData, error: accountError } = await supabase
          .from('accounts')
          .select('current_capital, highest_balance, initial_capital')
          .eq('id', selectedAccountId)
          .single();

        if (accountError) throw new Error("No se pudo obtener el capital actual de la cuenta.");

        const pnlAmount = parseFloat(formData.pnl_neto);
        const currentCap = accountData?.current_capital || 0;
        const initialCap = accountData?.initial_capital || 0;
        const newCapital = currentCap + pnlAmount;

        // Calculate new highest balance
        // Logic: Highest Balance should NEVER decrease.
        // It starts at Initial Capital.
        // It only goes up if New Capital > Current Highest.

        // 1. Determine the baseline highest (from DB or default to max(current, initial))
        const currentHighest = accountData?.highest_balance ?? Math.max(currentCap, initialCap);

        // 2. Calculate new highest (compare baseline vs new capital)
        // Ensure newHighestBalance exceeds currentHighest to trigger an update, or at least equals it.
        // STRICT HWM RULE: HWM never goes down.
        const newHighestBalance = Math.max(currentHighest, newCapital);

        // Debug info (optional, for development)
        console.log("Trailing Drawdown Debug:", {
          currentCap,
          initialCap,
          pnlAmount,
          newCapital,
          currentHighest,
          newHighestBalance,
          shouldUpdate: newHighestBalance > currentHighest
        });

        const { error: updateError } = await supabase
          .from('accounts')
          .update({
            current_capital: newCapital,
            highest_balance: newHighestBalance
          })
          .eq('id', selectedAccountId);

        if (updateError) throw new Error("Error al actualizar el capital de la cuenta.");

        toast.success("Trade registrado con éxito");
      }

      // Broken rules insertion removed

      // Éxito: Resetear formulario y refrescar datos
      queryClient.invalidateQueries({ queryKey: ["tradesList"] }); // Refresca la tabla
      queryClient.invalidateQueries({ queryKey: ["trades"] }); // Refresca la lista general
      queryClient.invalidateQueries({ queryKey: ["accounts"] }); // Refresca las cuentas (para actualizar capital y highest_balance)

      if (tradeToEdit) {
        queryClient.invalidateQueries({ queryKey: ["trades", tradeId] }); // Refresca el detalle del trade
      }

      if (onSaveSuccess) {
        onSaveSuccess(); // Llama al callback (ej. para cerrar el modal)
      } else {
        // Si es el formulario de "Nueva", resetea los campos
        setFormData({
          par: "",
          pnl_neto: "",
          riesgo: "",
          emocion: "",
          trade_type: "buy",
        });
        setTradeDate(new Date());
        setEntryTimeString('09:00:00');
        setExitTimeString('10:00:00');
        setPreTradeNotes('');
        setPostTradeNotes('');
        setSetupRating('');
        setImageUrlM1('');
        setImageUrlM5('');
        setImageUrlM15('');
        setImageInputModeM1('url');
        setImageInputModeM5('url');
        setImageInputModeM15('url');
        setSetupCompliance('full');
        setOutsidePlanWarning(false);
        setIsTradeOfDay(false);
        setTradeOfDayImage('');
        setTradeOfDayNotes('');
        setSelectedEntryTypes([]);
        setIsBreakEven(false);

        // Mantener la cuenta seleccionada o seleccionar la primera
        if (accounts.length > 0) {
          const defaultId = lastSpecificAccountId || accounts[0].id;
          setSelectedAccountId(defaultId);
          setAccount(defaultId);
        } else {
          setSelectedAccountId(null);
        }
      }

    } catch (error: any) {
      toast.error("Error al guardar la operación: " + error.message);
      console.error("Error detallado:", error);
    } finally {
      setLoading(false);
    }
  };
  // --- Fin handleSubmit ---


  // --- JSX del Componente ---
  return (
    <div className="relative animate-in fade-in-0 duration-300">
      {/* Glow ambiental detrás de la card */}
      <div
        className="pointer-events-none absolute -inset-6 rounded-3xl opacity-60"
        style={{ background: 'radial-gradient(ellipse 55% 40% at 25% 50%, rgba(139,92,246,0.07), transparent), radial-gradient(ellipse 45% 55% at 75% 30%, rgba(6,182,212,0.05), transparent)' }}
        aria-hidden
      />

      <Card className="relative border-border/60 shadow-[0_0_60px_-20px_rgba(120,80,220,0.12)] overflow-hidden">
        {/* Línea de acento superior */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" aria-hidden />

        <CardHeader className="pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-violet-500/25 bg-gradient-to-br from-violet-500/15 to-cyan-500/8">
              <Plus className="h-4 w-4 text-violet-400" />
            </div>
            <div>
              <CardTitle className="text-xl">{tradeToEdit ? "Editar Operación" : "Registrar Operación"}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Los campos marcados con * son requeridos</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-0">

              {/* ── Columna Izquierda: datos del trade ── */}
              <div className="space-y-5 lg:pr-8 lg:border-r lg:border-border/40">
                <div className="flex items-center gap-2.5 pb-3 border-b border-border/40">
                  <div className="h-4 w-0.5 rounded-full bg-gradient-to-b from-violet-400 to-cyan-400 shrink-0" />
                  <span className="text-sm font-semibold text-foreground/80">Datos del Trade</span>
                </div>

                {/* Cuenta */}
                <div className="space-y-2">
                  <Label htmlFor="account-select" className="text-sm font-medium">Cuenta *</Label>
                  <div className="flex items-center gap-2">
                    <Select
                      value={selectedAccountId || ""}
                      onValueChange={(value) => { setSelectedAccountId(value); setAccount(value); }}
                      required
                    >
                      <SelectTrigger id="account-select" className="flex-grow transition-all duration-200 focus:ring-violet-500/30 focus:border-violet-500/40">
                        <SelectValue placeholder="Seleccionar cuenta..." />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>{account.account_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setIsAccountDialogOpen(true)}
                      aria-label="Añadir nueva cuenta"
                      className="shrink-0 transition-all duration-200 hover:border-violet-500/40 hover:bg-violet-500/5"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Fecha y Horas */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="trade-date" className="text-sm font-medium">Fecha</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" id="trade-date" className="w-full justify-start text-left font-normal text-sm transition-all duration-200 hover:border-violet-500/40 px-3">
                          <CalendarIcon className="mr-1.5 h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          {tradeDate ? format(tradeDate, "dd/MM/yy") : <span className="text-muted-foreground">Fecha</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={tradeDate} onSelect={setTradeDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="entry-time" className="text-sm font-medium">Entrada</Label>
                    <Input id="entry-time" type="time" step="1" value={entryTimeString} onChange={(e) => setEntryTimeString(e.target.value)} required className="transition-all duration-200 focus-visible:ring-violet-500/30 focus-visible:border-violet-500/40 focus-visible:shadow-[0_0_12px_-3px_rgba(139,92,246,0.2)]" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exit-time" className="text-sm font-medium">Salida</Label>
                    <Input id="exit-time" type="time" step="1" value={exitTimeString} onChange={(e) => setExitTimeString(e.target.value)} required className="transition-all duration-200 focus-visible:ring-violet-500/30 focus-visible:border-violet-500/40 focus-visible:shadow-[0_0_12px_-3px_rgba(139,92,246,0.2)]" />
                  </div>
                </div>

                {/* Par y PnL */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="par" className="text-sm font-medium">Par</Label>
                    <Combobox options={simbolosOptions} value={formData.par} onChange={(value) => handleComboboxChange('par', value)} placeholder="Seleccionar par..." emptyMessage="No se encontraron pares." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pnl_neto" className="text-sm font-medium">Resultado final *</Label>
                    <Input id="pnl_neto" type="number" step="0.01" placeholder="0.00" value={formData.pnl_neto} onChange={handleInputChange} required className="bg-secondary transition-all duration-200 focus-visible:ring-violet-500/30 focus-visible:border-violet-500/40 focus-visible:shadow-[0_0_12px_-3px_rgba(139,92,246,0.2)]" />
                    <div className="p-3 rounded-lg border border-border/50 bg-muted/15 space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="is-be-switch" className="text-xs font-medium cursor-pointer text-muted-foreground">Break-Even (BE)</Label>
                        <Switch id="is-be-switch" checked={isBreakEven} onCheckedChange={setIsBreakEven} className="data-[state=checked]:bg-slate-500 scale-90" />
                      </div>
                      {isBreakEven && (
                        <p className="text-xs text-muted-foreground leading-relaxed animate-in fade-in-0 slide-in-from-top-1 duration-200">
                          No contará en estadísticas.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dirección — segmented control */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Dirección</Label>
                  <div className="flex h-11 rounded-xl border border-border overflow-hidden">
                    <button
                      type="button"
                      onClick={() => handleRadioChange("buy")}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 text-sm font-semibold transition-all duration-200",
                        formData.trade_type === "buy"
                          ? "bg-emerald-500/15 text-emerald-400 shadow-[inset_0_0_20px_-4px_rgba(52,211,153,0.2)]"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                      )}
                    >
                      <ArrowUp className="h-4 w-4" />
                      Compra
                    </button>
                    <div className="w-px bg-border/60 shrink-0" />
                    <button
                      type="button"
                      onClick={() => handleRadioChange("sell")}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 text-sm font-semibold transition-all duration-200",
                        formData.trade_type === "sell"
                          ? "bg-rose-500/15 text-rose-400 shadow-[inset_0_0_20px_-4px_rgba(244,63,94,0.2)]"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                      )}
                    >
                      <ArrowDown className="h-4 w-4" />
                      Venta
                    </button>
                  </div>
                </div>

                {/* Riesgo y RR */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="riesgo" className="text-sm font-medium">Riesgo ($) *</Label>
                    <Input id="riesgo" type="number" step="0.01" placeholder="Ej. 100" value={formData.riesgo} onChange={handleInputChange} required className="transition-all duration-200 focus-visible:ring-violet-500/30 focus-visible:border-violet-500/40 focus-visible:shadow-[0_0_12px_-3px_rgba(139,92,246,0.2)]" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rr-calculated" className="text-sm font-medium">RR Calculado</Label>
                    <Input
                      id="rr-calculated"
                      type="text"
                      value={(() => {
                        const risk = parseFloat(formData.riesgo);
                        const pnl = parseFloat(formData.pnl_neto);
                        if (risk > 0 && !isNaN(pnl)) return `1 : ${(pnl / risk).toFixed(2)}`;
                        return 'N/A';
                      })()}
                      readOnly
                      className={cn(
                        "bg-secondary/50 border-dashed text-center font-mono text-sm transition-colors duration-200",
                        (() => {
                          const risk = parseFloat(formData.riesgo);
                          const pnl = parseFloat(formData.pnl_neto);
                          if (risk > 0 && !isNaN(pnl)) {
                            const r = pnl / risk;
                            if (r >= 1.5) return "text-emerald-400";
                            if (r > 0) return "text-yellow-400";
                            return "text-rose-400";
                          }
                          return "text-muted-foreground";
                        })()
                      )}
                    />
                  </div>
                </div>

                {/* Evaluación del Setup */}
                {tradingPlan && (
                  <div className="space-y-3 p-4 rounded-xl border border-border/60 bg-muted/10">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🧠</span>
                      <span className="text-sm font-semibold">Evaluación del Setup</span>
                    </div>
                    {tradingPlan.setup_rules?.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Setup: <span className="font-medium text-foreground">{tradingPlan.setup_rules[0].name}</span>
                      </p>
                    )}
                    <div className="space-y-1.5">
                      {[
                        { value: 'full', label: 'Sí, cumple completamente', emoji: '✔️', on: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' },
                        { value: 'partial', label: 'Parcialmente', emoji: '⚠️', on: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400' },
                        { value: 'none', label: 'No cumple', emoji: '❌', on: 'border-rose-500/40 bg-rose-500/10 text-rose-400' },
                      ].map(({ value, label, emoji, on }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => { setSetupCompliance(value as 'full' | 'partial' | 'none'); setOutsidePlanWarning(value !== 'full'); }}
                          className={cn(
                            "w-full flex items-center gap-3 p-2.5 rounded-lg border text-sm font-medium transition-all duration-200",
                            setupCompliance === value ? on : "border-transparent text-muted-foreground hover:border-border/60 hover:bg-muted/30"
                          )}
                        >
                          <span>{emoji}</span>
                          {label}
                        </button>
                      ))}
                    </div>
                    {outsidePlanWarning && (
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-yellow-500/8 border border-yellow-500/25 animate-in fade-in-0 slide-in-from-top-1 duration-200">
                        <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
                        <p className="text-xs text-yellow-400">Trade fuera del plan de trading.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Emoción */}
                <div className="space-y-2">
                  <Label htmlFor="emocion" className="text-sm font-medium">Emoción al operar</Label>
                  <Combobox options={emocionOptions} value={formData.emocion} onChange={(value) => handleComboboxChange('emocion', value)} placeholder="Seleccionar emoción..." emptyMessage="No se encontraron emociones." />
                </div>

                {/* Calificación del Setup */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Calificación del Setup</Label>
                  <ToggleGroup type="single" value={setupRating} onValueChange={(value) => { if (value) setSetupRating(value); }} className="grid grid-cols-5 gap-1.5">
                    {[
                      { label: 'Malo',      active: 'data-[state=on]:bg-rose-500/15 data-[state=on]:border-rose-500/50 data-[state=on]:text-rose-400 data-[state=on]:shadow-[0_0_12px_-2px_rgba(244,63,94,0.35)]' },
                      { label: 'Regular',   active: 'data-[state=on]:bg-orange-500/15 data-[state=on]:border-orange-500/50 data-[state=on]:text-orange-400 data-[state=on]:shadow-[0_0_12px_-2px_rgba(249,115,22,0.35)]' },
                      { label: 'Aceptable', active: 'data-[state=on]:bg-yellow-500/15 data-[state=on]:border-yellow-500/50 data-[state=on]:text-yellow-400 data-[state=on]:shadow-[0_0_12px_-2px_rgba(234,179,8,0.35)]' },
                      { label: 'Bueno',     active: 'data-[state=on]:bg-lime-500/15 data-[state=on]:border-lime-500/50 data-[state=on]:text-lime-400 data-[state=on]:shadow-[0_0_12px_-2px_rgba(132,204,22,0.35)]' },
                      { label: 'Excelente', active: 'data-[state=on]:bg-emerald-500/15 data-[state=on]:border-emerald-500/50 data-[state=on]:text-emerald-400 data-[state=on]:shadow-[0_0_14px_-2px_rgba(52,211,153,0.45)]' },
                    ].map(({ label, active }) => (
                      <ToggleGroupItem
                        key={label}
                        value={label}
                        aria-label={`Calificación ${label}`}
                        className={cn(
                          "h-11 w-full p-1 border border-neutral-700/60 bg-neutral-900/60 text-xs font-semibold text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300 hover:border-neutral-600 transition-all duration-200 rounded-lg",
                          active
                        )}
                      >
                        {label}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>

                {/* Tipo de Entrada */}
                <EntryTypeManager selectedTypes={selectedEntryTypes} onSelectionChange={setSelectedEntryTypes} />
              </div>

              {/* ── Columna Derecha: análisis, imágenes y trade del día ── */}
              <div className="space-y-5 lg:pl-8">
                <div className="flex items-center gap-2.5 pb-3 border-b border-border/40">
                  <div className="h-4 w-0.5 rounded-full bg-gradient-to-b from-cyan-400 to-violet-400 shrink-0" />
                  <span className="text-sm font-semibold text-foreground/80">Análisis & Contexto</span>
                </div>

                {/* Notas Pre y Post Trade */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Pre & Post Trade</Label>
                  <div className="space-y-2 p-4 rounded-xl border border-neutral-800/80 bg-neutral-950/40 transition-all duration-200 focus-within:border-violet-500/30 focus-within:shadow-[0_0_20px_-6px_rgba(139,92,246,0.15)]">
                    <Label htmlFor="pre-trade-notes" className="text-sm font-medium text-violet-400">Análisis Pre-Trade</Label>
                    <Textarea id="pre-trade-notes" placeholder="¿Por qué estoy tomando este trade? ¿Qué confirmaciones veo?" value={preTradeNotes} onChange={(e) => setPreTradeNotes(e.target.value)} className="bg-transparent border-0 p-0 focus:ring-0 focus-visible:ring-offset-0 focus-visible:ring-0 min-h-[100px] text-sm resize-none" />
                  </div>
                  <div className="space-y-2 p-4 rounded-xl border border-neutral-800/80 bg-neutral-950/40 transition-all duration-200 focus-within:border-cyan-500/30 focus-within:shadow-[0_0_20px_-6px_rgba(6,182,212,0.12)]">
                    <Label htmlFor="post-trade-notes" className="text-sm font-medium text-cyan-400">Reflexión Post-Trade</Label>
                    <Textarea id="post-trade-notes" placeholder="¿Qué salió bien/mal? ¿Seguí el plan? ¿Cómo me sentí?" value={postTradeNotes} onChange={(e) => setPostTradeNotes(e.target.value)} className="bg-transparent border-0 p-0 focus:ring-0 focus-visible:ring-offset-0 focus-visible:ring-0 min-h-[100px] text-sm resize-none" />
                  </div>
                </div>

                {/* Imágenes de Gráficos */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Imágenes de Gráficos</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { label: 'M1', url: imageUrlM1, setUrl: setImageUrlM1, mode: imageInputModeM1, setMode: setImageInputModeM1, uploading: uploadingM1, setUploading: setUploadingM1, timeframe: 'M1' as const },
                      { label: 'M5', url: imageUrlM5, setUrl: setImageUrlM5, mode: imageInputModeM5, setMode: setImageInputModeM5, uploading: uploadingM5, setUploading: setUploadingM5, timeframe: 'M5' as const },
                      { label: 'M15', url: imageUrlM15, setUrl: setImageUrlM15, mode: imageInputModeM15, setMode: setImageInputModeM15, uploading: uploadingM15, setUploading: setUploadingM15, timeframe: 'M15' as const },
                    ]).map(({ label, url, setUrl, mode, setMode, uploading, setUploading, timeframe }) => (
                      <div key={label} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-semibold text-muted-foreground">{label}</Label>
                          <div className="flex items-center gap-0.5 bg-neutral-800/80 rounded p-0.5">
                            <button type="button" onClick={() => setMode('url')} className={cn("flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors", mode === 'url' ? 'bg-violet-600/80 text-white' : 'text-muted-foreground hover:text-foreground')}>
                              <Link className="h-2.5 w-2.5" />URL
                            </button>
                            <button type="button" onClick={() => setMode('file')} className={cn("flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors", mode === 'file' ? 'bg-violet-600/80 text-white' : 'text-muted-foreground hover:text-foreground')}>
                              <Upload className="h-2.5 w-2.5" />File
                            </button>
                          </div>
                        </div>

                        {mode === 'url' && (
                          <Input id={`image_url_${label.toLowerCase()}`} type="url" placeholder={`Enlace ${label}...`} value={url} onChange={(e) => setUrl(e.target.value)} className="bg-secondary text-xs h-8 transition-all duration-200 focus-visible:ring-violet-500/30 focus-visible:border-violet-500/40" />
                        )}

                        {mode === 'file' && (
                          <div className="space-y-2">
                            <label htmlFor={`file_upload_${label.toLowerCase()}`} className={cn("flex flex-col items-center justify-center w-full h-20 rounded-lg border-2 border-dashed transition-all duration-200 cursor-pointer", uploading ? 'border-violet-500/40 bg-violet-500/5' : 'border-neutral-700 bg-neutral-900/60 hover:border-violet-500/40 hover:bg-violet-500/5')}>
                              {uploading ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-violet-400/40 border-t-violet-400" />
                              ) : (
                                <div className="flex flex-col items-center gap-0.5">
                                  <Upload className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-[9px] text-muted-foreground">Subir imagen</span>
                                </div>
                              )}
                              <input id={`file_upload_${label.toLowerCase()}`} type="file" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" className="hidden" disabled={uploading} onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadImageToStorage(file, timeframe, setUploading, setUrl); e.target.value = ''; }} />
                            </label>
                            {url && (
                              <div className="relative group rounded-lg overflow-hidden border border-neutral-700">
                                <img src={url} alt={`Preview ${label}`} className="w-full h-20 object-cover" />
                                <button type="button" onClick={() => setUrl('')} className="absolute top-1 right-1 bg-black/70 hover:bg-black/90 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-3 w-3" /></button>
                              </div>
                            )}
                          </div>
                        )}

                        {mode === 'url' && url && (
                          <div className="relative group rounded-lg overflow-hidden border border-neutral-700/80">
                            <img src={url} alt={`Preview ${label}`} className="w-full h-16 object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            <button type="button" onClick={() => setUrl('')} className="absolute top-1 right-1 bg-black/70 hover:bg-black/90 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-3 w-3" /></button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trade del Día */}
                <div className={cn(
                  "space-y-3 p-4 rounded-xl border transition-all duration-300",
                  isTradeOfDay ? "border-yellow-500/30 bg-yellow-500/5 shadow-[0_0_20px_-8px_rgba(234,179,8,0.25)]" : "border-border/60 bg-muted/10"
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Star className={cn(
                        "h-5 w-5 transition-all duration-300",
                        isTradeOfDay ? "text-yellow-400 fill-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.6)]" : "text-muted-foreground"
                      )} />
                      <div>
                        <Label className="text-sm font-semibold cursor-pointer" htmlFor="trade-of-day-switch">Trade del Día</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">¿Un trade destacado que no tomaste?</p>
                      </div>
                    </div>
                    <Switch id="trade-of-day-switch" checked={isTradeOfDay} onCheckedChange={setIsTradeOfDay} />
                  </div>

                  {isTradeOfDay && (
                    <div className="space-y-3 pt-1 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                      <div className="space-y-1.5">
                        <Label htmlFor="trade_of_day_image" className="text-xs font-medium text-muted-foreground">Imagen del Trade</Label>
                        <Input id="trade_of_day_image" type="url" placeholder="Pegar enlace a la imagen..." value={tradeOfDayImage} onChange={(e) => setTradeOfDayImage(e.target.value)} className="bg-secondary text-sm transition-all duration-200 focus-visible:ring-yellow-500/30 focus-visible:border-yellow-500/40" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="trade_of_day_notes" className="text-xs font-medium text-muted-foreground">¿Por qué es tu Trade del Día?</Label>
                        <Textarea id="trade_of_day_notes" placeholder="Explica brevemente por qué destacás esta operación..." value={tradeOfDayNotes} onChange={(e) => setTradeOfDayNotes(e.target.value)} className="bg-transparent border border-neutral-700/80 min-h-[70px] text-sm resize-none" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full text-base font-semibold py-6 mt-2 border-0 text-white bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 shadow-[0_4px_20px_-6px_rgba(120,80,220,0.5)] hover:shadow-[0_6px_28px_-4px_rgba(120,80,220,0.65)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Guardando...
                </div>
              ) : (
                tradeToEdit ? "Actualizar Operación" : "Registrar Operación"
              )}
            </Button>
          </form>

        <AccountFormDialog
          isOpen={isAccountDialogOpen}
          onOpenChange={setIsAccountDialogOpen}
          onSaveSuccess={(newAccount) => {
            fetchAccounts();
            if (newAccount?.id) setSelectedAccountId(newAccount.id);
            setIsAccountDialogOpen(false);
          }}
        />


      </CardContent>
    </Card>
  </div>
  );
};

export default TradeForm;
