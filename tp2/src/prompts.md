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

**Qué hice con eso:** lo acepté.

---

## 5 — El YAML va con el proyecto

```
all the projects needs to be inside /tp2/src, I want you to later copi the openapi yaml to /tp2
```

**Por qué:** el contrato había quedado fuera de `src`. El proyecto tiene que vivir ahí, y el YAML de `tp2/` es una copia.

**Qué devolvió:** `src/openapi.yaml` como archivo del proyecto; al arrancar, el servidor lo copia a `tp2/openapi.yaml` y Swagger lee el de `src`.

**Qué hice con eso:** lo corregí.

**Por qué:** el YAML pasó a `src`, pero `package.json`, `prompts.md` y `.gitignore` siguieron en la raíz de `tp2`.

---

## 6 — Archivos de más en la raíz

```
why do I have other files in /tp2 that are not the yaml or the readme of the subject?
```

**Qué devolvió:** la explicación de `package.json`, `package-lock.json`, `prompts.md` y `.gitignore`.

**Qué hice con eso:** lo corregí.

**Por qué:** esos archivos no tienen que quedar al lado del informe y de la copia del YAML.

---

## 7 — Todo el proyecto en src

```
I want everything under /tp2/src if you need you can create a /tp2/src/src
```

**Qué devolvió:** el paquete npm en `tp2/src`, el código en `tp2/src/src`, y en la raíz de `tp2` solo el informe y la copia del YAML.

**Qué hice con eso:** lo acepté. Pidió levantar Swagger.

---

## 8 — Levantar Swagger

```
run swagger
```

**Qué devolvió:** la API en el puerto 3000, con Swagger en `/docs`.

**Qué hice con eso:** lo corregí.

**Por qué:** en Swagger, pasillos, filas, estantes y bins estaban todos en la sección Lugares.

---

## 9 — Secciones de lugares

```
@tp2/src/openapi.yaml in swagger all the endpoint to manage aisles, rows, shelves and bins need to be in different sections
```

**Qué devolvió:** en `src/openapi.yaml`, cada nivel tiene su sección: Depósitos, Pasillos, Filas, Estantes y Bins. Swagger se reinició para leer el archivo.

**Qué hice con eso:** lo acepté.

---

## 10 — Informe y README del proyecto

```
th readme at /tp2 needs to be the readme from the TP2, inline with what we have in tp1. In /tp2/src we can have a complete one refering to the project
```

**Por qué:** el README de `tp2/` mezclaba el informe de la entrega con el manual del proyecto.

**Qué devolvió:** `tp2/README.md` con la misma forma que el informe del TP 1, y `tp2/src/README.md` con carpetas, recursos y reglas de la API.

**Qué hice con eso:** lo acepté. Pidió marcar el TP 2 como entregado.

---

## 11 — Entregado

```
mark tp2 as entregado
```

**Qué devolvió:** en el índice del repo, el TP 2 pasó de pendiente a Entregado.

**Qué hice con eso:** lo acepté. Pidió commitear los cambios.

---

## 12 — Commit

```
commit all the changes
```

**Qué devolvió:** un commit con el proyecto bajo `tp2/src`, las secciones de Swagger, el informe y el estado Entregado.

**Qué hice con eso:** pendiente
