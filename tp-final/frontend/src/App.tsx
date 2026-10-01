import { useCallback, useEffect, useMemo, useState } from "react";
import { ComponentRow, ComponentTable, deleteComponent, listComponents, listTypes } from "./api";
import { ComponentForm } from "./ComponentForm";

export function App() {
  const [types, setTypes] = useState<ComponentTable[]>([]);
  const [selected, setSelected] = useState("");
  const [rows, setRows] = useState<ComponentRow[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ComponentRow | null | undefined>(undefined);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const table = types.find((item) => item.name === selected);

  const loadRows = useCallback(async (type: string) => {
    setLoading(true);
    setError(null);
    try {
      setRows(await listComponents(type));
    } catch (caught) {
      setRows([]);
      setError(caught instanceof Error ? caught.message : "No se pudieron cargar los componentes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    listTypes()
      .then((loaded) => {
        setTypes(loaded);
        if (loaded[0]) {
          setSelected(loaded[0].name);
        } else {
          setLoading(false);
        }
      })
      .catch((caught: unknown) => {
        setError(caught instanceof Error ? caught.message : "No se pudo hablar con la API.");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!selected) {
      return;
    }
    setQuery("");
    setEditing(undefined);
    setPendingDelete(null);
    setRows([]);
    void loadRows(selected);
  }, [selected, loadRows]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle || !table) {
      return rows;
    }
    return rows.filter((row) =>
      table.columns.some((column) => (row[column] ?? "").toLowerCase().includes(needle)),
    );
  }, [query, rows, table]);

  const status = !selected
    ? loading
      ? "Cargando…"
      : "Sin tabla"
    : loading
      ? `${selected} · Cargando…`
      : query.trim()
        ? `${selected} · ${visible.length} de ${rows.length}`
        : rows.length === 1
          ? `${selected} · 1 componente`
          : `${selected} · ${rows.length} componentes`;

  function choose(name: string) {
    if (name === selected) {
      return;
    }
    setSelected(name);
    setRows([]);
    setLoading(true);
    setQuery("");
    setEditing(undefined);
    setPendingDelete(null);
  }

  async function confirmDelete(partNumber: string) {
    setError(null);
    try {
      await deleteComponent(selected, partNumber);
      setPendingDelete(null);
      await loadRows(selected);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo borrar.");
    }
  }

  return (
    <div className="app">
      <header className="app-bar">
        <span className="mark" aria-hidden="true" />
        Gestor de componentes
      </header>
      <aside className="types">
        <p className="panel-title">Tablas</p>
        <nav aria-label="Tipos">
          {types.map((item) => (
            <button
              key={item.name}
              type="button"
              className={item.name === selected ? "selected" : undefined}
              aria-current={item.name === selected ? "true" : undefined}
              onClick={() => choose(item.name)}
            >
              {item.name}
            </button>
          ))}
        </nav>
      </aside>
      <main>
        <header className="toolbar">
          <h1>{selected || "Gestor de componentes"}</h1>
          <div className="toolbar-actions">
            <input
              type="search"
              placeholder="Buscar"
              aria-label="Buscar"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button type="button" className="primary" disabled={!table} onClick={() => setEditing(null)}>
              Nuevo componente
            </button>
          </div>
        </header>
        {error ? <p className="banner">{error}</p> : null}
        {pendingDelete ? (
          <p className="confirm">
            ¿Borrar <strong>{pendingDelete}</strong>?
            <button type="button" className="danger" onClick={() => void confirmDelete(pendingDelete)}>
              Borrar
            </button>
            <button type="button" onClick={() => setPendingDelete(null)}>
              Cancelar
            </button>
          </p>
        ) : null}
        {table && !loading && visible.length === 0 ? <p className="empty">No hay componentes para mostrar.</p> : null}
        {table && !loading && visible.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {table.columns.map((column) => (
                    <th key={column} className={column === "Part Number" ? "part" : undefined}>
                      {column}
                    </th>
                  ))}
                  <th className="actions">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => {
                  const partNumber = row["Part Number"] ?? "";
                  return (
                    <tr key={partNumber}>
                      {table.columns.map((column) => (
                        <td key={column} className={column === "Part Number" ? "part" : undefined} title={row[column] ?? ""}>
                          {row[column] ?? ""}
                        </td>
                      ))}
                      <td className="actions">
                        <button type="button" onClick={() => setEditing(row)}>
                          Editar
                        </button>
                        <button type="button" onClick={() => setPendingDelete(partNumber)}>
                          Borrar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </main>
      <footer className="status-bar">{status}</footer>
      {table && editing !== undefined ? (
        <ComponentForm
          table={table}
          initial={editing}
          onCancel={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined);
            void loadRows(selected);
          }}
        />
      ) : null}
    </div>
  );
}
