#!/usr/bin/env python3
"""Build the Altium-facing schema, seed, and table catalog from cdb.xls.

Altium maps columns by name and looks a component up by one key. The workbook
already uses the reserved names (Library Ref, Footprint Ref, ...). Part Number
is added as that key because Manufacturer PN is not unique.
"""

import json
import struct
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
XLS = ROOT / "data" / "cdb.xls"
CATALOG = ROOT / "data" / "component-tables.json"
TABLES_SQL = ROOT / "db" / "001_tables.sql"
SEED_SQL = ROOT / "db" / "002_seed.sql"

REQUIRED = ["Part Number", "Library Ref", "Footprint Ref"]


def u16(buf, offset):
    return struct.unpack_from("<H", buf, offset)[0]


def u32(buf, offset):
    return struct.unpack_from("<I", buf, offset)[0]


def read_workbook(path):
    data = path.read_bytes()
    sector_size = 1 << u16(data, 0x1E)
    difat = []
    for index in range(109):
        value = u32(data, 0x4C + index * 4)
        if value == 0xFFFFFFFF:
            break
        difat.append(value)
    fat = []
    for sector in difat:
        offset = 512 + sector * sector_size
        fat.extend(u32(data, offset + i * 4) for i in range(sector_size // 4))

    def read_chain(start, size=None):
        blob = b""
        sector = start
        seen = set()
        while sector < 0xFFFFFFF0 and sector not in seen:
            seen.add(sector)
            blob += data[512 + sector * sector_size : 512 + (sector + 1) * sector_size]
            sector = fat[sector]
        return blob if size is None else blob[:size]

    directory = read_chain(u32(data, 0x30))
    workbook = None
    for offset in range(0, len(directory), 128):
        entry = directory[offset : offset + 128]
        name_len = u16(entry, 64)
        name = entry[:name_len].decode("utf-16le", "ignore").rstrip("\x00")
        if name == "Workbook":
            workbook = read_chain(u32(entry, 116), u32(entry, 120))
            break
    if workbook is None:
        raise SystemExit("cdb.xls has no Workbook stream")

    records = []
    position = 0
    while position + 4 <= len(workbook):
        kind = u16(workbook, position)
        length = u16(workbook, position + 2)
        position += 4
        records.append((kind, workbook[position : position + length], position - 4))
        position += length
    return records


class Stream:
    def __init__(self, bodies):
        self.bodies = bodies
        self.body_index = 0
        self.position = 0

    def remaining(self):
        return len(self.bodies[self.body_index]) - self.position

    def read(self, count):
        chunks = []
        while count:
            if self.remaining() == 0:
                self.body_index += 1
                self.position = 0
            take = min(count, self.remaining())
            chunks.append(self.bodies[self.body_index][self.position : self.position + take])
            self.position += take
            count -= take
        return b"".join(chunks)

    def u8(self):
        return self.read(1)[0]

    def u16(self):
        return struct.unpack("<H", self.read(2))[0]

    def u32(self):
        return struct.unpack("<I", self.read(4))[0]


def shared_strings(records):
    start = next(index for index, (kind, _, _) in enumerate(records) if kind == 0x00FC)
    bodies = [records[start][1]]
    cursor = start + 1
    while cursor < len(records) and records[cursor][0] == 0x003C:
        bodies.append(records[cursor][1])
        cursor += 1
    stream = Stream(bodies)
    stream.u32()
    unique = stream.u32()
    strings = []

    def read_string():
        if stream.remaining() < 3:
            stream.body_index += 1
            stream.position = 0
        count = stream.u16()
        flags = stream.u8()
        wide = flags & 1
        runs = stream.u16() if flags & 8 else 0
        extra = stream.u32() if flags & 4 else 0
        parts = []
        left = count
        while left:
            if stream.remaining() == 0:
                stream.body_index += 1
                stream.position = 0
                wide = stream.u8() & 1
            width = 2 if wide else 1
            available = min(left, stream.remaining() // width)
            raw = stream.read(available * width)
            parts.append(raw.decode("utf-16le" if wide else "latin1"))
            left -= available
        if runs:
            stream.read(runs * 4)
        if extra:
            stream.read(extra)
        return "".join(parts)

    for _ in range(unique):
        strings.append(read_string())
    return strings


def sheets_and_cells(records, strings):
    bounds = []
    for kind, body, _ in records:
        if kind != 0x0085:
            continue
        name_len = body[6]
        wide = body[7] & 1
        name = body[8 : 8 + name_len * 2].decode("utf-16le") if wide else body[8 : 8 + name_len].decode("latin1")
        bounds.append((name, u32(body, 0)))

    ranges = []
    for index, (name, offset) in enumerate(bounds):
        end = bounds[index + 1][1] if index + 1 < len(bounds) else 10**12
        ranges.append((name, offset, end))

    cells = defaultdict(dict)
    max_col = defaultdict(int)
    max_row = defaultdict(int)
    for kind, body, offset in records:
        sheet = next((name for name, start, end in ranges if start <= offset < end), None)
        if sheet is None or kind != 0x00FD or len(body) < 10:
            continue
        row, col, _, string_index = struct.unpack_from("<HHHI", body)
        cells[sheet][(row, col)] = strings[string_index]
        max_col[sheet] = max(max_col[sheet], col)
        max_row[sheet] = max(max_row[sheet], row)
    return [name for name, _, _ in ranges], cells, max_col, max_row


def blank(value):
    return value is None or value == ""


def column_headers(name, cells, max_col, max_row):
    headers = [cells[name].get((0, col), "") for col in range(max_col[name] + 1)]
    while headers and blank(headers[-1]):
        headers.pop()
    seen = []
    kept = []
    for index, header in enumerate(headers):
        if header in seen:
            values = [cells[name].get((row, index), "") for row in range(1, max_row[name] + 1)]
            if any(not blank(value) for value in values):
                raise SystemExit(f"{name} repeats column {header!r} and that column has data")
            continue
        seen.append(header)
        kept.append((index, header))
    return kept


def cell_value(cells, sheet, row, col):
    value = cells[sheet].get((row, col), "")
    return None if blank(value) else value


def assign_part_numbers(sheet_names, cells, columns, max_row):
    rows = []
    for sheet in sheet_names:
        by_name = {header: index for index, header in columns[sheet]}
        for row in range(1, max_row[sheet] + 1):
            fields = {
                header: cell_value(cells, sheet, row, index)
                for index, header in columns[sheet]
            }
            if sheet == "MISC":
                base = fields.get("Key")
            else:
                base = fields.get("Manufacturer PN")
            if blank(base):
                raise SystemExit(f"{sheet} row {row} has no identity")
            rows.append({
                "sheet": sheet,
                "base": base,
                "library_ref": fields.get("Library Ref"),
                "footprint_ref": fields.get("Footprint Ref"),
                "fields": fields,
            })

    counts = defaultdict(int)
    for row in rows:
        counts[row["base"]] += 1

    grouped = defaultdict(list)
    for row in rows:
        if counts[row["base"]] == 1:
            row["part_number"] = row["base"]
        else:
            if blank(row["library_ref"]):
                raise SystemExit(f"duplicate {row['base']} is missing Library Ref")
            candidate = f"{row['base']} | {row['library_ref']}"
            grouped[candidate].append(row)

    for candidate, group in grouped.items():
        if len(group) == 1:
            group[0]["part_number"] = candidate
            continue
        for row in group:
            if blank(row["footprint_ref"]):
                raise SystemExit(f"duplicate {candidate} is missing Footprint Ref")
            row["part_number"] = f"{candidate} | {row['footprint_ref']}"

    seen = defaultdict(list)
    for row in rows:
        seen[row["part_number"]].append(row["sheet"])
    collisions = {key: value for key, value in seen.items() if len(value) > 1}
    if collisions:
        raise SystemExit(f"Part Number still collides: {collisions}")
    return rows


def quote_ident(name):
    return '"' + name.replace('"', '""') + '"'


def sql_literal(value):
    if value is None:
        return "NULL"
    return "'" + value.replace("'", "''") + "'"


def write_sql(sheet_names, columns, rows):
    table_lines = [
        "-- Tablas que Altium lee por ODBC. Los nombres coinciden con el Excel",
        "-- para que el DbLib mapee Library Ref, Footprint Ref y Description solo.",
        "-- Part Number es la clave de búsqueda. No hay columnas de aplicación:",
        "-- Altium convierte cada columna en un parámetro o en un modelo.",
        "",
        "CREATE SCHEMA IF NOT EXISTS app;",
        "",
        "CREATE TABLE app.part_number (",
        "    part_number text PRIMARY KEY,",
        "    table_name text NOT NULL",
        ");",
        "",
        "CREATE FUNCTION app.enforce_part_number() RETURNS trigger",
        "LANGUAGE plpgsql AS $$",
        "BEGIN",
        "    IF TG_OP = 'INSERT' THEN",
        "        INSERT INTO app.part_number (part_number, table_name)",
        '        VALUES (NEW."Part Number", TG_TABLE_NAME);',
        "        RETURN NEW;",
        "    ELSIF TG_OP = 'UPDATE' THEN",
        '        IF NEW."Part Number" IS DISTINCT FROM OLD."Part Number" THEN',
        "            UPDATE app.part_number",
        '            SET part_number = NEW."Part Number"',
        '            WHERE part_number = OLD."Part Number"',
        "              AND table_name = TG_TABLE_NAME;",
        "        END IF;",
        "        RETURN NEW;",
        "    ELSIF TG_OP = 'DELETE' THEN",
        "        DELETE FROM app.part_number",
        '        WHERE part_number = OLD."Part Number"',
        "          AND table_name = TG_TABLE_NAME;",
        "        RETURN OLD;",
        "    END IF;",
        "    RETURN NULL;",
        "END;",
        "$$;",
        "",
    ]
    for sheet in sheet_names:
        column_sql = ["    " + quote_ident("Part Number") + " text PRIMARY KEY"]
        for _, header in columns[sheet]:
            column_sql.append("    " + quote_ident(header) + " text")
        table_lines.append(f"CREATE TABLE {quote_ident(sheet)} (")
        table_lines.append(",\n".join(column_sql))
        table_lines.append(");")
        table_lines.append("")
        table_lines.append(
            f"CREATE TRIGGER {quote_ident(sheet + '_part_number')}"
        )
        table_lines.append(
            f"AFTER INSERT OR UPDATE OR DELETE ON {quote_ident(sheet)}"
        )
        table_lines.append("FOR EACH ROW EXECUTE FUNCTION app.enforce_part_number();")
        table_lines.append("")
    TABLES_SQL.write_text("\n".join(table_lines), encoding="utf-8")

    seed_lines = [
        "-- Carga inicial desde cdb.xls. Una celda vacía queda NULL.",
        "",
    ]
    by_sheet = defaultdict(list)
    for row in rows:
        by_sheet[row["sheet"]].append(row)
    for sheet in sheet_names:
        headers = ["Part Number"] + [header for _, header in columns[sheet]]
        column_list = ", ".join(quote_ident(header) for header in headers)
        for row in by_sheet[sheet]:
            values = [row["part_number"]] + [row["fields"][header] for _, header in columns[sheet]]
            literals = ", ".join(sql_literal(value) for value in values)
            seed_lines.append(
                f"INSERT INTO {quote_ident(sheet)} ({column_list}) VALUES ({literals});"
            )
        seed_lines.append("")
    SEED_SQL.write_text("\n".join(seed_lines), encoding="utf-8")


def write_catalog(sheet_names, columns):
    catalog = {
        "tables": [
            {
                "name": sheet,
                "columns": ["Part Number"] + [header for _, header in columns[sheet]],
                "required": REQUIRED,
            }
            for sheet in sheet_names
        ]
    }
    CATALOG.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main():
    records = read_workbook(XLS)
    strings = shared_strings(records)
    sheet_names, cells, max_col, max_row = sheets_and_cells(records, strings)
    columns = {
        name: column_headers(name, cells, max_col, max_row) for name in sheet_names
    }
    for name in sheet_names:
        headers = [header for _, header in columns[name]]
        for required in ("Library Ref", "Footprint Ref"):
            if required not in headers:
                raise SystemExit(f"{name} is missing {required}")
    rows = assign_part_numbers(sheet_names, cells, columns, max_row)
    for row in rows:
        if blank(row["library_ref"]) or blank(row["footprint_ref"]):
            raise SystemExit(f"{row['sheet']} {row['part_number']} is missing a model reference")
    write_sql(sheet_names, columns, rows)
    write_catalog(sheet_names, columns)
    adjusted = [row for row in rows if row["part_number"] != row["base"]]
    print(f"tables {len(sheet_names)} rows {len(rows)} adjusted {len(adjusted)}")
    for row in adjusted:
        print(f"  {row['sheet']}: {row['part_number']}")


if __name__ == "__main__":
    main()
