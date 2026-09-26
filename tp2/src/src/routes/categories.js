const express = require("express");
const { sendError, bodyObject, requireId, text, uniqueConstraint } = require("../http");

function toCategory(row) {
  return { id: row.id, name: row.name };
}

function categories(db) {
  const router = express.Router();

  router.get("/categories", (req, res) => {
    const rows = db.prepare("SELECT * FROM categories ORDER BY id").all();
    res.json(rows.map(toCategory));
  });

  router.post("/categories", (req, res) => {
    const body = bodyObject(res, req.body);
    if (!body) return;
    const name = text(body.name);
    if (!name) return sendError(res, 400, "name tiene que ser un texto");
    try {
      const info = db.prepare("INSERT INTO categories (name) VALUES (?)").run(name);
      const row = db.prepare("SELECT * FROM categories WHERE id = ?").get(info.lastInsertRowid);
      res.status(201).json(toCategory(row));
    } catch (err) {
      if (uniqueConstraint(res, err, "Ya existe una categoría con ese nombre")) return;
      throw err;
    }
  });

  router.get("/categories/:categoryId", (req, res) => {
    const id = requireId(res, req.params.categoryId, "categoryId");
    if (id == null) return;
    const row = db.prepare("SELECT * FROM categories WHERE id = ?").get(id);
    if (!row) return sendError(res, 404, "No existe esa categoría");
    res.json(toCategory(row));
  });

  router.patch("/categories/:categoryId", (req, res) => {
    const id = requireId(res, req.params.categoryId, "categoryId");
    if (id == null) return;
    const body = bodyObject(res, req.body);
    if (!body) return;
    const row = db.prepare("SELECT * FROM categories WHERE id = ?").get(id);
    if (!row) return sendError(res, 404, "No existe esa categoría");
    if (!("name" in body)) return sendError(res, 400, "No hay campos para actualizar");
    const name = text(body.name);
    if (!name) return sendError(res, 400, "name tiene que ser un texto");
    try {
      db.prepare("UPDATE categories SET name = ? WHERE id = ?").run(name, id);
    } catch (err) {
      if (uniqueConstraint(res, err, "Ya existe una categoría con ese nombre")) return;
      throw err;
    }
    res.json(toCategory(db.prepare("SELECT * FROM categories WHERE id = ?").get(id)));
  });

  router.delete("/categories/:categoryId", (req, res) => {
    const id = requireId(res, req.params.categoryId, "categoryId");
    if (id == null) return;
    const row = db.prepare("SELECT * FROM categories WHERE id = ?").get(id);
    if (!row) return sendError(res, 404, "No existe esa categoría");
    const used = db.prepare("SELECT COUNT(*) AS n FROM products WHERE category_id = ?").get(id).n;
    if (used > 0) return sendError(res, 409, "La categoría todavía tiene productos");
    db.prepare("DELETE FROM categories WHERE id = ?").run(id);
    res.status(204).end();
  });

  return router;
}

module.exports = categories;
