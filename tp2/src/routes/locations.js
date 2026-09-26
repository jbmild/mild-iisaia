const express = require("express");
const { sendError, bodyObject, requireId, text, uniqueConstraint } = require("../http");

// Los cinco niveles comparten las mismas reglas: el código es único
// dentro del padre, y no se borra un lugar que todavía tiene hijos o stock.
const levels = [
  {
    table: "warehouses",
    named: true,
    collectionPath: "/warehouses",
    itemPath: "/warehouses/:warehouseId",
    idParam: "warehouseId",
    idLabel: "warehouseId",
    missing: "No existe ese depósito",
    uniqueMessage: "Ya existe un depósito con ese código",
    inUseMessage: "El depósito todavía tiene pasillos",
    inUse(db, id) {
      return db.prepare("SELECT COUNT(*) AS n FROM aisles WHERE warehouse_id = ?").get(id).n;
    },
    toJson(row) {
      return { id: row.id, code: row.code, name: row.name };
    },
  },
  {
    table: "aisles",
    collectionPath: "/warehouses/:warehouseId/aisles",
    itemPath: "/aisles/:aisleId",
    idParam: "aisleId",
    idLabel: "aisleId",
    missing: "No existe ese pasillo",
    uniqueMessage: "Ya existe un pasillo con ese código en el depósito",
    inUseMessage: "El pasillo todavía tiene filas",
    parent: {
      table: "warehouses",
      column: "warehouse_id",
      param: "warehouseId",
      label: "warehouseId",
      jsonKey: "warehouseId",
      missing: "No existe ese depósito",
    },
    inUse(db, id) {
      return db.prepare('SELECT COUNT(*) AS n FROM "rows" WHERE aisle_id = ?').get(id).n;
    },
    toJson(row) {
      return { id: row.id, code: row.code, warehouseId: row.warehouse_id };
    },
  },
  {
    table: "rows",
    collectionPath: "/aisles/:aisleId/rows",
    itemPath: "/rows/:rowId",
    idParam: "rowId",
    idLabel: "rowId",
    missing: "No existe esa fila",
    uniqueMessage: "Ya existe una fila con ese código en el pasillo",
    inUseMessage: "La fila todavía tiene estantes",
    parent: {
      table: "aisles",
      column: "aisle_id",
      param: "aisleId",
      label: "aisleId",
      jsonKey: "aisleId",
      missing: "No existe ese pasillo",
    },
    inUse(db, id) {
      return db.prepare("SELECT COUNT(*) AS n FROM shelves WHERE row_id = ?").get(id).n;
    },
    toJson(row) {
      return { id: row.id, code: row.code, aisleId: row.aisle_id };
    },
  },
  {
    table: "shelves",
    collectionPath: "/rows/:rowId/shelves",
    itemPath: "/shelves/:shelfId",
    idParam: "shelfId",
    idLabel: "shelfId",
    missing: "No existe ese estante",
    uniqueMessage: "Ya existe un estante con ese código en la fila",
    inUseMessage: "El estante todavía tiene bins",
    parent: {
      table: "rows",
      column: "row_id",
      param: "rowId",
      label: "rowId",
      jsonKey: "rowId",
      missing: "No existe esa fila",
    },
    inUse(db, id) {
      return db.prepare("SELECT COUNT(*) AS n FROM bins WHERE shelf_id = ?").get(id).n;
    },
    toJson(row) {
      return { id: row.id, code: row.code, rowId: row.row_id };
    },
  },
  {
    table: "bins",
    collectionPath: "/shelves/:shelfId/bins",
    itemPath: "/bins/:binId",
    idParam: "binId",
    idLabel: "binId",
    missing: "No existe ese bin",
    uniqueMessage: "Ya existe un bin con ese código en el estante",
    inUseMessage: "El bin todavía tiene stock o ya se usó en un ingreso o un pick",
    parent: {
      table: "shelves",
      column: "shelf_id",
      param: "shelfId",
      label: "shelfId",
      jsonKey: "shelfId",
      missing: "No existe ese estante",
    },
    inUse(db, id) {
      const stock = db.prepare("SELECT COUNT(*) AS n FROM stock WHERE bin_id = ?").get(id).n;
      const allocations = db.prepare("SELECT COUNT(*) AS n FROM intake_allocations WHERE bin_id = ?").get(id).n;
      const picks = db.prepare("SELECT COUNT(*) AS n FROM picks WHERE bin_id = ?").get(id).n;
      return stock + allocations + picks;
    },
    toJson(row) {
      return { id: row.id, code: row.code, shelfId: row.shelf_id };
    },
  },
];

function quoted(table) {
  return `"${table}"`;
}

function loadParent(db, res, level, req) {
  const parentId = requireId(res, req.params[level.parent.param], level.parent.label);
  if (parentId == null) return null;
  const parent = db.prepare(`SELECT id FROM ${quoted(level.parent.table)} WHERE id = ?`).get(parentId);
  if (!parent) {
    sendError(res, 404, level.parent.missing);
    return null;
  }
  return parentId;
}

