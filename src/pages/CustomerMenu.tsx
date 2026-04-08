import { useState, useEffect } from "react";
import { 
  ShoppingBag, 
  Search, 
  Plus, 
  Minus, 
  MapPin, 
  Check,
  X,
  CreditCard,
  Banknote,
  QrCode,
  UtensilsCrossed
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/hooks/useSettings";
import { useAddons } from "@/hooks/useAddons";
import { useAddOrder } from "@/hooks/useOrders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";

type Category = { id: string; name: string };
type Product = { 
  id: string; 
  name: string; 
  price: number; 
  category_id: string; 
  code: number;
  description?: string;
};

export default function CustomerMenu() {
  const { settings } = useSettings();
  const { data: addons = [] } = useAddons();
  const addOrder = useAddOrder();

  const [cart, setCart] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Selection states
  const [selectedAddons, setSelectedAddons] = useState<any[]>([]);
  const [quantity, setQuantity] = useState(1);

  // Checkout States
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [isPickup, setIsPickup] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "pix">("cash");
  const [changeFor, setChangeFor] = useState("");
  const [observation, setObservation] = useState("");

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories_public"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("name");
      return data as Category[];
    }
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products_public"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").order("name");
      return data as Product[];
    }
  });

  const filteredProducts = products.filter(p => 
    (!activeCategory || p.category_id === activeCategory) &&
    (p.name.toLowerCase().includes(search.toLowerCase()))
  );

  const cartTotal = cart.reduce((acc, item) => acc + (item.total * item.quantity), 0);
  const totalWithDelivery = cartTotal + (isPickup ? 0 : settings.defaultDeliveryFee);

  const toggleAddon = (addon: any) => {
    if (selectedAddons.find(a => a.name === addon.name)) {
      setSelectedAddons(selectedAddons.filter(a => a.name !== addon.name));
    } else {
      setSelectedAddons([...selectedAddons, { name: addon.name, price: Number(addon.price) }]);
    }
  };

  const handleAddToCart = () => {
    const itemTotal = selectedProduct.price + selectedAddons.reduce((s, a) => s + a.price, 0);
    const cartItem = { 
      id: crypto.randomUUID(), 
      productCode: selectedProduct.code.toString(),
      product: selectedProduct.name,
      quantity: quantity,
      unitPrice: selectedProduct.price,
      addons: [...selectedAddons],
      total: itemTotal,
      categoryId: selectedProduct.category_id,
      observation: ""
    };
    setCart([...cart, cartItem]);
    setSelectedProduct(null);
    setSelectedAddons([]);
    setQuantity(1);
    toast.success(`${quantity}x ${selectedProduct.name} adicionado!`);
  };

  const currentItemPrice = selectedProduct ? (selectedProduct.price + selectedAddons.reduce((s, a) => s + a.price, 0)) * quantity : 0;

  const handleFinishOrder = () => {
    if (!customerName || !phone || (!isPickup && !address)) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    addOrder.mutate({
      customerName,
      phone,
      address: isPickup ? "RETIRADA NO LOCAL" : address,
      items: cart,
      paymentMethod,
      deliveryFee: isPickup ? 0 : settings.defaultDeliveryFee,
      totalAmount: totalWithDelivery,
      changeFor: paymentMethod === "cash" ? parseFloat(changeFor) || 0 : 0,
      status: "pending",
      isPickup,
      observation,
      isPrinted: false
    }, {
      onSuccess: () => {
        setCart([]);
        setCheckoutOpen(false);
        toast.success("Pedido enviado com sucesso! Aguarde a confirmação.");
      }
    });
  };

  return (
    <div className="min-h-screen bg-white pb-32 font-sans selection:bg-primary/10 selection:text-primary">
      {/* Wave Decor Header */}
      <div className="h-4 p-0 bg-primary/5"></div>
      
      {/* Header */}
      <div className="bg-white px-6 pt-8 pb-6 sticky top-0 z-40">
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-1">
            <h1 className="text-3xl font-[1000] text-slate-900 tracking-tighter uppercase italic leading-none">{settings.storeName}</h1>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Cardápio On-line Aberto</p>
            </div>
          </div>
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-orange-400 rounded-3xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative h-14 w-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-900 shadow-sm overflow-hidden">
               <ShoppingBag className="h-7 w-7" />
               <div className="absolute top-2 right-2 h-2 w-2 bg-primary rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
          </div>
          <Input 
            placeholder="O que você quer comer hoje?" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-14 pl-12 pr-4 rounded-[1.5rem] border-none bg-slate-100/80 font-bold placeholder:font-bold placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-primary/20 transition-all text-sm md:text-base"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-3 overflow-x-auto px-6 py-2 no-scrollbar">
        <button 
          onClick={() => setActiveCategory(null)}
          className={cn(
            "px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300",
            !activeCategory ? "bg-slate-900 text-white shadow-xl shadow-slate-200" : "bg-white text-slate-400 border border-slate-100 hover:border-slate-300"
          )}
        >
          🍔 Todos
        </button>
        {categories.map((cat) => (
          <button 
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              "px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300",
              activeCategory === cat.id ? "bg-slate-900 text-white shadow-xl shadow-slate-200" : "bg-white text-slate-400 border border-slate-100 hover:border-slate-300"
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Product List */}
      <div className="px-6 space-y-5 mt-6">
        {filteredProducts.map((p) => (
          <div 
            key={p.id} 
            className="group block bg-white border border-slate-100 rounded-[2.5rem] p-4 active:scale-[0.97] transition-all hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 cursor-pointer"
            onClick={() => {
                setSelectedProduct(p);
                setSelectedAddons([]);
                setQuantity(1);
            }}
          >
            <div className="flex items-center gap-5">
              <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-[2rem] bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-primary/5 group-hover:text-primary/20 transition-colors shrink-0">
                <UtensilsCrossed className="h-10 w-10 sm:h-12 sm:w-12 rotate-45" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-[1000] text-slate-900 uppercase tracking-tighter text-base sm:text-lg italic leading-tight">{p.name}</h3>
                  <div className="h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shrink-0">
                    <Plus className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-[11px] font-medium text-slate-500 line-clamp-2 leading-relaxed opacity-80">{p.description || "Ingredientes selecionados para o melhor sabor."}</p>
                <div className="flex items-center gap-3 pt-2">
                  <span className="text-lg font-[1000] text-primary italic tracking-tighter">R$ {Number(p.price).toFixed(2)}</span>
                  {p.code && <Badge variant="secondary" className="bg-slate-100 text-slate-400 border-none font-black text-[9px] uppercase tracking-widest px-2 h-5">ID {p.code}</Badge>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Selection Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-[480px] w-[95%] p-0 border-none rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          {selectedProduct && (
            <div className="bg-white flex flex-col max-h-[90vh]">
              <div className="h-40 bg-primary/5 relative flex items-center justify-center">
                 <UtensilsCrossed className="h-16 w-16 text-primary opacity-20 rotate-45" />
              </div>

              <div className="p-8 space-y-8 overflow-y-auto no-scrollbar">
                <div>
                  <h2 className="text-3xl font-[1000] text-slate-900 uppercase tracking-tighter italic leading-none">{selectedProduct.name}</h2>
                  <p className="text-xs font-medium text-slate-500 mt-3 leading-relaxed">{selectedProduct.description || "Customize seu pedido com os nossos melhores adicionais!"}</p>
                </div>
                
                <div className="space-y-4">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] block mb-2">Adicionais</span>
                  <div className="grid gap-2">
                    {addons
                      .filter(a => !a.category_id || a.category_id === selectedProduct.category_id)
                      .map(addon => {
                        const isSelected = selectedAddons.some(a => a.name === addon.name);
                        return (
                          <div 
                            key={addon.id} 
                            onClick={() => toggleAddon(addon)}
                            className={cn(
                              "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer select-none",
                              isSelected ? "bg-primary/5 border-primary/30" : "bg-slate-50/50 border-slate-100"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "h-5 w-5 rounded-md border flex items-center justify-center transition-all",
                                isSelected ? "bg-primary border-primary text-white" : "border-slate-300 bg-white"
                              )}>
                                {isSelected && <Check className="h-3 w-3" />}
                              </div>
                              <span className="text-xs font-black text-slate-700 uppercase italic tracking-tight">{addon.name}</span>
                            </div>
                            <span className="text-xs font-black text-primary/40 italic">+R$ {addon.price}</span>
                          </div>
                        );
                      })
                    }
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Quantidade</span>
                  <div className="flex items-center gap-4 bg-slate-100 p-1 rounded-xl">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="h-8 w-8 flex items-center justify-center bg-white rounded-lg shadow-sm"><Minus className="h-4 w-4" /></button>
                    <span className="text-sm font-black italic">{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)} className="h-8 w-8 flex items-center justify-center bg-primary text-white rounded-lg"><Plus className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>

              <div className="p-8 pt-0 mt-auto">
                <Button 
                  className="w-full h-14 rounded-2xl font-black uppercase italic tracking-widest text-lg shadow-2xl flex justify-between px-8"
                  onClick={handleAddToCart}
                >
                  <span>Adicionar</span>
                  <span>R$ {currentItemPrice.toFixed(2)}</span>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cart Float */}
      {cart.length > 0 && (
        <div className="fixed bottom-8 left-6 right-6 z-50">
          <Button 
            onClick={() => setCheckoutOpen(true)}
            className="w-full h-16 rounded-full bg-slate-900 text-white flex items-center justify-between px-8 shadow-2xl active:scale-95 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center font-black italic">{cart.length}</div>
              <span className="uppercase font-black italic tracking-widest text-xs">Carrinho</span>
            </div>
            <span className="text-lg font-black italic">R$ {cartTotal.toFixed(2)}</span>
          </Button>
        </div>
      )}

      {/* Checkout Drawer */}
      <Drawer open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DrawerContent className="max-h-[95vh] rounded-t-[3rem]">
          <div className="mx-auto w-12 h-1.5 bg-slate-200 rounded-full mt-4 mb-6"></div>
          <div className="px-8 pb-12 overflow-y-auto no-scrollbar">
            <h2 className="text-3xl font-[1000] text-slate-900 uppercase tracking-tighter italic mb-8">Finalizar</h2>
            
            <div className="space-y-8">
              <div className="flex gap-2">
                <button onClick={() => setIsPickup(false)} className={cn("flex-1 p-4 rounded-2xl border font-black uppercase text-[10px] tracking-widest transition-all", !isPickup ? "bg-primary/10 border-primary text-primary" : "opacity-40")}>Entrega</button>
                <button onClick={() => setIsPickup(true)} className={cn("flex-1 p-4 rounded-2xl border font-black uppercase text-[10px] tracking-widest transition-all", isPickup ? "bg-primary/10 border-primary text-primary" : "opacity-40")}>Retirada</button>
              </div>

              <div className="grid gap-6">
                <div className="space-y-2">
                  <Label className="uppercase font-black text-[10px] tracking-widest text-slate-400">Nome</Label>
                  <Input placeholder="SEU NOME" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="h-12 rounded-xl bg-slate-50 border-none font-bold uppercase"/>
                </div>
                <div className="space-y-2">
                  <Label className="uppercase font-black text-[10px] tracking-widest text-slate-400">WhatsApp</Label>
                  <Input placeholder="(00) 0 0000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-12 rounded-xl bg-slate-50 border-none font-bold"/>
                </div>
                {!isPickup && (
                  <div className="space-y-2">
                    <Label className="uppercase font-black text-[10px] tracking-widest text-slate-400">Endereço</Label>
                    <Input placeholder="RUA, NÚMERO, BAIRRO..." value={address} onChange={(e) => setAddress(e.target.value)} className="h-12 rounded-xl bg-slate-50 border-none font-bold uppercase text-[10px]"/>
                  </div>
                )}
                
                <div className="space-y-4">
                  <Label className="uppercase font-black text-[10px] tracking-widest text-slate-400">Pagamento</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => setPaymentMethod("cash")} className={cn("p-4 rounded-xl border flex flex-col items-center gap-1 transition-all", paymentMethod === "cash" ? "bg-slate-900 text-white" : "text-slate-400")}>
                      <Banknote className="h-4 w-4" /><span className="text-[8px] font-black uppercase">Dinheiro</span>
                    </button>
                    <button onClick={() => setPaymentMethod("card")} className={cn("p-4 rounded-xl border flex flex-col items-center gap-1 transition-all", paymentMethod === "card" ? "bg-slate-900 text-white" : "text-slate-400")}>
                      <CreditCard className="h-4 w-4" /><span className="text-[8px] font-black uppercase">Cartão</span>
                    </button>
                    <button onClick={() => setPaymentMethod("pix")} className={cn("p-4 rounded-xl border flex flex-col items-center gap-1 transition-all", paymentMethod === "pix" ? "bg-slate-900 text-white" : "text-slate-400")}>
                      <QrCode className="h-4 w-4" /><span className="text-[8px] font-black uppercase">PIX</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-[2rem] space-y-2 font-black uppercase text-[10px] tracking-widest">
                <div className="flex justify-between text-slate-400"><span>Itens</span><span>R$ {cartTotal.toFixed(2)}</span></div>
                {!isPickup && <div className="flex justify-between text-slate-400"><span>Taxa</span><span>R$ {settings.defaultDeliveryFee.toFixed(2)}</span></div>}
                <div className="flex justify-between text-xl text-slate-900 pt-2 border-t mt-2"><span>Total</span><span>R$ {totalWithDelivery.toFixed(2)}</span></div>
              </div>

              <Button onClick={handleFinishOrder} disabled={addOrder.isPending} className="w-full h-16 rounded-full bg-primary text-white font-black uppercase italic tracking-widest text-lg shadow-2xl">
                {addOrder.isPending ? "Processando..." : "Enviar Pedido"}
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
