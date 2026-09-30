# TP Final — Gestor de componentes para Altium

Gestor de los componentes que usa Altium Designer. La base es PostgreSQL: Altium la lee por ODBC con un DbLib. Cada hoja de `data/cdb.xls` es una tabla.

Estado: en curso. En esta rama está la base. La API y la interfaz van en las ramas siguientes.

## Cómo se ejecuta

Desde `tp-final/`:

```bash
docker compose up -d
```

PostgreSQL 16 queda en `localhost:5432`. Base, usuario y contraseña: `components`.

Los scripts `db/001_tables.sql` y `db/002_seed.sql` corren solo la primera vez, cuando el volumen está vacío. Para volver a cargar el Excel hay que borrar el volumen:

```bash
docker compose down -v
docker compose up -d
```

`db/generate.py` regenera el SQL y `data/component-tables.json` desde `data/cdb.xls`:

```bash
python3 db/generate.py
```

## Qué me propuse construir

Un gestor de componentes para Altium, a partir de `cdb.xls`. La base se conecta directo con Altium y Altium la consume. El gestor es React + TypeScript + PostgreSQL, con el servidor en capas router → controller → service → repository → entity.

## Decisiones que tomé yo

- Una tabla por hoja del Excel (`CAPACITOR`, `RESISTOR`, `IC`, …), con los mismos nombres de columna. Altium mapea solo si el nombre coincide con el suyo (`Library Ref`, `Footprint Ref`, `Description`).
- `Part Number` es la clave de Altium. `Manufacturer PN` queda como está en el Excel: no es único.
- Si el `Manufacturer PN` no se repite en el libro, `Part Number` es ese valor. En `MISC`, que no tiene ese campo, `Part Number` es `Key`. Si se repite, se le suma `Library Ref`; si sigue repetido, también `Footprint Ref`.
- La unicidad entre tablas vive en `app.part_number`, con un trigger. Ese schema no es una biblioteca: en el DbLib, Include Table Schema Names queda apagado.
- No hay `id` ni fechas. Altium convierte cada columna en un parámetro o en un modelo.
- Celdas vacías se guardan como NULL. Todas las columnas son texto, porque los valores del Excel son texto (`5VDC`, `10A`).

## Cómo se conecta Altium

Altium no trae un driver de PostgreSQL. El DbLib usa ADO/OLE DB contra un DSN ODBC de 64 bits.

1. Instalar el driver psqlODBC de 64 bits y crear un System DSN Unicode hacia `localhost`, puerto `5432`, base `components`, usuario `components`.
2. En Altium: File → New → Library → Database Library.
3. Use Connection String → Build → proveedor OLE DB para ODBC → el DSN. Probar la conexión.
4. En Advanced, comillas izquierda y derecha: `"`. PostgreSQL no acepta los corchetes de Access. Sin eso fallan los nombres con espacio (`Library Ref`, `Manufacturer PN`).
5. Include Table Schema Names: apagado. Habilitar solo las 17 tablas de componentes. No habilitar nada del schema `app`.
6. En cada tabla, Single key lookup con el campo `Part Number`.
7. En Field Mappings, `Library Ref`, `Footprint Ref`, `Footprint Path` y `Description` se asignan solos porque el nombre coincide con el reservado. Tiene que quedar `[Library Ref]` y al menos un `[Footprint Ref]`: sin eso Altium no coloca el componente. Las 302 filas del Excel ya traen los dos.

`Library Path` y los footprints 2 y 3 son opcionales si el DbLib tiene search paths. El Excel ya los trae y se conservan. El resto de las columnas (Value, Voltage, Package, …) pasan a ser parámetros del componente.

Los archivos `.SchLib` y `.PcbLib` no están en el Excel. La base guarda el nombre y el path; esos archivos tienen que estar donde Altium los busque.

El archivo `.DbLib` se arma en Altium, en Windows. Esta máquina no lo puede probar.

## Qué salió mal y cómo lo corregí

`Manufacturer PN` no sirve como clave. `SM712-02HTG` está dos veces en `TVS` (otro símbolo) y `Generic_0805` / `Generic_1206` están dos veces en `RESISTOR` (huella comercial y huella MIL). Por eso la clave es `Part Number` y el PN del fabricante no se reescribe.

La hoja `MISC` repite el encabezado `Description` en una columna vacía. PostgreSQL no admite dos columnas con el mismo nombre: esa columna no se crea.

## Prompts

1. Armar el gestor de componentes para Altium a partir de `cdb.xls`, con React, TypeScript y PostgreSQL, en capas router → controller → service → repository → entity, y verificar qué campos necesita la base para que Altium se conecte.
2. Una tabla por hoja, no una tabla única con vistas. Clave nueva `Part Number`, dejando `Manufacturer PN` como en el Excel.
