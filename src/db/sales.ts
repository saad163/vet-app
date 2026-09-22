import { getDB } from "../../database";
import { getProductById } from "./products";
import { Sale, SaleItem } from "../types";

export interface NewSaleItemInput {
  product_id: number;
  quantity: number;
  selling_price: number;
  product_name?: string;
}

export const createSale = (
  customer_id: number | null,
  sale_date: string,
  notes: string | null,
  items: NewSaleItemInput[]
): number => {
  const db = getDB();
  let saleId = 0;

  db.withTransactionSync(() => {
    let total_amount = 0;
    let total_profit = 0;

    // 1. Validate pricing and stock before making any insertions
    for (const item of items) {
      const product = getProductById(item.product_id);
      if (!product) {
        throw new Error(`Product with ID ${item.product_id} not found.`);
      }

      if (item.selling_price < product.min_selling_price) {
        throw new Error(`Selling price (Rs. ${item.selling_price}) for ${product.name} cannot be lower than the minimum (Rs. ${product.min_selling_price}).`);
      }

      if (item.selling_price > product.max_selling_price) {
        throw new Error(`Selling price (Rs. ${item.selling_price}) for ${product.name} cannot be higher than the maximum (Rs. ${product.max_selling_price}).`);
      }

      if (product.total_stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}. Only ${product.total_stock} units available.`);
      }
      
      total_amount += (item.selling_price * item.quantity);
    }

    // 2. Insert Sale record first to get ID
    const saleResult = db.runSync(`
      INSERT INTO sales (customer_id, sale_date, total_amount, total_profit, notes)
      VALUES (?, ?, ?, ?, ?)
    `, [customer_id, sale_date, total_amount, 0, notes]);
    
    saleId = saleResult.lastInsertRowId;

    // 3. Process Items directly against Product
    for (const item of items) {
      const product = getProductById(item.product_id)!;
      
      const profitPerUnit = item.selling_price - product.purchase_price;
      const totalProfitForItem = profitPerUnit * item.quantity;
      const subtotal = item.selling_price * item.quantity;

      // Deduct from product stock
      db.runSync(`
        UPDATE products 
        SET total_stock = total_stock - ? 
        WHERE id = ?
      `, [item.quantity, item.product_id]);

      // Create sale item
      db.runSync(`
        INSERT INTO sale_items (sale_id, product_id, quantity, purchase_price, selling_price, profit_per_unit, total_profit, subtotal)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        saleId,
        item.product_id,
        item.quantity,
        product.purchase_price,
        item.selling_price,
        profitPerUnit,
        totalProfitForItem,
        subtotal
      ]);

      total_profit += totalProfitForItem;
    }

    // 4. Update the Sale record with the calculated total profit
    db.runSync(`
      UPDATE sales SET total_profit = ? WHERE id = ?
    `, [total_profit, saleId]);
  });

  return saleId;
};

export const getSales = () => {
  const db = getDB();
  return db.getAllSync(`
    SELECT s.*, c.name as customer_name 
    FROM sales s
    LEFT JOIN customers c ON s.customer_id = c.id
    ORDER BY s.sale_date DESC
  `);
};

export interface SaleDetailItem {
  id: number;
  sale_id: number;
  product_id: number;
  quantity: number;
  purchase_price: number;
  selling_price: number;
  profit_per_unit: number;
  total_profit: number;
  subtotal: number;
  product_name: string;
  returned_quantity: number; // dynamically calculated
}

export interface SaleDetails extends Sale {
  customer_name: string | null;
  items: SaleDetailItem[];
}

export const getSaleDetails = (saleId: number): SaleDetails | null => {
  const db = getDB();
  const sale = db.getFirstSync<any>(`
    SELECT s.*, c.name as customer_name 
    FROM sales s
    LEFT JOIN customers c ON s.customer_id = c.id
    WHERE s.id = ?
  `, [saleId]);

  if (!sale) return null;

  const items = db.getAllSync<any>(`
    SELECT 
      si.*, 
      p.name as product_name,
      COALESCE(SUM(ri.quantity), 0) as returned_quantity
    FROM sale_items si
    JOIN products p ON si.product_id = p.id
    LEFT JOIN return_items ri ON ri.sale_item_id = si.id
    WHERE si.sale_id = ?
    GROUP BY si.id
  `, [saleId]);

  return {
    ...sale,
    items
  };
};
