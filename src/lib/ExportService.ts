import { Order } from "@/types/order";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

export const exportFullSystemBackup = async () => {
  try {
    const toastId = toast.loading("Gerando backup completo...");
    
    // Buscar todos os dados principais
    const { data: categories } = await supabase.from("categories").select("*");
    const { data: products } = await supabase.from("products").select("*");
    const { data: addons } = await supabase.from("addons").select("*");
    const { data: customers } = await supabase.from("customers").select("*");
    const { data: settings } = await supabase.from("settings").select("*");
    const { data: employees } = await supabase.from("employees").select("*");
    const { data: orders } = await supabase.from("orders").select("*");
    const { data: orderItems } = await supabase.from("order_items").select("*");
    const { data: orderAddons } = await supabase.from("order_addons").select("*");

    const backupData = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      data: {
        categories,
        products,
        addons,
        customers,
        settings,
        employees,
        orders,
        orderItems,
        orderAddons
      }
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().replace(/:/g, "-").split(".")[0];
    
    link.setAttribute("href", url);
    link.setAttribute("download", `SISTEMA_FULL_BACKUP_${dateStr}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.dismiss(toastId);
    toast.success("Backup completo gerado com sucesso!");
  } catch (error) {
    console.error("Erro no backup:", error);
    toast.error("Falha ao gerar backup completo.");
  }
};

export const importFullSystemBackup = async (jsonData: any) => {
  try {
    if (!jsonData.version || !jsonData.data) {
      throw new Error("Arquivo de backup inválido");
    }

    const { data } = jsonData;
    const toastId = toast.loading("Restaurando dados... Isso pode demorar.");

    // Função auxiliar para inserir dados ignorando erros de duplicidade se necessário
    const safeInsert = async (table: string, records: any[]) => {
      if (!records || records.length === 0) return;
      
      // Para o restore completo, vamos usar upsert para evitar erros de PRIMARY KEY
      const { error } = await supabase.from(table as any).upsert(records);
      if (error) {
        console.error(`Erro ao restaurar ${table}:`, error);
        throw error;
      }
    };

    // Restaurar na ordem correta de dependências
    await safeInsert("categories", data.categories);
    await safeInsert("products", data.products);
    await safeInsert("addons", data.addons);
    await safeInsert("customers", data.customers);
    await safeInsert("settings", data.settings);
    await safeInsert("employees", data.employees);
    await safeInsert("orders", data.orders);
    await safeInsert("order_items", data.orderItems);
    await safeInsert("order_addons", data.orderAddons);

    toast.dismiss(toastId);
    toast.success("Sistema restaurado com sucesso! Recarregando...");
    setTimeout(() => window.location.reload(), 1500);
  } catch (error) {
    console.error("Erro na restauração:", error);
    toast.error("Falha ao restaurar backup. Verifique o arquivo.");
  }
};
