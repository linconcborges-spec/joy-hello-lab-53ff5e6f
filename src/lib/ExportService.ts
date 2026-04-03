import { Order } from "@/types/order";

export const exportOrdersToCSV = (orders: Order[]) => {
  if (orders.length === 0) {
    return;
  }

  // Cabeçalhos do CSV
  const headers = [
    "Número",
    "Data",
    "Cliente",
    "Telefone",
    "Endereço",
    "Itens",
    "Taxa Entrega",
    "Total",
    "Status",
    "Pagamento"
  ];

  // Mapear dados para linhas
  const rows = orders.map(order => {
    const itemsDescription = order.items
      .map(item => `${item.quantity}x ${item.product}`)
      .join(" | ");
    
    return [
      order.number,
      new Date(order.createdAt).toLocaleString("pt-BR"),
      order.customerName || "Avulso",
      order.phone,
      `"${order.address}"`, // Aspas para não quebrar com vírgulas
      `"${itemsDescription}"`,
      order.deliveryFee.toFixed(2),
      order.totalAmount.toFixed(2),
      order.status,
      order.paymentMethod
    ];
  });

  // Montar conteúdo do arquivo
  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.join(","))
  ].join("\n");

  // Criar e disparar download
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const dateStr = new Date().toISOString().split("T")[0];
  
  link.setAttribute("href", url);
  link.setAttribute("download", `backup_pedidos_${dateStr}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
