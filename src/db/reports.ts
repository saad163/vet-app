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
      d.date,
      COALESCE(SUM(d.total_sales), 0) - COALESCE(SUM(d.total_refund), 0) as total_sales,
      COALESCE(SUM(d.total_profit), 0) - COALESCE(SUM(d.total_profit_adjustment), 0) as total_profit
    FROM (
      SELECT substr(sale_date, 1, 10) as date, total_amount as total_sales, total_profit, 0 as total_refund, 0 as total_profit_adjustment
      FROM sales
      UNION ALL
      SELECT substr(return_date, 1, 10) as date, 0 as total_sales, 0 as total_profit, total_refund, total_profit_adjustment
      FROM returns
    ) d
    GROUP BY d.date
    ORDER BY d.date DESC
    LIMIT 30
  `);
};

export const getMonthlyReport = (): MonthlyReport[] => {
  const db = getDB();
  return db.getAllSync(`
    SELECT 
      d.month,
      COALESCE(SUM(d.total_sales), 0) - COALESCE(SUM(d.total_refund), 0) as total_sales,
      COALESCE(SUM(d.total_profit), 0) - COALESCE(SUM(d.total_profit_adjustment), 0) as total_profit
    FROM (
      SELECT substr(sale_date, 1, 7) as month, total_amount as total_sales, total_profit, 0 as total_refund, 0 as total_profit_adjustment
      FROM sales
      UNION ALL
      SELECT substr(return_date, 1, 7) as month, 0 as total_sales, 0 as total_profit, total_refund, total_profit_adjustment
      FROM returns
    ) d
    GROUP BY d.month
    ORDER BY d.month DESC
    LIMIT 12
  `);
};

export const getProductReport = (): ProductReport[] => {
  const db = getDB();
  return db.getAllSync(`
    SELECT 
      p.id as product_id,
      p.name as product_name,
      COALESCE(s.total_qty, 0) - COALESCE(r.total_ret_qty, 0) as total_quantity_sold,
      COALESCE(s.total_rev, 0) - COALESCE(r.total_ret_amt, 0) as total_revenue,
      COALESCE(s.total_prof, 0) - COALESCE(r.total_ret_prof, 0) as total_profit
    FROM products p
    LEFT JOIN (
      SELECT product_id, SUM(quantity) as total_qty, SUM(subtotal) as total_rev, SUM(total_profit) as total_prof
      FROM sale_items GROUP BY product_id
    ) s ON p.id = s.product_id
    LEFT JOIN (
      SELECT product_id, SUM(quantity) as total_ret_qty, SUM(refund_amount) as total_ret_amt, SUM(profit_adjustment) as total_ret_prof
      FROM return_items GROUP BY product_id
    ) r ON p.id = r.product_id
    WHERE COALESCE(s.total_qty, 0) > 0 OR COALESCE(r.total_ret_qty, 0) > 0
    ORDER BY total_quantity_sold DESC
  `);
};
