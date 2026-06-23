import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ROIEntryInsert } from "@/hooks/useROIEntries";

interface ROIEntryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: any) => void;
  entryToEdit: any | null;
}

export const ROIEntryDialog = ({ isOpen, onClose, onSave, entryToEdit }: ROIEntryDialogProps) => {
  const [formData, setFormData] = useState<Partial<ROIEntryInsert>>({
    fecha: "",
    cuentas_compradas: undefined,
    inversion: undefined,
    retiros: undefined,
    monto_retiros: undefined,
    empresa_fondeo: "",
    observaciones: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (entryToEdit) {
      setFormData({
        ...entryToEdit,
        fecha: entryToEdit.fecha ? entryToEdit.fecha.substring(0, 7) : "",
      });
    } else {
      setFormData({
        fecha: new Date().toISOString().substring(0, 7),
        cuentas_compradas: undefined,
        inversion: undefined,
        retiros: undefined,
        monto_retiros: undefined,
        empresa_fondeo: "",
        observaciones: "",
      });
    }
  }, [entryToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? undefined : Number(value)) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fecha) return;
    setSaving(true);
    const finalFecha = formData.fecha.length === 7 ? `${formData.fecha}-01` : formData.fecha;
    await onSave({ ...formData, fecha: finalFecha });
    setSaving(false);
  };

  const inversion = Number(formData.inversion || 0);
  const retiros = Number(formData.monto_retiros || 0);
  const balance = retiros - inversion;
  const balancePos = balance > 0;
  const balanceNeg = balance < 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] p-0 gap-0 overflow-hidden border-border/50">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border/40">
          <DialogTitle className="text-base font-semibold">
            {entryToEdit ? "Editar entrada" : "Nueva entrada ROI"}
          </DialogTitle>
          {entryToEdit && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {entryToEdit.fecha}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">
            {/* Row 1: Período + Empresa */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="fecha" className="text-xs text-muted-foreground">Período *</Label>
                <Input
                  id="fecha"
                  name="fecha"
                  type="month"
                  required
                  value={formData.fecha || ""}
                  onChange={handleChange}
                  className="bg-muted/30 border-border/40 h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="empresa_fondeo" className="text-xs text-muted-foreground">Empresa de fondeo</Label>
                <Input
                  id="empresa_fondeo"
                  name="empresa_fondeo"
                  type="text"
                  placeholder="Topstep, Apex…"
                  value={formData.empresa_fondeo || ""}
                  onChange={handleChange}
                  className="bg-muted/30 border-border/40 h-9 text-sm"
                />
              </div>
            </div>

            {/* Divider: Inversión */}
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Inversión</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="cuentas_compradas" className="text-xs text-muted-foreground">Cuentas compradas</Label>
                  <Input
                    id="cuentas_compradas"
                    name="cuentas_compradas"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.cuentas_compradas ?? ""}
                    onChange={handleChange}
                    className="bg-muted/30 border-border/40 h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="inversion" className="text-xs text-muted-foreground">Monto invertido *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">$</span>
                    <Input
                      id="inversion"
                      name="inversion"
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      placeholder="0.00"
                      className="pl-6 bg-muted/30 border-border/40 h-9 text-sm"
                      value={formData.inversion ?? ""}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Divider: Retiros */}
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Retiros</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="retiros" className="text-xs text-muted-foreground">Cantidad de retiros</Label>
                  <Input
                    id="retiros"
                    name="retiros"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.retiros ?? ""}
                    onChange={handleChange}
                    className="bg-muted/30 border-border/40 h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="monto_retiros" className="text-xs text-muted-foreground">Monto retirado</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">$</span>
                    <Input
                      id="monto_retiros"
                      name="monto_retiros"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="pl-6 bg-muted/30 border-border/40 h-9 text-sm"
                      value={formData.monto_retiros ?? ""}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Balance preview */}
            <div className="flex items-center justify-between rounded-lg bg-muted/30 border border-border/40 px-4 py-2.5">
              <span className="text-xs text-muted-foreground">Balance mensual</span>
              <span
                className="font-mono text-sm font-semibold tabular-nums"
                style={{
                  color: balancePos ? "var(--profit-color)" : balanceNeg ? "var(--loss-color)" : undefined,
                }}
              >
                {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(balance)}
              </span>
            </div>

            {/* Observaciones */}
            <div className="space-y-1.5">
              <Label htmlFor="observaciones" className="text-xs text-muted-foreground">Observaciones</Label>
              <Textarea
                id="observaciones"
                name="observaciones"
                maxLength={500}
                rows={2}
                placeholder="Notas opcionales sobre este período…"
                value={formData.observaciones || ""}
                onChange={handleChange}
                className="bg-muted/30 border-border/40 text-sm resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border/40 bg-muted/10">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  Guardando…
                </span>
              ) : entryToEdit ? "Guardar cambios" : "Guardar entrada"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
