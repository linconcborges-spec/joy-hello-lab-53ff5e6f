import { useState, useEffect, useRef } from "react";
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
  UtensilsCrossed,
  ChevronRight,
  Info,
  Clock,
  ArrowRight,
  Star
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
  image_url?: string;
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

  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
    toast.success(`${quantity}x ${selectedProduct.name} no carrinho!`, {
        position: "top-center",
        className: "rounded-full bg-slate-900 text-white border-0 shadow-2xl font-bold"
    });
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
        toast.success("Pedido enviado! Prepare o estômago. 🍟", {
            duration: 5000,
            position: "top-center"
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-32 font-sans selection:bg-primary/20">
      
      {/* Banner Superior Premium */}
      <div className="relative h-[280px] w-full bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-[#FDFDFD] z-10"></div>
        <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center"></div>
        
        {/* Info Overlay */}
        <div className="absolute bottom-10 left-0 right-0 z-20 px-6 animate-in fade-in slide-in-from-bottom-5 duration-700">
           <div className="flex items-center gap-2 mb-2">
             <Badge className="bg-emerald-500 text-white border-0 text-[9px] font-black uppercase px-2 h-5 tracking-widest shadow-lg shadow-emerald-500/20">Aberto</Badge>
             <Badge className="bg-white/10 backdrop-blur-md text-white border-0 text-[10px] font-bold px-2 h-5 flex items-center gap-1">
               <Clock className="h-3 w-3" /> 20-40 min
             </Badge>
           </div>
           <h1 className="text-4xl md:text-5xl font-[1000] text-slate-900 tracking-tighter uppercase italic drop-shadow-sm leading-none">{settings.storeName}</h1>
           <p className="text-slate-500 font-bold text-xs mt-1 uppercase tracking-widest opacity-80 decoration-primary decoration-2 underline-offset-4 underline">O melhor delivery da região</p>
        </div>
      </div>

      {/* Floating Header Categories */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm transition-all duration-300">
        <div className="flex gap-4 overflow-x-auto px-6 py-4 no-scrollbar items-center">
          <button 
            onClick={() => setActiveCategory(null)}
            className={cn(
              "px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-[0.15em] transition-all duration-300 border",
              !activeCategory ? "bg-primary text-white border-primary shadow-xl shadow-primary/20 scale-105" : "bg-slate-50 text-slate-400 border-transparent hover:border-slate-200"
            )}
          >
            🔥 Destaques
          </button>
          {categories.map((cat) => (
            <button 
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-[0.15em] transition-all duration-300 border flex items-center gap-2",
                activeCategory === cat.id ? "bg-primary text-white border-primary shadow-xl shadow-primary/20 scale-105" : "bg-slate-50 text-slate-400 border-transparent hover:border-slate-200"
              )}
            >
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
        
        {/* Search Bar Minimal */}
        <div className="px-6 pb-4">
            <div className="relative group">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-primary transition-colors" />
               <input 
                 type="text"
                 placeholder="O que você deseja hoje?"
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 className="w-full h-11 pl-11 rounded-2xl bg-slate-50/50 border border-slate-100 text-sm font-bold placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/20 transition-all"
               />
            </div>
        </div>
      </div>

      {/* Product Grid Layout */}
      <div className="px-6 mt-8">
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-[1000] text-slate-900 uppercase italic tracking-tighter">
                {activeCategory ? categories.find(c => c.id === activeCategory)?.name : "Explore Nosso Menu"}
            </h2>
            <div className="h-1 w-12 bg-primary/20 rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((p) => (
            <div 
              key={p.id} 
              className="group relative bg-white rounded-[2rem] border border-slate-100 p-3 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 cursor-pointer active:scale-95"
              onClick={() => {
                  setSelectedProduct(p);
                  setSelectedAddons([]);
                  setQuantity(1);
              }}
            >
              {/* Product Card Top (Image or Abstract) */}
              <div className="relative h-44 w-full rounded-[1.5rem] bg-slate-50 overflow-hidden mb-4 border border-slate-50 group-hover:border-primary/10 transition-all">
                 <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-primary/10 opacity-60"></div>
                 <div className="absolute inset-0 flex items-center justify-center opacity-30 group-hover:scale-110 group-hover:opacity-60 transition-all duration-700">
                    <UtensilsCrossed className="h-20 w-20 text-primary rotate-45" />
                 </div>
                 
                 {/* Badge de preço flutuante */}
                 <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-2xl shadow-xl border border-white/20">
                    <span className="text-base font-[1000] text-primary italic tracking-tighter">R$ {Number(p.price).toFixed(2)}</span>
                 </div>
              </div>

              {/* Info */}
              <div className="px-2 pb-2">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="font-black text-slate-900 uppercase text-lg tracking-tight italic group-hover:text-primary transition-colors">{p.name}</h3>
                    <div className="bg-slate-50 h-8 w-8 rounded-full flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                        <Plus className="h-5 w-5" />
                    </div>
                </div>
                <p className="text-[11px] font-medium text-slate-400 mt-1 line-clamp-2 leading-relaxed h-8">{p.description || "O sabor original que você já conhece e ama."}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selection Drawer Estilo Premium (Abre de Baixo) */}
      <Drawer open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DrawerContent className="bg-white border-0 rounded-t-[3rem] max-h-[96vh]">
            <div className="mx-auto w-12 h-1.5 bg-slate-100 rounded-full mt-4 mb-2"></div>
            {selectedProduct && (
                <div className="flex flex-col h-full overflow-hidden">
                    {/* Header do Produto no Drawer */}
                    <div className="px-8 pt-6 pb-4">
                        <div className="flex items-start justify-between gap-6">
                            <div className="flex-1">
                                <h1 className="text-3xl font-[1000] text-slate-900 uppercase italic tracking-tighter leading-none mb-2">{selectedProduct.name}</h1>
                                <p className="text-sm font-bold text-slate-400 leading-relaxed italic">{selectedProduct.description || "Mais que um pedido, uma experiência de sabor exclusiva."}</p>
                            </div>
                            <div className="text-2xl font-[1000] text-primary italic tracking-widest whitespace-nowrap">R$ {Number(selectedProduct.price).toFixed(2)}</div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-8 py-4 no-scrollbar space-y-8">
                        {/* Seção de Adicionais */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 bg-primary rounded-full"></div>
                                    <span className="text-[11px] font-black uppercase text-slate-900 tracking-widest">Turbine seu Pedido</span>
                                </div>
                                <span className="text-[9px] font-black text-slate-300 uppercase">Opcionais</span>
                            </div>
                            
                            <div className="grid gap-3">
                                {addons
                                    .filter(a => !a.category_id || a.category_id === selectedProduct.category_id)
                                    .map(addon => {
                                        const isSelected = selectedAddons.some(a => a.name === addon.name);
                                        return (
                                            <div 
                                                key={addon.id}
                                                onClick={() => toggleAddon(addon)}
                                                className={cn(
                                                    "relative flex items-center justify-between p-4 rounded-[1.5rem] border transition-all duration-300 cursor-pointer overflow-hidden",
                                                    isSelected ? "bg-primary/5 border-primary shadow-lg shadow-primary/5 translate-x-1" : "bg-slate-50/50 border-slate-100 hover:border-slate-300"
                                                )}
                                            >
                                                {isSelected && <div className="absolute top-0 left-0 w-1.5 h-full bg-primary"></div>}
                                                <div className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "h-6 w-6 rounded-lg flex items-center justify-center border transition-all",
                                                        isSelected ? "bg-primary border-primary text-white" : "bg-white border-slate-200"
                                                    )}>
                                                        {isSelected && <Check className="h-4 w-4 stroke-[3px]" />}
                                                    </div>
                                                    <span className="text-sm font-black text-slate-800 uppercase italic tracking-tight">{addon.name}</span>
                                                </div>
                                                <span className="text-xs font-black text-primary italic">+ R$ {addon.price}</span>
                                            </div>
                                        );
                                    })
                                }
                            </div>
                        </div>

                        {/* Observações */}
                        <div className="space-y-3">
                             <div className="flex items-center gap-2">
                                <div className="h-2 w-2 bg-slate-300 rounded-full"></div>
                                <span className="text-[11px] font-black uppercase text-slate-900 tracking-widest">Tem alguma observação?</span>
                             </div>
                             <textarea 
                                placeholder="Ex: Sem cebola, ponto da carne, etc..."
                                className="w-full h-24 p-4 rounded-[1.5rem] bg-slate-50 border-0 focus:ring-2 focus:ring-primary/10 text-sm font-bold placeholder:text-slate-300 uppercase transition-all"
                             ></textarea>
                        </div>
                    </div>

                    {/* Footer Fixo do Drawer */}
                    <div className="px-8 pt-4 pb-10 bg-white border-t border-slate-50 flex items-center gap-4">
                        <div className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-2xl">
                             <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="h-11 w-11 bg-white rounded-xl shadow-md flex items-center justify-center active:scale-90 transition-all">
                                <Minus className="h-5 w-5 text-slate-900" />
                             </button>
                             <span className="text-xl font-black italic w-10 text-center">{quantity}</span>
                             <button onClick={() => setQuantity(quantity + 1)} className="h-11 w-11 bg-slate-900 text-white rounded-xl shadow-lg flex items-center justify-center active:scale-95 transition-all">
                                <Plus className="h-5 w-5" />
                             </button>
                        </div>
                        <Button 
                            className="flex-1 h-14 rounded-2xl bg-primary text-white font-[1000] uppercase italic text-lg shadow-2xl shadow-primary/30 flex justify-between px-6 transition-all active:scale-[0.98]"
                            onClick={handleAddToCart}
                        >
                            <span className="text-xs tracking-widest opacity-80">Finalizar</span>
                            <span>R$ {currentItemPrice.toFixed(2)}</span>
                        </Button>
                    </div>
                </div>
            )}
        </DrawerContent>
      </Drawer>

      {/* Floating Cart Button Premium */}
      {cart.length > 0 && (
        <div className="fixed bottom-8 left-0 right-0 z-50 px-6 animate-in slide-in-from-bottom-10 duration-500">
           <button 
             onClick={() => setCheckoutOpen(true)}
             className="w-full h-18 bg-slate-900 text-white rounded-[2.5rem] p-4 flex items-center justify-between shadow-2xl transition-all active:scale-95 group overflow-hidden relative"
           >
             <div className="absolute inset-x-0 h-1 top-0 bg-primary/20">
                <div className="h-full bg-primary transition-all duration-1000" style={{ width: '100%' }}></div>
             </div>
             <div className="flex items-center gap-5 ml-4">
               <div className="h-10 w-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
                  <ShoppingBag className="h-5 w-5" />
               </div>
               <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Meu Pedido</div>
                  <div className="text-sm font-black uppercase italic tracking-tighter leading-none">{cart.length} {cart.length === 1 ? 'Item' : 'Itens'}</div>
               </div>
             </div>
             
             <div className="flex items-center gap-4 mr-2">
                <div className="text-right">
                    <div className="text-[10px] font-black uppercase tracking-widest text-primary italic">Finalizar</div>
                    <div className="text-lg font-[1000] italic tracking-tighter">R$ {cartTotal.toFixed(2)}</div>
                </div>
                <div className="bg-white/10 h-10 w-10 rounded-full flex items-center justify-center group-hover:translate-x-1 transition-transform">
                   <ChevronRight className="h-6 w-6" />
                </div>
             </div>
           </button>
        </div>
      )}

      {/* Checkout Final Drawer */}
      <Drawer open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DrawerContent className="bg-white rounded-t-[3.5rem] border-0 max-h-[96vh]">
           <div className="mx-auto w-12 h-1.5 bg-slate-100 rounded-full mt-4 mb-2"></div>
           <div className="px-8 pb-12 pt-6 overflow-y-auto no-scrollbar flex flex-col gap-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-4xl font-[1000] text-slate-900 uppercase italic tracking-tighter leading-none">Checkout</h2>
                    <Button variant="ghost" size="icon" onClick={() => setCheckoutOpen(false)} className="rounded-full bg-slate-50"><X /></Button>
                </div>

                {/* Switch Entrega/Retirada Estilizado */}
                <div className="flex p-1.5 bg-slate-100 rounded-[2.5rem] relative">
                    <button 
                      onClick={() => setIsPickup(false)}
                      className={cn(
                        "flex-1 h-14 rounded-[2.2rem] flex items-center justify-center gap-2 font-[1000] uppercase text-xs italic tracking-widest transition-all z-10",
                        !isPickup ? "bg-white text-slate-900 shadow-xl" : "text-slate-400"
                      )}
                    >
                      <MapPin className="h-4 w-4" /> Delivery
                    </button>
                    <button 
                      onClick={() => setIsPickup(true)}
                      className={cn(
                        "flex-1 h-14 rounded-[2.2rem] flex items-center justify-center gap-2 font-[1000] uppercase text-xs italic tracking-widest transition-all z-10",
                        isPickup ? "bg-white text-slate-900 shadow-xl" : "text-slate-400"
                      )}
                    >
                      <ShoppingBag className="h-4 w-4" /> Retirada
                    </button>
                </div>

                {/* Form Inputs Estilizados */}
                <div className="grid gap-6">
                    <div className="space-y-2">
                         <Label className="text-[11px] font-black uppercase text-slate-900 tracking-widest ml-4">Nome Completo</Label>
                         <input 
                           placeholder="COMO TE CHAMAMOS?"
                           value={customerName}
                           onChange={(e) => setCustomerName(e.target.value)}
                           className="w-full h-14 px-6 rounded-[1.5rem] bg-slate-50 border-0 focus:ring-2 focus:ring-primary/20 text-sm font-black uppercase italic tracking-tight transition-all"
                         />
                    </div>

                    <div className="space-y-2">
                         <Label className="text-[11px] font-black uppercase text-slate-900 tracking-widest ml-4">Telefone (WhatsApp)</Label>
                         <input 
                           placeholder="(00) 0 0000-0000"
                           value={phone}
                           onChange={(e) => setPhone(e.target.value)}
                           className="w-full h-14 px-6 rounded-[1.5rem] bg-slate-50 border-0 focus:ring-2 focus:ring-primary/20 text-sm font-black italic tracking-tight transition-all"
                         />
                    </div>

                    {!isPickup && (
                        <div className="space-y-2">
                             <Label className="text-[11px] font-black uppercase text-slate-900 tracking-widest ml-4">Endereço de Entrega</Label>
                             <input 
                               placeholder="RUA, NÚMERO, BAIRRO..."
                               value={address}
                               onChange={(e) => setAddress(e.target.value)}
                               className="w-full h-14 px-6 rounded-[1.5rem] bg-slate-50 border-0 focus:ring-2 focus:ring-primary/20 text-sm font-black uppercase italic tracking-tight transition-all"
                             />
                        </div>
                    )}

                    <div className="space-y-4">
                         <Label className="text-[11px] font-black uppercase text-slate-900 tracking-widest ml-4">Forma de Pagamento</Label>
                         <div className="grid grid-cols-3 gap-3">
                            {[
                                { id: "cash", label: "Dinheiro", icon: Banknote },
                                { id: "card", label: "Cartão", icon: CreditCard },
                                { id: "pix", label: "PIX", icon: QrCode },
                            ].map((method) => (
                                <button 
                                    key={method.id}
                                    onClick={() => setPaymentMethod(method.id as any)}
                                    className={cn(
                                        "h-20 rounded-[1.8rem] border-2 flex flex-col items-center justify-center gap-2 transition-all",
                                        paymentMethod === method.id ? "bg-slate-900 border-slate-900 text-white scale-105 shadow-xl" : "bg-white border-slate-100 text-slate-400"
                                    )}
                                >
                                    <method.icon className="h-6 w-6" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">{method.label}</span>
                                </button>
                            ))}
                         </div>
                    </div>
                </div>

                {/* Resumo Estilizado */}
                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10"><UtensilsCrossed className="h-20 w-20 rotate-45" /></div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest opacity-60"><span>Itens ({cart.length})</span><span>R$ {cartTotal.toFixed(2)}</span></div>
                    {!isPickup && <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest opacity-60"><span>Taxa de Entrega</span><span>R$ {settings.defaultDeliveryFee.toFixed(2)}</span></div>}
                    <div className="h-[1px] bg-white/10 my-4"></div>
                    <div className="flex justify-between items-center">
                        <span className="text-lg font-[1000] uppercase italic italic italic tracking-tighter">Total Geral</span>
                        <span className="text-3xl font-[1000] text-primary italic tracking-tighter">R$ {totalWithDelivery.toFixed(2)}</span>
                    </div>
                </div>

                <Button 
                    onClick={handleFinishOrder} 
                    disabled={addOrder.isPending}
                    className="w-full h-18 rounded-[2.5rem] bg-primary text-white font-[1000] uppercase italic text-xl tracking-widest shadow-2xl shadow-primary/40 active:scale-95 transition-all mb-4"
                >
                    {addOrder.isPending ? "Criando Pedido..." : "Finalizar Pedido Agora"}
                </Button>
           </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
