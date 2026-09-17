import { getDB } from "../../database";
import { Batch, Purchase, PurchaseItem } from "../types";

export interface NewPurchaseItem {
  product_id: number;
  batch_number: string;
  purchase_price: number;
  quantity: number;
  expiry_date: string | null;
}

export const createPurchase = (
  supplier: string | null,
  purchase_date: string,
  notes: string | null,
  items: NewPurchaseItem[]
): number => {
  const db = getDB();
  let purchaseId = 0;

  db.withTransactionSync(() => {
    // 1. Calculate total amount
    const total_amount = items.reduce((sum, item) => sum + (item.purchase_price * item.quantity), 0);

    // 2. Insert Purchase
    const purchaseResult = db.runSync(`
      INSERT INTO purchases (supplier, purchase_date, total_amount, notes)
      VALUES (?, ?, ?, ?)
    `, [supplier, purchase_date, total_amount, notes]);
    
    purchaseId = purchaseResult.lastInsertRowId;

    // 3. Process each item
    for (const item of items) {
      // a. Insert Batch
      const batchResult = db.runSync(`
        INSERT INTO batches (product_id, batch_number, purchase_price, quantity_purchased, remaining_quantity, expiry_date, purchase_date, supplier)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        item.product_id,
        item.batch_number,
        item.purchase_price,
        item.quantity,
        item.quantity, // remaining is initially full quantity
        item.expiry_date,
        purchase_date,
        supplier
      ]);
      const batchId = batchResult.lastInsertRowId;

      // b. Insert Purchase Item
      const subtotal = item.purchase_price * item.quantity;
      db.runSync(`
        INSERT INTO purchase_items (purchase_id, product_id, batch_id, quantity, purchase_price, subtotal)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        purchaseId,
        item.product_id,
        batchId,
        item.quantity,
        item.purchase_price,
        subtotal
      ]);
    }
  });

  return purchaseId;
};

export const getPurchases = (): Purchase[] => {
  const db = getDB();
  return db.getAllSync(`SELECT * FROM purchases ORDER BY purchase_date DESC`);
};

export const getBatchesForProduct = (productId: number): Batch[] => {
  const db = getDB();
  return db.getAllSync(`
    SELECT * FROM batches 
    WHERE product_id = ? AND remaining_quantity > 0
    ORDER BY purchase_date ASC
  `, [productId]);
};
