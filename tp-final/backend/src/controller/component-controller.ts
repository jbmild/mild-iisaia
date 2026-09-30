import { Request, Response } from "express";
import { ComponentError, ComponentService } from "../service/component-service";

function partNumberFrom(req: Request): string {
  const marker = `/api/components/${req.params.type}/`;
  const pathOnly = req.originalUrl.split("?")[0];
  const index = pathOnly.indexOf(marker);
  if (index < 0) {
    return "";
  }
  try {
    return decodeURIComponent(pathOnly.slice(index + marker.length));
  } catch {
    return "";
  }
}

export class ComponentController {
  constructor(private readonly service: ComponentService) {}

  listTypes = async (_req: Request, res: Response): Promise<void> => {
    res.json(this.service.listTypes());
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const components = await this.service.list(req.params.type);
    res.json(components.map((component) => component.fields));
  };

  getOne = async (req: Request, res: Response): Promise<void> => {
    const component = await this.service.get(req.params.type, partNumberFrom(req));
    res.json(component.fields);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const component = await this.service.create(req.params.type, req.body);
    res.status(201).json(component.fields);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const component = await this.service.update(req.params.type, partNumberFrom(req), req.body);
    res.json(component.fields);
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    await this.service.remove(req.params.type, partNumberFrom(req));
    res.status(204).end();
  };
}

export function handleError(error: unknown, res: Response): void {
  if (error instanceof ComponentError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  console.error(error);
  res.status(500).json({ error: "No se pudo completar la operación." });
}
