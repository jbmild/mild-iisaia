export type ComponentTable = {
  name: string;
  columns: string[];
  required: string[];
};

export type ComponentRow = Record<string, string | null>;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
  });
  if (response.status === 204) {
    return undefined as T;
  }
  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  if (!response.ok) {
    throw new Error(payload?.error ?? "No se pudo completar la operación.");
  }
  return payload as T;
}

function componentPath(type: string, partNumber: string): string {
  return `/api/components/${encodeURIComponent(type)}/${encodeURIComponent(partNumber)}`;
}

export function listTypes(): Promise<ComponentTable[]> {
  return request("/api/component-types");
}

export function listComponents(type: string): Promise<ComponentRow[]> {
  return request(`/api/components/${encodeURIComponent(type)}`);
}

export function createComponent(type: string, row: ComponentRow): Promise<ComponentRow> {
  return request(`/api/components/${encodeURIComponent(type)}`, {
    method: "POST",
    body: JSON.stringify(row),
  });
}

export function updateComponent(type: string, partNumber: string, row: ComponentRow): Promise<ComponentRow> {
  return request(componentPath(type, partNumber), {
    method: "PUT",
    body: JSON.stringify(row),
  });
}

export function deleteComponent(type: string, partNumber: string): Promise<void> {
  return request(componentPath(type, partNumber), { method: "DELETE" });
}
