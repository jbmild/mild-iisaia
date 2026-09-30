import { Pool, QueryResult } from "pg";
import { Component, ComponentFields, ComponentTable } from "../entity/component";

function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

function toComponent(table: ComponentTable, row: Record<string, string | null>): Component {
  const fields: ComponentFields = {};
  for (const column of table.columns) {
    fields[column] = row[column] ?? null;
  }
  return {
    table: table.name,
    partNumber: fields["Part Number"] ?? "",
    fields,
  };
}

export class ComponentRepository {
  constructor(private readonly pool: Pool) {}

  async list(table: ComponentTable): Promise<Component[]> {
    const sql = `SELECT ${this.columnList(table)} FROM ${quoteIdent(table.name)} ORDER BY ${quoteIdent("Part Number")}`;
    const result = await this.pool.query(sql);
    return result.rows.map((row) => toComponent(table, row));
  }

  async find(table: ComponentTable, partNumber: string): Promise<Component | null> {
    const sql = `SELECT ${this.columnList(table)} FROM ${quoteIdent(table.name)} WHERE ${quoteIdent("Part Number")} = $1`;
    const result = await this.pool.query(sql, [partNumber]);
    return result.rowCount ? toComponent(table, result.rows[0]) : null;
  }

  async insert(table: ComponentTable, fields: ComponentFields): Promise<Component> {
    const columns = table.columns.map(quoteIdent).join(", ");
    const placeholders = table.columns.map((_, index) => `$${index + 1}`).join(", ");
    const values = table.columns.map((column) => fields[column] ?? null);
    const sql = `INSERT INTO ${quoteIdent(table.name)} (${columns}) VALUES (${placeholders}) RETURNING ${this.columnList(table)}`;
    const result = await this.pool.query(sql, values);
    return toComponent(table, result.rows[0]);
  }

  async update(
    table: ComponentTable,
    currentPartNumber: string,
    fields: ComponentFields,
  ): Promise<Component | null> {
    const assignments = table.columns.map((column, index) => `${quoteIdent(column)} = $${index + 1}`);
    const values = table.columns.map((column) => fields[column] ?? null);
    values.push(currentPartNumber);
    const sql = `UPDATE ${quoteIdent(table.name)} SET ${assignments.join(", ")} WHERE ${quoteIdent("Part Number")} = $${
      values.length
    } RETURNING ${this.columnList(table)}`;
    const result = await this.pool.query(sql, values);
    return result.rowCount ? toComponent(table, result.rows[0]) : null;
  }

  async delete(table: ComponentTable, partNumber: string): Promise<boolean> {
    const result: QueryResult = await this.pool.query(
      `DELETE FROM ${quoteIdent(table.name)} WHERE ${quoteIdent("Part Number")} = $1`,
      [partNumber],
    );
    return (result.rowCount ?? 0) > 0;
  }

  private columnList(table: ComponentTable): string {
    return table.columns.map(quoteIdent).join(", ");
  }
}
