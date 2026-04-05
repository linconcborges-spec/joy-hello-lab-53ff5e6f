import type { Order } from "@/types/order";
import type { AppSettings } from "@/hooks/useSettings";

export function printOrder(order: Order, settings: AppSettings) {
  const printWindow = window.open("", "_blank", "width=800,height=600");
  if (!printWindow) return;

  const date = new Date(order.createdAt).toLocaleString("pt-BR");
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Pedido #${order.number}</title>
        <style>
          @page {
            margin: ${settings.printMargin};
            size: ${settings.printPaperWidth} auto;
          }
          body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: ${settings.printFontSize};
            width: ${settings.printPaperWidth};
            margin: 0;
            padding: 0;
            color: #000;
            line-height: 1.2;
          }
          .container {
            padding: 5px;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 10px;
          }
          .store-name {
            font-size: 1.5em;
            font-weight: 900;
            margin-bottom: 5px;
            text-transform: uppercase;
          }
          .order-number {
            font-size: 1.3em;
            font-weight: 900;
          }
          .section {
            margin-bottom: 12px;
            border-bottom: 1px solid #000;
            padding-bottom: 8px;
          }
          .section-title {
            font-weight: 900;
            margin-bottom: 4px;
            text-transform: uppercase;
            font-size: 1em;
            text-decoration: underline;
          }
          .item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
            font-weight: bold;
            font-size: 1.1em;
          }
          .item-details {
            flex: 1;
            padding-right: 5px;
          }
          .item-price {
            margin-left: 10px;
            font-weight: 900;
          }
          .addon {
            font-size: 1em;
            margin-left: 15px;
            font-weight: bold;
          }
          .obs {
            font-size: 1em;
            margin-left: 15px;
            font-weight: 900;
            background: #eee;
            padding: 2px 5px;
            margin-top: 2px;
            text-transform: uppercase;
          }
          .totals {
            margin-top: 15px;
          }
          .total-line {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
            font-weight: bold;
          }
          .grand-total {
            font-weight: 900;
            font-size: 1.4em;
            margin-top: 8px;
            border-top: 2px solid #000;
            padding-top: 8px;
          }
          .footer {
            text-align: center;
            margin-top: 25px;
            font-size: 1em;
            font-weight: bold;
            border-top: 1px dashed #000;
            padding-top: 10px;
          }
          @media print {
            body { width: 100%; }
          }
        </style>
      </head>
      <body>
        <div style="height: ${settings.printMarginTop || '0mm'}; width: 100%;"></div>
        <div class="container">
          <div class="header">
            <div class="store-name">${settings.storeName}</div>
            ${order.isPickup ? '<div style="font-size:1.4em;font-weight:900;background:#000;color:#fff;padding:4px 10px;margin:6px 0;letter-spacing:2px;">★ RETIRADA ★</div>' : ''}
            <div class="order-number">Pedido #${order.number}</div>
            <div>${date}</div>
          </div>

          <div class="section">
            <div class="section-title">Cliente</div>
            <div>${order.customerName || "Não informado"}</div>
            <div>${order.phone || ""}</div>
            <div>${order.isPickup ? "RETIRADA NO LOCAL" : (order.address || "Retirada")}</div>
          </div>

          ${order.observation ? `
          <div class="section" style="background:#eee; padding:5px; border:2px dashed #000; margin-bottom:12px; text-align: center;">
            <div class="section-title" style="border:none; margin:0; text-align: center;">OBSERVAÇÃO</div>
            <div style="font-weight: 900; font-style: italic; font-size: 1.1em; text-transform: uppercase;">
              ${order.observation}
            </div>
          </div>
          ` : ''}

          <div class="section">
            <div class="section-title">Itens</div>
            ${order.items.map(item => `
              <div class="item">
                <div class="item-details">
                  ${item.quantity}x ${item.product}
                </div>
                <div class="item-price">R$ ${item.total.toFixed(2)}</div>
              </div>
              ${item.addons && item.addons.length > 0 ? `
                ${item.addons.map(a => `
                  <div class="addon">+ ${a.name} (R$ ${a.price.toFixed(2)})</div>
                `).join('')}
              ` : ''}
              ${item.observation ? `<div class="obs">Obs: ${item.observation}</div>` : ''}
            `).join('')}
          </div>

          <div class="totals text-right">
            <div class="total-line">
              <span>Subtotal</span>
              <span>R$ ${(order.totalAmount - order.deliveryFee).toFixed(2)}</span>
            </div>
            <div class="total-line">
              <span>Taxa de Entrega</span>
              <span>R$ ${order.deliveryFee.toFixed(2)}</span>
            </div>
            <div class="total-line grand-total">
              <span>TOTAL</span>
              <span>R$ ${order.totalAmount.toFixed(2)}</span>
            </div>
            ${order.changeFor > 0 ? `
              <div class="total-line">
                <span>Troco para</span>
                <span>R$ ${order.changeFor.toFixed(2)}</span>
              </div>
              <div class="total-line">
                <span>Total Troco</span>
                <span>R$ ${(order.changeFor - order.totalAmount).toFixed(2)}</span>
              </div>
            ` : ''}
            <div class="total-line">
              <span>Pagamento</span>
              <span>${order.paymentMethod.toUpperCase()}</span>
            </div>
          </div>

          <div class="footer">
            Obrigado pela preferência!
          </div>
        </div>
        <script>
          window.focus();
          setTimeout(() => {
            window.print();
            window.close();
          }, 500);
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
