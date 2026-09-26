const express = require("express");
const { sendError, bodyObject, requireId, text, wholeNumber, uniqueConstraint } = require("../http");

function presentOrder(db, id) {
  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
  if (!order) return null;
  const lines = db.prepare("SELECT * FROM order_lines WHERE order_id = ? ORDER BY id").all(id);
  const pickedStmt = db.prepare(
    "SELECT COALESCE(SUM(quantity), 0) AS n FROM picks WHERE order_id = ? AND product_id = ?"
  );
  const cartons = db.prepare("SELECT * FROM cartons WHERE order_id = ? ORDER BY id").all(id);
  const picksStmt = db.prepare("SELECT * FROM picks WHERE carton_id = ? ORDER BY id");
  return {
    id: order.id,
    status: order.status,
    createdAt: order.created_at,
    lines: lines.map((line) => ({
      productId: line.product_id,
      quantity: line.quantity,
      picked: pickedStmt.get(id, line.product_id).n,
    })),
    cartons: cartons.map((carton) => ({
      id: carton.id,
      code: carton.code,
      picks: picksStmt.all(carton.id).map((pick) => ({
        id: pick.id,
        productId: pick.product_id,
        binId: pick.bin_id,
        quantity: pick.quantity,
      })),
    })),
  };
}

function readLines(res, body) {
  if (!Array.isArray(body.lines) || body.lines.length === 0) {
    sendError(res, 400, "lines tiene que tener al menos un producto");
    return null;
  }
  const lines = [];
  const seen = new Set();
  for (const item of body.lines) {
    if (item === null || typeof item !== "object" || Array.isArray(item)) {
      sendError(res, 400, "cada línea tiene que ser un objeto");
      return null;
    }
    const productId = wholeNumber(item.productId, 1);
    const quantity = wholeNumber(item.quantity, 1);
    if (productId == null) {
      sendError(res, 400, "productId tiene que ser un entero mayor a 0");
      return null;
    }
    if (quantity == null) {
      sendError(res, 400, "quantity tiene que ser un entero mayor o igual a 1");
      return null;
    }
    if (seen.has(productId)) {
      sendError(res, 400, "El pedido admite una sola línea por producto");
      return null;
    }
    seen.add(productId);
    lines.push({ productId, quantity });
  }
  return lines;
}

