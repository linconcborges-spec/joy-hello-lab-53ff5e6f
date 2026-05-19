import { useState, useEffect } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AuthModal } from "./AuthModal";
import type { Order, OrderItem } from "@/types/order";
import { toast } from "sonner";
import { useCustomers, useAddCustomer, useUpdateCustomer, normalizePhone } from "@/hooks/useCustomers";
import { useProducts } from "@/hooks/useProducts";
import { useAddons } from "@/hooks/useAddons";
import { useSettings } from "@/hooks/useSettings";
import { printOrder } from "@/lib/PrintService";
import { getNextLocalOrderNumber } from "@/lib/offlineStorage";
import { OrderItemRow } from "@/components/orders/OrderItemRow";
import { CustomerSearchDialog } from "@/components/orders/CustomerSearchDialog";
import { OrderFormCustomerSection } from "@/components/orders/OrderFormCustomerSection";
import { OrderFormPaymentSection } from "@/components/orders/OrderFormPaymentSection";
import { OrderFormObservationSection } from "@/components/orders/OrderFormObservationSection";
import { OrderFormActions } from "@/components/orders/OrderFormActions";

interface NewOrderFormProps {
  onSubmit: (order: Omit<Order, "id" | "number" | "createdAt">) => void;
  onCancel: () => void;
  onOpenCustomers?: () => void;
  initialOrder?: Order;
}

function createEmptyItem(): OrderItem {
  return { id: crypto.randomUUID(), productCode: "", quantity: 1, product: "", addons: [], unitPrice: 0, total: 0, categoryId: null, observation: "" };
}

function calcTotal(item: OrderItem): number {
  const addonsTotal = item.addons.reduce((s, a) => s + a.price, 0);
  return item.quantity * (item.unitPrice + addonsTotal);
}

