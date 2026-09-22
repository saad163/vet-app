import { getDB } from "../../database";

export interface ReturnItemInput {
  sale_item_id: number;
  product_id: number;
  quantity: number;
  selling_price: number;
  profit_per_unit: number;
}

export const processReturn = (
  saleId: number,
  itemsToReturn: ReturnItemInput[],
  reason: string | null,
  notes: string | null
): number => {
  const db = getDB();
  let returnId = 0;

  db.withTransactionSync(() => {
    let totalRefund = 0;
    let totalProfitAdjustment = 0;
    const returnDate = new Date().toISOString();

    for (const item of itemsToReturn) {
      if (item.quantity <= 0) continue;
      
      const refundAmount = item.quantity * item.selling_price;
      const profitAdjustment = item.quantity * item.profit_per_unit;
      
      totalRefund += refundAmount;
      totalProfitAdjustment += profitAdjustment;
    }

    if (totalRefund === 0) {
      throw new Error("No items selected to return.");
    }

    // 1. Insert Return record
    const returnResult = db.runSync(`
      INSERT INTO returns (sale_id, return_date, total_refund, total_profit_adjustment, reason, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [saleId, returnDate, totalRefund, totalProfitAdjustment, reason, notes]);
    
    returnId = returnResult.lastInsertRowId;

    // 2. Process each item
    for (const item of itemsToReturn) {
      if (item.quantity <= 0) continue;

      const refundAmount = item.quantity * item.selling_price;
      const profitAdjustment = item.quantity * item.profit_per_unit;

      // Insert return_items
      db.runSync(`
        INSERT INTO return_items (return_id, sale_item_id, product_id, quantity, refund_amount, profit_adjustment)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [returnId, item.sale_item_id, item.product_id, item.quantity, refundAmount, profitAdjustment]);

      // Add stock back to product
      db.runSync(`
        UPDATE products 
        SET total_stock = total_stock + ? 
        WHERE id = ?
      `, [item.quantity, item.product_id]);
    }

    // 3. Update Sale Record Status & Totals
    const sale = db.getFirstSync<any>(`
      SELECT 
        total_amount, 
        returned_amount, 
        (SELECT COALESCE(SUM(quantity), 0) FROM sale_items WHERE sale_id = ?) as total_qty,
        (SELECT COALESCE(SUM(ri.quantity), 0) 
         FROM return_items ri 
         JOIN sale_items si ON ri.sale_item_id = si.id 
         WHERE si.sale_id = ?) as total_returned_qty
      FROM sales 
      WHERE id = ?
    `, [saleId, saleId, saleId]);

    if (!sale) throw new Error("Sale not found.");
    
    // Check status
    let newStatus = 'COMPLETED';
    if (sale.total_returned_qty >= sale.total_qty) {
      newStatus = 'FULLY_RETURNED';
    } else if (sale.total_returned_qty > 0) {
      newStatus = 'PARTIALLY_RETURNED';
    }

    db.runSync(`
      UPDATE sales 
      SET 
        returned_amount = returned_amount + ?, 
        returned_profit = returned_profit + ?, 
        status = ?
      WHERE id = ?
    `, [totalRefund, totalProfitAdjustment, newStatus, saleId]);
  });

  return returnId;
};

export const getReturns = () => {
  const db = getDB();
  return db.getAllSync(`
    SELECT 
      r.*, 
      s.total_amount as original_sale_amount,
      c.name as customer_name,
      (SELECT COUNT(*) FROM return_items WHERE return_id = r.id) as item_count
    FROM returns r
    JOIN sales s ON r.sale_id = s.id
    LEFT JOIN customers c ON s.customer_id = c.id
    ORDER BY r.return_date DESC
  `);
};
