import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Order } from "@/types/order";

interface OrderFormPaymentSectionProps {
  paymentMethod: Order["paymentMethod"];
  setPaymentMethod: (v: Order["paymentMethod"]) => void;
  deliveryFee: number;
  setDeliveryFee: (v: number) => void;
  changeFor: number;
  setChangeFor: (v: number) => void;
  isPickup: boolean;
}

export function OrderFormPaymentSection({
  paymentMethod, setPaymentMethod,
  deliveryFee, setDeliveryFee,
  changeFor, setChangeFor,
  isPickup,
}: OrderFormPaymentSectionProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="uppercase">Pagamento</CardTitle>
      </CardHeader>
      <CardContent className={cn("grid grid-cols-1 gap-3", isPickup ? "sm:grid-cols-2" : "sm:grid-cols-3")}>
        <div className="space-y-1.5">
          <Label className="uppercase font-black text-xs">Forma de Pagamento</Label>
          <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as Order["paymentMethod"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="cash" className="uppercase font-bold">Dinheiro</SelectItem>
              <SelectItem value="card" className="uppercase font-bold">Cartão</SelectItem>
              <SelectItem value="pix" className="uppercase font-bold">PIX</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {!isPickup && (
          <div className="space-y-1.5">
            <Label htmlFor="delivery" className="uppercase font-black text-xs">Taxa de Entrega (R$)</Label>
            <Input id="delivery" type="number" step="0.01" min={0} value={deliveryFee || ""} onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)} />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="change" className="uppercase font-black text-xs">Troco Para (R$)</Label>
          <Input
            id="change"
            type="number"
            step="0.01"
            min={0}
            value={changeFor || ""}
            onChange={(e) => setChangeFor(parseFloat(e.target.value) || 0)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                document.getElementById("global-obs")?.focus();
              }
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
