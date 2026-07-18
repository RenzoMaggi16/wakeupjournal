import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import {
  BookOpen, Image as ImageIcon, Newspaper, Sparkles, Maximize2, Minimize2,
  Search, Upload, X, Pencil, TrendingUp, TrendingDown, Minus,
} from "lucide-react";
import { toast } from "sonner";
import { useDailyRecap, uploadRecapImage, type DailyRecapInsert, type RecapImageSlot } from "@/hooks/useDailyRecap";

type FormState = Omit<DailyRecapInsert, "user_id" | "recap_date">;

const emptyForm: FormState = {
  session_bias_pre: "",
  session_bias_post: "",
  key_levels: "",
  had_news: false,
  news_notes: "",
  image_url_m1: "",
  image_url_m5: "",
  image_url_m15: "",
  image_url_trade1: "",
  image_url_trade2: "",
  image_url_trade3: "",
  followed_plan: null,
  emotional_state: "",
  lessons_learned: "",
  notes_for_tomorrow: "",
};

interface DailyRecapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  userId?: string;
}

interface DayTradeSummary {
  id: string;
  pnl_neto: number;
}

function useDayTradesSummary(userId: string | undefined, date: Date | null) {
  return useQuery({
    queryKey: ["recap_day_trades", userId, date ? format(date, "yyyy-MM-dd") : null],
    queryFn: async () => {
      if (!userId || !date) return [];
      const { data, error } = await supabase
        .from("trades")
        .select("id, pnl_neto, entry_time")
        .eq("user_id", userId);
      if (error) throw error;
      return ((data as any[]) || []).filter((t) => t.entry_time && isSameDay(new Date(t.entry_time), date)) as DayTradeSummary[];
    },
    enabled: !!userId && !!date,
  });
}

