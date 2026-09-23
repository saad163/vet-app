import * as SQLite from "expo-sqlite";

const DB_NAME = "vetstore.db";

// Singleton DB instance
let dbInstance: SQLite.SQLiteDatabase | null = null;

export const getDB = (): SQLite.SQLiteDatabase => {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync(DB_NAME);
  }
  return dbInstance;
};

export const resetDB = () => {
  if (dbInstance) {
    dbInstance.closeSync();
    dbInstance = null;
  }
};

export const initDatabase = () => {
  const db = getDB();

  db.execSync(`
    PRAGMA journal_mode = WAL;
  `);

  // --- MIGRATION: Remove Batch System ---
  try {
    const tableCheck = db.getAllSync<{ name: string }>(`SELECT name FROM sqlite_master WHERE type='table' AND name='batches'`);
    if (tableCheck.length > 0) {
      console.log("Migrating database away from batches system...");
      db.execSync(`SAVEPOINT batch_migration;`);
      try {
        db.execSync(`
          PRAGMA foreign_keys = OFF;
          
          -- Migrate products
          CREATE TABLE IF NOT EXISTS products_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT,
            brand TEXT,
            description TEXT,
            unit TEXT,
            min_selling_price REAL NOT NULL,
            max_selling_price REAL NOT NULL,
            min_stock_alert INTEGER DEFAULT 0,
            total_stock INTEGER DEFAULT 0,
            purchase_price REAL DEFAULT 0,
            expiry_date TEXT,
            is_active INTEGER DEFAULT 1,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
          );
          
          INSERT INTO products_new (id, name, category, brand, description, unit, min_selling_price, max_selling_price, min_stock_alert, is_active, created_at, updated_at, total_stock, purchase_price, expiry_date)
          SELECT 
            p.id, p.name, p.category, p.brand, p.description, p.unit, p.min_selling_price, p.max_selling_price, p.min_stock_alert, p.is_active, p.created_at, p.updated_at,
            COALESCE((SELECT SUM(remaining_quantity) FROM batches WHERE product_id = p.id), 0) as total_stock,
            COALESCE((SELECT purchase_price FROM batches WHERE product_id = p.id ORDER BY purchase_date DESC LIMIT 1), 0) as purchase_price,
            (SELECT expiry_date FROM batches WHERE product_id = p.id AND expiry_date IS NOT NULL AND expiry_date != '' ORDER BY expiry_date ASC LIMIT 1) as expiry_date
          FROM products p;

          -- Migrate purchase_items
          CREATE TABLE IF NOT EXISTS purchase_items_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            purchase_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            purchase_price REAL NOT NULL,
            subtotal REAL NOT NULL,
            expiry_date TEXT,
            FOREIGN KEY (purchase_id) REFERENCES purchases (id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products_new (id) ON DELETE RESTRICT
          );

          INSERT INTO purchase_items_new (id, purchase_id, product_id, quantity, purchase_price, subtotal, expiry_date)
          SELECT 
            pi.id, pi.purchase_id, pi.product_id, pi.quantity, pi.purchase_price, pi.subtotal,
            b.expiry_date
          FROM purchase_items pi
          LEFT JOIN batches b ON pi.batch_id = b.id;

          -- Migrate sale_items
          CREATE TABLE IF NOT EXISTS sale_items_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sale_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            purchase_price REAL NOT NULL,
            selling_price REAL NOT NULL,
            profit_per_unit REAL NOT NULL,
            total_profit REAL NOT NULL,
            subtotal REAL NOT NULL,
            FOREIGN KEY (sale_id) REFERENCES sales (id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products_new (id) ON DELETE RESTRICT
          );

          INSERT INTO sale_items_new (id, sale_id, product_id, quantity, purchase_price, selling_price, profit_per_unit, total_profit, subtotal)
          SELECT id, sale_id, product_id, quantity, purchase_price, selling_price, profit_per_unit, total_profit, subtotal FROM sale_items;

          -- Migrate return_items
          CREATE TABLE IF NOT EXISTS return_items_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            return_id INTEGER NOT NULL,
            sale_item_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            refund_amount REAL NOT NULL,
            profit_adjustment REAL NOT NULL,
            FOREIGN KEY (return_id) REFERENCES returns (id) ON DELETE CASCADE,
            FOREIGN KEY (sale_item_id) REFERENCES sale_items_new (id) ON DELETE RESTRICT,
            FOREIGN KEY (product_id) REFERENCES products_new (id) ON DELETE RESTRICT
          );

          INSERT INTO return_items_new (id, return_id, sale_item_id, product_id, quantity, refund_amount, profit_adjustment)
          SELECT id, return_id, sale_item_id, product_id, quantity, refund_amount, profit_adjustment FROM return_items;

          -- Drop old tables
          DROP TABLE return_items;
          DROP TABLE sale_items;
          DROP TABLE purchase_items;
          DROP TABLE batches;
          DROP TABLE products;

          -- Rename new tables
          ALTER TABLE products_new RENAME TO products;
          ALTER TABLE purchase_items_new RENAME TO purchase_items;
          ALTER TABLE sale_items_new RENAME TO sale_items;
          ALTER TABLE return_items_new RENAME TO return_items;
        `);
        db.execSync(`RELEASE batch_migration;`);
        console.log("Batch migration completed successfully.");
      } catch (migrationError) {
        db.execSync(`ROLLBACK TO batch_migration;`);
        db.execSync(`RELEASE batch_migration;`);
        console.error("Batch migration failed, rolled back safely:", migrationError);
      }
    }
  } catch (error) {
    console.error("Migration error (Batch Removal):", error);
  }

  // Schema migrations for existing sales table (legacy)
  try {
    const tableInfo = db.getAllSync<{ name: string }>(`PRAGMA table_info(sales)`);
    if (tableInfo.length > 0) {
      const hasReturnedAmount = tableInfo.some((col) => col.name === 'returned_amount');
      if (!hasReturnedAmount) {
        db.execSync(`
          ALTER TABLE sales ADD COLUMN returned_amount REAL DEFAULT 0;
          ALTER TABLE sales ADD COLUMN returned_profit REAL DEFAULT 0;
          ALTER TABLE sales ADD COLUMN status TEXT DEFAULT 'COMPLETED';
        `);
      }
    }
  } catch (error) {
    console.error("Legacy Migration error:", error);
  }

  db.execSync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT,
      brand TEXT,
      description TEXT,
      unit TEXT,
      min_selling_price REAL NOT NULL,
      max_selling_price REAL NOT NULL,
      min_stock_alert INTEGER DEFAULT 0,
      total_stock INTEGER DEFAULT 0,
      purchase_price REAL DEFAULT 0,
      expiry_date TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier TEXT,
      purchase_date TEXT NOT NULL,
      total_amount REAL NOT NULL,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS purchase_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      purchase_price REAL NOT NULL,
      subtotal REAL NOT NULL,
      expiry_date TEXT,
      FOREIGN KEY (purchase_id) REFERENCES purchases (id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      sale_date TEXT NOT NULL,
      total_amount REAL NOT NULL,
      total_profit REAL NOT NULL,
      notes TEXT,
      returned_amount REAL DEFAULT 0,
      returned_profit REAL DEFAULT 0,
      status TEXT DEFAULT 'COMPLETED',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      purchase_price REAL NOT NULL,
      selling_price REAL NOT NULL,
      profit_per_unit REAL NOT NULL,
      total_profit REAL NOT NULL,
      subtotal REAL NOT NULL,
      FOREIGN KEY (sale_id) REFERENCES sales (id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS returns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      return_date TEXT NOT NULL,
      total_refund REAL NOT NULL,
      total_profit_adjustment REAL NOT NULL,
      reason TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sale_id) REFERENCES sales (id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS return_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      return_id INTEGER NOT NULL,
      sale_item_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      refund_amount REAL NOT NULL,
      profit_adjustment REAL NOT NULL,
      FOREIGN KEY (return_id) REFERENCES returns (id) ON DELETE CASCADE,
      FOREIGN KEY (sale_item_id) REFERENCES sale_items (id) ON DELETE RESTRICT,
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE RESTRICT
    );
  `);
};
