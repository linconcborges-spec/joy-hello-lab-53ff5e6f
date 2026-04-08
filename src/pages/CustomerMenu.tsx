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
  Menu as MenuIcon
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
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
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
      cnpj: "",
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
    <div className="min-h-screen bg-[#fcfcfc] pb-32 font-inter selection:bg-rose-100">
      
      {/* Banner Superior Estilo Hexágonos */}
      <div className="relative h-44 md:h-64 w-full bg-rose-900">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: `url('${settings.bannerUrl || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop"}')` }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
      </div>

      {/* Info Loja Header */}
      <div className="px-6 -mt-10 relative z-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
           <div className="flex items-end gap-4">
              <div className="h-24 w-24 md:h-32 md:w-32 bg-white rounded-2xl shadow-2xl p-2 border-4 border-white overflow-hidden">
                <div className="h-full w-full bg-rose-700 rounded-xl flex items-center justify-center text-white overflow-hidden">
                    {settings.logoUrl ? (
                      <img src={settings.logoUrl} alt={settings.storeName} className="h-full w-full object-contain" />
                    ) : (
                      <span className="text-3xl font-black italic tracking-tighter">IC</span>
                    )}
                </div>
              </div>
              <div className="pb-1">
                <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">{settings.storeName}</h1>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 h-5 px-1.5 text-[10px] uppercase font-bold">Aberto</Badge>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] md:text-xs font-medium uppercase tracking-tighter">
                    <MapPin className="h-3 w-3" /> Portal Doutor José, Martinópolis - SP
                </div>
              </div>
           </div>
           
           <div className="flex items-center gap-2 pb-1">
              <button className="h-10 w-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-emerald-600 hover:bg-slate-50 transition-all"><MessageCircle className="h-5 w-5" /></button>
              <button className="h-10 w-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-rose-600 hover:bg-slate-50 transition-all"><Instagram className="h-5 w-5" /></button>
              <button className="h-10 w-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-blue-600 hover:bg-slate-50 transition-all"><Facebook className="h-5 w-5" /></button>
              <Button variant="outline" size="sm" className="h-10 rounded-xl font-bold uppercase text-[10px] gap-2 border-slate-100"><Info className="h-4 w-4" /> Informação</Button>
           </div>
        </div>
      </div>

      {/* Categories Bar Pills */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm mt-8">
        <div className="flex gap-4 overflow-x-auto px-6 py-4 no-scrollbar items-center">
          <button className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0"><Search className="h-4 w-4" /></button>
          <button className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-900 shrink-0"><MenuIcon className="h-4 w-4" /></button>
          
          <button 
            onClick={() => setActiveCategory(null)}
            className={cn(
              "px-5 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-2",
              !activeCategory ? "border-rose-600 text-rose-600" : "border-transparent text-slate-500 hover:text-slate-900"
            )}
          >
            🔥 Destaques
          </button>
          {categories.map((cat) => (
            <button 
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                // Scroll suave para a categoria
                const el = document.getElementById(cat.id);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={cn(
                "px-5 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-2",
                activeCategory === cat.id ? "border-rose-600 text-rose-600" : "border-transparent text-slate-500 hover:text-slate-900"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Sections */}
      <div className="px-6 py-8 md:px-12 lg:px-24">
        {categories.map((cat) => {
            const catProducts = products.filter(p => p.category_id === cat.id);
            if (catProducts.length === 0) return null;

            return (
                <div key={cat.id} id={cat.id} className="mb-12 scroll-mt-32">
                    <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight mb-6 flex items-center gap-2">
                        {cat.name}
                        <div className="h-1 flex-1 bg-slate-100 rounded-full"></div>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {catProducts.map(p => (
                            <div 
                                key={p.id}
                                onClick={() => {
                                    setSelectedProduct(p);
                                    setSelectedAddons([]);
                                    setQuantity(1);
                                    setItemObservation("");
                                }}
                                className="bg-white rounded-2xl p-4 flex gap-4 border border-slate-50 hover:border-rose-100 transition-all hover:shadow-xl hover:shadow-rose-500/5 cursor-pointer"
                            >
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-black text-sm md:text-base text-slate-900 uppercase tracking-tight leading-tight mb-1">{p.name}</h3>
                                    <p className="text-[10px] md:text-xs text-slate-400 font-medium line-clamp-2 mb-3 leading-relaxed">
                                        {p.description || "Ingredientes selecionados para o melhor sabor do Império."}
                                    </p>
                                    <span className="text-base font-black text-rose-600 italic">R$ {Number(p.price).toFixed(2)}</span>
                                </div>
                                
                                <div className="relative h-[100px] w-[100px] md:h-[120px] md:w-[120px] rounded-2xl bg-slate-50 border border-slate-100 shrink-0 overflow-hidden group">
                                     {p.image_url ? (
                                        <img 
                                          src={p.image_url} 
                                          alt={p.name} 
                                          className="h-full w-full object-cover transition-transform group-hover:scale-110 duration-500"
                                        />
                                     ) : (
                                        <div className="absolute inset-0 flex items-center justify-center opacity-30">
                                            <UtensilsCrossed className="h-10 w-10 text-rose-600 rotate-45" />
                                        </div>
                                     )}
                                     {/* Botão + Vermelho Estilo OlaClick */}
                                     <div className="absolute bottom-1.5 right-1.5 h-8 w-8 bg-rose-600 rounded-full flex items-center justify-center text-white shadow-lg active:scale-90 transition-all z-10">
                                        <Plus className="h-5 w-5" />
                                     </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        })}
      </div>

      {/* Cart Float Floating Card */}
      {cart.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] md:w-[400px] z-50">
            <button 
                onClick={() => setCheckoutOpen(true)}
                className="w-full h-16 bg-rose-600 text-white rounded-3xl flex items-center justify-between px-8 shadow-2xl shadow-rose-900/30 active:scale-95 transition-all animate-in slide-in-from-bottom-10"
            >
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-white/20 rounded-xl flex items-center justify-center font-black italic">{cart.length}</div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">Ver Pedido</span>
                </div>
                <span className="text-xl font-black italic tracking-tighter">R$ {cartTotal.toFixed(2)}</span>
            </button>
        </div>
      )}

      {/* Item Selection Drawer */}
      <Drawer open={!!selectedProduct} onOpenChange={(o) => !o && setSelectedProduct(null)}>
        <DrawerContent className="bg-white rounded-t-[3rem] border-0 max-h-[96vh]">
            <div className="mx-auto w-12 h-1.5 bg-slate-100 rounded-full mt-4 mb-2"></div>
            {selectedProduct && (
                <div className="flex flex-col h-full overflow-hidden">
                    <div className="px-8 pt-6 pb-4 border-b border-slate-50">
                         <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter leading-tight">{selectedProduct.name}</h2>
                         <p className="text-xs text-slate-400 font-bold mt-1">A partir de R$ {Number(selectedProduct.price).toFixed(2)}</p>
                    </div>

                    <div className="flex-1 overflow-y-auto px-8 py-6 no-scrollbar space-y-8">
                         {/* Adicionais */}
                         <div className="space-y-4">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Turbine seu pedido</span>
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
                                                    "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer",
                                                    isSelected ? "bg-rose-50 border-rose-200" : "bg-white border-slate-100"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={cn("h-5 w-5 rounded-md border flex items-center justify-center", isSelected ? "bg-rose-600 border-rose-600 text-white" : "border-slate-300")}>
                                                        {isSelected && <Check className="h-3 w-3" />}
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-700 uppercase">{addon.name}</span>
                                                </div>
                                                <span className="text-xs font-black text-rose-600">+ R$ {addon.price}</span>
                                            </div>
                                        );
                                    })
                                }
                            </div>
                         </div>

                         {/* Observação item */}
                         <div className="space-y-3">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Alguma observação?</span>
                            <textarea 
                                value={itemObservation}
                                onChange={(e) => setItemObservation(e.target.value)}
                                placeholder="EX: SEM CEBOLA, SEM MOLHO..."
                                className="w-full h-24 bg-slate-50 border-0 rounded-2xl p-4 text-xs font-bold placeholder:text-slate-300 uppercase focus:ring-2 focus:ring-rose-100"
                            ></textarea>
                         </div>
                    </div>

                    {/* Footer Selection */}
                    <div className="px-8 pb-10 pt-4 flex items-center gap-4 border-t border-slate-50">
                        <div className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-2xl">
                             <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm"><Minus className="h-4 w-4" /></button>
                             <span className="text-base font-black w-6 text-center">{quantity}</span>
                             <button onClick={() => setQuantity(quantity + 1)} className="h-10 w-10 bg-rose-600 text-white rounded-xl flex items-center justify-center shadow-md"><Plus className="h-4 w-4" /></button>
                        </div>
                        <Button 
                            className="flex-1 h-12 rounded-2xl bg-rose-600 font-black uppercase italic tracking-widest text-sm shadow-xl"
                            onClick={handleAddToCart}
                        >
                            Adicionar R$ {( (Number(selectedProduct.price) + selectedAddons.reduce((s, a) => s + a.price, 0)) * quantity ).toFixed(2)}
                        </Button>
                    </div>
                </div>
            )}
        </DrawerContent>
      </Drawer>

      {/* Checkout Drawer Final */}
      <Drawer open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DrawerContent className="bg-white rounded-t-[3rem] border-0 max-h-[96vh]">
            <div className="mx-auto w-12 h-1.5 bg-slate-100 rounded-full mt-4 mb-2"></div>
            <div className="px-8 pb-12 pt-6 overflow-y-auto no-scrollbar flex flex-col gap-8">
                <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">Checkout</h2>

                <div className="grid gap-6">
                    <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
                        <button onClick={() => setIsPickup(false)} className={cn("flex-1 h-12 rounded-xl text-[10px] font-black uppercase transition-all", !isPickup ? "bg-white shadow-sm text-slate-900" : "text-slate-400")}>🛵 Delivery</button>
                        <button onClick={() => setIsPickup(true)} className={cn("flex-1 h-12 rounded-xl text-[10px] font-black uppercase transition-all", isPickup ? "bg-white shadow-sm text-slate-900" : "text-slate-400")}>🛍️ Retirada</button>
                    </div>

                    <div className="space-y-2">
                        <Label className="uppercase font-black text-[10px] text-slate-400">Nome</Label>
                        <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="COMO TE CHAMAMOS?" className="w-full h-12 bg-slate-50 px-5 rounded-2xl border-0 font-black text-xs uppercase" />
                    </div>

                    <div className="space-y-2">
                        <Label className="uppercase font-black text-[10px] text-slate-400">WhatsApp</Label>
                        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 0 0000-0000" className="w-full h-12 bg-slate-50 px-5 rounded-2xl border-0 font-black text-xs" />
                    </div>

                    {!isPickup && (
                        <div className="space-y-2">
                            <Label className="uppercase font-black text-[10px] text-slate-400">Endereço</Label>
                            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="RUA, NÚMERO, BAIRRO..." className="w-full h-12 bg-slate-50 px-5 rounded-2xl border-0 font-black text-[10px] uppercase" />
                        </div>
                    )}

                    <div className="space-y-4">
                        <Label className="uppercase font-black text-[10px] text-slate-400">Pagamento</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {["cash", "card", "pix"].map(m => (
                                <button key={m} onClick={() => setPaymentMethod(m as any)} className={cn("h-16 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all", paymentMethod === m ? "bg-slate-900 border-slate-900 text-white" : "border-slate-50 text-slate-300")}>
                                    {m === 'cash' ? <Banknote className="h-4 w-4" /> : m === 'card' ? <CreditCard className="h-4 w-4" /> : <QrCode className="h-4 w-4" />}
                                    <span className="text-[8px] font-black uppercase">{m === 'cash' ? 'Dinheiro' : m === 'card' ? 'Cartão' : 'PIX'}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-rose-600 rounded-3xl p-6 text-white text-[10px] font-black uppercase tracking-widest space-y-2">
                    <div className="flex justify-between opacity-70"><span>Itens</span><span>R$ {cartTotal.toFixed(2)}</span></div>
                    {!isPickup && <div className="flex justify-between opacity-70"><span>Taxa de Entrega</span><span>R$ {settings.defaultDeliveryFee.toFixed(2)}</span></div>}
                    <div className="flex justify-between text-xl pt-2 border-t border-white/10 mt-2"><span>Total</span><span>R$ {totalWithDelivery.toFixed(2)}</span></div>
                </div>

                <Button onClick={handleFinishOrder} disabled={addOrder.isPending} className="w-full h-16 rounded-3xl bg-slate-900 text-white font-black uppercase italic tracking-widest text-lg shadow-xl shadow-slate-200">
                    {addOrder.isPending ? "Enviando..." : "Confirmar Pedido"}
                </Button>
            </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
