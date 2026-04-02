import { useState } from "react";
import { Plus, Trash2, ArrowLeft, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { Order, OrderItem } from "@/types/order";
import { toast } from "sonner";
import { useCustomers } from "@/hooks/useCustomers";
import { useProducts } from "@/hooks/useProducts";
import { useAddons } from "@/hooks/useAddons";

interface NewOrderFormProps {
  onSubmit: (order: Omit<Order, "id" | "number" | "createdAt">) => void;
  onCancel: () => void;
}

function createEmptyItem(): OrderItem {
  return { id: crypto.randomUUID(), productCode: "", quantity: 1, product: "", addons: [], unitPrice: 0, total: 0 };
}

function calcTotal(item: OrderItem): number {
  const addonsTotal = item.addons.reduce((s, a) => s + a.price, 0);
  return item.quantity * item.unitPrice + addonsTotal;
}

export function NewOrderForm({ onSubmit, onCancel }: NewOrderFormProps) {
  const { data: customers = [] } = useCustomers();
  const { data: products = [] } = useProducts();
  const { data: addons = [] } = useAddons();
  const [customerCode, setCustomerCode] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [items, setItems] = useState<OrderItem[]>([createEmptyItem()]);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [changeFor, setChangeFor] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<Order["paymentMethod"]>("cash");

  const handleCustomerCodeSearch = () => {
    const code = parseInt(customerCode);
    const customer = customers.find((c) => c.code === code);
    if (customer) {
      setCustomerName(customer.name);
      setAddress(customer.address);
      setPhone(customer.phone);
      toast.success(`Cliente "${customer.name}" encontrado!`);
    } else {
      toast.error("Cliente não encontrado com esse código");
    }
  };

  const updateItem = (id: string, field: keyof OrderItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        updated.total = calcTotal(updated);
        return updated;
      })
    );
  };

  const toggleAddon = (itemId: string, addon: { name: string; price: number }) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const exists = item.addons.some((a) => a.name === addon.name);
        const updated = {
          ...item,
          addons: exists ? item.addons.filter((a) => a.name !== addon.name) : [...item.addons, addon],
        };
        updated.total = calcTotal(updated);
        return updated;
      })
    );
  };

  const handleProductCodeSearch = (itemId: string, code: string) => {
    const codeNum = parseInt(code);
    if (isNaN(codeNum)) return;
    const product = products.find((p) => p.code === codeNum);
    if (product) {
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) return item;
          const price = Number(product.price);
          const updated = { ...item, productCode: code, product: product.name, unitPrice: price };
          updated.total = calcTotal(updated);
          return updated;
        })
      );
      toast.success(`${product.name} - R$ ${Number(product.price).toFixed(2)}`);
    } else if (code.trim()) {
      toast.error("Produto não encontrado");
    }
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
        <CardContent className="space-y-3">
          <div className="flex gap-2 items-end">
            <div className="space-y-1.5 flex-1">
              <Label htmlFor="code">Código do Cliente</Label>
              <Input
                id="code"
                value={customerCode}
                onChange={(e) => setCustomerCode(e.target.value)}
                placeholder="Ex: 1, 2, 3..."
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCustomerCodeSearch(); } }}
              />
            </div>
            <Button type="button" variant="secondary" onClick={handleCustomerCodeSearch} className="gap-1.5">
              <Search className="h-4 w-4" /> Buscar
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Itens do Pedido</CardTitle>
          <p className="text-xs text-muted-foreground">Digite o código do produto e pressione Enter para preencher automaticamente</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="bg-secondary/40 rounded-lg p-3 space-y-2">
              <div className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs">Código</Label>
                  <Input
                    value={item.productCode}
                    onChange={(e) => updateItem(item.id, "productCode", e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleProductCodeSearch(item.id, item.productCode); } }}
                    onBlur={() => handleProductCodeSearch(item.id, item.productCode)}
                    placeholder="Cód."
                    className="text-center"
                  />
                </div>
                <div className="col-span-4 space-y-1.5">
                  <Label className="text-xs">Produto</Label>
                  <Input
                    value={item.product}
                    onChange={(e) => updateItem(item.id, "product", e.target.value)}
                    placeholder="Nome do produto"
                    readOnly={!!item.productCode}
                    className={item.productCode ? "bg-muted" : ""}
                  />
                </div>
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
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs">Valor</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={item.unitPrice || ""}
                    onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                    readOnly={!!item.productCode}
                    className={item.productCode ? "bg-muted" : ""}
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs">Total</Label>
                  <p className="h-10 flex items-center text-sm font-bold text-primary">R$ {item.total.toFixed(2)}</p>
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
              {/* Addons selector */}
              <div className="space-y-1.5">
                <Label className="text-xs">Adicionais</Label>
                <div className="flex flex-wrap gap-1.5">
                  {addons.map((addon) => {
                    const selected = item.addons.some((a) => a.name === addon.name);
                    return (
                      <Badge
                        key={addon.id}
                        variant={selected ? "default" : "outline"}
                        className="cursor-pointer select-none"
                        onClick={() => toggleAddon(item.id, { name: addon.name, price: Number(addon.price) })}
                      >
                        {addon.name} +R${Number(addon.price).toFixed(2)}
                        {selected && <X className="h-3 w-3 ml-1" />}
                      </Badge>
                    );
                  })}
                  {addons.length === 0 && (
                    <span className="text-xs text-muted-foreground">Nenhum adicional cadastrado. Cadastre em Produtos → Adicionais.</span>
                  )}
                </div>
                {item.addons.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Total adicionais: R$ {item.addons.reduce((s, a) => s + a.price, 0).toFixed(2)}
                  </p>
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
