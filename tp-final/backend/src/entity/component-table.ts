import fs from "fs";
import { ComponentTable } from "./component";

type CatalogFile = {
  tables: ComponentTable[];
};

export function loadCatalog(filePath: string): ComponentTable[] {
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8")) as CatalogFile;
  if (!Array.isArray(parsed.tables) || parsed.tables.length === 0) {
    throw new Error("El catálogo de tablas está vacío.");
  }
  for (const table of parsed.tables) {
    if (!table.name || !Array.isArray(table.columns) || !table.columns.includes("Part Number")) {
      throw new Error("El catálogo tiene una tabla sin Part Number.");
    }
  }
  return parsed.tables;
}

export function findTable(tables: ComponentTable[], name: string): ComponentTable | undefined {
  return tables.find((table) => table.name === name);
}
