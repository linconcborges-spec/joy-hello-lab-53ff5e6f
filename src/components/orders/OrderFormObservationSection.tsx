import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OrderFormObservationSectionProps {
  globalObservation: string;
  setGlobalObservation: (v: string) => void;
}

export function OrderFormObservationSection({ globalObservation, setGlobalObservation }: OrderFormObservationSectionProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="uppercase tracking-widest text-sm">Observações</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5">
          <Label htmlFor="global-obs" className="uppercase font-black text-xs">Informações adicionais (Horário, avisos, etc.)</Label>
          <Input
            id="global-obs"
            value={globalObservation}
            onChange={(e) => setGlobalObservation(e.target.value)}
            placeholder="EX: ENTREGAR APÓS AS 20H / PORTÃO VERMELHO"
            className="uppercase font-medium"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                document.getElementById("submit-order")?.focus();
              }
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
