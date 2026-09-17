export interface Product {
  id: number;
  name: string;
  category: string | null;
  brand: string | null;
  description: string | null;
  unit: string | null;
  min_selling_price: number;
  max_selling_price: number;
  min_stock_alert: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface ProductWithStock extends Product {
  total_stock: number;
}

export interface Batch {
  id: number;
  product_id: number;
  batch_number: string;
  purchase_price: number;
  quantity_purchased: number;
  remaining_quantity: number;
  expiry_date: string | null;
  purchase_date: string;
  supplier: string | null;
  created_at: string;
}

export interface Purchase {
  id: number;
  supplier: string | null;
  purchase_date: string;
  total_amount: number;
  notes: string | null;
  created_at: string;
}

export interface PurchaseItem {
  id: number;
  purchase_id: number;
  product_id: number;
  batch_id: number;
  quantity: number;
  purchase_price: number;
  subtotal: number;
}

export interface Sale {
  id: number;
  customer_id: number | null;
  sale_date: string;
  total_amount: number;
  total_profit: number;
  notes: string | null;
  created_at: string;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  batch_id: number;
  quantity: number;
  purchase_price: number;
  selling_price: number;
  profit_per_unit: number;
  total_profit: number;
  subtotal: number;
}

export interface Customer {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
}
