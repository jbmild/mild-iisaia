const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const dataDir = path.join(__dirname, "..", "data");
const dbPath = path.join(dataDir, "warehouse.sqlite");

const schema = `
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category_id INTEGER NOT NULL REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS warehouses (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS aisles (
  id INTEGER PRIMARY KEY,
  warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
  code TEXT NOT NULL,
  UNIQUE (warehouse_id, code)
);

CREATE TABLE IF NOT EXISTS "rows" (
  id INTEGER PRIMARY KEY,
  aisle_id INTEGER NOT NULL REFERENCES aisles(id),
  code TEXT NOT NULL,
  UNIQUE (aisle_id, code)
);

CREATE TABLE IF NOT EXISTS shelves (
  id INTEGER PRIMARY KEY,
  row_id INTEGER NOT NULL REFERENCES "rows"(id),
  code TEXT NOT NULL,
  UNIQUE (row_id, code)
);

CREATE TABLE IF NOT EXISTS bins (
  id INTEGER PRIMARY KEY,
  shelf_id INTEGER NOT NULL REFERENCES shelves(id),
  code TEXT NOT NULL,
  UNIQUE (shelf_id, code)
);

CREATE TABLE IF NOT EXISTS stock (
  product_id INTEGER NOT NULL REFERENCES products(id),
  bin_id INTEGER NOT NULL REFERENCES bins(id),
  quantity INTEGER NOT NULL CHECK (quantity >= 0),
  PRIMARY KEY (product_id, bin_id)
);

CREATE TABLE IF NOT EXISTS intakes (
  id INTEGER PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('open', 'completed')),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS intake_lines (
  id INTEGER PRIMARY KEY,
  intake_id INTEGER NOT NULL REFERENCES intakes(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity >= 1)
);

CREATE TABLE IF NOT EXISTS intake_allocations (
  id INTEGER PRIMARY KEY,
  intake_line_id INTEGER NOT NULL REFERENCES intake_lines(id),
  bin_id INTEGER NOT NULL REFERENCES bins(id),
  quantity INTEGER NOT NULL CHECK (quantity >= 1)
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('open', 'packed')),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS order_lines (
  id INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity >= 1),
  UNIQUE (order_id, product_id)
);

CREATE TABLE IF NOT EXISTS cartons (
  id INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  code TEXT NOT NULL,
  UNIQUE (order_id, code)
);

CREATE TABLE IF NOT EXISTS picks (
  id INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  carton_id INTEGER NOT NULL REFERENCES cartons(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  bin_id INTEGER NOT NULL REFERENCES bins(id),
  quantity INTEGER NOT NULL CHECK (quantity >= 1)
);
`;

function openDatabase() {
  fs.mkdirSync(dataDir, { recursive: true });
  const db = new Database(dbPath);
  db.pragma("foreign_keys = ON");
  db.exec(schema);
  return db;
}

module.exports = { openDatabase };
