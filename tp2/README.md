# TP 2 — API de depósito

API REST para un depósito: categorías, productos, lugares, ingresos y pedidos. El contrato está en `openapi.yaml` y se ve en Swagger.

Estado: pendiente

## Cómo se ejecuta

Desde `tp2/`:

```bash
npm install
npm start
```

La API queda en `http://localhost:3000`. Swagger UI, leyendo el `openapi.yaml` del repo, queda en `http://localhost:3000/docs`.

Al arrancar se crea `tp2/data/warehouse.sqlite` si no existe. `data/` y `node_modules/` están en `.gitignore`.

No hay login. Un cuerpo mal formado responde `400`, un id que no existe `404`, y un conflicto de estado (borrar algo que todavía tiene hijos o stock, completar un ingreso dos veces, pickear de más, embalar antes de tiempo) responde `409`.

El stock no se edita a mano: se consulta en `/products/{id}/stock` y `/bins/{id}/stock`. Completar un ingreso sin líneas responde `400`. Los ingresos y los pedidos también se listan y se leen por id.

## Qué me propuse construir

Una API para administrar un depósito. Se crean categorías y productos, y el stock de cada producto puede estar repartido. Los lugares se administran. El ingreso escanea productos, suma inventario y asigna uno o más lugares, incluso un lugar que ya tiene ese producto. Los pedidos se preparan: se retiran de un lugar y se meten en una caja. Un pedido tiene uno o más productos, y cada cantidad puede ser mayor a uno. Después, el YAML de OpenAPI de esa API, y Swagger para verlo.

## Decisiones que tomé yo

- Node + Express + SQLite (`better-sqlite3`). Esta máquina tiene Node 18, así que no uso `node:sqlite`.
- El último nivel del lugar es un **bin**: ahí vive el stock. El **cartón** es otra cosa: es donde se embala el pedido, no un lugar del depósito.
- La cantidad no se edita a mano. Cambia al completar un ingreso o al pickear hacia un cartón.
- El producto no va anidado en la categoría. `categoryId` es un campo, porque un escaneo busca el SKU en todo el depósito (`GET /products?sku=`).
- Los lugares sí van anidados (`warehouse → aisle → row → shelf → bin`), porque un pasillo solo existe dentro de un depósito. Cada nivel también se lee, se modifica y se borra por su propio id, para no arrastrar toda la cadena en un pick.
- El YAML se escribió después de las rutas, para que documente la API que se puede llamar. Swagger sirve ese archivo, no un spec que arma Express.

## Qué salió mal y cómo lo corregí

En el pedido, “box” nombraba dos cosas: el lugar donde se guarda el stock y la caja del pedido. Antes de escribir código se separaron: bin para el stock, cartón para el embalaje. El código de la API queda en `src/`; `openapi.yaml` es el único artefacto del contrato fuera de esa carpeta.

## Prompts

El registro completo va en [prompts.md](prompts.md).

Los que cambiaron el resultado:

1. Pedir la API de depósito (categorías, productos, stock en lugares, ingresos y pedidos) y el OpenAPI con Swagger.
2. Pedir que todo el código quede en `tp2/src`, salvo el YAML.