function orders(db) {
  const router = express.Router();

  const createOrder = db.transaction((lines) => {
    for (const line of lines) {
      const product = db.prepare("SELECT id FROM products WHERE id = ?").get(line.productId);
      if (!product) return { status: 404, error: "No existe ese producto" };
    }
    const info = db
      .prepare("INSERT INTO orders (status, created_at) VALUES ('open', ?)")
      .run(new Date().toISOString());
    const insert = db.prepare(
      "INSERT INTO order_lines (order_id, product_id, quantity) VALUES (?, ?, ?)"
    );
    for (const line of lines) {
      insert.run(info.lastInsertRowid, line.productId, line.quantity);
    }
    return { status: 201, orderId: Number(info.lastInsertRowid) };
  });

  const pickIntoCarton = db.transaction((orderId, cartonId, productId, binId, quantity) => {
    const order = db.prepare("SELECT status FROM orders WHERE id = ?").get(orderId);
    if (!order) return { status: 404, error: "No existe ese pedido" };
    if (order.status !== "open") return { status: 409, error: "El pedido ya está embalado" };
    const carton = db.prepare("SELECT id FROM cartons WHERE id = ? AND order_id = ?").get(cartonId, orderId);
    if (!carton) return { status: 404, error: "No existe ese cartón en el pedido" };
    const line = db
      .prepare("SELECT quantity FROM order_lines WHERE order_id = ? AND product_id = ?")
      .get(orderId, productId);
    if (!line) return { status: 404, error: "Ese producto no está en el pedido" };
    const bin = db.prepare("SELECT id FROM bins WHERE id = ?").get(binId);
    if (!bin) return { status: 404, error: "No existe ese bin" };
    const picked = db
      .prepare("SELECT COALESCE(SUM(quantity), 0) AS n FROM picks WHERE order_id = ? AND product_id = ?")
      .get(orderId, productId).n;
    if (quantity > line.quantity - picked) {
      return { status: 409, error: "La cantidad supera lo que falta pickear" };
    }
    const stock = db
      .prepare("SELECT quantity FROM stock WHERE product_id = ? AND bin_id = ?")
      .get(productId, binId);
    if (!stock || stock.quantity < quantity) {
      return { status: 409, error: "No hay stock suficiente en ese bin" };
    }
    const next = stock.quantity - quantity;
    if (next === 0) {
      db.prepare("DELETE FROM stock WHERE product_id = ? AND bin_id = ?").run(productId, binId);
    } else {
      db.prepare("UPDATE stock SET quantity = ? WHERE product_id = ? AND bin_id = ?").run(next, productId, binId);
    }
    const info = db
      .prepare(
        "INSERT INTO picks (order_id, carton_id, product_id, bin_id, quantity) VALUES (?, ?, ?, ?, ?)"
      )
      .run(orderId, cartonId, productId, binId, quantity);
    return { status: 201, pickId: Number(info.lastInsertRowid) };
  });

  const packOrder = db.transaction((orderId) => {
    const order = db.prepare("SELECT status FROM orders WHERE id = ?").get(orderId);
    if (!order) return { status: 404, error: "No existe ese pedido" };
    if (order.status !== "open") return { status: 409, error: "El pedido ya está embalado" };
    const lines = db.prepare("SELECT product_id, quantity FROM order_lines WHERE order_id = ?").all(orderId);
    const pickedStmt = db.prepare(
      "SELECT COALESCE(SUM(quantity), 0) AS n FROM picks WHERE order_id = ? AND product_id = ?"
    );
    for (const line of lines) {
      const picked = pickedStmt.get(orderId, line.product_id).n;
      if (picked !== line.quantity) {
        return { status: 409, error: "Todavía faltan picks para embalar el pedido" };
      }
    }
    db.prepare("UPDATE orders SET status = 'packed' WHERE id = ?").run(orderId);
    return { status: 200 };
  });

  router.get("/orders", (req, res) => {
    const rows = db.prepare("SELECT id FROM orders ORDER BY id").all();
    res.json(rows.map((row) => presentOrder(db, row.id)));
  });

  router.post("/orders", (req, res) => {
    const body = bodyObject(res, req.body);
    if (!body) return;
    const lines = readLines(res, body);
    if (!lines) return;
    const result = createOrder(lines);
    if (result.error) return sendError(res, result.status, result.error);
    res.status(201).json(presentOrder(db, result.orderId));
  });

  router.get("/orders/:orderId", (req, res) => {
    const id = requireId(res, req.params.orderId, "orderId");
    if (id == null) return;
    const order = presentOrder(db, id);
    if (!order) return sendError(res, 404, "No existe ese pedido");
    res.json(order);
  });

  router.post("/orders/:orderId/cartons", (req, res) => {
    const orderId = requireId(res, req.params.orderId, "orderId");
    if (orderId == null) return;
    const body = bodyObject(res, req.body);
    if (!body) return;
    const code = text(body.code);
    if (!code) return sendError(res, 400, "code tiene que ser un texto");
    const order = db.prepare("SELECT status FROM orders WHERE id = ?").get(orderId);
    if (!order) return sendError(res, 404, "No existe ese pedido");
    if (order.status !== "open") return sendError(res, 409, "El pedido ya está embalado");
    try {
      const info = db.prepare("INSERT INTO cartons (order_id, code) VALUES (?, ?)").run(orderId, code);
      res.status(201).json({ id: Number(info.lastInsertRowid), code, picks: [] });
    } catch (err) {
      if (uniqueConstraint(res, err, "Ya existe un cartón con ese código en el pedido")) return;
      throw err;
    }
  });

  router.post("/orders/:orderId/cartons/:cartonId/picks", (req, res) => {
    const orderId = requireId(res, req.params.orderId, "orderId");
    if (orderId == null) return;
    const cartonId = requireId(res, req.params.cartonId, "cartonId");
    if (cartonId == null) return;
    const body = bodyObject(res, req.body);
    if (!body) return;
    const productId = wholeNumber(body.productId, 1);
    const binId = wholeNumber(body.binId, 1);
    const quantity = wholeNumber(body.quantity, 1);
    if (productId == null) return sendError(res, 400, "productId tiene que ser un entero mayor a 0");
    if (binId == null) return sendError(res, 400, "binId tiene que ser un entero mayor a 0");
    if (quantity == null) return sendError(res, 400, "quantity tiene que ser un entero mayor a 0");
    const result = pickIntoCarton(orderId, cartonId, productId, binId, quantity);
    if (result.error) return sendError(res, result.status, result.error);
    const pick = db.prepare("SELECT * FROM picks WHERE id = ?").get(result.pickId);
    res.status(201).json({
      id: pick.id,
      productId: pick.product_id,
      binId: pick.bin_id,
      quantity: pick.quantity,
    });
  });

  router.post("/orders/:orderId/pack", (req, res) => {
    const orderId = requireId(res, req.params.orderId, "orderId");
    if (orderId == null) return;
    if (req.body != null && (typeof req.body !== "object" || Array.isArray(req.body))) {
      return sendError(res, 400, "El cuerpo tiene que ser un objeto JSON");
    }
    const result = packOrder(orderId);
    if (result.error) return sendError(res, result.status, result.error);
    res.json(presentOrder(db, orderId));
  });

  return router;
}

module.exports = orders;
