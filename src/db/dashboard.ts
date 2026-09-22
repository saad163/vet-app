import { getDB } from "../../database";

export interface DashboardMetrics {
  totalProducts: number;
  totalStock: number;
  todaySales: number;
  todayProfit: number;
  lowStockCount: number;
  outOfStockCount: number;
  nearExpiryCount: number;
  expiredCount: number;
}

export const getDashboardMetrics = (): DashboardMetrics => {
  const db = getDB();
  const today = new Date().toISOString().split("T")[0] + "%"; 
  
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const expiryThreshold = thirtyDaysFromNow.toISOString().split("T")[0];

  const metrics: DashboardMetrics = {
    totalProducts: 0,
    totalStock: 0,
    todaySales: 0,
    todayProfit: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    nearExpiryCount: 0,
    expiredCount: 0,
  };

  // 1. Total active products
  const productsResult = db.getFirstSync<{count: number}>(`SELECT COUNT(id) as count FROM products WHERE is_active = 1`);
  metrics.totalProducts = productsResult?.count || 0;

  // 2. Total Stock
  const stockResult = db.getFirstSync<{total: number}>(`SELECT SUM(total_stock) as total FROM products WHERE is_active = 1`);
  metrics.totalStock = stockResult?.total || 0;

  // 3. Today's Sales & Profit
  const salesResult = db.getFirstSync<{sales: number, profit: number}>(`
    SELECT COALESCE(SUM(total_amount), 0) as sales, COALESCE(SUM(total_profit), 0) as profit 
    FROM sales 
    WHERE sale_date LIKE ?
  `, [today]);
  
  const returnsResult = db.getFirstSync<{returns: number, return_profit: number}>(`
    SELECT COALESCE(SUM(total_refund), 0) as returns, COALESCE(SUM(total_profit_adjustment), 0) as return_profit 
    FROM returns 
    WHERE return_date LIKE ?
  `, [today]);

  metrics.todaySales = (salesResult?.sales || 0) - (returnsResult?.returns || 0);
  metrics.todayProfit = (salesResult?.profit || 0) - (returnsResult?.return_profit || 0);

  // 4. Alerts counts
  const productStock = db.getAllSync<{id: number, min_alert: number, total: number}>(`
    SELECT id, min_stock_alert as min_alert, total_stock as total
    FROM products
    WHERE is_active = 1
  `);

  for (const p of productStock) {
    if (p.total === 0) {
      metrics.outOfStockCount++;
    } else if (p.total <= p.min_alert) {
      metrics.lowStockCount++;
    }
  }

  // 5. Expiring soon & Expired counts
  const todayDateStr = new Date().toISOString().split("T")[0];
  
  const expiringResult = db.getFirstSync<{count: number}>(`
    SELECT COUNT(id) as count FROM products 
    WHERE total_stock > 0 
    AND expiry_date IS NOT NULL 
    AND expiry_date != '' 
    AND expiry_date > ? 
    AND expiry_date <= ?
    AND is_active = 1
  `, [todayDateStr, expiryThreshold]);
  
  const expiredResult = db.getFirstSync<{count: number}>(`
    SELECT COUNT(id) as count FROM products 
    WHERE total_stock > 0 
    AND expiry_date IS NOT NULL 
    AND expiry_date != '' 
    AND expiry_date <= ?
    AND is_active = 1
  `, [todayDateStr]);
  
  metrics.nearExpiryCount = expiringResult?.count || 0;
  metrics.expiredCount = expiredResult?.count || 0;

  return metrics;
};

export interface AlertItem {
  id: string; // unique string for UI
  type: 'OUT_OF_STOCK' | 'LOW_STOCK' | 'NEAR_EXPIRY' | 'EXPIRED';
  productId: number;
  productName: string;
  message: string;
}

export const getAlerts = (): AlertItem[] => {
  const db = getDB();
  const alerts: AlertItem[] = [];

  // Low/Out of Stock
  const productStock = db.getAllSync<{id: number, name: string, min_alert: number, total: number}>(`
    SELECT id, name, min_stock_alert as min_alert, total_stock as total
    FROM products
    WHERE is_active = 1
    AND (total_stock <= min_stock_alert OR total_stock = 0)
  `);

  for (const p of productStock) {
    if (p.total === 0) {
      alerts.push({
        id: `oos-${p.id}`,
        type: 'OUT_OF_STOCK',
        productId: p.id,
        productName: p.name,
        message: 'Out of stock'
      });
    } else if (p.total <= p.min_alert) {
      alerts.push({
        id: `low-${p.id}`,
        type: 'LOW_STOCK',
        productId: p.id,
        productName: p.name,
        message: `Only ${p.total} units remaining (Min: ${p.min_alert})`
      });
    }
  }

  // Expiring
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const expiryThreshold = thirtyDaysFromNow.toISOString().split("T")[0];

  const todayDateStr = new Date().toISOString().split("T")[0];

  const expiringProducts = db.getAllSync<{id: number, name: string, expiry_date: string}>(`
    SELECT id, name, expiry_date
    FROM products
    WHERE total_stock > 0 
    AND expiry_date IS NOT NULL 
    AND expiry_date != '' 
    AND expiry_date <= ?
    AND is_active = 1
  `, [expiryThreshold]);

  for (const p of expiringProducts) {
    const isExpired = p.expiry_date <= todayDateStr;
    alerts.push({
      id: isExpired ? `expired-${p.id}` : `exp-${p.id}`,
      type: isExpired ? 'EXPIRED' : 'NEAR_EXPIRY',
      productId: p.id,
      productName: p.name,
      message: isExpired 
        ? `Expired on ${p.expiry_date}` 
        : `Expires on ${p.expiry_date}`
    });
  }

  return alerts;
};
