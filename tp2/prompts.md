# Prompts — TP 2

El registro del proceso, en orden.

---

## 1 — API de depósito

```
lets create the TP2. For this TP I need to create a rest api and after that I need to create the yaml for the openapi of that rest api. Also, I want to run swagger to see it. The API will be to manage a warehose. This warehouse you can create categories, products. For each product you have a stock. You can have the stock in different locations. You need to be able to manage the locations. There are warehouses, aisle, row, shelf and box (propse other structure for the warehouse if you think there is a better one). We have intake of new stock, where we scan the products and increase the inventory of a product. When this process takes place, you need to asign one or more locations to the new inventory comming in, you can also use the spot where you already have inventory of this product.
You recieve orders, each order needs to be prepared, picked up for the location and put into a box. each order can have one or more products and the quantity of each product could be one ore more.
Create the rest api to handle all of this along with the openapi yaml
```

**Qué devolvió:** un plan de la API (recursos, códigos HTTP, SQLite) y dos decisiones para cerrar antes de codear: el stack, y si el último nivel era un lugar de guardado distinto de la caja del pedido.

**Qué hice con eso:** lo acepté. Elegí Node + Express + SQLite, y el árbol depósito → pasillo → fila → estante → bin. El cartón queda aparte, solo para embalar el pedido.

---

## 2 — Código en src

```
all the code needs to be in ./tp2/src excepto the yaml
```

**Por qué:** el código de la API no tiene que mezclarse con el informe ni con el contrato.

**Qué devolvió:** el plan ajustado: todo el JavaScript en `tp2/src`, y `openapi.yaml` como único artefacto de la API fuera de esa carpeta.

**Qué hice con eso:** lo acepté.

---

## 3 — Implementar el plan

```
TP2 warehouse API

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.
```

**Qué devolvió:** la API en `tp2/src`, `openapi.yaml` y Swagger en `/docs`.

**Qué hice con eso:** lo acepté. Se commitea y se pushea.

---

## 4 — Commit y push

```
commit and push the changes
```

**Qué devolvió:** commit y push de la API, el YAML y el informe.

**Qué hice con eso:** pendiente