function loadSelf(db, res, level, req) {
  const id = requireId(res, req.params[level.idParam], level.idLabel);
  if (id == null) return null;
  const row = db.prepare(`SELECT * FROM ${quoted(level.table)} WHERE id = ?`).get(id);
  if (!row) {
    sendError(res, 404, level.missing);
    return null;
  }
  return row;
}

function readCode(res, body, required) {
  if (!required && !("code" in body)) return undefined;
  const code = text(body.code);
  if (!code) {
    sendError(res, 400, "code tiene que ser un texto");
    return null;
  }
  return code;
}

function readName(res, body, required) {
  if (!required && !("name" in body)) return undefined;
  const name = text(body.name);
  if (!name) {
    sendError(res, 400, "name tiene que ser un texto");
    return null;
  }
  return name;
}

function locations(db) {
  const router = express.Router();

  for (const level of levels) {
    router.get(level.collectionPath, (req, res) => {
      let rows;
      if (level.parent) {
        const parentId = loadParent(db, res, level, req);
        if (parentId == null) return;
        rows = db
          .prepare(`SELECT * FROM ${quoted(level.table)} WHERE ${level.parent.column} = ? ORDER BY id`)
          .all(parentId);
      } else {
        rows = db.prepare(`SELECT * FROM ${quoted(level.table)} ORDER BY id`).all();
      }
      res.json(rows.map(level.toJson));
    });

    router.post(level.collectionPath, (req, res) => {
      const body = bodyObject(res, req.body);
      if (!body) return;
      const parentId = level.parent ? loadParent(db, res, level, req) : undefined;
      if (level.parent && parentId == null) return;
      const code = readCode(res, body, true);
      if (code == null) return;
      let name;
      if (level.named) {
        name = readName(res, body, true);
        if (name == null) return;
      }
      try {
        const info = level.parent
          ? db
              .prepare(`INSERT INTO ${quoted(level.table)} (${level.parent.column}, code) VALUES (?, ?)`)
              .run(parentId, code)
          : db.prepare(`INSERT INTO ${quoted(level.table)} (code, name) VALUES (?, ?)`).run(code, name);
        const row = db.prepare(`SELECT * FROM ${quoted(level.table)} WHERE id = ?`).get(info.lastInsertRowid);
        res.status(201).json(level.toJson(row));
      } catch (err) {
        if (uniqueConstraint(res, err, level.uniqueMessage)) return;
        throw err;
      }
    });

    router.get(level.itemPath, (req, res) => {
      const row = loadSelf(db, res, level, req);
      if (!row) return;
      res.json(level.toJson(row));
    });

    router.patch(level.itemPath, (req, res) => {
      const row = loadSelf(db, res, level, req);
      if (!row) return;
      const body = bodyObject(res, req.body);
      if (!body) return;
      const code = readCode(res, body, false);
      if (code === null) return;
      const name = level.named ? readName(res, body, false) : undefined;
      if (name === null) return;
      if (code === undefined && name === undefined) {
        return sendError(res, 400, "No hay campos para actualizar");
      }
      const nextCode = code === undefined ? row.code : code;
      const nextName = name === undefined ? row.name : name;
      try {
        if (level.named) {
          db.prepare(`UPDATE ${quoted(level.table)} SET code = ?, name = ? WHERE id = ?`).run(nextCode, nextName, row.id);
        } else {
          db.prepare(`UPDATE ${quoted(level.table)} SET code = ? WHERE id = ?`).run(nextCode, row.id);
        }
      } catch (err) {
        if (uniqueConstraint(res, err, level.uniqueMessage)) return;
        throw err;
      }
      const updated = db.prepare(`SELECT * FROM ${quoted(level.table)} WHERE id = ?`).get(row.id);
      res.json(level.toJson(updated));
    });

    router.delete(level.itemPath, (req, res) => {
      const row = loadSelf(db, res, level, req);
      if (!row) return;
      if (level.inUse(db, row.id) > 0) return sendError(res, 409, level.inUseMessage);
      db.prepare(`DELETE FROM ${quoted(level.table)} WHERE id = ?`).run(row.id);
      res.status(204).end();
    });
  }

  router.get("/bins/:binId/stock", (req, res) => {
    const id = requireId(res, req.params.binId, "binId");
    if (id == null) return;
    const bin = db.prepare("SELECT id FROM bins WHERE id = ?").get(id);
    if (!bin) return sendError(res, 404, "No existe ese bin");
    const balances = db
      .prepare(
        `SELECT s.quantity, p.id AS product_id, p.sku, p.name
         FROM stock s
         JOIN products p ON p.id = s.product_id
         WHERE s.bin_id = ?
         ORDER BY p.id`
      )
      .all(id)
      .map((row) => ({
        productId: row.product_id,
        sku: row.sku,
        name: row.name,
        quantity: row.quantity,
      }));
    res.json({ binId: id, balances });
  });

  return router;
}

module.exports = locations;
