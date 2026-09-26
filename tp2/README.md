# TP 2 — API de depósito

API REST para administrar un depósito: categorías, productos, stock en lugares, ingresos y pedidos. El contrato OpenAPI se mira en Swagger.

## Cómo se ejecuta

Desde `src/`:

```bash
npm install
npm start
```

La API queda en `http://localhost:3000`. Swagger queda en `http://localhost:3000/docs`.

El proyecto, con el detalle de carpetas, recursos y reglas, está en [src/README.md](src/README.md).

## Qué me propuse construir

Una API para un depósito. Se crean categorías y productos, y el stock de cada producto puede estar repartido en lugares. Esos lugares se administran. El ingreso escanea productos, suma inventario y asigna uno o más lugares, incluso uno que ya tiene ese producto. Los pedidos se preparan: se retiran de un lugar y se meten en una caja. Un pedido tiene uno o más productos, y cada cantidad puede ser mayor a uno. Después, el YAML de OpenAPI de esa API, y Swagger para verlo.

## Decisiones que tomé yo

- Node + Express + SQLite (`better-sqlite3`). Esta máquina tiene Node 18, así que no uso `node:sqlite`.
- El último nivel del lugar es un **bin**: ahí vive el stock. El **cartón** es otra cosa: es donde se embala el pedido, no un lugar del depósito.
- La cantidad no se edita a mano. Cambia al completar un ingreso o al pickear hacia un cartón.
- El producto no va anidado en la categoría. `categoryId` es un campo, porque un escaneo busca el SKU en todo el depósito (`GET /products?sku=`).
- Los lugares sí van anidados (`warehouse → aisle → row → shelf → bin`), porque un pasillo solo existe dentro de un depósito. Cada nivel también se lee, se modifica y se borra por su propio id, para no arrastrar toda la cadena en un pick.
- El YAML se escribió después de las rutas, para que documente la API que se puede llamar. Swagger lee `src/openapi.yaml`, no un spec que arma Express. Al arrancar, ese archivo se copia a `openapi.yaml` en esta carpeta.
- El paquete npm vive en `src/`. El JavaScript vive en `src/src/`, porque `npm start` necesita el `package.json` en la carpeta desde la que se arranca. Acá quedan el informe y la copia del YAML.
- En Swagger, depósitos, pasillos, filas, estantes y bins son secciones distintas.

## Qué salió mal y cómo lo corregí

En el pedido, “box” nombraba dos cosas: el lugar donde se guarda el stock y la caja del pedido. Antes de escribir código se separaron: bin para el stock, cartón para el embalaje. El contrato había quedado suelto en esta carpeta; el proyecto pasó a `src/` y `openapi.yaml` quedó como copia. `package.json`, el registro de prompts y `.gitignore` seguían al lado del informe: se movieron a `src/`, y el JavaScript a `src/src/`. En Swagger, pasillos, filas, estantes y bins estaban todos bajo Lugares: cada nivel pasó a su propia sección.

## Prompts

El registro completo va en [src/prompts.md](src/prompts.md).

Los que cambiaron el resultado:

1. Pedir la API de depósito (categorías, productos, stock en lugares, ingresos y pedidos) y el OpenAPI con Swagger.
2. Pedir que todo el código quede en `tp2/src`, salvo el YAML.
3. Pedir que el proyecto entero quede en `tp2/src` y que el YAML se copie a `tp2/`.
4. Pedir que también el paquete, el registro de prompts y `.gitignore` queden bajo `tp2/src`, con el código en `tp2/src/src`.
5. Separar en Swagger los endpoints de pasillos, filas, estantes y bins.
6. Dejar este archivo como el informe del TP, alineado con el TP 1, y la documentación del proyecto en `src/README.md`.
