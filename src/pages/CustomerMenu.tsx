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
  Clock,
  Instagram,
  Facebook,
  MessageCircle,
  Info,
  ChevronLeft
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
  const [isSearching, setIsSearching] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  // Selection states
  const [selectedAddons, setSelectedAddons] = useState<any[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [itemObservation, setItemObservation] = useState("");

  // Checkout States
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [isPickup, setIsPickup] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "pix">("cash");
  const [changeFor, setChangeFor] = useState("");
  const [globalObservation, setGlobalObservation] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 280);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
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
    setCart([...cart, { 
      id: crypto.randomUUID(), 
      productCode: selectedProduct.code?.toString() || "",
      product: selectedProduct.name,
      quantity: quantity,
      unitPrice: selectedProduct.price,
      addons: [...selectedAddons],
      total: itemTotal,
      categoryId: selectedProduct.category_id,
      observation: itemObservation
    }]);
    setSelectedProduct(null);
    setSelectedAddons([]);
    setQuantity(1);
    setItemObservation("");
    toast.success("Adicionado!");
  };

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
      observation: globalObservation,
      isPrinted: false
    }, {
      onSuccess: () => {
        setCart([]);
        setCheckoutOpen(false);
        setGlobalObservation("");
        toast.success("Pedido enviado! 🚀");
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-32 font-inter selection:bg-rose-100">
      
      {/* Sticky Header Small (Appears on Scroll) */}
      <div className={cn(
        "fixed top-0 left-0 right-0 h-16 bg-white z-[50] flex items-center px-6 transition-all duration-300 shadow-sm border-b",
        scrolled ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      )}>
         <h1 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">{settings.storeName}</h1>
      </div>

      {/* Banner Superior Estilo Hexágonos */}
      <div className="relative h-44 md:h-64 w-full bg-[#E11D48]">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
      </div>

      {/* Info Loja Header */}
      <div className="px-6 -mt-10 relative z-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
           <div className="flex items-end gap-5">
              <div className="h-24 w-24 md:h-32 md:w-32 bg-white rounded-[12px] shadow-2xl p-2 border-4 border-white overflow-hidden">
                <div className="h-full w-full bg-rose-700 rounded-lg flex items-center justify-center text-white">
                    <span className="text-3xl font-black italic tracking-tighter">IC</span>
                </div>
              </div>
              <div className="pb-1">
                <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">{settings.storeName}</h1>
                    <Badge variant="outline" className="bg-slate-100 text-slate-600 border-none h-5 px-1.5 text-[10px] uppercase font-black tracking-widest flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div> Aberto
                    </Badge>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 text-[10px] md:text-xs font-medium uppercase tracking-tighter opacity-70">
                    <MapPin className="h-3 w-3" /> {settings.storeAddress || "Av. Napoleão Rodrigues Parente, 55 - Portal Doutor José"}
                </div>
              </div>
           </div>
           
           <div className="flex items-center gap-2 pb-1">
              <button className="h-9 w-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all"><MessageCircle className="h-4 w-4" /></button>
              <button className="h-9 w-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all"><Instagram className="h-4 w-4" /></button>
              <button className="h-9 w-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all"><Facebook className="h-4 w-4" /></button>
              <Button variant="outline" size="sm" className="h-9 rounded-xl font-black uppercase text-[10px] gap-2 border-slate-200 bg-white"><Info className="h-4 w-4" /> Informação</Button>
           </div>
        </div>
      </div>

      {/* Categories Bar & Search (The OlaClick Way) */}
      <div className="sticky top-0 md:top-16 z-40 bg-white border-b border-slate-100 transition-all duration-300">
        <div className="flex items-center h-16 w-full relative">
            
            {/* Search Overlay (Expands) */}
            <div className={cn(
                "absolute inset-0 bg-white z-50 flex items-center px-4 transition-all duration-300",
                isSearching ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-full pointer-events-none"
            )}>
                <input 
                    type="text" 
                    placeholder="O que você está procurando?" 
                    className="flex-1 h-12 bg-transparent outline-none font-bold text-sm uppercase tracking-tight"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    autoFocus={isSearching}
                />
                <button onClick={() => setIsSearching(false)} className="h-10 w-10 flex items-center justify-center text-rose-600">
                    <X className="h-6 w-6" />
                </button>
            </div>

            {/* Normal Bar */}
            <div className="flex items-center gap-0 overflow-x-auto px-4 no-scrollbar flex-1 h-full">
                <button 
                   onClick={() => setIsSearching(true)}
                   className="h-12 w-12 flex items-center justify-center text-slate-900 mr-2 shrink-0 border-r"
                >
                    <Search className="h-5 w-5" />
                </button>
                
                <button 
                    onClick={() => setActiveCategory(null)}
                    className={cn(
                        "px-6 h-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-[3px]",
                        !activeCategory ? "border-rose-600 text-rose-600" : "border-transparent text-slate-500"
                    )}
                >
                    !! PROMOÇÃO !!
                </button>
                {categories.map((cat) => (
                    <button 
                    key={cat.id}
                    onClick={() => {
                        setActiveCategory(cat.id);
                        const el = document.getElementById(cat.id);
                        if (el) window.scrollTo({ top: el.offsetTop - 120, behavior: 'smooth' });
                    }}
                    className={cn(
                        "px-6 h-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-[3px] flex items-center gap-2",
                        activeCategory === cat.id ? "border-rose-600 text-rose-600" : "border-transparent text-slate-500"
                    )}
                    >
                    {cat.name}
                    </button>
                ))}
            </div>
        </div>
      </div>

      {/* Menu List */}
      <div className="px-6 py-8 max-w-4xl mx-auto space-y-12">
        {(!activeCategory ? categories : categories.filter(c => c.id === activeCategory)).map((cat) => {
            const catProducts = products.filter(p => p.category_id === cat.id && (p.name.toLowerCase().includes(search.toLowerCase())));
            if (catProducts.length === 0) return null;

            return (
                <div key={cat.id} id={cat.id} className="animate-in fade-in duration-500">
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-8 flex items-center gap-3">
                        {cat.name}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        {catProducts.map(p => (
                            <div 
                                key={p.id}
                                onClick={() => {
                                    setSelectedProduct(p);
                                    setSelectedAddons([]);
                                    setQuantity(1);
                                    setItemObservation("");
                                }}
                                className="bg-white rounded-[12px] p-0 flex gap-0 hover:shadow-lg transition-all cursor-pointer overflow-hidden border border-slate-100"
                            >
                                <div className="flex-1 p-4 flex flex-col justify-between">
                                    <div className="space-y-1">
                                        <h3 className="font-black text-sm text-slate-900 uppercase tracking-tight leading-tight">{p.name}</h3>
                                        <p className="text-[10px] text-slate-400 font-bold leading-relaxed line-clamp-2">
                                            {p.description || "Ingredientes selecionados para o melhor sabor do Império."}
                                        </p>
                                    </div>
                                    <span className="text-base font-black text-slate-900 mt-2">R$ {Number(p.price).toFixed(2)}</span>
                                </div>
                                
                                <div className="relative h-28 w-28 md:h-32 md:w-32 bg-[#F8F9FA] shrink-0 overflow-hidden">
                                     <div className="absolute inset-0 flex items-center justify-center opacity-10">
                                        <UtensilsCrossed className="h-10 w-10 text-rose-600" />
                                     </div>
                                     {p.image_url && <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />}
                                     
                                     {/* Botão + OlaClick Style */}
                                     <div className="absolute bottom-1 right-1 h-9 w-9 bg-rose-600 rounded-full flex items-center justify-center text-white shadow-xl active:scale-95 transition-all z-10 border-2 border-white">
                                        <Plus className="h-5 w-5 stroke-[4px]" />
                                     </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        })}
      </div>

      {/* Item Order Drawer */}
      <Drawer open={!!selectedProduct} onOpenChange={(o) => !o && setSelectedProduct(null)}>
        <DrawerContent className="bg-white border-0 rounded-t-[32px] max-h-[96vh]">
            <div className="mx-auto w-12 h-1.5 bg-slate-100 rounded-full mt-4 mb-2"></div>
            {selectedProduct && (
                <div className="flex flex-col h-full">
                    {/* Header Item */}
                    <div className="px-8 py-6 border-b border-slate-50">
                         <div className="flex justify-between items-start">
                             <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter leading-tight">{selectedProduct.name}</h2>
                             <span className="text-lg font-black text-rose-600 italic">R$ {Number(selectedProduct.price).toFixed(2)}</span>
                         </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-8 py-8 no-scrollbar space-y-10">
                         {/* Adicionais */}
                         <div className="space-y-5">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block border-l-4 border-rose-600 pl-3">Adicionais</span>
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
                                                    "flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer",
                                                    isSelected ? "bg-rose-50 border-rose-200" : "bg-white border-slate-100"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={cn("h-5 w-5 rounded-md border flex items-center justify-center transition-all", isSelected ? "bg-rose-600 border-rose-600 text-white" : "border-slate-300 bg-white")}>
                                                        {isSelected && <Check className="h-3.5 w-3.5 stroke-[3px]" />}
                                                    </div>
                                                    <span className="text-xs font-black text-slate-800 uppercase italic">{addon.name}</span>
                                                </div>
                                                <span className="text-xs font-black text-rose-600 italic">+ R$ {addon.price}</span>
                                            </div>
                                        );
                                    })
                                }
                            </div>
                         </div>

                         {/* Observação Item */}
                         <div className="space-y-4">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block border-l-4 border-slate-200 pl-3">Observações</span>
                            <textarea 
                                value={itemObservation}
                                onChange={(e) => setItemObservation(e.target.value)}
                                placeholder="EX: SEM CEBOLA, SEM MOLHO..."
                                className="w-full h-28 bg-slate-50 border-0 rounded-2xl p-5 text-xs font-bold placeholder:text-slate-300 uppercase focus:ring-2 focus:ring-rose-100 transition-all"
                            ></textarea>
                         </div>
                    </div>

                    {/* Footer Order Selection */}
                    <div className="px-8 pb-10 pt-4 flex items-center gap-4 bg-white border-t">
                        <div className="flex items-center gap-4 bg-slate-100 p-1.5 rounded-2xl">
                             <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="h-10 w-10 bg-white rounded-xl shadow-sm flex items-center justify-center"><Minus className="h-4 w-4" /></button>
                             <span className="text-lg font-black w-6 text-center italic">{quantity}</span>
                             <button onClick={() => setQuantity(quantity + 1)} className="h-10 w-10 bg-rose-600 text-white rounded-xl flex items-center justify-center shadow-md"><Plus className="h-4 w-4" /></button>
                        </div>
                        <Button 
                            className="flex-1 h-14 rounded-2xl bg-rose-600 font-black uppercase italic tracking-widest text-base shadow-2xl shadow-rose-500/20"
                            onClick={handleAddToCart}
                        >
                            Confirmar R$ {( (Number(selectedProduct.price) + selectedAddons.reduce((s, a) => s + a.price, 0)) * quantity ).toFixed(2)}
                        </Button>
                    </div>
                </div>
            )}
        </DrawerContent>
      </Drawer>

      {/* Floating View Cart Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] md:w-[450px] z-50 animate-in slide-in-from-bottom-10 duration-500">
            <button 
                onClick={() => setCheckoutOpen(true)}
                className="w-full h-18 bg-rose-600 text-white rounded-[24px] flex items-center justify-between px-10 shadow-3xl shadow-rose-900/40 active:scale-95 transition-all"
            >
                <div className="flex flex-col items-start gap-0">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80 decoration-white/20 underline underline-offset-4">Meu Carrinho</span>
                    <span className="text-lg font-black italic tracking-tighter uppercase leading-none">{cart.length} {cart.length === 1 ? 'Produto' : 'Produtos'}</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-2xl font-black italic tracking-tighter">R$ {cartTotal.toFixed(2)}</span>
                    <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center group-hover:translate-x-1 transition-all"><Plus className="h-5 w-5 rotate-45" /></div>
                </div>
            </button>
        </div>
      )}

      {/* Checkout Drawer (Final Flow) */}
      <Drawer open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DrawerContent className="bg-white rounded-t-[40px] border-0 max-h-[96vh]">
            <div className="mx-auto w-12 h-1.5 bg-slate-100 rounded-full mt-4 mb-2"></div>
            <div className="px-8 pb-12 pt-6 overflow-y-auto no-scrollbar flex flex-col gap-10">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Finalizar Pedido</h2>
                    <Badge className="bg-rose-50 text-rose-600 border-none font-black px-3 py-1">PASSO ÚNICO</Badge>
                </div>

                <div className="grid gap-8">
                    {/* Delivery Toggle Style OlaClick */}
                    <div className="flex p-2 bg-slate-50 border border-slate-100 rounded-[20px]">
                        <button onClick={() => setIsPickup(false)} className={cn("flex-1 h-12 rounded-[14px] text-[11px] font-black uppercase flex items-center justify-center gap-2 transition-all", !isPickup ? "bg-white shadow-md text-rose-600" : "text-slate-400")}>🛵 Delivery</button>
                        <button onClick={() => setIsPickup(true)} className={cn("flex-1 h-12 rounded-[14px] text-[11px] font-black uppercase flex items-center justify-center gap-2 transition-all", isPickup ? "bg-white shadow-md text-rose-600" : "text-slate-400")}>🛍️ Retirada</button>
                    </div>

                    <div className="space-y-3">
                        <Label className="uppercase font-black text-[10px] text-slate-400 tracking-widest pl-2">Informações Iniciais</Label>
                        <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="SEU NOME" className="w-full h-14 bg-slate-50 px-6 rounded-2xl border-0 font-black text-xs uppercase focus:ring-2 focus:ring-rose-100 transition-all" />
                        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="SEU WHATSAPP" className="w-full h-14 bg-slate-50 px-6 rounded-2xl border-0 font-black text-xs focus:ring-2 focus:ring-rose-100 transition-all" />
                    </div>

                    {!isPickup && (
                        <div className="space-y-3">
                            <Label className="uppercase font-black text-[10px] text-slate-400 tracking-widest pl-2">Onde Entregamos?</Label>
                            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="ENDEREÇO COMPLETO..." className="w-full h-14 bg-slate-50 px-6 rounded-2xl border-0 font-black text-[10px] uppercase focus:ring-2 focus:ring-rose-100 transition-all" />
                        </div>
                    )}

                    <div className="space-y-4">
                        <Label className="uppercase font-black text-[10px] text-slate-400 tracking-widest pl-2">Forma de Pagamento</Label>
                        <div className="grid grid-cols-3 gap-3">
                            {["cash", "card", "pix"].map(m => (
                                <button key={m} onClick={() => setPaymentMethod(m as any)} className={cn("h-20 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all", paymentMethod === m ? "bg-slate-900 border-slate-900 text-white scale-105 shadow-xl" : "bg-white border-slate-100 text-slate-300")}>
                                    {m === 'cash' ? <Banknote className="h-6 w-6" /> : m === 'card' ? <CreditCard className="h-4 w-4" /> : <QrCode className="h-4 w-4" />}
                                    <span className="text-[9px] font-black uppercase">{m === 'cash' ? 'Dinheiro' : m === 'card' ? 'Cartão' : 'PIX'}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-[#18181B] rounded-[32px] p-8 text-white space-y-4">
                    <div className="flex justify-between items-center opacity-40 text-[10px] font-black uppercase"><span>Valor dos Produtos</span><span>R$ {cartTotal.toFixed(2)}</span></div>
                    {!isPickup && <div className="flex justify-between items-center opacity-40 text-[10px] font-black uppercase"><span>Taxa de Entrega Fixa</span><span>R$ {settings.defaultDeliveryFee.toFixed(2)}</span></div>}
                    <div className="h-[1px] bg-white/5 my-2"></div>
                    <div className="flex justify-between items-center">
                        <span className="text-xl font-[1000] uppercase italic tracking-tighter">Total do Pedido</span>
                        <span className="text-3xl font-[1000] text-rose-500 italic tracking-tighter">R$ {totalWithDelivery.toFixed(2)}</span>
                    </div>
                </div>

                <Button onClick={handleFinishOrder} disabled={addOrder.isPending} className="w-full h-18 rounded-[24px] bg-rose-600 text-white font-[1000] uppercase italic tracking-[0.2em] text-lg shadow-3xl shadow-rose-900/20 active:scale-95 transition-all">
                    {addOrder.isPending ? "PROCESSANDO..." : "CONFIRMAR E ENVIAR"}
                </Button>
            </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
