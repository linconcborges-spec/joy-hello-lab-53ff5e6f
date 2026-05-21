import { Printer, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Order } from "@/types/order";

interface OrderFormActionsProps {
  totalAmount: number;
  initialOrder?: Order;
  showPrintButton: boolean;
  onSave: () => void;
  onSaveAndPrint: () => void;
  onEditSubmit: (e: React.FormEvent) => void;
}

export function OrderFormActions({ totalAmount, initialOrder, showPrintButton, onSave, onSaveAndPrint, onEditSubmit }: OrderFormActionsProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between bg-card rounded-xl p-4 border gap-3">
      <span className="text-lg font-black uppercase">Total: R$ {totalAmount.toFixed(2)}</span>
      {initialOrder ? (
        <Button id="submit-order" type="submit" size="lg" className="px-8 uppercase font-black w-full sm:w-auto">
          Salvar Alterações
        </Button>
      ) : showPrintButton ? (
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            id="submit-order-save"
            type="button"
            variant="outline"
            size="lg"
            className="flex-1 sm:flex-none px-6 uppercase font-black gap-2 border-border/60"
            onClick={onSave}
          >
            <Save className="h-4 w-4" />
            Salvar
          </Button>
          <Button
            id="submit-order"
            type="button"
            size="lg"
            className="flex-1 sm:flex-none px-6 uppercase font-black gap-2 shadow-lg shadow-primary/20"
            onClick={onSaveAndPrint}
          >
            <Printer className="h-4 w-4" />
            Salvar e Imprimir
          </Button>
        </div>
      ) : (
        <Button
          id="submit-order-save"
          type="button"
          size="lg"
          className="w-full sm:w-auto px-8 uppercase font-black gap-2 shadow-lg shadow-primary/20"
          onClick={onSave}
        >
          <Save className="h-4 w-4" />
          Salvar Pedido
        </Button>
      )}
    </div>
  );
}
