const fs = require("fs");
const path = require("path");
const express = require("express");
const swaggerUi = require("swagger-ui-express");
const yaml = require("js-yaml");
const { openDatabase } = require("./db");
const categories = require("./routes/categories");
const products = require("./routes/products");
const locations = require("./routes/locations");
const intakes = require("./routes/intakes");
const orders = require("./routes/orders");

const db = openDatabase();
const app = express();

app.use(express.json());
app.use(categories(db));
app.use(products(db));
app.use(locations(db));
app.use(intakes(db));
app.use(orders(db));

const specPath = path.join(__dirname, "..", "openapi.yaml");
fs.copyFileSync(specPath, path.join(__dirname, "..", "..", "openapi.yaml"));
const spec = yaml.load(fs.readFileSync(specPath, "utf8"));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(spec, { customSiteTitle: "API de depósito" }));

app.use((req, res) => {
  res.status(404).json({ error: "No existe esa ruta" });
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400) {
    return res.status(400).json({ error: "JSON inválido" });
  }
  console.error(err);
  res.status(500).json({ error: "Error interno" });
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`API en http://localhost:${port} — Swagger en /docs`);
});