export const DailyRecapModal = ({ open, onOpenChange, date, userId }: DailyRecapModalProps) => {
  const { recap, upsertRecap } = useDailyRecap(userId, date);
  const { data: dayTrades = [] } = useDayTradesSummary(userId, date);

  const [mode, setMode] = useState<"empty" | "view" | "edit">("empty");
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("contexto");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<Record<RecapImageSlot, boolean>>({
    M1: false, M5: false, M15: false, TRADE1: false, TRADE2: false, TRADE3: false,
  });
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (recap) {
      setMode("view");
      setForm({
        session_bias_pre: recap.session_bias_pre || "",
        session_bias_post: recap.session_bias_post || "",
        key_levels: recap.key_levels || "",
        had_news: recap.had_news || false,
        news_notes: recap.news_notes || "",
        image_url_m1: recap.image_url_m1 || "",
        image_url_m5: recap.image_url_m5 || "",
        image_url_m15: recap.image_url_m15 || "",
        image_url_trade1: recap.image_url_trade1 || "",
        image_url_trade2: recap.image_url_trade2 || "",
        image_url_trade3: recap.image_url_trade3 || "",
        followed_plan: recap.followed_plan,
        emotional_state: recap.emotional_state || "",
        lessons_learned: recap.lessons_learned || "",
        notes_for_tomorrow: recap.notes_for_tomorrow || "",
      });
    } else {
      setMode("empty");
      setForm(emptyForm);
    }
    setActiveTab("contexto");
  }, [recap, open, date]);

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) setExpanded(false);
    onOpenChange(isOpen);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await upsertRecap.mutateAsync(form);
      toast.success("Recap guardado");
      setMode("view");
    } catch (err: any) {
      toast.error("Error al guardar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (slot: RecapImageSlot, file: File) => {
    if (!userId || !date) return;
    setUploading((u) => ({ ...u, [slot]: true }));
    try {
      const url = await uploadRecapImage(userId, date, slot, file);
      setForm((f) => ({ ...f, [`image_url_${slot.toLowerCase()}`]: url }));
      toast.success(`Imagen subida`);
    } catch (err: any) {
      toast.error("Error al subir la imagen: " + err.message);
    } finally {
      setUploading((u) => ({ ...u, [slot]: false }));
    }
  };

  const renderImageField = (slot: RecapImageSlot, label: string) => {
    const key = `image_url_${slot.toLowerCase()}` as keyof FormState;
    const url = form[key] as string;
    return (
      <div key={slot} className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        {url ? (
          <div className="relative rounded-md overflow-hidden border border-border bg-neutral-900 aspect-video group">
            <img src={url} alt={label} className="w-full h-full object-cover" />
            <button
              onClick={() => setLightboxUrl(url)}
              className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <Search className="h-4 w-4 text-white" />
            </button>
            <button
              onClick={() => setForm((f) => ({ ...f, [key]: "" }))}
              className="absolute top-1 right-1 bg-black/70 rounded-full p-0.5 text-white hover:bg-red-500/80"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-20 rounded-lg border-2 border-dashed border-neutral-700 bg-neutral-900/60 hover:border-violet-500/40 hover:bg-violet-500/5 transition-all duration-200 cursor-pointer">
            {uploading[slot] ? (
              <span className="h-4 w-4 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
            ) : (
              <>
                <Upload className="h-4 w-4 text-muted-foreground mb-1" />
                <span className="text-[10px] text-muted-foreground">Subir imagen</span>
              </>
            )}
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              className="hidden"
              disabled={uploading[slot]}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(slot, file);
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>
    );
  };

  const dayPnL = dayTrades.reduce((sum, t) => sum + Number(t.pnl_neto), 0);
  const winCount = dayTrades.filter((t) => Number(t.pnl_neto) > 0).length;
  const winRate = dayTrades.length > 0 ? (winCount / dayTrades.length) * 100 : 0;

  const title = date ? format(date, "EEEE d 'de' MMMM, yyyy", { locale: es }) : "";

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent
          className={`overflow-y-auto transition-all duration-200 ${
            expanded ? "sm:max-w-[95vw] max-h-[92vh]" : "sm:max-w-[640px] max-h-[85vh]"
          }`}
        >
          <DialogHeader>
            <div className="flex items-center justify-between gap-2">
              <DialogTitle className="capitalize">{title}</DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 mr-6 text-muted-foreground hover:text-foreground"
                onClick={() => setExpanded((e) => !e)}
                title={expanded ? "Reducir" : "Expandir"}
              >
                {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          </DialogHeader>

          {/* Performance del día — resumen de solo lectura */}
          {dayTrades.length > 0 && (
            <div className="flex items-center justify-between rounded-lg bg-muted/30 border border-border/40 px-4 py-2.5">
              <span className="text-xs text-muted-foreground">
                {dayTrades.length} {dayTrades.length === 1 ? "trade" : "trades"} · {winRate.toFixed(0)}% winrate
              </span>
              <span className={`text-sm font-bold flex items-center gap-1 ${dayPnL > 0 ? "text-emerald-400" : dayPnL < 0 ? "text-red-400" : "text-neutral-400"}`}>
                {dayPnL > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : dayPnL < 0 ? <TrendingDown className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                {dayPnL > 0 ? "+" : ""}
                {dayPnL.toLocaleString("en-US", { style: "currency", currency: "USD" })}
              </span>
            </div>
          )}

          {mode === "empty" && (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <BookOpen className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground max-w-xs">
                Todavía no cargaste el recap de este día.
              </p>
              <Button onClick={() => setMode("edit")} className="gap-2">
                <Pencil className="h-4 w-4" />
                Agregar recap
              </Button>
            </div>
          )}

          {mode === "view" && recap && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <SummaryField label="Bias pre-mercado" value={recap.session_bias_pre} />
                <SummaryField label="Bias real" value={recap.session_bias_post} />
              </div>
              {recap.key_levels && <SummaryField label="Niveles clave" value={recap.key_levels} block />}
              {recap.had_news && <SummaryField label="Noticias" value={recap.news_notes || "Hubo noticias"} block />}

              {(recap.image_url_m1 || recap.image_url_m5 || recap.image_url_m15) && (
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                    <ImageIcon className="h-3 w-3" />
                    Imágenes
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {(["m1", "m5", "m15"] as const).map((tf) => {
                      const url = (recap as any)[`image_url_${tf}`];
                      if (!url) return null;
                      return (
                        <button
                          key={tf}
                          onClick={() => setLightboxUrl(url)}
                          className="relative rounded-md overflow-hidden border border-border bg-neutral-900 aspect-video group"
                        >
                          <img src={url} alt={tf.toUpperCase()} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <Search className="h-4 w-4 text-white" />
                          </div>
                          <span className="absolute bottom-1 left-1 text-[8px] font-bold bg-black/70 px-1 py-0.5 rounded text-white z-10">{tf.toUpperCase()}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {(recap.image_url_trade1 || recap.image_url_trade2 || recap.image_url_trade3) && (
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                    <ImageIcon className="h-3 w-3" />
                    Trades ideales de la sesión
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {(["trade1", "trade2", "trade3"] as const).map((tf, i) => {
                      const url = (recap as any)[`image_url_${tf}`];
                      if (!url) return null;
                      return (
                        <button
                          key={tf}
                          onClick={() => setLightboxUrl(url)}
                          className="relative rounded-md overflow-hidden border border-border bg-neutral-900 aspect-video group"
                        >
                          <img src={url} alt={`Trade ${i + 1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <Search className="h-4 w-4 text-white" />
                          </div>
                          <span className="absolute bottom-1 left-1 text-[8px] font-bold bg-black/70 px-1 py-0.5 rounded text-white z-10">Trade {i + 1}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <SummaryField
                  label="¿Seguiste el plan?"
                  value={recap.followed_plan === true ? "Sí" : recap.followed_plan === false ? "No" : "—"}
                />
                <SummaryField label="Estado emocional" value={recap.emotional_state} />
              </div>
              {recap.lessons_learned && <SummaryField label="Lecciones aprendidas" value={recap.lessons_learned} block />}
              {recap.notes_for_tomorrow && <SummaryField label="Notas para mañana" value={recap.notes_for_tomorrow} block />}

              <div className="flex justify-end pt-2">
                <Button variant="outline" size="sm" onClick={() => setMode("edit")} className="gap-2">
                  <Pencil className="h-3.5 w-3.5" />
                  Editar
                </Button>
              </div>
            </div>
          )}

          {mode === "edit" && (
            <div className="space-y-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="contexto" className="gap-1.5 text-xs">
                    <BookOpen className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Contexto</span>
                  </TabsTrigger>
                  <TabsTrigger value="imagenes" className="gap-1.5 text-xs">
                    <ImageIcon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Imágenes</span>
                  </TabsTrigger>
                  <TabsTrigger value="noticias" className="gap-1.5 text-xs">
                    <Newspaper className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Noticias</span>
                  </TabsTrigger>
                  <TabsTrigger value="reflexion" className="gap-1.5 text-xs">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Reflexión</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="contexto" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Sesgo pre-mercado</Label>
                      <Textarea
                        rows={2}
                        placeholder="¿Qué esperabas antes de que abra?"
                        value={form.session_bias_pre || ""}
                        onChange={(e) => setForm((f) => ({ ...f, session_bias_pre: e.target.value }))}
                        className="text-sm resize-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Sesgo real (post)</Label>
                      <Textarea
                        rows={2}
                        placeholder="¿Qué terminó pasando?"
                        value={form.session_bias_post || ""}
                        onChange={(e) => setForm((f) => ({ ...f, session_bias_post: e.target.value }))}
                        className="text-sm resize-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Niveles clave / zonas de liquidez</Label>
                    <Textarea
                      rows={2}
                      placeholder="Niveles importantes del día..."
                      value={form.key_levels || ""}
                      onChange={(e) => setForm((f) => ({ ...f, key_levels: e.target.value }))}
                      className="text-sm resize-none"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="imagenes" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {renderImageField("M1", "M1")}
                    {renderImageField("M5", "M5")}
                    {renderImageField("M15", "M15")}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Trades ideales de la sesión</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {renderImageField("TRADE1", "Trade 1")}
                      {renderImageField("TRADE2", "Trade 2")}
                      {renderImageField("TRADE3", "Trade 3")}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="noticias" className="space-y-4 mt-4">
                  <div className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/20 px-4 py-3">
                    <Label className="text-sm">¿Hubo noticias relevantes?</Label>
                    <Switch
                      checked={!!form.had_news}
                      onCheckedChange={(checked) => setForm((f) => ({ ...f, had_news: checked }))}
                    />
                  </div>
                  {form.had_news && (
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Detalle de las noticias</Label>
                      <Textarea
                        rows={3}
                        placeholder="¿Qué noticias hubo y cómo impactaron?"
                        value={form.news_notes || ""}
                        onChange={(e) => setForm((f) => ({ ...f, news_notes: e.target.value }))}
                        className="text-sm resize-none"
                      />
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="reflexion" className="space-y-4 mt-4">
                  <div className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/20 px-4 py-3">
                    <Label className="text-sm">¿Seguiste tu plan hoy?</Label>
                    <Switch
                      checked={!!form.followed_plan}
                      onCheckedChange={(checked) => setForm((f) => ({ ...f, followed_plan: checked }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Estado emocional</Label>
                    <Textarea
                      rows={2}
                      placeholder="¿Cómo te sentiste durante la sesión?"
                      value={form.emotional_state || ""}
                      onChange={(e) => setForm((f) => ({ ...f, emotional_state: e.target.value }))}
                      className="text-sm resize-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Lecciones aprendidas</Label>
                    <Textarea
                      rows={2}
                      placeholder="¿Qué aprendiste hoy?"
                      value={form.lessons_learned || ""}
                      onChange={(e) => setForm((f) => ({ ...f, lessons_learned: e.target.value }))}
                      className="text-sm resize-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Notas para mañana</Label>
                    <Textarea
                      rows={2}
                      placeholder="¿Qué querés recordar para la próxima sesión?"
                      value={form.notes_for_tomorrow || ""}
                      onChange={(e) => setForm((f) => ({ ...f, notes_for_tomorrow: e.target.value }))}
                      className="text-sm resize-none"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => (recap ? setMode("view") : setMode("empty"))}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                      Guardando…
                    </span>
                  ) : (
                    "Guardar"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {lightboxUrl && (
        <Dialog open={!!lightboxUrl} onOpenChange={(open) => !open && setLightboxUrl(null)}>
          <DialogContent className="max-w-[95vw] md:max-w-5xl h-[90vh] bg-black/95 border-0 shadow-2xl flex items-center justify-center p-0 overflow-hidden ring-1 ring-white/10">
            <img src={lightboxUrl} alt="Vista detallada" className="max-w-full max-h-full object-contain" />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

function SummaryField({ label, value, block }: { label: string; value?: string | null; block?: boolean }) {
  return (
    <div className={block ? "bg-muted/30 border border-border/40 rounded-lg p-3" : "bg-muted/30 border border-border/40 rounded-lg p-3"}>
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-sm ${block ? "whitespace-pre-wrap text-foreground/80" : "font-semibold"}`}>{value || "—"}</p>
    </div>
  );
}
