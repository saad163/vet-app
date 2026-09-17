import { getDB } from "../../database";
import { Customer } from "../types";

export const getCustomers = (): Customer[] => {
  const db = getDB();
  return db.getAllSync(`SELECT * FROM customers ORDER BY name ASC`);
};

export const addCustomer = (name: string, phone: string, address: string, notes: string): number => {
  const db = getDB();
  const result = db.runSync(`
    INSERT INTO customers (name, phone, address, notes)
    VALUES (?, ?, ?, ?)
  `, [name, phone, address, notes]);
  return result.lastInsertRowId;
};