export function NewOrderForm({ onSubmit, onCancel, initialOrder }: NewOrderFormProps) {
  const { data: customers = [] } = useCustomers();
  const addCustomer = useAddCustomer();
  const updateCustomer = useUpdateCustomer();
  const { data: products = [] } = useProducts();
  const { settings } = useSettings();
  const { data: addons = [] } = useAddons();

  const [customerName, setCustomerName] = useState(initialOrder?.customerName || "");
  const [address, setAddress] = useState(initialOrder?.address || "");
  const [phone, setPhone] = useState(initialOrder?.phone || "");
  const [customerAddresses, setCustomerAddresses] = useState<string[]>([]);
  const [cnpj, setCnpj] = useState(initialOrder?.cnpj || "");
  const [items, setItems] = useState<OrderItem[]>(initialOrder?.items || [createEmptyItem()]);
  const [isPickup, setIsPickup] = useState(initialOrder?.isPickup || false);
  const [deliveryFee, setDeliveryFee] = useState(initialOrder?.deliveryFee ?? settings.defaultDeliveryFee);
  const [changeFor, setChangeFor] = useState(initialOrder?.changeFor || 0);
  const [paymentMethod, setPaymentMethod] = useState<Order["paymentMethod"]>(initialOrder?.paymentMethod || "cash");
  const [globalObservation, setGlobalObservation] = useState(initialOrder?.observation || "");
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [showCuringaDialog, setShowCuringaDialog] = useState(false);
  const [pendingOrderData, setPendingOrderData] = useState<any>(null);

  useEffect(() => {
    if (initialOrder) {
      setCustomerName(initialOrder.customerName);
      setAddress(initialOrder.address);
      setPhone(initialOrder.phone);
      setCnpj(initialOrder.cnpj || "");
      setItems(JSON.parse(JSON.stringify(initialOrder.items)));
      setIsPickup(!!initialOrder.isPickup);
      setDeliveryFee(initialOrder.deliveryFee);
      setChangeFor(initialOrder.changeFor);
      setPaymentMethod(initialOrder.paymentMethod);
      setGlobalObservation(initialOrder.observation || "");
    }
  }, [initialOrder]);

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
      setShowCuringaDialog(true);
    }
  };

  const handleQuickRegister = () => {
    if (!customerName.trim()) { toast.error("Preencha o nome do cliente para cadastrar"); return; }
    if (!phone.trim()) { toast.error("Preencha o telefone"); return; }
    const normalized = normalizePhone(phone);
    const existing = customers.find(c => normalizePhone(c.phone) === normalized);
    if (existing) {
      const newAddress = address.trim();
      const currentAddresses = existing.addresses || [];
      if (!isPickup && newAddress && !currentAddresses.includes(newAddress)) {
        const updatedAddresses = [...currentAddresses, newAddress];
        updateCustomer.mutate({ id: existing.id, name: customerName.trim(), phone: existing.phone, addresses: updatedAddresses });
        setCustomerAddresses(updatedAddresses);
      } else {
        toast.info("Identificação concluída!");
      }
    } else {
      addCustomer.mutate({
        name: customerName.trim() || (isPickup ? "CLIENTE AVULSO (RETIRADA)" : "CLIENTE AVULSO"),
        addresses: isPickup ? [] : [address.trim()],
        phone: phone.trim(),
      });
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
        const updated = { ...item, addons: exists ? item.addons.filter((a) => a.name !== addon.name) : [...item.addons, addon] };
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

  const prepareOrderData = (authorizedBy?: string) => {
    const validItems = items.filter((i) => i.product.trim());
    const orderData: any = {
      customerName: customerName.trim(),
      address: isPickup ? "" : address.trim(),
      phone: phone.trim(),
      cnpj: cnpj.trim(),
      items: validItems,
      deliveryFee: isPickup ? 0 : deliveryFee,
      totalAmount: isPickup ? subtotal : totalAmount,
      changeFor,
      status: initialOrder?.status || ("preparing" as Order["status"]),
      paymentMethod,
      isPrinted: initialOrder?.isPrinted ?? true,
      isPickup,
      observation: globalObservation.trim(),
    };
    if (authorizedBy) {
      orderData.lastEditedBy = authorizedBy;
      if (!initialOrder?.originalSnapshot) orderData.originalSnapshot = { ...initialOrder };
    }
    return orderData;
  };

  const processSubmission = async (authorizedBy?: string, shouldPrint: boolean = true, overrideData?: any) => {
    let orderData = overrideData || pendingOrderData || prepareOrderData(authorizedBy);
    if (!initialOrder) {
      orderData = { ...orderData, status: shouldPrint ? "preparing" : "pending", isPrinted: shouldPrint };
    }
    if (shouldPrint) {
      const printNumber = initialOrder?.number || getNextLocalOrderNumber();
      const orderToPrint: Order = { ...orderData as any, id: initialOrder?.id || "temp", number: printNumber, createdAt: initialOrder?.createdAt || new Date().toISOString() };
      await printOrder(orderToPrint, settings);
      toast.success("Pedido enviado para a impressora!");
    } else {
      toast.success("Pedido salvo! Aguardando impressão.");
    }
    onSubmit(orderData as any);
    setPendingOrderData(null);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = items.filter((i) => i.product.trim());
    if (validItems.length === 0) { toast.error("Adicione pelo menos um item ao pedido"); return; }
    if (initialOrder) {
      setAuthModalOpen(true);
    } else {
      const data = prepareOrderData();
      setPendingOrderData(data);
      processSubmission(undefined, true, data);
    }
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="gap-1.5 uppercase font-black text-xs">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Button>

      <OrderFormCustomerSection
        phone={phone} setPhone={setPhone}
        customerName={customerName} setCustomerName={setCustomerName}
        address={address} setAddress={setAddress}
        customerAddresses={customerAddresses} setCustomerAddresses={setCustomerAddresses}
        cnpj={cnpj} setCnpj={setCnpj}
        isPickup={isPickup} setIsPickup={setIsPickup}
        setDeliveryFee={setDeliveryFee}
        settings={settings}
        addCustomerPending={addCustomer.isPending}
        onPhoneSearch={handlePhoneSearch}
        onOpenCustomerSearch={() => setCustomerSearchOpen(true)}
        onQuickRegister={handleQuickRegister}
        onClearCustomer={() => { setCustomerName(""); setPhone(""); setAddress(""); setCustomerAddresses([]); setCnpj(""); }}
      />

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
              setTimeout(() => { document.getElementById(`code-${newItem.id}`)?.focus(); }, 50);
            }}
            className="gap-1.5 uppercase font-black text-xs"
          >
            <Plus className="h-4 w-4" /> Adicionar Item
          </Button>
        </CardContent>
      </Card>

      <OrderFormPaymentSection
        paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod}
        deliveryFee={deliveryFee} setDeliveryFee={setDeliveryFee}
        changeFor={changeFor} setChangeFor={setChangeFor}
        isPickup={isPickup}
      />

      <OrderFormObservationSection
        globalObservation={globalObservation}
        setGlobalObservation={setGlobalObservation}
      />

      <OrderFormActions
        totalAmount={totalAmount}
        initialOrder={initialOrder}
        onEditSubmit={handleFormSubmit}
        onSave={() => {
          const validItems = items.filter((i) => i.product.trim());
          if (validItems.length === 0) { toast.error("Adicione pelo menos um item ao pedido"); return; }
          const data = prepareOrderData();
          setPendingOrderData(data);
          processSubmission(undefined, false, data);
        }}
        onSaveAndPrint={() => {
          const validItems = items.filter((i) => i.product.trim());
          if (validItems.length === 0) { toast.error("Adicione pelo menos um item ao pedido"); return; }
          const data = prepareOrderData();
          setPendingOrderData(data);
          processSubmission(undefined, true, data);
        }}
      />

      <CustomerSearchDialog
        open={customerSearchOpen}
        onOpenChange={setCustomerSearchOpen}
        customers={customers}
        onSelectCustomer={handleSelectCustomer}
        query={customerSearchQuery}
        onQueryChange={setCustomerSearchQuery}
      />

      <AlertDialog open={showCuringaDialog} onOpenChange={setShowCuringaDialog}>
        <AlertDialogContent className="rounded-[2rem]">
          <AlertDialogHeader>
            <AlertDialogTitle className="uppercase font-black italic">Cliente não encontrado</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Deseja realizar o cadastramento deste cliente agora?
              <br /><br />
              Se clicar em <b>AVULSO</b>, os dados serão salvos apenas neste pedido para não perder a venda.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel
              onClick={() => { setCustomerName("CLIENTE NÃO CADASTRADO"); toast.info("Usando cadastro curinga."); setShowCuringaDialog(false); }}
              className="rounded-xl uppercase font-bold text-xs"
            >
              Venda Avulsa
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { toast.info("Por favor, preencha o nome e finalize o cadastro."); setShowCuringaDialog(false); }}
              className="rounded-xl uppercase font-black text-xs bg-orange-500 hover:bg-orange-600 text-white"
            >
              Sim, Cadastrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        onAuthorize={(authorizedBy) => processSubmission(authorizedBy)}
      />
    </form>
  );
}
