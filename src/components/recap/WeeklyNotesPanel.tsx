import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addWeeks, endOfWeek, format, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, NotebookPen } from "lucide-react";
import { toast } from "sonner";
import { useWeeklyNote } from "@/hooks/useWeeklyNote";

interface WeeklyNotesPanelProps {
  userId?: string;
}

export const WeeklyNotesPanel = ({ userId }: WeeklyNotesPanelProps) => {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const { weeklyNote, upsertNote } = useWeeklyNote(userId, weekStart);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNotes(weeklyNote?.notes || "");
  }, [weeklyNote, weekStart]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await upsertNote.mutateAsync(notes);
      toast.success("Nota semanal guardada");
    } catch (err: any) {
      toast.error("Error al guardar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const isDirty = notes !== (weeklyNote?.notes || "");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <NotebookPen className="h-4 w-4 text-muted-foreground" />
          Notas semanales
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setWeekStart((w) => addWeeks(w, -1))}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {format(weekStart, "d MMM", { locale: es })} – {format(weekEnd, "d MMM", { locale: es })}
          </span>
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setWeekStart((w) => addWeeks(w, 1))}>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          rows={6}
          placeholder="Reflexiones, patrones y objetivos de la semana…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="text-sm resize-none"
        />
        <div className="flex justify-end">
          <Button size="sm" onClick={handleSave} disabled={saving || !isDirty}>
            {saving ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
