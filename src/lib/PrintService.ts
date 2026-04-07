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
            font-size: ${settings.printFontSize || '14px'};
            width: ${settings.printPaperWidth};
            margin: 0;
            padding: 0;
            color: #000;
            line-height: 1.3;
            text-transform: uppercase;
            font-weight: 600;
          }
          .container {
            padding: 2px 5px;
          }
          .text-center { text-align: center; }
          .bold { font-weight: bold; }
          
          .dashed-line {
            border-top: 1px dashed #000;
            margin: 10px 0;
          }
          
          .store-name {
            font-size: 1.1em;
            margin-bottom: 5px;
          }
          .datetime {
            margin-bottom: 5px;
          }
          .delivery-type {
            font-size: 1.25em;
            margin-bottom: 5px;
          }
          .order-number {
            font-size: 1em;
          }
          
          .item-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .item-title {
            flex: 1;
            padding-right: 5px;
          }
          .item-price {
            text-align: right;
            white-space: nowrap;
          }
          .addon {
            margin-left: 15px;
          }
          .obs {
            margin-left: 15px;
          }
          
          .totals-row {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
            font-size: 1.1em;
            margin-top: 4px;
          }
          .watermark {
            text-align: center;
            font-size: 1.5em;
            font-weight: 900;
            border: 4px solid #000;
            margin: 10px 0;
            padding: 10px;
            letter-spacing: 2px;
            background: #fff;
          }
        </style>
      </head>
      <body>
        <div style="height: ${settings.printMarginTop || '0mm'}; width: 100%;"></div>
        <div class="container">
          ${(order.status === 'completed' || order.status === 'cancelled' || new Date(order.createdAt).toDateString() !== new Date().toDateString()) ? `
            <div class="watermark">
              ${order.status === 'cancelled' ? 'CANCELADO' : order.status === 'completed' ? 'CONCLUÍDO' : 'REIMPRESSÃO'}
              <div style="font-size: 0.5em; margin-top: 5px;">${new Date(order.createdAt).toLocaleDateString('pt-BR')}</div>
            </div>
          ` : ''}

          <div class="text-center">
            <div class="store-name">${settings.storeName}</div>
            <div class="dashed-line"></div>
            <div class="datetime">${date.replace(',', ' -')}</div>
            <div class="delivery-type bold">${order.isPickup ? 'RETIRADA' : 'DELIVERY'}</div>
            <div class="order-number">PEDIDO Nº (${order.number})</div>
          </div>
          
          <div class="dashed-line"></div>
          
          <div class="text-center">
            <div>${order.customerName || "NÃO INFORMADO"}</div>
            <div>${order.phone || ""}</div>
            <div style="font-size: 0.9em; margin-top: 3px;">
              ${order.isPickup ? "RETIRADA NO LOCAL" : (order.address || "")}
            </div>
          </div>
          
          <div class="dashed-line"></div>

          <div>
            ${order.items.map(item => `
              <div class="item-row">
                <div class="item-title">X ${item.quantity}${item.addons && item.addons.length > 0 ? ' *** ' : ' '}${item.product}</div>
                <div class="item-price">${item.total.toFixed(2).replace('.', ',')}</div>
              </div>
              ${item.addons && item.addons.length > 0 ? `
                ${item.addons.map(a => `
                  <div class="addon">+ ${a.name}</div>
                `).join('')}
              ` : ''}
              ${item.observation ? `
                <div class="obs">OBS: ${item.observation}</div>
              ` : ''}
              <div style="margin-bottom: 8px;"></div>
            `).join('')}
            ${order.deliveryFee > 0 ? `
              <div class="item-row">
                <div class="item-title">X 1 TAXA DE ENTREGA</div>
                <div class="item-price">${order.deliveryFee.toFixed(2).replace('.', ',')}</div>
              </div>
            ` : ''}
          </div>

          <div class="dashed-line"></div>

          <div>
            <div>FORMA DE PAGAMENTO:</div>
            <div>1: R$ ${order.totalAmount.toFixed(2).replace('.', ',')} - ${order.paymentMethod === 'cash' ? 'DINHEIRO' : order.paymentMethod === 'card' ? 'CARTÃO' : 'PIX'}</div>
            ${order.changeFor > 0 ? `
              <div>VALOR DO TROCO: R$ ${(order.changeFor - order.totalAmount).toFixed(2).replace('.', ',')}</div>
            ` : ''}
          </div>

          <div class="dashed-line"></div>

          <div class="totals-row total-big">
            <span>TOTAL R$</span>
            <span>${order.totalAmount.toFixed(2).replace('.', ',')}</span>
          </div>

          <div class="dashed-line"></div>

          <div>
            <div>STATUS DO PAGAMENTO: NÃO PAGO</div>
            ${order.observation ? `<div style="margin-top: 6px; font-weight: bold;">OBS: ${order.observation}</div>` : ''}
          </div>

          ${(order.status === 'completed' || order.status === 'cancelled') ? `
             <div class="watermark" style="margin-top: 20px;">
               ${order.status === 'cancelled' ? 'CANCELADO' : 'CONCLUÍDO'}
             </div>
          ` : ''}

          <div class="text-center" style="margin-top: 25px; font-size: 0.8em; font-weight: bold;">
            <div>Este documento não tem valor fiscal.</div>
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
