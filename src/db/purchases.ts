import { getDB } from "../../database";
import { Purchase, PurchaseItem } from "../types";

export interface NewPurchaseItem {
  product_id: number;
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
      // a. Insert Purchase Item
      const subtotal = item.purchase_price * item.quantity;
      db.runSync(`
        INSERT INTO purchase_items (purchase_id, product_id, quantity, purchase_price, subtotal, expiry_date)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        purchaseId,
        item.product_id,
        item.quantity,
        item.purchase_price,
        subtotal,
        item.expiry_date
      ]);

      // b. Update Product Stock and Master Details
      if (item.expiry_date) {
        db.runSync(`
          UPDATE products 
          SET 
            total_stock = total_stock + ?, 
            purchase_price = ?, 
            expiry_date = ? 
          WHERE id = ?
        `, [item.quantity, item.purchase_price, item.expiry_date, item.product_id]);
      } else {
        db.runSync(`
          UPDATE products 
          SET 
            total_stock = total_stock + ?, 
            purchase_price = ? 
          WHERE id = ?
        `, [item.quantity, item.purchase_price, item.product_id]);
      }
    }
  });

  return purchaseId;
};

export const getPurchases = (): Purchase[] => {
  const db = getDB();
  return db.getAllSync(`SELECT * FROM purchases ORDER BY purchase_date DESC`);
};
