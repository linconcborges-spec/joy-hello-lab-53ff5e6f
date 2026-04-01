import { useState } from "react";
import { Plus, Trash2, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Order, OrderItem } from "@/types/order";
import { toast } from "sonner";
import { useCustomers } from "@/hooks/useCustomers";

interface NewOrderFormProps {
  onSubmit: (order: Omit<Order, "id" | "number" | "createdAt">) => void;
  onCancel: () => void;
}

function createEmptyItem(): OrderItem {
  return { id: crypto.randomUUID(), quantity: 1, product: "", additionalPrice: 0, unitPrice: 0, total: 0 };
}

export function NewOrderForm({ onSubmit, onCancel }: NewOrderFormProps) {
  const [customerName, setCustomerName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [items, setItems] = useState<OrderItem[]>([createEmptyItem()]);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [changeFor, setChangeFor] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<Order["paymentMethod"]>("cash");

  const updateItem = (id: string, field: keyof OrderItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        updated.total = updated.quantity * updated.unitPrice + updated.additionalPrice;
        return updated;
      })
    );
  };

  const subtotal = items.reduce((sum, i) => sum + i.total, 0);
  const totalAmount = subtotal + deliveryFee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = items.filter((i) => i.product.trim());
    if (validItems.length === 0) {
      toast.error("Adicione pelo menos um item ao pedido");
      return;
    }
    onSubmit({
      customerName: customerName.trim(),
      address: address.trim(),
      phone: phone.trim(),
      cnpj: cnpj.trim(),
      items: validItems,
      deliveryFee,
      totalAmount,
      changeFor,
      status: "pending",
      paymentMethod,
    });
    toast.success("Pedido criado com sucesso!");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="gap-1.5">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Button>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Dados do Cliente</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nome do cliente" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="address">Endereço</Label>
            <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Endereço de entrega" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input id="cnpj" value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="Opcional" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Itens do Pedido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((item, idx) => (
            <div key={item.id} className="grid grid-cols-12 gap-2 items-end bg-secondary/40 rounded-lg p-3">
              <div className="col-span-1 space-y-1.5">
                <Label className="text-xs">Qtd</Label>
                <Input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 1)}
                  className="text-center"
                />
              </div>
              <div className="col-span-5 space-y-1.5">
                <Label className="text-xs">Produto</Label>
                <Input
                  value={item.product}
                  onChange={(e) => updateItem(item.id, "product", e.target.value)}
                  placeholder="Nome do produto"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Valor (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={item.unitPrice || ""}
                  onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Adicional</Label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={item.additionalPrice || ""}
                  onChange={(e) => updateItem(item.id, "additionalPrice", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="col-span-1 space-y-1.5">
                <Label className="text-xs">Total</Label>
                <p className="h-10 flex items-center text-sm font-medium">R$ {item.total.toFixed(2)}</p>
              </div>
              <div className="col-span-1 flex justify-end">
                {items.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setItems((p) => p.filter((i) => i.id !== item.id))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => setItems((p) => [...p, createEmptyItem()])} className="gap-1.5">
            <Plus className="h-4 w-4" /> Adicionar item
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Pagamento</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label>Forma de pagamento</Label>
            <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as Order["paymentMethod"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Dinheiro</SelectItem>
                <SelectItem value="card">Cartão</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="delivery">Taxa de entrega (R$)</Label>
            <Input id="delivery" type="number" step="0.01" min={0} value={deliveryFee || ""} onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="change">Troco para (R$)</Label>
            <Input id="change" type="number" step="0.01" min={0} value={changeFor || ""} onChange={(e) => setChangeFor(parseFloat(e.target.value) || 0)} />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between bg-card rounded-xl p-4 border">
        <span className="text-lg font-bold">Total: R$ {totalAmount.toFixed(2)}</span>
        <Button type="submit" size="lg" className="px-8">Criar Pedido</Button>
      </div>
    </form>
  );
}
