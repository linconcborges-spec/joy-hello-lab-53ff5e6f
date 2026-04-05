import { useState } from "react";
import { Plus, Trash2, ArrowLeft, Search, X, Check, ChevronsUpDown, Phone, MapPin, PackageCheck } from "lucide-react";
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
import { useCustomers, useAddCustomer, useUpdateCustomer, normalizePhone } from "@/hooks/useCustomers";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface NewOrderFormProps {
  onSubmit: (order: Omit<Order, "id" | "number" | "createdAt">) => void;
  onCancel: () => void;
  onOpenCustomers?: () => void;
}

function createEmptyItem(): OrderItem {
  return { id: crypto.randomUUID(), productCode: "", quantity: 1, product: "", addons: [], unitPrice: 0, total: 0, categoryId: null, observation: "" };
}

function calcTotal(item: OrderItem): number {
  const addonsTotal = item.addons.reduce((s, a) => s + a.price, 0);
  return item.quantity * (item.unitPrice + addonsTotal);
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
    <div className="bg-secondary/40 rounded-[2rem] p-4 sm:p-6 space-y-5 border border-border/20 shadow-sm">
      {/* Grid Iterativa e Responsiva - 7 Colunas no Desktop */}
      <div className="grid grid-cols-1 md:grid-cols-[4.5rem_4.5rem_2.5fr_6.5rem_1.5fr_6.5rem_auto] gap-4 items-start">
        
        {/* 1. Código */}
        <div className="space-y-1.5 flex flex-col">
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
            className="text-center font-bold rounded-xl md:h-11 h-12 bg-background border-none shadow-sm focus-visible:ring-1 focus-visible:ring-primary/30"
            maxLength={5}
          />
        </div>

        {/* 2. Quantidade */}
        <div className="space-y-1.5 flex flex-col">
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
            className="text-center font-bold rounded-xl md:h-11 h-12 bg-background border-none shadow-sm focus-visible:ring-1 focus-visible:ring-primary/30"
          />
        </div>

        {/* 3. Produto (Busca/Seleção) */}
        <div className="space-y-1.5 flex flex-col min-w-0">
          <Label className="text-[10px] font-black uppercase opacity-60 ml-2 whitespace-nowrap">Nome do Produto</Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                id={`combobox-${item.id}`}
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className={cn(
                  "w-full justify-between md:h-11 h-12 px-4 rounded-xl font-bold bg-background border-none shadow-sm overflow-hidden",
                  !item.product && "text-muted-foreground",
                  item.productCode ? "bg-muted/50 opacity-100" : "" 
                )}
                disabled={!!item.productCode}
              >
                <span className="truncate text-left flex-1">{item.product || "Selecione..."}</span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-40" />
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
                  className="h-14 font-bold uppercase"
                />
                <CommandList className="max-h-[300px]">
                  <CommandEmpty className="py-6 text-center text-xs font-black uppercase opacity-30">ENTER PARA USAR "{searchQuery.toUpperCase()}"</CommandEmpty>
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
                        <Check className={cn("mr-3 h-4 w-4 shrink-0 text-primary", item.product === produto.name ? "opacity-100" : "opacity-0")} />
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

        {/* 4. Valor Unitário */}
        <div className="space-y-1.5 flex flex-col">
          <Label className="text-[10px] font-black uppercase opacity-60 ml-2 whitespace-nowrap">Valor Unit.</Label>
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
            className={cn("md:h-11 h-12 font-bold rounded-xl bg-background border-none shadow-sm", item.productCode ? "bg-muted/50 cursor-default" : "")}
          />
        </div>

        {/* 5. Observação */}
        <div className="space-y-1.5 flex flex-col min-w-0">
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
            placeholder="EX: SEM CEBOLA"
            className="md:h-11 h-12 font-medium rounded-xl bg-background border-none shadow-sm px-4 uppercase"
          />
        </div>

        {/* 6. Total do Item */}
        <div className="space-y-1.5 flex flex-col text-right">
          <Label className="text-[10px] font-black uppercase opacity-60">Subtotal</Label>
          <div className="md:h-11 h-12 flex items-center justify-end">
            <span className="text-sm font-black text-primary">R$ {item.total.toFixed(2)}</span>
          </div>
        </div>

        {/* 7. Ações (Remover) */}
        <div className="space-y-1.5 flex flex-col items-end">
          <Label className="text-[10px] font-black uppercase opacity-0 mr-2 md:block hidden">Ação</Label>
          <div className="md:h-11 h-12 flex items-center">
            {items.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-destructive/40 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                onClick={() => setItems((p: any) => p.filter((i: any) => i.id !== item.id))}
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3 bg-background/30 p-4 rounded-2xl border border-border/10">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-black uppercase opacity-50 tracking-widest">Adicionais Extras</Label>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {addons
            .filter((addon: any) => !addon.category_id || addon.category_id === item.categoryId)
            .map((addon: any) => {
            const selected = item.addons.some((a: any) => a.name === addon.name);
            return (
              <Badge
                key={addon.id}
                variant={selected ? "success" : "outline"}
                className={cn(
                  "cursor-pointer select-none py-2.5 px-4 rounded-xl border-none transition-all active:scale-95 h-auto",
                  selected ? "shadow-md shadow-success/20 ring-2 ring-success/20" : "bg-background/50 opacity-70 hover:opacity-100"
                )}
                onClick={() => toggleAddon(item.id, { name: addon.name, price: Number(addon.price) })}
              >
                <span className="text-xs font-bold uppercase">{addon.name}</span>
                <span className="text-xs ml-2 font-black opacity-50">R${Number(addon.price).toFixed(0)}</span>
                {selected && <Check className="h-4 w-4 ml-2" />}
              </Badge>
            );
          })}
          {addons.filter((addon: any) => !addon.category_id || addon.category_id === item.categoryId).length === 0 && (
            <span className="text-xs text-muted-foreground uppercase font-black opacity-20">Nenhum adicional p/ esta categoria</span>
          )}
        </div>
      </div>
    </div>
  );
}

