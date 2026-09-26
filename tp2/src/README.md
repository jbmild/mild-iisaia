# Depósito

API REST del TP 2. Categorías, productos, lugares, ingresos y pedidos. El stock vive solo en bins. El informe de la entrega está en [../README.md](../README.md).

## Cómo se ejecuta

Desde esta carpeta:

```bash
npm install
npm start
```

| Qué | Dónde |
|-----|--------|
| API | http://localhost:3000 |
| Swagger | http://localhost:3000/docs |
| Base | `data/warehouse.sqlite`, se crea al arrancar |

`npm start` ejecuta `node src/server.js`. No hay login.

## Carpetas

```
src/                      esta carpeta, el paquete npm
├── package.json
├── openapi.yaml          contrato que lee Swagger
├── prompts.md            registro de prompts del TP
├── src/
│   ├── server.js         Express, copia el YAML y monta /docs
│   ├── db.js             SQLite y tablas
│   └── routes/
└── data/                 ignorada por git
```

Al arrancar, `src/server.js` copia `openapi.yaml` a `../openapi.yaml`. El archivo que hay que editar es el de esta carpeta. La copia de arriba se reescribe en el próximo arranque.

## Recursos

Swagger los agrupa así: Categorías, Productos, Depósitos, Pasillos, Filas, Estantes, Bins, Ingresos, Pedidos.

- Categorías y productos. El producto lleva `sku`, `name` y `categoryId`. `GET /products?sku=` es el escaneo.
- Lugares anidados: `warehouse → aisle → row → shelf → bin`. Cada uno se crea bajo su padre y también tiene `GET`, `PATCH` y `DELETE` por su propio id.
- `GET /products/{productId}/stock` y `GET /bins/{binId}/stock` son saldos. La cantidad no se edita por ahí.
- Ingreso: `POST /intakes` lo abre. `POST /intakes/{id}/lines` escanea un producto y reparte la cantidad en uno o más bins. Las asignaciones tienen que sumar la cantidad escaneada. Un bin que ya tiene ese producto se puede volver a usar. `POST /intakes/{id}/complete` suma el stock una sola vez. Completar de nuevo responde `409`. Completar sin líneas responde `400`.
- Pedido: `POST /orders` con una o más líneas (`productId`, `quantity` ≥ 1). Una línea por producto. `POST /orders/{id}/cartons` abre un cartón. `POST /orders/{id}/cartons/{cartonId}/picks` saca `productId`, `binId` y `quantity` de ese bin hacia ese cartón. Un pick no puede pasar el stock del bin ni lo que falta de la línea. `POST /orders/{id}/pack` solo cuando todas las líneas están pickeadas.

Un cuerpo mal formado responde `400`. Un id que no existe responde `404`. Borrar un lugar, una categoría o un producto que todavía tiene hijos o stock responde `409`.
