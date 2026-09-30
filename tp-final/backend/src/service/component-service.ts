import { Component, ComponentFields, ComponentTable } from "../entity/component";
import { findTable } from "../entity/component-table";
import { ComponentRepository } from "../repository/component-repository";

export class ComponentError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code === "23505";
}

export class ComponentService {
  constructor(
    private readonly tables: ComponentTable[],
    private readonly repository: ComponentRepository,
  ) {}

  listTypes(): ComponentTable[] {
    return this.tables;
  }

  async list(type: string): Promise<Component[]> {
    return this.repository.list(this.table(type));
  }

  async get(type: string, partNumber: string): Promise<Component> {
    const found = await this.repository.find(this.table(type), this.partNumber(partNumber));
    if (!found) {
      throw new ComponentError(404, "El componente no existe.");
    }
    return found;
  }

  async create(type: string, body: unknown): Promise<Component> {
    const table = this.table(type);
    const fields = this.fields(table, body);
    try {
      return await this.repository.insert(table, fields);
    } catch (error) {
      this.rethrow(error);
    }
  }

  async update(type: string, partNumber: string, body: unknown): Promise<Component> {
    const table = this.table(type);
    const fields = this.fields(table, body);
    try {
      const updated = await this.repository.update(table, this.partNumber(partNumber), fields);
      if (!updated) {
        throw new ComponentError(404, "El componente no existe.");
      }
      return updated;
    } catch (error) {
      this.rethrow(error);
    }
  }

  async remove(type: string, partNumber: string): Promise<void> {
    const deleted = await this.repository.delete(this.table(type), this.partNumber(partNumber));
    if (!deleted) {
      throw new ComponentError(404, "El componente no existe.");
    }
  }

  private table(type: string): ComponentTable {
    const table = findTable(this.tables, type);
    if (!table) {
      throw new ComponentError(404, "El tipo no existe.");
    }
    return table;
  }

  private partNumber(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) {
      throw new ComponentError(400, "Falta Part Number.");
    }
    return trimmed;
  }

  private fields(table: ComponentTable, body: unknown): ComponentFields {
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      throw new ComponentError(400, "El cuerpo tiene que ser un objeto.");
    }
    const input = body as Record<string, unknown>;
    for (const key of Object.keys(input)) {
      if (!table.columns.includes(key)) {
        throw new ComponentError(400, `La columna ${key} no existe en ${table.name}.`);
      }
    }
    const fields: ComponentFields = {};
    for (const column of table.columns) {
      fields[column] = this.cell(input[column], column, table.required.includes(column));
    }
    return fields;
  }

  private cell(value: unknown, column: string, required: boolean): string | null {
    if (value === undefined || value === null) {
      if (required) {
        throw new ComponentError(400, `Falta ${column}.`);
      }
      return null;
    }
    if (typeof value !== "string") {
      throw new ComponentError(400, `${column} tiene que ser texto.`);
    }
    const trimmed = value.trim();
    if (!trimmed) {
      if (required) {
        throw new ComponentError(400, `Falta ${column}.`);
      }
      return null;
    }
    return trimmed;
  }

  private rethrow(error: unknown): never {
    if (error instanceof ComponentError) {
      throw error;
    }
    if (isUniqueViolation(error)) {
      throw new ComponentError(409, "Ese Part Number ya existe.");
    }
    throw error;
  }
}
