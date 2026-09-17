import { getDB } from "../../database";
import { Product, ProductWithStock } from "../types";

export const getProducts = (): ProductWithStock[] => {
  const db = getDB();
  return db.getAllSync(`
    SELECT p.*, COALESCE(SUM(b.remaining_quantity), 0) as total_stock
    FROM products p
    LEFT JOIN batches b ON p.id = b.product_id
    WHERE p.is_active = 1
    GROUP BY p.id
    ORDER BY p.name ASC
  `);
};

export const searchProducts = (query: string): ProductWithStock[] => {
  const db = getDB();
  return db.getAllSync(`
    SELECT p.*, COALESCE(SUM(b.remaining_quantity), 0) as total_stock
    FROM products p
    LEFT JOIN batches b ON p.id = b.product_id
    WHERE p.is_active = 1 AND (p.name LIKE ? OR p.brand LIKE ? OR p.category LIKE ?)
    GROUP BY p.id
    ORDER BY p.name ASC
  `, [`%${query}%`, `%${query}%`, `%${query}%`]);
};

export const getProductById = (id: number): ProductWithStock | null => {
  const db = getDB();
  return db.getFirstSync<ProductWithStock>(`
    SELECT p.*, COALESCE(SUM(b.remaining_quantity), 0) as total_stock
    FROM products p
    LEFT JOIN batches b ON p.id = b.product_id
    WHERE p.id = ?
    GROUP BY p.id
  `, [id]);
};

export const addProduct = (
  product: Omit<Product, "id" | "created_at" | "updated_at" | "is_active">
): number => {
  const db = getDB();
  const result = db.runSync(`
    INSERT INTO products (name, category, brand, description, unit, min_selling_price, max_selling_price, min_stock_alert)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    product.name,
    product.category,
    product.brand,
    product.description,
    product.unit,
    product.min_selling_price,
    product.max_selling_price,
    product.min_stock_alert,
  ]);
  return result.lastInsertRowId;
};

export const updateProduct = (
  id: number,
  product: Omit<Product, "id" | "created_at" | "updated_at" | "is_active">
): void => {
  const db = getDB();
  db.runSync(`
    UPDATE products
    SET name = ?, category = ?, brand = ?, description = ?, unit = ?, min_selling_price = ?, max_selling_price = ?, min_stock_alert = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [
    product.name,
    product.category,
    product.brand,
    product.description,
    product.unit,
    product.min_selling_price,
    product.max_selling_price,
    product.min_stock_alert,
    id,
  ]);
};

export const deactivateProduct = (id: number): void => {
  const db = getDB();
  db.runSync(`UPDATE products SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [id]);
};
