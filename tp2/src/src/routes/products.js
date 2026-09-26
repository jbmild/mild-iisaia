const express = require("express");
const { sendError, bodyObject, requireId, text, wholeNumber, uniqueConstraint } = require("../http");

function toProduct(row) {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    categoryId: row.category_id,
  };
}

function productInUse(db, id) {
  const stock = db.prepare("SELECT COUNT(*) AS n FROM stock WHERE product_id = ?").get(id).n;
  const intakes = db.prepare("SELECT COUNT(*) AS n FROM intake_lines WHERE product_id = ?").get(id).n;
  const orders = db.prepare("SELECT COUNT(*) AS n FROM order_lines WHERE product_id = ?").get(id).n;
  return stock + intakes + orders > 0;
}

function readProductFields(res, body, partial) {
  const fields = {};
  if (!partial || "sku" in body) {
    const sku = text(body.sku);
    if (!sku) {
      sendError(res, 400, "sku tiene que ser un texto");
      return null;
    }
    fields.sku = sku;
  }
  if (!partial || "name" in body) {
    const name = text(body.name);
    if (!name) {
      sendError(res, 400, "name tiene que ser un texto");
      return null;
    }
    fields.name = name;
  }
  if (!partial || "categoryId" in body) {
    const categoryId = wholeNumber(body.categoryId, 1);
    if (categoryId == null) {
      sendError(res, 400, "categoryId tiene que ser un entero mayor a 0");
      return null;
    }
    fields.categoryId = categoryId;
  }
  if (Object.keys(fields).length === 0) {
    sendError(res, 400, "No hay campos para actualizar");
    return null;
  }
  return fields;
}

function products(db) {
  const router = express.Router();

  router.get("/products", (req, res) => {
    if (req.query.sku !== undefined) {
      if (Array.isArray(req.query.sku)) return sendError(res, 400, "sku tiene que ser un texto");
      const sku = text(req.query.sku);
      if (!sku) return sendError(res, 400, "sku tiene que ser un texto");
      const rows = db.prepare("SELECT * FROM products WHERE sku = ? ORDER BY id").all(sku);
      return res.json(rows.map(toProduct));
    }
    const rows = db.prepare("SELECT * FROM products ORDER BY id").all();
    res.json(rows.map(toProduct));
  });

  router.post("/products", (req, res) => {
    const body = bodyObject(res, req.body);
    if (!body) return;
    const fields = readProductFields(res, body, false);
    if (!fields) return;
    const category = db.prepare("SELECT id FROM categories WHERE id = ?").get(fields.categoryId);
    if (!category) return sendError(res, 404, "No existe esa categoría");
    try {
      const info = db
        .prepare("INSERT INTO products (sku, name, category_id) VALUES (?, ?, ?)")
        .run(fields.sku, fields.name, fields.categoryId);
      const row = db.prepare("SELECT * FROM products WHERE id = ?").get(info.lastInsertRowid);
      res.status(201).json(toProduct(row));
    } catch (err) {
      if (uniqueConstraint(res, err, "Ya existe un producto con ese SKU")) return;
      throw err;
    }
  });

  router.get("/products/:productId/stock", (req, res) => {
    const id = requireId(res, req.params.productId, "productId");
    if (id == null) return;
    const product = db.prepare("SELECT id FROM products WHERE id = ?").get(id);
    if (!product) return sendError(res, 404, "No existe ese producto");
    const balances = db
      .prepare(
        `SELECT s.quantity,
                b.id AS bin_id, b.code AS bin_code,
                sh.id AS shelf_id, sh.code AS shelf_code,
                r.id AS row_id, r.code AS row_code,
                a.id AS aisle_id, a.code AS aisle_code,
                w.id AS warehouse_id, w.code AS warehouse_code
         FROM stock s
         JOIN bins b ON b.id = s.bin_id
         JOIN shelves sh ON sh.id = b.shelf_id
         JOIN "rows" r ON r.id = sh.row_id
         JOIN aisles a ON a.id = r.aisle_id
         JOIN warehouses w ON w.id = a.warehouse_id
         WHERE s.product_id = ?
         ORDER BY b.id`
      )
      .all(id)
      .map((row) => ({
        binId: row.bin_id,
        quantity: row.quantity,
        binCode: row.bin_code,
        shelfId: row.shelf_id,
        shelfCode: row.shelf_code,
        rowId: row.row_id,
        rowCode: row.row_code,
        aisleId: row.aisle_id,
        aisleCode: row.aisle_code,
        warehouseId: row.warehouse_id,
        warehouseCode: row.warehouse_code,
      }));
    const total = balances.reduce((sum, row) => sum + row.quantity, 0);
    res.json({ productId: id, total, balances });
  });

  router.get("/products/:productId", (req, res) => {
    const id = requireId(res, req.params.productId, "productId");
    if (id == null) return;
    const row = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
    if (!row) return sendError(res, 404, "No existe ese producto");
    res.json(toProduct(row));
  });

  router.patch("/products/:productId", (req, res) => {
    const id = requireId(res, req.params.productId, "productId");
    if (id == null) return;
    const body = bodyObject(res, req.body);
    if (!body) return;
    const current = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
    if (!current) return sendError(res, 404, "No existe ese producto");
    const fields = readProductFields(res, body, true);
    if (!fields) return;
    if (fields.categoryId != null) {
      const category = db.prepare("SELECT id FROM categories WHERE id = ?").get(fields.categoryId);
      if (!category) return sendError(res, 404, "No existe esa categoría");
    }
    const sku = fields.sku != null ? fields.sku : current.sku;
    const name = fields.name != null ? fields.name : current.name;
    const categoryId = fields.categoryId != null ? fields.categoryId : current.category_id;
    try {
      db.prepare("UPDATE products SET sku = ?, name = ?, category_id = ? WHERE id = ?").run(sku, name, categoryId, id);
    } catch (err) {
      if (uniqueConstraint(res, err, "Ya existe un producto con ese SKU")) return;
      throw err;
    }
    res.json(toProduct(db.prepare("SELECT * FROM products WHERE id = ?").get(id)));
  });

  router.delete("/products/:productId", (req, res) => {
    const id = requireId(res, req.params.productId, "productId");
    if (id == null) return;
    const row = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
    if (!row) return sendError(res, 404, "No existe ese producto");
    if (productInUse(db, id)) {
      return sendError(res, 409, "El producto todavía tiene stock, ingresos o pedidos");
    }
    db.prepare("DELETE FROM products WHERE id = ?").run(id);
    res.status(204).end();
  });

  return router;
}

module.exports = products;
