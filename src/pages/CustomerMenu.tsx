import { useState, useEffect, useRef } from "react";
import {
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
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Bike,
  Store
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/hooks/useSettings";
import { useAddOrder } from "@/hooks/useOrders";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { CustomerChatDrawer } from "@/components/chat/CustomerChatDrawer";

type Category = { id: string; name: string };
type Product = {
  id: string;
  name: string;
  price: number;
  category_id?: string | null;
  category_ids?: string[];
  code: number;
  description?: string;
  image_url?: string;
  is_visible?: boolean;
};

export default function CustomerMenu() {
  const { settings, isCurrentlyOpen } = useSettings();
  const addOrder = useAddOrder();

  const [cart, setCart] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [chatReady, setChatReady] = useState(false);

  // Adicionais: lazy load — só busca quando o cliente abre um produto
  const { data: addons = [] } = useQuery({
    queryKey: ["addons"],
    enabled: !!selectedProduct,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const [addonsRes, acRes] = await Promise.all([
        supabase.from("addons").select("id, code, name, price, category_id").order("code", { ascending: true }),
        supabase.from("addon_categories").select("addon_id, category_id"),
      ]);
      const acMap: Record<string, string[]> = {};
      (acRes.data ?? []).forEach((ac: any) => {
        if (!acMap[ac.addon_id]) acMap[ac.addon_id] = [];
        acMap[ac.addon_id].push(ac.category_id);
      });
      return (addonsRes.data ?? []).map((a: any) => ({
        ...a,
        category_ids: acMap[a.id] ?? (a.category_id ? [a.category_id] : []),
      }));
    },
  });
  const [infoExpanded, setInfoExpanded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setChatReady(true), 1200);
    return () => clearTimeout(t);
  }, []);

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
  const [trackingOrder, setTrackingOrder] = useState<{ id: string; number: number; isPickup: boolean } | null>(null);

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ["categories_public"],
    staleTime: 2 * 60_000,
    retry: 1,
    queryFn: async () => {
      // Tenta com sort_order; se a coluna não existir, tenta sem
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, sort_order")
        .order("sort_order", { ascending: true });
      if (error) {
        const { data: fallback } = await supabase.from("categories").select("id, name");
        return ((fallback ?? []) as any[]).map(c => ({ ...c, sort_order: 0 })) as Category[];
      }
      return (data ?? []) as Category[];
    }
  });

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["products_public"],
    staleTime: 2 * 60_000,
    retry: 1,
    queryFn: async () => {
      // neq(false) inclui is_visible=true E is_visible=NULL — evita tela vazia por valores NULL
      // Tenta ordenar por sort_order; se a coluna não existir, usa code
      let productsRes = await supabase
        .from("products")
        .select("*")
        .neq("is_visible", false)
        .order("sort_order", { ascending: true });

      if (productsRes.error) {
        productsRes = await supabase
          .from("products")
          .select("*")
          .neq("is_visible", false)
          .order("code", { ascending: true });
      }

      const [pcRes] = await Promise.all([
        supabase.from("product_categories").select("product_id, category_id"),
      ]);

      const rows: any[] = productsRes.data ?? [];
      const pcMap: Record<string, string[]> = {};
      (pcRes.data ?? []).forEach((pc: any) => {
        if (!pcMap[pc.product_id]) pcMap[pc.product_id] = [];
        pcMap[pc.product_id].push(pc.category_id);
      });

      return rows.map((p: any) => ({
        ...p,
        category_ids: pcMap[p.id]?.length
          ? pcMap[p.id]
          : (p.category_id ? [p.category_id] : []),
      })) as Product[];
    }
  });

  const cartTotal = cart.reduce((acc, item) => acc + (item.total * item.quantity), 0);
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalWithDelivery = cartTotal + (isPickup ? 0 : settings.defaultDeliveryFee);

  const filteredProducts = search.trim()
    ? products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.description || "").toLowerCase().includes(search.toLowerCase())
      )
    : products;

  const toggleAddon = (addon: any) => {
    if (selectedAddons.find(a => a.name === addon.name)) {
      setSelectedAddons(selectedAddons.filter(a => a.name !== addon.name));
    } else {
      setSelectedAddons([...selectedAddons, { name: addon.name, price: Number(addon.price) }]);
    }
  };

  const isStoreOpen = isCurrentlyOpen;
  const outOfStock: string[] = settings.outOfStockProducts ?? [];
  const isEsgotado = (id: string) => outOfStock.includes(id);

  const handleAddToCart = () => {
    if (!isStoreOpen) {
      toast.error("A loja está fechada no momento.");
      return;
    }
    const itemTotal = selectedProduct.price + selectedAddons.reduce((s, a) => s + a.price, 0);
    setCart([...cart, {
      id: crypto.randomUUID(),
      productCode: selectedProduct.code?.toString() || "",
      product: selectedProduct.name,
      quantity,
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
    toast.success("Item adicionado ao carrinho!");
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
      onSuccess: (data: any) => {
        setCart([]);
        setCheckoutOpen(false);
        setGlobalObservation("");
        if (data?.id) {
          setTrackingOrder({ id: data.id, number: data.number, isPickup });
        }
      }
    });
  };

  if (loadingCategories || loadingProducts) {
    return <MenuSkeleton />;
  }

  if (trackingOrder) {
    return (
      <OrderTrackingView
        orderId={trackingOrder.id}
        orderNumber={trackingOrder.number}
        isPickup={trackingOrder.isPickup}
        storeName={settings.storeName}
        logoUrl={settings.logoUrl}
        onNewOrder={() => setTrackingOrder(null)}
      />
    );
  }

  const scrollToCategory = (catId: string | null) => {
    setActiveCategory(catId);
    if (catId) {
      const el = document.getElementById(`cat-${catId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans pb-32">
    <div className="max-w-md mx-auto bg-gray-100 min-h-screen">

      {/* ── Banner + Store Info ── */}
      <div className="bg-white">
        {/* Cover Image */}
        <div className="relative h-32 w-full bg-gray-200 overflow-hidden">
          <img
            src={settings.bannerUrl || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop"}
            alt="banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>

        {/* Store Card */}
        <div className="px-4 pt-4 pb-5">
          <div className="flex gap-4 items-start">
            {/* Logo */}
            <div className="h-20 w-20 rounded-2xl bg-white shadow-md border border-gray-100 overflow-hidden shrink-0 -mt-10 relative z-10">
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt={settings.storeName} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-red-600 flex items-center justify-center">
                  <UtensilsCrossed className="h-8 w-8 text-white" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900 leading-tight">{settings.storeName}</h1>
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full",
                  isStoreOpen
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                )}>
                  {isStoreOpen ? "Aberto" : "Fechado"}
                </span>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 flex-wrap">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {settings.deliveryTimeMin || 30}–{settings.deliveryTimeMax || 50} min
                </span>
                {settings.defaultDeliveryFee > 0 ? (
                  <span className="flex items-center gap-1">
                    <Bike className="h-3.5 w-3.5" />
                    Entrega R$ {Number(settings.defaultDeliveryFee).toFixed(2)}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-green-600 font-semibold">
                    <Bike className="h-3.5 w-3.5" />
                    Entrega grátis
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Expandable store details */}
          <button
            onClick={() => setInfoExpanded(v => !v)}
            className="mt-4 flex items-center gap-1 text-red-600 text-xs font-semibold"
          >
            {infoExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            Mais informações
          </button>

          {infoExpanded && (
            <div className="mt-3 space-y-2 text-sm text-gray-600 border-t pt-3">
              {settings.storeAddress && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                  <span>{settings.storeAddress}</span>
                </div>
              )}
              {settings.storePhone && (
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-gray-400 shrink-0" />
                  <span>{settings.storePhone}</span>
                </div>
              )}
              {/* Social links */}
              <div className="flex gap-3 pt-1">
                {settings.whatsappNumber && (
                  <a href={`https://wa.me/${settings.whatsappNumber}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 text-green-600 font-medium text-xs hover:underline">
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </a>
                )}
                {settings.instagramUrl && (
                  <a href={settings.instagramUrl} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 text-pink-600 font-medium text-xs hover:underline">
                    <Instagram className="h-4 w-4" /> Instagram
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div className="bg-white mt-2 px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-3 bg-gray-100 rounded-xl px-4 h-11">
          <Search className="h-4 w-4 text-gray-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar no cardápio"
            className="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none"
          />
          {search && (
            <button onClick={() => setSearch("")}>
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* ── Category Pills (sticky) ── */}
      {!search && (
        <div className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
          <div className="flex gap-2 overflow-x-auto px-4 py-3 no-scrollbar">
            <button
              onClick={() => scrollToCategory(null)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap border transition-all shrink-0",
                !activeCategory
                  ? "bg-red-600 text-white border-red-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              )}
            >
              Todos
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap border transition-all shrink-0",
                  activeCategory === cat.id
                    ? "bg-red-600 text-white border-red-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Banner loja fechada ── */}
      {!isStoreOpen && (
        <div className="mx-4 mt-3 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <div className="h-10 w-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-red-700">Estamos fechados agora</p>
            <p className="text-xs text-red-400 mt-0.5">Fora do horário de atendimento. Você pode navegar pelo cardápio.</p>
          </div>
        </div>
      )}

      {/* ── Products ── */}
      <div className="mt-2 space-y-2">
        {search.trim() ? (
          /* Search results — lista iFood */
          <div className="bg-white">
            {filteredProducts.length === 0 ? (
              <div className="py-16 flex flex-col items-center gap-2 text-gray-400">
                <Search className="h-8 w-8" />
                <p className="text-sm font-medium">Nenhum item encontrado</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filteredProducts.map(p => (
                  <ProductRow key={p.id} product={p} isOutOfStock={isEsgotado(p.id)} onSelect={() => {
                    if (isEsgotado(p.id)) { toast.error("Produto esgotado no momento."); return; }
                    setSelectedProduct(p); setSelectedAddons([]); setQuantity(1); setItemObservation("");
                  }} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Em Destaque — scroll horizontal com cards grandes */}
            {products.length > 0 && (
              <div className="bg-white pt-5 pb-4">
                <div className="px-4 mb-3 flex items-center gap-3">
                  <div className="w-1 h-6 bg-red-600 rounded-full" />
                  <div>
                    <h2 className="text-base font-bold text-gray-900 leading-none">Em Destaque</h2>
                    <p className="text-[11px] text-gray-400 mt-0.5">Os mais pedidos</p>
                  </div>
                </div>
                <div className="flex gap-3 overflow-x-auto px-4 no-scrollbar pb-1">
                  {products.slice(0, 8).map(p => (
                    <FeaturedCard key={p.id} product={p} isOutOfStock={isEsgotado(p.id)} onSelect={() => {
                      if (isEsgotado(p.id)) { toast.error("Produto esgotado no momento."); return; }
                      setSelectedProduct(p); setSelectedAddons([]); setQuantity(1); setItemObservation("");
                    }} />
                  ))}
                </div>
              </div>
            )}

            {/* Categorias — grid 2 colunas estilo OlaClick */}
            {categories.map(cat => {
              const catProducts = filteredProducts.filter(p =>
                (p.category_ids && p.category_ids.includes(cat.id)) ||
                p.category_id === cat.id
              );
              if (catProducts.length === 0) return null;
              return (
                <div key={cat.id} id={`cat-${cat.id}`} className="bg-white scroll-mt-28 pt-5 pb-5">
                  {/* Cabeçalho estilo OlaClick */}
                  <div className="px-4 mb-4 flex items-center gap-3">
                    <div className="w-1 h-6 bg-red-600 rounded-full shrink-0" />
                    <h2 className="text-base font-bold text-gray-900">{cat.name}</h2>
                  </div>
                  {/* Grid 2 colunas */}
                  <div className="grid grid-cols-2 gap-3 px-4">
                    {catProducts.map(p => (
                      <ProductCard key={p.id} product={p} isOutOfStock={isEsgotado(p.id)} onSelect={() => {
                        if (isEsgotado(p.id)) { toast.error("Produto esgotado no momento."); return; }
                        setSelectedProduct(p); setSelectedAddons([]); setQuantity(1); setItemObservation("");
                      }} />
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* ── Chat Flutuante ── */}
      {chatReady && <CustomerChatDrawer storeName={settings.storeName} logoUrl={settings.logoUrl} />}

      {/* ── Floating Cart Button ── */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-4 right-4 z-50">
          <button
            onClick={() => setCheckoutOpen(true)}
            className="w-full h-14 bg-red-600 text-white rounded-2xl flex items-center justify-between px-5 shadow-2xl shadow-red-900/20 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 bg-red-700 rounded-lg flex items-center justify-center text-sm font-bold">
                {cartItemCount}
              </div>
              <span className="text-sm font-bold">Ver sacola</span>
            </div>
            <span className="text-sm font-bold">R$ {cartTotal.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* ── Item Selection Drawer — estilo OlaClick ── */}
      <Drawer open={!!selectedProduct} onOpenChange={(o) => !o && setSelectedProduct(null)}>
        <DrawerContent className="bg-white border-0 max-h-[96vh] outline-none rounded-t-2xl">
          {selectedProduct && (
            <div className="flex flex-col h-full overflow-hidden">

              {/* Imagem + fechar */}
              <div className="relative w-full bg-gray-100 shrink-0" style={{ height: selectedProduct.image_url ? 220 : 0 }}>
                {selectedProduct.image_url && (
                  <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-full h-full object-cover" />
                )}
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="absolute top-3 right-3 h-8 w-8 bg-white rounded-full shadow flex items-center justify-center"
                >
                  <X className="h-4 w-4 text-gray-600" />
                </button>
              </div>

              {/* Scroll area */}
              <div className="flex-1 overflow-y-auto no-scrollbar">

                {/* Nome + preço + descrição */}
                <div className="px-5 pt-5 pb-4 border-b border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900 text-center uppercase tracking-wide">
                    {selectedProduct.name}
                  </h2>
                  {selectedProduct.description && (
                    <p className="text-sm text-gray-500 mt-2 text-center leading-relaxed">
                      {selectedProduct.description}
                      {" "}
                      <span className="text-gray-400 text-xs">(IMAGEM ILUSTRATIVA)</span>
                    </p>
                  )}
                  <p className="text-2xl font-bold text-gray-900 mt-3 text-center">
                    R$ {Number(selectedProduct.price).toFixed(2).replace(".", ",")}
                  </p>
                </div>

                {/* Acréscimos */}
                {addons.filter(a => !a.category_id || a.category_id === selectedProduct.category_id).length > 0 && (
                  <div>
                    {/* Cabeçalho seção */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                      <div>
                        <p className="text-base font-bold text-gray-900">Acréscimos:</p>
                        <p className="text-xs text-red-600 font-medium mt-0.5">
                          Selecione até {addons.length} opções
                        </p>
                      </div>
                    </div>

                    {/* Lista de addons */}
                    {addons
                      .filter(a => !a.category_id || a.category_id === selectedProduct.category_id)
                      .map(addon => {
                        const isSelected = selectedAddons.some(a => a.name === addon.name);
                        return (
                          <div
                            key={addon.id}
                            className="flex items-center justify-between px-5 py-4 border-b border-gray-50"
                          >
                            <div>
                              <p className="text-sm font-bold text-gray-800 uppercase tracking-wide">{addon.name}</p>
                              <p className="text-xs text-gray-500 mt-0.5">+ R$ {Number(addon.price).toFixed(2).replace(".", ",")}</p>
                            </div>
                            <button
                              onClick={() => toggleAddon(addon)}
                              className={cn(
                                "h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                                isSelected
                                  ? "border-red-600 bg-red-600 text-white"
                                  : "border-gray-300 text-gray-400 hover:border-red-400"
                              )}
                            >
                              {isSelected ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        );
                      })
                    }
                  </div>
                )}

                {/* Observação */}
                <div className="px-5 py-5">
                  <p className="text-base font-bold text-gray-900 mb-1">Alguma observação?</p>
                  <p className="text-xs text-gray-400 mb-3">Ex: sem cebola, sem molho, ponto da carne</p>
                  <textarea
                    value={itemObservation}
                    onChange={e => setItemObservation(e.target.value)}
                    placeholder="Escreva aqui..."
                    rows={3}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm text-gray-700 placeholder:text-gray-300 outline-none focus:border-gray-300 resize-none"
                  />
                </div>
              </div>

              {/* Footer sticky — quantidade + botão */}
              <div className="px-5 pb-8 pt-3 border-t border-gray-100 bg-white flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-3 border border-gray-200 rounded-xl px-3 py-2 shrink-0">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="h-7 w-7 flex items-center justify-center text-gray-500"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="text-base font-bold w-5 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="h-7 w-7 flex items-center justify-center text-gray-500"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <button
                  onClick={handleAddToCart}
                  className="flex-1 h-12 bg-red-600 text-white rounded-xl font-bold text-sm flex items-center justify-between px-5 active:scale-95 transition-all"
                >
                  <span>Adicionar</span>
                  <span>R$ {((Number(selectedProduct.price) + selectedAddons.reduce((s, a) => s + a.price, 0)) * quantity).toFixed(2).replace(".", ",")}</span>
                </button>
              </div>

            </div>
          )}
        </DrawerContent>
      </Drawer>

      {/* ── Checkout Drawer ── */}
      <Drawer open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DrawerContent className="bg-white rounded-t-3xl border-0 max-h-[96vh] outline-none">
          <div className="mx-auto w-10 h-1 bg-gray-200 rounded-full mt-3 mb-1" />
          <div className="px-5 pb-10 pt-4 overflow-y-auto no-scrollbar flex flex-col gap-5">
            <h2 className="text-xl font-bold text-gray-900">Minha sacola</h2>

            {/* Cart items */}
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item.id} className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-bold text-red-600 w-5 shrink-0">{item.quantity}x</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{item.product}</p>
                      {item.addons?.length > 0 && (
                        <p className="text-xs text-gray-400">{item.addons.map((a: any) => a.name).join(", ")}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-semibold text-gray-700">R$ {(item.total * item.quantity).toFixed(2)}</span>
                    <button
                      onClick={() => setCart(cart.filter(c => c.id !== item.id))}
                      className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="h-px bg-gray-100" />

            {/* Delivery / Pickup toggle */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
              <button
                onClick={() => setIsPickup(false)}
                className={cn(
                  "flex-1 h-11 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2",
                  !isPickup ? "bg-white shadow text-gray-900" : "text-gray-400"
                )}
              >
                <Bike className="h-4 w-4" /> Delivery
              </button>
              <button
                onClick={() => setIsPickup(true)}
                className={cn(
                  "flex-1 h-11 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2",
                  isPickup ? "bg-white shadow text-gray-900" : "text-gray-400"
                )}
              >
                <Store className="h-4 w-4" /> Retirada
              </button>
            </div>

            {/* Customer fields */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-semibold text-gray-500 mb-1.5 block">Seu nome *</Label>
                <input
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Como você se chama?"
                  className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm text-gray-800 outline-none focus:border-gray-300"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-gray-500 mb-1.5 block">WhatsApp *</Label>
                <input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm text-gray-800 outline-none focus:border-gray-300"
                />
              </div>
              {!isPickup && (
                <div>
                  <Label className="text-xs font-semibold text-gray-500 mb-1.5 block">Endereço de entrega *</Label>
                  <input
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Rua, número, bairro"
                    className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm text-gray-800 outline-none focus:border-gray-300"
                  />
                </div>
              )}
            </div>

            {/* Payment */}
            <div>
              <Label className="text-xs font-semibold text-gray-500 mb-2 block">Forma de pagamento</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "cash", label: "Dinheiro", icon: <Banknote className="h-5 w-5" /> },
                  { value: "card", label: "Cartão", icon: <CreditCard className="h-5 w-5" /> },
                  { value: "pix", label: "PIX", icon: <QrCode className="h-5 w-5" /> },
                ].map(m => (
                  <button
                    key={m.value}
                    onClick={() => setPaymentMethod(m.value as any)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-xs font-semibold transition-all",
                      paymentMethod === m.value
                        ? "border-red-600 bg-red-50 text-red-600"
                        : "border-gray-100 text-gray-500"
                    )}
                  >
                    {m.icon}
                    {m.label}
                  </button>
                ))}
              </div>

              {paymentMethod === "cash" && (
                <div className="mt-3">
                  <Label className="text-xs font-semibold text-gray-500 mb-1.5 block">Troco para quanto?</Label>
                  <input
                    value={changeFor}
                    onChange={e => setChangeFor(e.target.value)}
                    type="number"
                    placeholder="R$ 0,00"
                    className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm text-gray-800 outline-none focus:border-gray-300"
                  />
                </div>
              )}
            </div>

            {/* Observation */}
            <div>
              <Label className="text-xs font-semibold text-gray-500 mb-1.5 block">Observação geral</Label>
              <textarea
                value={globalObservation}
                onChange={e => setGlobalObservation(e.target.value)}
                placeholder="Algum recado para a loja?"
                rows={2}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-300 outline-none focus:border-gray-300 resize-none"
              />
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>R$ {cartTotal.toFixed(2)}</span>
              </div>
              {!isPickup && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Taxa de entrega</span>
                  <span className={settings.defaultDeliveryFee === 0 ? "text-green-600 font-semibold" : ""}>
                    {settings.defaultDeliveryFee === 0 ? "Grátis" : `R$ ${Number(settings.defaultDeliveryFee).toFixed(2)}`}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>R$ {totalWithDelivery.toFixed(2)}</span>
              </div>
            </div>

            {/* Confirm */}
            <button
              onClick={handleFinishOrder}
              disabled={addOrder.isPending}
              className="w-full h-14 bg-red-600 text-white rounded-2xl font-bold text-base flex items-center justify-between px-6 active:scale-[0.98] transition-all disabled:opacity-60"
            >
              <span>{addOrder.isPending ? "Enviando..." : "Confirmar pedido"}</span>
              {!addOrder.isPending && <span>R$ {totalWithDelivery.toFixed(2)}</span>}
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
    </div>
  );
}

/* Skeleton de carregamento do cardápio */
function MenuSkeleton() {
  return (
    <div className="min-h-screen bg-gray-100 max-w-md mx-auto animate-pulse">
      {/* Banner */}
      <div className="bg-white">
        <div className="h-32 w-full bg-gray-200" />
        <div className="px-4 pt-4 pb-5">
          <div className="flex gap-4 items-start">
            <div className="h-20 w-20 rounded-2xl bg-gray-200 shrink-0 -mt-10" />
            <div className="flex-1 pt-1 space-y-2">
              <div className="h-5 bg-gray-200 rounded-lg w-40" />
              <div className="h-3 bg-gray-200 rounded-lg w-28" />
            </div>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="bg-white mt-2 px-4 py-3">
        <div className="h-11 bg-gray-200 rounded-xl" />
      </div>

      {/* Category pills */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex gap-2">
        {[80, 96, 72, 88].map((w, i) => (
          <div key={i} className="h-8 bg-gray-200 rounded-full shrink-0" style={{ width: w }} />
        ))}
      </div>

      {/* Em Destaque */}
      <div className="bg-white mt-2 pt-5 pb-4">
        <div className="px-4 mb-3 h-5 bg-gray-200 rounded-lg w-32" />
        <div className="flex gap-3 px-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="shrink-0 w-28 rounded-xl bg-gray-200 h-32" />
          ))}
        </div>
      </div>

      {/* Categoria com produtos */}
      <div className="bg-white mt-2 pt-5 pb-5">
        <div className="px-4 mb-4 h-5 bg-gray-200 rounded-lg w-24" />
        <div className="grid grid-cols-2 gap-3 px-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-xl bg-gray-200 h-36" />
          ))}
        </div>
      </div>
    </div>
  );
}

/* Card grande para "Em Destaque" — scroll horizontal */
function FeaturedCard({ product, onSelect, isOutOfStock }: { product: Product; onSelect: () => void; isOutOfStock?: boolean }) {
  return (
    <button
      onClick={onSelect}
      className={cn("shrink-0 w-28 rounded-xl bg-white border border-gray-100 overflow-hidden shadow-sm active:scale-95 transition-all text-left", isOutOfStock && "opacity-60")}
    >
      <div className="relative w-full h-20 bg-gray-100">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <UtensilsCrossed className="h-8 w-8 text-gray-300" />
          </div>
        )}
        {isOutOfStock ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <span className="text-[10px] font-bold text-white bg-gray-800/80 px-2 py-0.5 rounded-full">Esgotado</span>
          </div>
        ) : (
          <div className="absolute bottom-1.5 right-1.5 h-7 w-7 bg-red-600 rounded-full flex items-center justify-center shadow">
            <Plus className="h-3.5 w-3.5 text-white" />
          </div>
        )}
      </div>
      <div className="p-2.5">
        <p className="text-[11px] font-semibold text-gray-900 line-clamp-2 leading-tight">{product.name}</p>
        <p className="text-xs font-bold text-red-600 mt-1">R$ {Number(product.price).toFixed(2)}</p>
      </div>
    </button>
  );
}

/* Card grid 2 colunas — estilo OlaClick */
function ProductCard({ product, onSelect, isOutOfStock }: { product: Product; onSelect: () => void; isOutOfStock?: boolean }) {
  return (
    <button
      onClick={onSelect}
      className={cn("rounded-xl bg-white border border-gray-100 overflow-hidden shadow-sm active:scale-95 transition-all text-left w-full", isOutOfStock && "opacity-60")}
    >
      {/* Imagem com altura fixa */}
      <div className="relative w-full h-20 bg-gray-100">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <UtensilsCrossed className="h-8 w-8 text-gray-200" />
          </div>
        )}
        {isOutOfStock ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/25">
            <span className="text-[10px] font-bold text-white bg-gray-800/80 px-2 py-0.5 rounded-full">Esgotado</span>
          </div>
        ) : (
          <div className="absolute bottom-1.5 right-1.5 h-7 w-7 bg-red-600 rounded-full flex items-center justify-center shadow-md">
            <Plus className="h-3.5 w-3.5 text-white" />
          </div>
        )}
      </div>
      {/* Info abaixo */}
      <div className="p-2.5">
        <p className="text-[11px] font-semibold text-gray-900 line-clamp-2 leading-snug">{product.name}</p>
        <p className="text-xs font-bold text-gray-900 mt-1.5">R$ {Number(product.price).toFixed(2)}</p>
      </div>
    </button>
  );
}

function ProductRow({ product, onSelect, isOutOfStock }: { product: Product; onSelect: () => void; isOutOfStock?: boolean }) {
  return (
    <button
      onClick={onSelect}
      className={cn("w-full flex items-center gap-4 px-4 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left", isOutOfStock && "opacity-60")}
    >
      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-gray-900 leading-snug">{product.name}</p>
          {isOutOfStock && (
            <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-200 text-gray-500 rounded-full">Esgotado</span>
          )}
        </div>
        {product.description && (
          <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">{product.description}</p>
        )}
        <p className="text-sm font-bold text-gray-800 mt-2">
          R$ {Number(product.price).toFixed(2)}
        </p>
      </div>

      {/* Image + Plus */}
      <div className="relative shrink-0">
        <div className="h-[90px] w-[90px] rounded-xl bg-gray-100 overflow-hidden">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <UtensilsCrossed className="h-7 w-7 text-gray-300" />
            </div>
          )}
        </div>
        {!isOutOfStock && (
          <div className="absolute -bottom-2 -right-2 h-8 w-8 bg-red-600 rounded-full flex items-center justify-center shadow-md">
            <Plus className="h-4 w-4 text-white" />
          </div>
        )}
      </div>
    </button>
  );
}

/* ─── Tela de acompanhamento do pedido em tempo real ─────────────────────── */
type TrackingStatus = "pending" | "preparing" | "delivering" | "completed" | "cancelled";

const STEPS_DELIVERY: { status: TrackingStatus; label: string; sub: string; icon: string }[] = [
  { status: "pending",    label: "Pedido recebido",      sub: "Aguardando confirmação da cozinha", icon: "📋" },
  { status: "preparing",  label: "Preparando",           sub: "Seu pedido está sendo preparado",   icon: "👨‍🍳" },
  { status: "delivering", label: "Saiu para entrega",    sub: "Seu pedido está a caminho",          icon: "🛵" },
  { status: "completed",  label: "Entregue!",            sub: "Bom apetite!",                       icon: "✅" },
];

const STEPS_PICKUP: { status: TrackingStatus; label: string; sub: string; icon: string }[] = [
  { status: "pending",    label: "Pedido recebido",        sub: "Aguardando confirmação da cozinha", icon: "📋" },
  { status: "preparing",  label: "Preparando",             sub: "Seu pedido está sendo preparado",   icon: "👨‍🍳" },
  { status: "delivering", label: "Pronto para retirada!",  sub: "Pode vir buscar o seu pedido",      icon: "🔔" },
  { status: "completed",  label: "Retirado!",              sub: "Obrigado pela preferência!",        icon: "✅" },
];

const STATUS_ORDER: TrackingStatus[] = ["pending", "preparing", "delivering", "completed"];

function OrderTrackingView({
  orderId, orderNumber, isPickup, storeName, logoUrl, onNewOrder,
}: {
  orderId: string;
  orderNumber: number;
  isPickup: boolean;
  storeName: string;
  logoUrl?: string;
  onNewOrder: () => void;
}) {
  const [status, setStatus] = useState<TrackingStatus>("pending");
  const [cancelled, setCancelled] = useState(false);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    supabase.from("orders").select("status").eq("id", orderId).single().then(({ data }) => {
      if (data?.status === "cancelled") setCancelled(true);
      else if (data?.status) setStatus(data.status as TrackingStatus);
    });

    channelRef.current = supabase
      .channel(`tracking-${orderId}`)
      .on("postgres_changes" as any, {
        event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}`,
      }, (payload: any) => {
        const s = payload.new?.status as TrackingStatus;
        if (s === "cancelled") setCancelled(true);
        else if (s) setStatus(s);
      })
      .subscribe();

    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, [orderId]);

  const steps = isPickup ? STEPS_PICKUP : STEPS_DELIVERY;
  const currentIdx = STATUS_ORDER.indexOf(status);

  if (cancelled) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="text-5xl mb-4">😔</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Pedido cancelado</h2>
        <p className="text-sm text-gray-500 mb-8">Entre em contato com o estabelecimento para mais informações.</p>
        <button onClick={onNewOrder} className="h-12 px-8 bg-red-600 text-white rounded-2xl font-bold text-sm active:scale-95 transition-all">
          Fazer novo pedido
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-3">
        {logoUrl ? (
          <img src={logoUrl} alt={storeName} className="h-9 w-9 rounded-xl object-contain" />
        ) : (
          <div className="h-9 w-9 rounded-xl bg-red-600 flex items-center justify-center">
            <UtensilsCrossed className="h-5 w-5 text-white" />
          </div>
        )}
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{storeName}</p>
          <p className="text-base font-black text-gray-900">Pedido #{orderNumber}</p>
        </div>
      </div>

      <div className="flex-1 px-5 py-8 flex flex-col gap-0">
        {steps.map((step, i) => {
          const done = i < currentIdx || status === "completed";
          const active = i === currentIdx && status !== "completed";
          const upcoming = i > currentIdx && status !== "completed";

          return (
            <div key={step.status} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className={cn(
                  "h-11 w-11 rounded-full flex items-center justify-center text-xl transition-all duration-500",
                  done   ? "bg-green-500 shadow-md shadow-green-200" :
                  active ? "bg-red-600 shadow-md shadow-red-200 animate-pulse" :
                           "bg-gray-100"
                )}>
                  {done ? "✅" : step.icon}
                </div>
                {i < steps.length - 1 && (
                  <div className={cn(
                    "w-0.5 h-10 mt-1 transition-all duration-500",
                    i < currentIdx ? "bg-green-400" : "bg-gray-200"
                  )} />
                )}
              </div>
              <div className={cn("pt-2.5 pb-6", upcoming && "opacity-30")}>
                <p className={cn(
                  "font-bold text-sm leading-tight",
                  done ? "text-green-600" : active ? "text-red-600" : "text-gray-400"
                )}>
                  {step.label}
                </p>
                {(done || active) && (
                  <p className="text-xs text-gray-400 mt-0.5">{step.sub}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-5 pb-8">
        {status === "completed" ? (
          <button
            onClick={onNewOrder}
            className="w-full h-14 bg-red-600 text-white rounded-2xl font-bold text-base active:scale-95 transition-all shadow-lg shadow-red-200"
          >
            Fazer novo pedido
          </button>
        ) : (
          <p className="text-center text-xs text-gray-400">Atualizando automaticamente...</p>
        )}
      </div>
    </div>
  );
}
