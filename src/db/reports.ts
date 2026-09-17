import { getDB } from "../../database";

export interface DailyReport {
  date: string;
  total_sales: number;
  total_profit: number;
}

export interface MonthlyReport {
  month: string;
  total_sales: number;
  total_profit: number;
}

export interface ProductReport {
  product_id: number;
  product_name: string;
  total_quantity_sold: number;
  total_revenue: number;
  total_profit: number;
}

export const getDailyReport = (): DailyReport[] => {
  const db = getDB();
  return db.getAllSync(`
    SELECT 
      substr(sale_date, 1, 10) as date, 
      SUM(total_amount) as total_sales, 
      SUM(total_profit) as total_profit
    FROM sales
    GROUP BY substr(sale_date, 1, 10)
    ORDER BY date DESC
    LIMIT 30
  `);
};

export const getMonthlyReport = (): MonthlyReport[] => {
  const db = getDB();
  return db.getAllSync(`
    SELECT 
      substr(sale_date, 1, 7) as month, 
      SUM(total_amount) as total_sales, 
      SUM(total_profit) as total_profit
    FROM sales
    GROUP BY substr(sale_date, 1, 7)
    ORDER BY month DESC
    LIMIT 12
  `);
};

export const getProductReport = (): ProductReport[] => {
  const db = getDB();
  return db.getAllSync(`
    SELECT 
      p.id as product_id,
      p.name as product_name,
      SUM(si.quantity) as total_quantity_sold,
      SUM(si.subtotal) as total_revenue,
      SUM(si.total_profit) as total_profit
    FROM sale_items si
    JOIN products p ON si.product_id = p.id
    GROUP BY p.id
    ORDER BY total_quantity_sold DESC
  `);
};
