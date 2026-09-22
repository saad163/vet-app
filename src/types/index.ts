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
  total_stock: number;
  purchase_price: number;
  expiry_date: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface ProductWithStock extends Product {
  // Alias for backward compatibility if needed, but it's identical now.
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
  quantity: number;
  purchase_price: number;
  subtotal: number;
  expiry_date: string | null;
}

export interface Sale {
  id: number;
  customer_id: number | null;
  sale_date: string;
  total_amount: number;
  total_profit: number;
  returned_amount: number;
  returned_profit: number;
  status: string;
  notes: string | null;
  created_at: string;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  quantity: number;
  purchase_price: number;
  selling_price: number;
  profit_per_unit: number;
  total_profit: number;
  subtotal: number;
}

export interface Return {
  id: number;
  sale_id: number;
  return_date: string;
  total_refund: number;
  total_profit_adjustment: number;
  reason: string | null;
  notes: string | null;
  created_at: string;
}

export interface ReturnItem {
  id: number;
  return_id: number;
  sale_item_id: number;
  product_id: number;
  quantity: number;
  refund_amount: number;
  profit_adjustment: number;
}

export interface Customer {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
}
