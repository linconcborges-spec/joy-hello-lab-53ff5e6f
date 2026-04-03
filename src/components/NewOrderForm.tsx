import { useState } from "react";
import { Plus, Trash2, ArrowLeft, Search, X, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { Order, OrderItem } from "@/types/order";
import { toast } from "sonner";
import { useCustomers, useAddCustomer } from "@/hooks/useCustomers";
import { useProducts } from "@/hooks/useProducts";
import { useAddons } from "@/hooks/useAddons";
import { useSettings } from "@/hooks/useSettings";
import { printOrder } from "@/lib/PrintService";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface NewOrderFormProps {
  onSubmit: (order: Omit<Order, "id" | "number" | "createdAt">) => void;
  onCancel: () => void;
}

function createEmptyItem(): OrderItem {
  return { id: crypto.randomUUID(), productCode: "", quantity: 1, product: "", addons: [], unitPrice: 0, total: 0, categoryId: null, observation: "" };
}

function calcTotal(item: OrderItem): number {
  const addonsTotal = item.addons.reduce((s, a) => s + a.price, 0);
  return item.quantity * item.unitPrice + addonsTotal;
}

const formatCpfCnpj = (value: string) => {
  const v = value.replace(/\D/g, "");
  if (v.length <= 11) {
    return v
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return v
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
    .slice(0, 18);
};

function OrderItemRow({ 
  item, 
  items, 
  setItems, 
  updateItem, 
  handleProductCodeSearch, 
  addons, 
  toggleAddon, 
  products 
}: any) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleCustomProductName = (name: string) => {
    updateItem(item.id, "product", name);
  };

  return (
    <div className="bg-secondary/40 rounded-3xl p-4 sm:p-5 space-y-4 border border-border/20 shadow-inner">
      {/* Grid Iterativa e Responsiva */}
      <div className="flex flex-col md:grid md:grid-cols-[6rem_6rem_1fr_7rem_1fr_6rem_auto] gap-4 items-end">
        
        {/* Código e Qtd em linha no mobile tamém para economizar espaço vertical */}
        <div className="grid grid-cols-2 gap-3 w-full md:contents">
          <div className="space-y-1.5 flex-1">
            <Label className="text-[10px] font-black uppercase opacity-60 ml-2">Código</Label>
            <Input
              id={`code-${item.id}`}
              value={item.productCode}
              onChange={(e) => updateItem(item.id, "productCode", e.target.value)}
              onKeyDown={(e) => { 
                if (e.key === "Enter") { 
                  e.preventDefault(); 
                  handleProductCodeSearch(item.id, item.productCode); 
                  document.getElementById(`qty-${item.id}`)?.focus();
                } 
              }}
              onBlur={() => handleProductCodeSearch(item.id, item.productCode)}
              placeholder="000"
              className="text-center font-bold rounded-xl h-12 bg-background border-none shadow-sm"
              maxLength={5}
            />
          </div>
          <div className="space-y-1.5 flex-1">
            <Label className="text-[10px] font-black uppercase opacity-60 ml-2">Qtd</Label>
            <Input
              id={`qty-${item.id}`}
              type="number"
              min={1}
              value={item.quantity}
              onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 1)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (item.productCode || item.product) {
                    document.getElementById(`price-${item.id}`)?.focus();
                  } else {
                    document.getElementById(`combobox-${item.id}`)?.focus();
                  }
                }
              }}
              className="text-center font-bold rounded-xl h-12 bg-background border-none shadow-sm"
            />
          </div>
        </div>

        {/* Produto e Valor */}
        <div className="grid grid-cols-[1fr_auto] gap-3 w-full md:contents">
          <div className="space-y-1.5 flex flex-col min-w-0">
            <Label className="text-[10px] font-black uppercase opacity-60 ml-2">Produto</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  id={`combobox-${item.id}`}
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className={cn(
                    "w-full justify-between h-12 px-4 rounded-xl font-bold bg-background border-none shadow-sm overflow-hidden",
                    !item.product && "text-muted-foreground",
                    item.productCode ? "bg-muted/50" : ""
                  )}
                  disabled={!!item.productCode}
                >
                  <span className="truncate">{item.product || "Busque p/ nome..."}</span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[calc(100vw-3rem)] sm:w-[400px] p-0 rounded-2xl shadow-2xl border-none overflow-hidden" align="start">
                <Command shouldFilter={false}>
                  <CommandInput 
                    placeholder="Buscar produto por nome..." 
                    value={searchQuery}
                    onValueChange={(v) => {
                      setSearchQuery(v);
                      handleCustomProductName(v);
                    }}
                    className="h-14 font-bold"
                  />
                  <CommandList className="max-h-[300px]">
                    <CommandEmpty className="py-6 text-center text-xs font-black uppercase opacity-30">Aperte enter para usar "{searchQuery}"</CommandEmpty>
                    <CommandGroup>
                      {products.filter((p: any) => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map((produto: any) => (
                        <CommandItem
                          key={produto.code}
                          value={produto.name}
                          className="py-3 px-4 m-1 rounded-xl cursor-pointer"
                          onSelect={() => {
                            updateItem(item.id, "productCode", produto.code.toString());
                            updateItem(item.id, "product", produto.name);
                            updateItem(item.id, "unitPrice", Number(produto.price));
                            updateItem(item.id, "categoryId", produto.category_id || null);
                            setSearchQuery("");
                            setOpen(false);
                            setTimeout(() => {
                              document.getElementById(`price-${item.id}`)?.focus();
                            }, 50);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-3 h-4 w-4 shrink-0 text-primary",
                              item.product === produto.name ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span className="font-bold">{produto.name}</span>
                            <span className="text-[10px] opacity-50 uppercase font-black">R$ {Number(produto.price).toFixed(2)}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-1.5 w-[7rem] md:contents">
            <Label className="text-[10px] font-black uppercase opacity-60 ml-2 md:hidden">Valor</Label>
            <div className="md:contents space-y-1.5">
               <Label className="hidden md:block text-[10px] font-black uppercase opacity-60 ml-2">Valor</Label>
               <Input
                id={`price-${item.id}`}
                type="number"
                step="0.01"
                min={0}
                value={item.unitPrice || ""}
                onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    document.getElementById(`obs-${item.id}`)?.focus();
                  }
                }}
                readOnly={!!item.productCode}
                className={cn("h-12 font-bold rounded-xl bg-background border-none shadow-sm", item.productCode ? "bg-muted/50 cursor-default" : "")}
              />
            </div>
          </div>
        </div>

        {/* Obs e Total */}
        <div className="grid grid-cols-[1fr_auto_auto] gap-3 w-full md:contents">
          <div className="space-y-1.5 flex-1 min-w-0">
            <Label className="text-[10px] font-black uppercase opacity-60 ml-2">Observação</Label>
            <Input
              id={`obs-${item.id}`}
              value={item.observation || ""}
              onChange={(e) => updateItem(item.id, "observation", e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  document.getElementById("btn-add-item")?.click();
                }
              }}
              placeholder="Ex: sem cebola"
              className="h-12 font-medium rounded-xl bg-background border-none shadow-sm px-4"
            />
          </div>
          <div className="space-y-1.5 min-w-[5rem] text-right">
            <Label className="text-[10px] font-black uppercase opacity-60 mr-2">Total</Label>
            <div className="h-12 flex items-center justify-end px-2">
              <span className="text-sm font-black text-primary">R$ {item.total.toFixed(2)}</span>
            </div>
          </div>
          <div className="space-y-1.5 flex items-end pb-1 px-1">
            {items.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-destructive/40 hover:text-destructive hover:bg-destructive/10 rounded-xl"
                onClick={() => setItems((p: any) => p.filter((i: any) => i.id !== item.id))}
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Adicionais com quebra de linha garantida */}
      <div className="space-y-2 bg-background/30 p-4 rounded-2xl border border-border/10">
        <div className="flex items-center justify-between">
          <Label className="text-[10px] font-black uppercase opacity-40 tracking-widest">Adicionais Extras</Label>
          {item.addons.length > 0 && (
            <span className="text-[10px] font-black text-primary uppercase">+ R$ {item.addons.reduce((s: any, a: any) => s + a.price, 0).toFixed(2)}</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {addons
            .filter((addon: any) => !addon.category_id || addon.category_id === item.categoryId)
            .map((addon: any) => {
            const selected = item.addons.some((a: any) => a.name === addon.name);
            return (
              <Badge
                key={addon.id}
                variant={selected ? "success" : "outline"}
                className={cn(
                  "cursor-pointer select-none py-2 px-3 rounded-xl border-none transition-all active:scale-95",
                  selected ? "shadow-md shadow-success/20 ring-2 ring-success/20" : "bg-background/50 opacity-60 hover:opacity-100"
                )}
                onClick={() => toggleAddon(item.id, { name: addon.name, price: Number(addon.price) })}
              >
                <span className="text-[10px] font-bold">{addon.name}</span>
                <span className="text-[10px] ml-1.5 font-black opacity-40">R${Number(addon.price).toFixed(0)}</span>
                {selected && <Check className="h-3 w-3 ml-2" />}
              </Badge>
            );
          })}
          {addons.filter((addon: any) => !addon.category_id || addon.category_id === item.categoryId).length === 0 && (
            <span className="text-[10px] text-muted-foreground uppercase font-black opacity-20">Nenhum adicional p/ esta categoria</span>
          )}
        </div>
      </div>
    </div>
  );
}

export function NewOrderForm({ onSubmit, onCancel }: NewOrderFormProps) {
  const { settings } = useSettings();
  const { data: customers = [] } = useCustomers();
  const addCustomer = useAddCustomer();
  const { data: products = [] } = useProducts();
  const { data: addons = [] } = useAddons();
  const [customerCode, setCustomerCode] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [items, setItems] = useState<OrderItem[]>([createEmptyItem()]);
  const [deliveryFee, setDeliveryFee] = useState(settings.defaultDeliveryFee);
  const [changeFor, setChangeFor] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<Order["paymentMethod"]>("cash");
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<Omit<Order, "id" | "number" | "createdAt"> | null>(null);

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

  const handleQuickRegister = () => {
    if (!customerName.trim()) {
      toast.error("Preencha o nome do cliente para cadastrar");
      return;
    }
    
    addCustomer.mutate(
      { name: customerName.trim(), address: address.trim(), phone: phone.trim() },
      { 
        onSuccess: (newCustomer) => {
          setCustomerCode(newCustomer.code.toString());
        }
      }
    );
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
          const updated = { ...item, productCode: code, product: product.name, unitPrice: price, categoryId: product.category_id || null };
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

    const orderData: Omit<Order, "id" | "number" | "createdAt"> = {
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
      isPrinted: false,
    };

    setPendingOrder(orderData);
    setShowPrintDialog(true);
  };

  const handleConfirmPrint = (shouldPrint: boolean) => {
    if (!pendingOrder) return;

    const finalOrder = {
      ...pendingOrder,
      status: (shouldPrint ? "preparing" : "pending") as Order["status"],
      isPrinted: shouldPrint,
    };

    // Para o print real, precisamos de um objeto que pareça com a Order (com number e id fake para o PrintService)
    if (shouldPrint) {
      const orderToPrint: Order = {
        ...finalOrder,
        id: "temp",
        number: 0, // O número real será gerado pelo hook, mas para o print imediato usamos 0 ou buscamos depois
        createdAt: new Date().toISOString(),
      };
      printOrder(orderToPrint, settings);
    }

    onSubmit(finalOrder);
    setShowPrintDialog(false);
    toast.success(shouldPrint ? "Pedido enviado para preparação e impresso!" : "Pedido criado com sucesso!");
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
              <Label htmlFor="cnpj">CPF/CNPJ</Label>
              <Input id="cnpj" value={cnpj} onChange={(e) => setCnpj(formatCpfCnpj(e.target.value))} placeholder="Opcional" />
            </div>
            <div className="flex items-end pt-1">
              <Button type="button" onClick={handleQuickRegister} disabled={addCustomer.isPending || !customerName.trim()} className="gap-1.5 w-full bg-orange-500 text-white hover:bg-orange-600 border-none transition-colors">
                <Plus className="h-4 w-4" /> Salvar Cliente no Sistema
              </Button>
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
            <OrderItemRow
              key={item.id}
              item={item}
              items={items}
              setItems={setItems}
              updateItem={updateItem}
              handleProductCodeSearch={handleProductCodeSearch}
              addons={addons}
              toggleAddon={toggleAddon}
              products={products}
            />
          ))}
          <Button 
            id="btn-add-item" 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={() => {
              const newItem = createEmptyItem();
              setItems((p) => [...p, newItem]);
              setTimeout(() => {
                document.getElementById(`code-${newItem.id}`)?.focus();
              }, 50);
            }} 
            className="gap-1.5"
          >
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

      <AlertDialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deseja imprimir o pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              Se SIM: O pedido será marcado como impresso e mudará para o status "Preparando".<br/>
              Se NÃO: O pedido ficará com o status "Pendente" e sem marcação de impresso.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => handleConfirmPrint(false)}>Não</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleConfirmPrint(true)}>Sim, imprimir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}
