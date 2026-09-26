const express = require("express");
const { sendError, bodyObject, requireId, wholeNumber } = require("../http");

function presentIntake(db, id) {
  const intake = db.prepare("SELECT * FROM intakes WHERE id = ?").get(id);
  if (!intake) return null;
  const lines = db.prepare("SELECT * FROM intake_lines WHERE intake_id = ? ORDER BY id").all(id);
  const allocations = db.prepare(
    "SELECT * FROM intake_allocations WHERE intake_line_id = ? ORDER BY id"
  );
  return {
    id: intake.id,
    status: intake.status,
    createdAt: intake.created_at,
    lines: lines.map((line) => ({
      id: line.id,
      productId: line.product_id,
      quantity: line.quantity,
      allocations: allocations.all(line.id).map((row) => ({
        id: row.id,
        binId: row.bin_id,
        quantity: row.quantity,
      })),
    })),
  };
}

function presentLine(db, lineId) {
  const line = db.prepare("SELECT * FROM intake_lines WHERE id = ?").get(lineId);
  const allocations = db
    .prepare("SELECT * FROM intake_allocations WHERE intake_line_id = ? ORDER BY id")
    .all(lineId);
  return {
    id: line.id,
    productId: line.product_id,
    quantity: line.quantity,
    allocations: allocations.map((row) => ({
      id: row.id,
      binId: row.bin_id,
      quantity: row.quantity,
    })),
  };
}

function readAllocations(res, body) {
  if (!Array.isArray(body.allocations) || body.allocations.length === 0) {
    sendError(res, 400, "allocations tiene que tener al menos un bin");
    return null;
  }
  const allocations = [];
  for (const item of body.allocations) {
    if (item === null || typeof item !== "object" || Array.isArray(item)) {
      sendError(res, 400, "cada asignación tiene que ser un objeto");
      return null;
    }
    const binId = wholeNumber(item.binId, 1);
    const quantity = wholeNumber(item.quantity, 1);
    if (binId == null) {
      sendError(res, 400, "binId tiene que ser un entero mayor a 0");
      return null;
    }
    if (quantity == null) {
      sendError(res, 400, "la cantidad de cada asignación tiene que ser un entero mayor a 0");
      return null;
    }
    allocations.push({ binId, quantity });
  }
  return allocations;
}

function intakes(db) {
  const router = express.Router();

  const addLine = db.transaction((intakeId, productId, quantity, allocations) => {
    const intake = db.prepare("SELECT status FROM intakes WHERE id = ?").get(intakeId);
    if (!intake) return { status: 404, error: "No existe ese ingreso" };
    if (intake.status !== "open") return { status: 409, error: "El ingreso ya fue completado" };
    const product = db.prepare("SELECT id FROM products WHERE id = ?").get(productId);
    if (!product) return { status: 404, error: "No existe ese producto" };
    for (const allocation of allocations) {
      const bin = db.prepare("SELECT id FROM bins WHERE id = ?").get(allocation.binId);
      if (!bin) return { status: 404, error: "No existe ese bin" };
    }
    const info = db
      .prepare("INSERT INTO intake_lines (intake_id, product_id, quantity) VALUES (?, ?, ?)")
      .run(intakeId, productId, quantity);
    const insert = db.prepare(
      "INSERT INTO intake_allocations (intake_line_id, bin_id, quantity) VALUES (?, ?, ?)"
    );
    for (const allocation of allocations) {
      insert.run(info.lastInsertRowid, allocation.binId, allocation.quantity);
    }
    return { status: 201, lineId: Number(info.lastInsertRowid) };
  });

  const completeIntake = db.transaction((intakeId) => {
    const intake = db.prepare("SELECT status FROM intakes WHERE id = ?").get(intakeId);
    if (!intake) return { status: 404, error: "No existe ese ingreso" };
    if (intake.status !== "open") return { status: 409, error: "El ingreso ya fue completado" };
    const lineCount = db.prepare("SELECT COUNT(*) AS n FROM intake_lines WHERE intake_id = ?").get(intakeId).n;
    if (lineCount === 0) return { status: 400, error: "El ingreso no tiene líneas" };
    const allocations = db
      .prepare(
        `SELECT l.product_id, a.bin_id, a.quantity
         FROM intake_allocations a
         JOIN intake_lines l ON l.id = a.intake_line_id
         WHERE l.intake_id = ?`
      )
      .all(intakeId);
    const upsert = db.prepare(
      `INSERT INTO stock (product_id, bin_id, quantity) VALUES (?, ?, ?)
       ON CONFLICT (product_id, bin_id) DO UPDATE SET quantity = quantity + excluded.quantity`
    );
    for (const allocation of allocations) {
      upsert.run(allocation.product_id, allocation.bin_id, allocation.quantity);
    }
    db.prepare("UPDATE intakes SET status = 'completed' WHERE id = ?").run(intakeId);
    return { status: 200 };
  });

  router.get("/intakes", (req, res) => {
    const rows = db.prepare("SELECT id FROM intakes ORDER BY id").all();
    res.json(rows.map((row) => presentIntake(db, row.id)));
  });

  router.post("/intakes", (req, res) => {
    if (req.body != null && (typeof req.body !== "object" || Array.isArray(req.body))) {
      return sendError(res, 400, "El cuerpo tiene que ser un objeto JSON");
    }
    const info = db
      .prepare("INSERT INTO intakes (status, created_at) VALUES ('open', ?)")
      .run(new Date().toISOString());
    res.status(201).json(presentIntake(db, Number(info.lastInsertRowid)));
  });

  router.get("/intakes/:intakeId", (req, res) => {
    const id = requireId(res, req.params.intakeId, "intakeId");
    if (id == null) return;
    const intake = presentIntake(db, id);
    if (!intake) return sendError(res, 404, "No existe ese ingreso");
    res.json(intake);
  });

  router.post("/intakes/:intakeId/lines", (req, res) => {
    const intakeId = requireId(res, req.params.intakeId, "intakeId");
    if (intakeId == null) return;
    const body = bodyObject(res, req.body);
    if (!body) return;
    const productId = wholeNumber(body.productId, 1);
    const quantity = wholeNumber(body.quantity, 1);
    if (productId == null) return sendError(res, 400, "productId tiene que ser un entero mayor a 0");
    if (quantity == null) return sendError(res, 400, "quantity tiene que ser un entero mayor a 0");
    const allocations = readAllocations(res, body);
    if (!allocations) return;
    const sum = allocations.reduce((total, allocation) => total + allocation.quantity, 0);
    if (sum !== quantity) {
      return sendError(res, 400, "Las asignaciones tienen que sumar la cantidad escaneada");
    }
    const result = addLine(intakeId, productId, quantity, allocations);
    if (result.error) return sendError(res, result.status, result.error);
    res.status(201).json(presentLine(db, result.lineId));
  });

  router.post("/intakes/:intakeId/complete", (req, res) => {
    const intakeId = requireId(res, req.params.intakeId, "intakeId");
    if (intakeId == null) return;
    if (req.body != null && (typeof req.body !== "object" || Array.isArray(req.body))) {
      return sendError(res, 400, "El cuerpo tiene que ser un objeto JSON");
    }
    const result = completeIntake(intakeId);
    if (result.error) return sendError(res, result.status, result.error);
    res.json(presentIntake(db, intakeId));
  });

  return router;
}

module.exports = intakes;
