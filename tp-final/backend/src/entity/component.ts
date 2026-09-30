export type ComponentFields = Record<string, string | null>;

export type Component = {
  table: string;
  partNumber: string;
  fields: ComponentFields;
};

export type ComponentTable = {
  name: string;
  columns: string[];
  required: string[];
};
