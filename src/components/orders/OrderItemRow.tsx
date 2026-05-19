import { useState } from "react";
import { Trash2, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import type { OrderItem } from "@/types/order";

interface OrderItemRowProps {
  item: OrderItem;
  items: OrderItem[];
  setItems: React.Dispatch<React.SetStateAction<OrderItem[]>>;
  updateItem: (id: string, field: keyof OrderItem, value: string | number) => void;
  handleProductCodeSearch: (itemId: string, code: string) => void;
  addons: any[];
  toggleAddon: (itemId: string, addon: { name: string; price: number }) => void;
  products: any[];
}

export function OrderItemRow({
  item,
  items,
  setItems,
  updateItem,
  handleProductCodeSearch,
  addons,
  toggleAddon,
  products,
}: OrderItemRowProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="bg-secondary/40 rounded-[2rem] p-4 sm:p-6 space-y-5 border border-border/20 shadow-sm">
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

        {/* 3. Produto */}
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
                    updateItem(item.id, "product", v);
                  }}
                  className="h-14 font-bold uppercase"
                />
                <CommandList className="max-h-[300px]">
                  <CommandEmpty className="py-6 text-center text-xs font-black uppercase opacity-30">ENTER PARA USAR "{searchQuery.toUpperCase()}"</CommandEmpty>
                  <CommandGroup>
                    {products
                      .filter((p: any) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((produto: any) => (
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

        {/* 6. Subtotal */}
        <div className="space-y-1.5 flex flex-col text-right">
          <Label className="text-[10px] font-black uppercase opacity-60">Subtotal</Label>
          <div className="md:h-11 h-12 flex items-center justify-end">
            <span className="text-sm font-black text-primary">R$ {item.total.toFixed(2)}</span>
          </div>
        </div>

        {/* 7. Remover */}
        <div className="space-y-1.5 flex flex-col items-end">
          <Label className="text-[10px] font-black uppercase opacity-0 mr-2 md:block hidden">Ação</Label>
          <div className="md:h-11 h-12 flex items-center">
            {items.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-destructive/40 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                onClick={() => setItems((p) => p.filter((i) => i.id !== item.id))}
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Adicionais */}
      <div className="space-y-3 bg-background/30 p-4 rounded-2xl border border-border/10">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-black uppercase opacity-50 tracking-widest">Adicionais Extras</Label>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {addons
            .filter((addon: any) => {
              const ids: string[] = addon.category_ids ?? (addon.category_id ? [addon.category_id] : []);
              return ids.length === 0 || (item.categoryId && ids.includes(item.categoryId));
            })
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
          {addons.filter((addon: any) => {
            const ids: string[] = addon.category_ids ?? (addon.category_id ? [addon.category_id] : []);
            return ids.length === 0 || (item.categoryId && ids.includes(item.categoryId));
          }).length === 0 && (
            <span className="text-xs text-muted-foreground uppercase font-black opacity-20">Nenhum adicional p/ esta categoria</span>
          )}
        </div>
      </div>
    </div>
  );
}
