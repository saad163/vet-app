import { PDFReportData } from "../db/pdf";

export const generatePDFHtml = (
  reportType: string,
  dateFrom: string,
  dateTo: string,
  data: PDFReportData
): string => {
  const generatedDate = new Date().toLocaleString();
  const isDateRangeSame = dateFrom === dateTo;
  const dateDisplay = isDateRangeSame ? dateFrom : `${dateFrom} to ${dateTo}`;

  const formatCurrency = (val: number) => `Rs. ${val.toFixed(2)}`;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Veterinary Store Report</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; margin: 0; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #059669; padding-bottom: 15px; margin-bottom: 20px; }
        h1 { color: #059669; margin: 0 0 5px 0; font-size: 28px; }
        h2 { color: #047857; font-size: 20px; margin: 0; }
        .meta { margin-top: 10px; font-size: 14px; color: #666; }
        .summary-grid { display: flex; justify-content: space-between; margin-bottom: 30px; gap: 15px; }
        .summary-box { background: #ecfdf5; border: 1px solid #d1fae5; padding: 15px; border-radius: 8px; flex: 1; }
        .summary-box h3 { margin: 0 0 10px 0; color: #059669; font-size: 16px; border-bottom: 1px solid #d1fae5; padding-bottom: 5px; }
        .stat { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px; }
        .stat strong { color: #111; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 12px; }
        th { background-color: #059669; color: white; padding: 10px; text-align: left; }
        td { border-bottom: 1px solid #eee; padding: 10px; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .text-right { text-align: right; }
        .profit { color: #059669; font-weight: bold; }
        .loss { color: #dc2626; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>New Malik Veterinary</h1>
        <h2>Veterinary Store Management Report</h2>
        <div class="meta">
          <strong>Report Type:</strong> ${reportType} | 
          <strong>Date:</strong> ${dateDisplay} | 
          <strong>Generated:</strong> ${generatedDate}
        </div>
      </div>

      <div class="summary-grid">
        <div class="summary-box">
          <h3>Sales Summary</h3>
          <div class="stat"><span>Total Sales:</span> <strong>${data.salesSummary.totalSales}</strong></div>
          <div class="stat"><span>Items Sold:</span> <strong>${data.salesSummary.totalItemsSold}</strong></div>
          <div class="stat"><span>Total Revenue:</span> <strong>${formatCurrency(data.salesSummary.totalRevenue)}</strong></div>
          <div class="stat"><span>Total Cost:</span> <strong>${formatCurrency(data.salesSummary.totalCost)}</strong></div>
          <div class="stat"><span>Total Profit:</span> <strong class="${data.salesSummary.totalProfit >= 0 ? 'profit' : 'loss'}">${formatCurrency(data.salesSummary.totalProfit)}</strong></div>
        </div>
        <div class="summary-box">
          <h3>Purchase Summary</h3>
          <div class="stat"><span>Total Purchases:</span> <strong>${data.purchaseSummary.totalPurchases}</strong></div>
          <div class="stat"><span>Items Purchased:</span> <strong>${data.purchaseSummary.totalItemsPurchased}</strong></div>
          <div class="stat"><span>Total Cost:</span> <strong>${formatCurrency(data.purchaseSummary.totalPurchaseCost)}</strong></div>
        </div>
        <div class="summary-box">
          <h3>Stock Summary</h3>
          <div class="stat"><span>Total Products:</span> <strong>${data.stockSummary.totalProducts}</strong></div>
          <div class="stat"><span>Total Stock Units:</span> <strong>${data.stockSummary.totalStock}</strong></div>
          <div class="stat"><span>Low Stock Alerts:</span> <strong style="color:#d97706">${data.stockSummary.lowStockProducts}</strong></div>
          <div class="stat"><span>Out of Stock:</span> <strong style="color:#dc2626">${data.stockSummary.outOfStockProducts}</strong></div>
        </div>
      </div>

      <h3 style="color: #047857; margin-bottom: 10px;">Sales Details</h3>
      ${data.salesDetails.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Product</th>
              <th class="text-right">Qty</th>
              <th class="text-right">Cost Price</th>
              <th class="text-right">Sell Price</th>
              <th class="text-right">Total Sale</th>
              <th class="text-right">Profit</th>
            </tr>
          </thead>
          <tbody>
            ${data.salesDetails.map(s => `
              <tr>
                <td>${s.date}</td>
                <td>${s.product}</td>
                <td class="text-right">${s.quantity}</td>
                <td class="text-right">${formatCurrency(s.purchaseCost)}</td>
                <td class="text-right">${formatCurrency(s.sellingPrice)}</td>
                <td class="text-right">${formatCurrency(s.totalSale)}</td>
                <td class="text-right ${s.profit >= 0 ? 'profit' : 'loss'}">${formatCurrency(s.profit)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : '<p style="color: #666; margin-bottom: 30px;">No sales recorded in this period.</p>'}

      <h3 style="color: #047857; margin-bottom: 10px;">Purchase Details</h3>
      ${data.purchaseDetails.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Product</th>
              <th>Supplier</th>
              <th class="text-right">Qty</th>
              <th class="text-right">Purchase Price</th>
              <th class="text-right">Total Cost</th>
            </tr>
          </thead>
          <tbody>
            ${data.purchaseDetails.map(p => `
              <tr>
                <td>${p.date}</td>
                <td>${p.product}</td>
                <td>${p.supplier}</td>
                <td class="text-right">${p.quantity}</td>
                <td class="text-right">${formatCurrency(p.purchasePrice)}</td>
                <td class="text-right">${formatCurrency(p.totalCost)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : '<p style="color: #666;">No purchases recorded in this period.</p>'}

    </body>
    </html>
  `;
};
