import { getDB } from "../../database";

export interface PDFReportData {
  salesSummary: {
    totalSales: number;
    totalItemsSold: number;
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
  };
  purchaseSummary: {
    totalPurchases: number;
    totalItemsPurchased: number;
    totalPurchaseCost: number;
  };
  stockSummary: {
    totalProducts: number;
    totalStock: number;
    lowStockProducts: number;
    outOfStockProducts: number;
  };
  salesDetails: {
    date: string;
    product: string;
    quantity: number;
    purchaseCost: number;
    sellingPrice: number;
    totalSale: number;
    profit: number;
  }[];
  purchaseDetails: {
    date: string;
    product: string;
    supplier: string;
    quantity: number;
    purchasePrice: number;
    totalCost: number;
  }[];
}

export const getPDFReportData = (startDate: string, endDate: string): PDFReportData => {
  const db = getDB();

  // Sales Summary & Details
  const salesSummaryRaw = db.getFirstSync<{
    totalSales: number;
    totalItemsSold: number;
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
  }>(`
    SELECT 
      COUNT(DISTINCT s.id) as totalSales,
      COALESCE(SUM(si.quantity), 0) as totalItemsSold,
      COALESCE(SUM(si.subtotal), 0) as totalRevenue,
      COALESCE(SUM(si.purchase_price * si.quantity), 0) as totalCost,
      COALESCE(SUM(si.total_profit), 0) as totalProfit
    FROM sales s
    LEFT JOIN sale_items si ON s.id = si.sale_id
    WHERE substr(s.sale_date, 1, 10) >= ? AND substr(s.sale_date, 1, 10) <= ?
  `, [startDate, endDate]);

  const salesDetails = db.getAllSync<{
    date: string;
    product: string;
    quantity: number;
    purchaseCost: number;
    sellingPrice: number;
    totalSale: number;
    profit: number;
  }>(`
    SELECT 
      substr(s.sale_date, 1, 16) as date,
      p.name as product,
      si.quantity as quantity,
      si.purchase_price as purchaseCost,
      si.selling_price as sellingPrice,
      si.subtotal as totalSale,
      si.total_profit as profit
    FROM sale_items si
    JOIN sales s ON si.sale_id = s.id
    JOIN products p ON si.product_id = p.id
    WHERE substr(s.sale_date, 1, 10) >= ? AND substr(s.sale_date, 1, 10) <= ?
    ORDER BY s.sale_date DESC
  `, [startDate, endDate]);

  // Purchase Summary & Details
  const purchaseSummaryRaw = db.getFirstSync<{
    totalPurchases: number;
    totalItemsPurchased: number;
    totalPurchaseCost: number;
  }>(`
    SELECT 
      COUNT(DISTINCT p.id) as totalPurchases,
      COALESCE(SUM(pi.quantity), 0) as totalItemsPurchased,
      COALESCE(SUM(pi.subtotal), 0) as totalPurchaseCost
    FROM purchases p
    LEFT JOIN purchase_items pi ON p.id = pi.purchase_id
    WHERE substr(p.purchase_date, 1, 10) >= ? AND substr(p.purchase_date, 1, 10) <= ?
  `, [startDate, endDate]);

  const purchaseDetails = db.getAllSync<{
    date: string;
    product: string;
    supplier: string;
    quantity: number;
    purchasePrice: number;
    totalCost: number;
  }>(`
    SELECT 
      substr(p.purchase_date, 1, 16) as date,
      prod.name as product,
      COALESCE(p.supplier, 'N/A') as supplier,
      pi.quantity as quantity,
      pi.purchase_price as purchasePrice,
      pi.subtotal as totalCost
    FROM purchase_items pi
    JOIN purchases p ON pi.purchase_id = p.id
    JOIN products prod ON pi.product_id = prod.id
    WHERE substr(p.purchase_date, 1, 10) >= ? AND substr(p.purchase_date, 1, 10) <= ?
    ORDER BY p.purchase_date DESC
  `, [startDate, endDate]);

  // Stock Summary
  const stockSummaryRaw = db.getFirstSync<{
    totalProducts: number;
    totalStock: number;
    lowStockProducts: number;
    outOfStockProducts: number;
  }>(`
    SELECT 
      COUNT(id) as totalProducts,
      COALESCE(SUM(total_stock), 0) as totalStock,
      SUM(CASE WHEN total_stock <= min_stock_alert AND total_stock > 0 THEN 1 ELSE 0 END) as lowStockProducts,
      SUM(CASE WHEN total_stock = 0 THEN 1 ELSE 0 END) as outOfStockProducts
    FROM products
    WHERE is_active = 1
  `);

  return {
    salesSummary: salesSummaryRaw || { totalSales: 0, totalItemsSold: 0, totalRevenue: 0, totalCost: 0, totalProfit: 0 },
    purchaseSummary: purchaseSummaryRaw || { totalPurchases: 0, totalItemsPurchased: 0, totalPurchaseCost: 0 },
    stockSummary: stockSummaryRaw || { totalProducts: 0, totalStock: 0, lowStockProducts: 0, outOfStockProducts: 0 },
    salesDetails: salesDetails || [],
    purchaseDetails: purchaseDetails || []
  };
};
