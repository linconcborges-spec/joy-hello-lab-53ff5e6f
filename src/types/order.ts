export interface OrderAddon {
  name: string;
  price: number;
}

export interface OrderItem {
  id: string;
  productCode: string;
  quantity: number;
  product: string;
  addons: OrderAddon[];
  unitPrice: number;
  total: number;
  categoryId?: string | null;
  observation?: string;
}

export interface Order {
  id: string;
  number: number;
  customerName: string;
  address: string;
  phone: string;
  cnpj: string;
  items: OrderItem[];
  deliveryFee: number;
  totalAmount: number;
  changeFor: number;
  status: "pending" | "preparing" | "delivering" | "completed" | "cancelled";
  createdAt: string;
  paymentMethod: "cash" | "card" | "pix";
}

export const STATUS_LABELS: Record<Order["status"], string> = {
  pending: "Pendente",
  preparing: "Preparando",
  delivering: "Em entrega",
  completed: "Concluído",
  cancelled: "Cancelado",
};

export const PAYMENT_LABELS: Record<Order["paymentMethod"], string> = {
  cash: "Dinheiro",
  card: "Cartão",
  pix: "PIX",
};
