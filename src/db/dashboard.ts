import { getDB } from "../../database";

export interface DashboardMetrics {
  totalProducts: number;
  totalStock: number;
  todaySales: number;
  todayProfit: number;
  lowStockCount: number;
  outOfStockCount: number;
  expiringSoonCount: number;
}

export const getDashboardMetrics = (): DashboardMetrics => {
  const db = getDB();
  const today = new Date().toISOString().split("T")[0] + "%"; // match '2026-09-16' part
  
  // Date 30 days from now
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
    expiringSoonCount: 0,
  };

  // 1. Total active products
  const productsResult = db.getFirstSync<{count: number}>(`SELECT COUNT(id) as count FROM products WHERE is_active = 1`);
  metrics.totalProducts = productsResult?.count || 0;

  // 2. Total Stock
  const stockResult = db.getFirstSync<{total: number}>(`SELECT SUM(remaining_quantity) as total FROM batches`);
  metrics.totalStock = stockResult?.total || 0;

  // 3. Today's Sales & Profit
  const salesResult = db.getFirstSync<{sales: number, profit: number}>(`
    SELECT SUM(total_amount) as sales, SUM(total_profit) as profit 
    FROM sales 
    WHERE sale_date LIKE ?
  `, [today]);
  metrics.todaySales = salesResult?.sales || 0;
  metrics.todayProfit = salesResult?.profit || 0;

  // 4. Alerts counts (needs to aggregate batch stock by product)
  const productStock = db.getAllSync<{id: number, min_alert: number, total: number}>(`
    SELECT p.id, p.min_stock_alert as min_alert, COALESCE(SUM(b.remaining_quantity), 0) as total
    FROM products p
    LEFT JOIN batches b ON p.id = b.product_id
    WHERE p.is_active = 1
    GROUP BY p.id
  `);

  for (const p of productStock) {
    if (p.total === 0) {
      metrics.outOfStockCount++;
    } else if (p.total <= p.min_alert) {
      metrics.lowStockCount++;
    }
  }

  // 5. Expiring soon count
  const expiringResult = db.getFirstSync<{count: number}>(`
    SELECT COUNT(id) as count FROM batches 
    WHERE remaining_quantity > 0 
    AND expiry_date IS NOT NULL 
    AND expiry_date != '' 
    AND expiry_date <= ?
  `, [expiryThreshold]);
  
  metrics.expiringSoonCount = expiringResult?.count || 0;

  return metrics;
};

export interface AlertItem {
  id: string; // unique string for UI
  type: 'OUT_OF_STOCK' | 'LOW_STOCK' | 'EXPIRING';
  productName: string;
  message: string;
}

export const getAlerts = (): AlertItem[] => {
  const db = getDB();
  const alerts: AlertItem[] = [];

  // Low/Out of Stock
  const productStock = db.getAllSync<{id: number, name: string, min_alert: number, total: number}>(`
    SELECT p.id, p.name, p.min_stock_alert as min_alert, COALESCE(SUM(b.remaining_quantity), 0) as total
    FROM products p
    LEFT JOIN batches b ON p.id = b.product_id
    WHERE p.is_active = 1
    GROUP BY p.id
    HAVING total <= min_alert OR total = 0
  `);

  for (const p of productStock) {
    if (p.total === 0) {
      alerts.push({
        id: `oos-${p.id}`,
        type: 'OUT_OF_STOCK',
        productName: p.name,
        message: 'Out of stock'
      });
    } else if (p.total <= p.min_alert) {
      alerts.push({
        id: `low-${p.id}`,
        type: 'LOW_STOCK',
        productName: p.name,
        message: `Only ${p.total} units remaining (Min: ${p.min_alert})`
      });
    }
  }

  // Expiring
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const expiryThreshold = thirtyDaysFromNow.toISOString().split("T")[0];

  const expiringBatches = db.getAllSync<{id: number, product_name: string, batch_number: string, expiry_date: string}>(`
    SELECT b.id, p.name as product_name, b.batch_number, b.expiry_date
    FROM batches b
    JOIN products p ON b.product_id = p.id
    WHERE b.remaining_quantity > 0 
    AND b.expiry_date IS NOT NULL 
    AND b.expiry_date != '' 
    AND b.expiry_date <= ?
  `, [expiryThreshold]);

  for (const b of expiringBatches) {
    alerts.push({
      id: `exp-${b.id}`,
      type: 'EXPIRING',
      productName: b.product_name,
      message: `Batch ${b.batch_number} expires on ${b.expiry_date}`
    });
  }

  return alerts;
};