export function NewOrderForm({ onSubmit, onCancel, onOpenCustomers }: NewOrderFormProps) {
  const { settings } = useSettings();
  const { data: customers = [] } = useCustomers();
  const addCustomer = useAddCustomer();
  const updateCustomer = useUpdateCustomer();
  const { data: products = [] } = useProducts();
  const { data: addons = [] } = useAddons();
  const [customerName, setCustomerName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [customerAddresses, setCustomerAddresses] = useState<string[]>([]);
  const [cnpj, setCnpj] = useState("");
  const [items, setItems] = useState<OrderItem[]>([createEmptyItem()]);
  const [isPickup, setIsPickup] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(settings.defaultDeliveryFee);
  const [changeFor, setChangeFor] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<Order["paymentMethod"]>("cash");
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<Omit<Order, "id" | "number" | "createdAt"> | null>(null);
  const [globalObservation, setGlobalObservation] = useState("");
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");

  const handleSelectCustomer = (c: any) => {
    setCustomerName(c.name);
    setPhone(c.phone || "");
    setCnpj("");
    if (c.addresses && c.addresses.length > 0) {
      setCustomerAddresses(c.addresses);
      setAddress(c.addresses[0]);
    } else {
      setCustomerAddresses([]);
      setAddress("");
    }
    setCustomerSearchOpen(false);
    toast.success("Cliente preenchido!");
    setTimeout(() => {
      document.getElementById("code-" + items[0]?.id)?.focus();
    }, 100);
  };

  const handlePhoneSearch = () => {
    const normalizedSearch = normalizePhone(phone);
    if (!normalizedSearch) {
      setCustomerSearchOpen(true);
      return;
    }

    const customer = customers.find((c) => normalizePhone(c.phone) === normalizedSearch);
    if (customer) {
      setCustomerName(customer.name);
      setPhone(customer.phone);
      setCustomerAddresses(customer.addresses || []);
      if (customer.addresses && customer.addresses.length > 0) {
        setAddress(customer.addresses[0]);
      }
      toast.success(`Cliente "${customer.name.toUpperCase()}" identificado!`);
    } else {
      // Lógica de cadastro curinga sugerida
      const useCuringa = window.confirm("CLIENTE NÃO ENCONTRADO. DESEJA CADASTRAR AGORA?\n\nSe clicar em CANCELAR, os dados serão salvos em um registro avulso para não perder a venda.");
      
      if (!useCuringa) {
        setCustomerName("CLIENTE NÃO CADASTRADO");
        toast.info("Usando cadastro curinga. O nome e telefone serão salvos individualmente neste pedido.");
      } else {
        toast.info("Por favor, preencha o nome e finalize o cadastro no botão laranja abaixo.");
      }
    }
  };

  const handleQuickRegister = () => {
    if (!customerName.trim()) {
      toast.error("Preencha o nome do cliente para cadastrar");
      return;
    }
    
    if (!phone.trim()) {
      toast.error("Preencha o telefone");
      return;
    }

    const normalized = normalizePhone(phone);
    const existing = customers.find(c => normalizePhone(c.phone) === normalized);

    if (existing) {
      // Adiciona o endereço atual se ele não estiver na lista (apenas se houver endereço)
      const newAddress = address.trim();
      const currentAddresses = existing.addresses || [];
      if (!isPickup && newAddress && !currentAddresses.includes(newAddress)) {
        const updatedAddresses = [...currentAddresses, newAddress];
        updateCustomer.mutate({
          id: existing.id,
          name: customerName.trim(),
          phone: existing.phone,
          addresses: updatedAddresses
        });
        setCustomerAddresses(updatedAddresses);
      } else {
        toast.info("Identificação concluída!");
      }
    } else {
      addCustomer.mutate(
        { 
          name: customerName.trim() || (isPickup ? "CLIENTE AVULSO (RETIRADA)" : "CLIENTE AVULSO"), 
          addresses: isPickup ? [] : [address.trim()], 
          phone: phone.trim() 
        }
      );
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
  const totalAmount = subtotal + (isPickup ? 0 : deliveryFee);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = items.filter((i) => i.product.trim());
    if (validItems.length === 0) {
      toast.error("Adicione pelo menos um item ao pedido");
      return;
    }

    const orderData: Omit<Order, "id" | "number" | "createdAt"> = {
      customerName: customerName.trim(),
      address: isPickup ? "" : address.trim(),
      phone: phone.trim(),
      cnpj: cnpj.trim(),
      items: validItems,
      deliveryFee: isPickup ? 0 : deliveryFee,
      totalAmount: isPickup ? subtotal : totalAmount,
      changeFor,
      status: "pending",
      paymentMethod,
      isPrinted: false,
      isPickup,
      observation: globalObservation.trim(),
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
      <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="gap-1.5 uppercase font-black text-xs">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Button>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="uppercase">Dados do Cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Busca por Telefone - Primeiro Campo SEMPRE */}
          <div className="flex gap-2 items-end sticky top-0 bg-background/80 backdrop-blur-sm z-10 py-1">
            <div className="space-y-1.5 flex-1">
              <Label htmlFor="phone-search" className="uppercase font-black text-xs">Telefone / Identificação</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                <Input
                  id="phone-search"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="pl-10 uppercase"
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handlePhoneSearch(); } }}
                />
              </div>
            </div>
            <Button type="button" variant="secondary" onClick={handlePhoneSearch} className="gap-1.5 h-10 uppercase font-black text-xs">
              <Search className="h-4 w-4" /> Buscar
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="uppercase font-black text-xs">Nome do Cliente</Label>
              <Input id="name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="NOME COMPLETO" className="uppercase placeholder:normal-case" />
            </div>

            {!isPickup && (
              <div className="space-y-1.5">
                <Label htmlFor="cnpj" className="uppercase font-black text-xs">CPF/CNPJ (Opcional)</Label>
                <Input id="cnpj" value={cnpj} onChange={(e) => setCnpj(formatCpfCnpj(e.target.value))} placeholder="000.000.000-00" />
              </div>
            )}

            {!isPickup && customerAddresses.length > 0 && (
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="uppercase font-black text-xs">Endereços Salvos</Label>
                <Select 
                  value={customerAddresses.includes(address) ? address : (address === "" ? "" : "new_address")} 
                  onValueChange={(val) => {
                    if (val === "new_address") {
                      setAddress("");
                      setTimeout(() => document.getElementById("address")?.focus(), 50);
                    } else {
                      setAddress(val);
                    }
                  }}
                >
                  <SelectTrigger className="bg-muted/30">
                    <SelectValue placeholder="SELECIONE UM ENDEREÇO SALVO OU ADICIONE..." />
                  </SelectTrigger>
                  <SelectContent>
                    {customerAddresses.map((addr, idx) => (
                      <SelectItem key={idx} value={addr} className="uppercase">{addr}</SelectItem>
                    ))}
                    <SelectItem value="new_address" className="uppercase font-bold text-primary">+ ADICIONAR NOVO ENDEREÇO...</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {!isPickup && (customerAddresses.length === 0 || !customerAddresses.includes(address)) && (
              <div className="space-y-1.5 sm:col-span-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <Label htmlFor="address" className="uppercase font-black text-xs">Endereço de Entrega</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                  <Input 
                    id="address" 
                    value={address} 
                    onChange={(e) => setAddress(e.target.value)} 
                    placeholder="RUA, NÚMERO, BAIRRO..." 
                    className="pl-10 uppercase"
                  />
                </div>
              </div>
            )}

            <div className="flex items-end pt-1 sm:col-span-2">
              <Button 
                type="button" 
                onClick={handleQuickRegister} 
                disabled={addCustomer.isPending || !customerName.trim() || !phone.trim() || (!isPickup && !address.trim())} 
                className="gap-1.5 w-full bg-orange-500 text-white hover:bg-orange-600 border-none transition-colors uppercase font-black text-xs"
              >
                <Plus className="h-4 w-4" /> {isPickup ? "Cadastrar para Retirada" : "Salvar/Atualizar Cliente no Sistema"}
              </Button>
            </div>
          </div>

          {/* Toggle Retirada - Agora fica aqui embaixo para não atrapalhar a busca */}
          <div
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none mt-4",
              isPickup
                ? "bg-primary/10 border-primary/30 ring-2 ring-primary/20"
                : "bg-secondary/40 border-border/20 hover:bg-secondary/60"
            )}
            onClick={() => {
              setIsPickup(!isPickup);
              if (!isPickup) {
                setAddress("");
                setDeliveryFee(settings.defaultDeliveryFee);
              } else {
                setDeliveryFee(0);
                setCustomerAddresses([]);
              }
            }}
          >
            <PackageCheck className={cn("h-5 w-5 shrink-0", isPickup ? "text-primary" : "text-muted-foreground")} />
            <div className="flex-1">
              <span className="font-bold text-sm uppercase">Retirada no Local</span>
              <p className="text-[10px] text-muted-foreground uppercase">Marque se o cliente vai retirar o pedido</p>
            </div>
            <div className={cn(
              "h-6 w-11 rounded-full transition-colors relative",
              isPickup ? "bg-primary" : "bg-muted"
            )}>
              <div className={cn(
                "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                isPickup ? "translate-x-5" : "translate-x-0.5"
              )} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="uppercase">Itens do Pedido</CardTitle>
          <p className="text-xs text-muted-foreground uppercase">Digite o código do produto e pressione Enter para preencher automaticamente</p>
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
            className="gap-1.5 uppercase font-black text-xs"
          >
            <Plus className="h-4 w-4" /> Adicionar Item
          </Button>
        </CardContent>
      </Card>

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

      <div className="flex items-center justify-between bg-card rounded-xl p-4 border">
        <span className="text-lg font-black uppercase">Total: R$ {totalAmount.toFixed(2)}</span>
        <Button id="submit-order" type="submit" size="lg" className="px-8 uppercase font-black">Criar Pedido</Button>
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

      <Dialog open={customerSearchOpen} onOpenChange={setCustomerSearchOpen}>
        <DialogContent className="max-w-2xl rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-6 bg-muted/30 border-b border-border/40">
            <DialogTitle className="uppercase font-black text-xl italic tracking-tighter">Buscar Cliente</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <input
              placeholder="Digite o nome ou telefone..."
              value={customerSearchQuery}
              onChange={(e) => setCustomerSearchQuery(e.target.value)}
              className="w-full h-14 px-4 rounded-xl border border-border/50 bg-background font-medium text-lg outline-none focus:border-primary transition-colors"
              autoFocus
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-2">
              {customers
                .filter(
                  (c) =>
                    !customerSearchQuery ||
                    c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
                    (c.phone && c.phone.includes(customerSearchQuery))
                )
                .slice(0, 30)
                .map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCustomer(c)}
                    className="flex flex-col p-4 bg-card border border-border/40 rounded-xl hover:border-primary/50 cursor-pointer active:scale-95 transition-all"
                  >
                    <span className="font-black text-sm uppercase">{c.name}</span>
                    {c.phone && <span className="text-xs font-bold text-primary mt-1">{c.phone}</span>}
                  </div>
                ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </form>

  );
}
