import { FormEvent, useEffect, useRef, useState } from "react";
import { ComponentRow, ComponentTable, createComponent, updateComponent } from "./api";

type Props = {
  table: ComponentTable;
  initial: ComponentRow | null;
  onCancel: () => void;
  onSaved: () => void;
};

function isWide(column: string): boolean {
  return column === "Description" || column === "Notes" || column === "Features" || column.endsWith("Path");
}

export function ComponentForm({ table, initial, onCancel, onSaved }: Props) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const next: Record<string, string> = {};
    for (const column of table.columns) {
      next[column] = initial?.[column] ?? "";
    }
    return next;
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const firstField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstField.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCancel();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const row: ComponentRow = {};
    for (const column of table.columns) {
      const trimmed = values[column].trim();
      row[column] = trimmed === "" ? null : trimmed;
    }
    setSaving(true);
    setError(null);
    try {
      if (initial) {
        await updateComponent(table.name, initial["Part Number"] ?? "", row);
      } else {
        await createComponent(table.name, row);
      }
      onSaved();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo guardar.");
      setSaving(false);
    }
  }

  return (
    <div className="backdrop" onMouseDown={onCancel}>
      <form
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="form-title"
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={onSubmit}
      >
        <h2 id="form-title" className="panel-title">
          {initial ? "Editar componente" : "Nuevo componente"}
        </h2>
        <p className="hint">{table.name}. Los nombres son los que lee Altium.</p>
        {error ? <p className="banner">{error}</p> : null}
        <div className="fields">
          {table.columns.map((column, index) => {
            const required = table.required.includes(column);
            const wide = isWide(column);
            const id = `field-${index}`;
            return (
              <label key={column} className={wide ? "wide" : undefined} htmlFor={id}>
                <span>
                  {column}
                  {required ? <abbr title="obligatorio"> *</abbr> : null}
                </span>
                {column === "Description" || column === "Notes" ? (
                  <textarea
                    id={id}
                    value={values[column]}
                    onChange={(event) => {
                      const next = event.target.value;
                      setValues((current) => ({ ...current, [column]: next }));
                    }}
                    required={required}
                  />
                ) : (
                  <input
                    id={id}
                    ref={index === 0 ? firstField : undefined}
                    value={values[column]}
                    onChange={(event) => {
                      const next = event.target.value;
                      setValues((current) => ({ ...current, [column]: next }));
                    }}
                    required={required}
                  />
                )}
              </label>
            );
          })}
        </div>
        <div className="form-actions">
          <button type="button" onClick={onCancel} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" className="primary" disabled={saving}>
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}
