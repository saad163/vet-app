import { getDB } from "../../database";
import { Product } from "../types";

export const getProducts = (): Product[] => {
  const db = getDB();
  return db.getAllSync(`
    SELECT *
    FROM products
    WHERE is_active = 1
    ORDER BY name ASC
  `);
};

export const searchProducts = (query: string): Product[] => {
  const db = getDB();
  return db.getAllSync(`
    SELECT *
    FROM products
    WHERE is_active = 1 AND (name LIKE ? OR brand LIKE ? OR category LIKE ?)
    ORDER BY name ASC
  `, [`%${query}%`, `%${query}%`, `%${query}%`]);
};

export const getProductById = (id: number): Product | null => {
  const db = getDB();
  return db.getFirstSync<Product>(`
    SELECT *
    FROM products
    WHERE id = ?
  `, [id]);
};

export const addProduct = (
  product: Omit<Product, "id" | "created_at" | "updated_at" | "is_active" | "total_stock" | "purchase_price" | "expiry_date">,
  purchase_price: number,
  initial_quantity: number,
  expiry_date: string | null = null
): number => {
  const db = getDB();
  const result = db.runSync(`
    INSERT INTO products (name, category, brand, description, unit, min_selling_price, max_selling_price, min_stock_alert, total_stock, purchase_price, expiry_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    product.name,
    product.category,
    product.brand,
    product.description,
    product.unit,
    product.min_selling_price,
    product.max_selling_price,
    product.min_stock_alert,
    initial_quantity,
    purchase_price,
    expiry_date
  ]);
  
  return result.lastInsertRowId;
};

export const updateProduct = (
  id: number,
  product: Partial<Omit<Product, "id" | "created_at" | "updated_at" | "is_active">>
): void => {
  const db = getDB();
  
  // Build dynamic update query
  const keys = Object.keys(product);
  if (keys.length === 0) return;
  
  const setString = keys.map(k => `${k} = ?`).join(", ");
  const values = Object.values(product);
  
  db.runSync(`
    UPDATE products
    SET ${setString}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [...values, id]);
};

export const deactivateProduct = (id: number): void => {
  const db = getDB();
  db.runSync(`UPDATE products SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [id]);
};
