import { getDB } from "../../database";
import { getProductById } from "./products";
import { getBatchesForProduct } from "./purchases";
import { Sale } from "../types"; // I'll add this type later or just use inline

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

    // 3. Process FIFO and Insert Sale Items
    for (const item of items) {
      let quantityToFulfill = item.quantity;
      const batches = getBatchesForProduct(item.product_id); // Ordered by purchase_date ASC

      for (const batch of batches) {
        if (quantityToFulfill <= 0) break;

        const quantityFromBatch = Math.min(batch.remaining_quantity, quantityToFulfill);
        const profitPerUnit = item.selling_price - batch.purchase_price;
        const totalProfitForBatch = profitPerUnit * quantityFromBatch;
        const subtotal = item.selling_price * quantityFromBatch;

        // Deduct from batch
        db.runSync(`
          UPDATE batches 
          SET remaining_quantity = remaining_quantity - ? 
          WHERE id = ?
        `, [quantityFromBatch, batch.id]);

        // Create sale item
        db.runSync(`
          INSERT INTO sale_items (sale_id, product_id, batch_id, quantity, purchase_price, selling_price, profit_per_unit, total_profit, subtotal)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          saleId,
          item.product_id,
          batch.id,
          quantityFromBatch,
          batch.purchase_price,
          item.selling_price,
          profitPerUnit,
          totalProfitForBatch,
          subtotal
        ]);

        total_profit += totalProfitForBatch;
        quantityToFulfill -= quantityFromBatch;
      }
      
      // We already checked total_stock, so quantityToFulfill should always reach 0.
      if (quantityToFulfill > 0) {
        throw new Error(`Critical Inventory Error: Could not fulfill ${quantityToFulfill} units of product ID ${item.product_id} from batches.`);
      }
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
    SELECT * FROM sales ORDER BY sale_date DESC
  `);
};
