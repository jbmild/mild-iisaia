import express from "express";
import path from "path";
import { Pool } from "pg";
import { ComponentController } from "./controller/component-controller";
import { loadCatalog } from "./entity/component-table";
import { ComponentRepository } from "./repository/component-repository";
import { componentRouter } from "./router/component-router";
import { ComponentService } from "./service/component-service";

const allowedOrigins = new Set(["http://localhost:5173", "http://127.0.0.1:5173"]);

const catalogPath = path.resolve(__dirname, "../../data/component-tables.json");
const tables = loadCatalog(catalogPath);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? "postgres://components:components@localhost:5432/components",
});
const service = new ComponentService(tables, new ComponentRepository(pool));
const app = express();

app.use(express.json());
app.use((req, res, next) => {
  const origin = req.header("Origin");
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});
app.use("/api", componentRouter(new ComponentController(service)));

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`API en http://localhost:${port}`);
});
