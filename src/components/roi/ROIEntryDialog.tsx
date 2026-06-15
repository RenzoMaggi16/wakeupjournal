import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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

  useEffect(() => {
    if (entryToEdit) {
      setFormData({
        ...entryToEdit,
        // map existing ISO date to YYYY-MM if needed, assuming the DB stores YYYY-MM-DD
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
    
    let parsedValue: any = value;
    if (type === "number") {
      parsedValue = value === "" ? undefined : Number(value);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: parsedValue,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fecha) return;

    // ensure fecha is YYYY-MM-01
    const finalFecha = formData.fecha.length === 7 ? `${formData.fecha}-01` : formData.fecha;

    onSave({
      ...formData,
      fecha: finalFecha,
    });
  };

  const currentInversion = Number(formData.inversion || 0);
  const currentRetiros = Number(formData.monto_retiros || 0);
  const balanceMensual = currentRetiros - currentInversion;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full max-w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {entryToEdit ? `Editar Entrada — ${entryToEdit.fecha}` : "Nueva Entrada ROI"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fecha">Período (Mes/Año)</Label>
              <Input
                id="fecha"
                name="fecha"
                type="month"
                required
                value={formData.fecha || ""}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="empresa_fondeo">Empresa de Fondeo</Label>
              <Input
                id="empresa_fondeo"
                name="empresa_fondeo"
                type="text"
                placeholder="ej. Topstep, Apex"
                value={formData.empresa_fondeo || ""}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cuentas_compradas">Cuentas Compradas</Label>
              <Input
                id="cuentas_compradas"
                name="cuentas_compradas"
                type="number"
                min="0"
                value={formData.cuentas_compradas ?? ""}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inversion">Inversión (USD)</Label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-muted-foreground">$</span>
                <Input
                  id="inversion"
                  name="inversion"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  className="pl-7"
                  value={formData.inversion ?? ""}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="retiros">Cantidad de Retiros</Label>
              <Input
                id="retiros"
                name="retiros"
                type="number"
                min="0"
                value={formData.retiros ?? ""}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monto_retiros">Monto Retirado (USD)</Label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-muted-foreground">$</span>
                <Input
                  id="monto_retiros"
                  name="monto_retiros"
                  type="number"
                  min="0"
                  step="0.01"
                  className="pl-7"
                  value={formData.monto_retiros ?? ""}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              name="observaciones"
              maxLength={500}
              rows={3}
              value={formData.observaciones || ""}
              onChange={handleChange}
            />
          </div>

          <div className="bg-muted/30 rounded-md p-3 text-sm text-center flex justify-between items-center text-muted-foreground border border-border/50">
            <span>Balance Mensual:</span>
            <span className={`font-mono font-bold ${balanceMensual > 0 ? 'text-[var(--profit-color)]' : balanceMensual < 0 ? 'text-[var(--loss-color)]' : ''}`}>
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(balanceMensual)}
            </span>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {entryToEdit ? "Guardar Cambios" : "Guardar Entrada"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
