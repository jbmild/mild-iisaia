import { Router } from "express";
import { ComponentController, handleError } from "../controller/component-controller";

function wrap(action: (req: Parameters<ComponentController["list"]>[0], res: Parameters<ComponentController["list"]>[1]) => Promise<void>) {
  return (req: Parameters<typeof action>[0], res: Parameters<typeof action>[1]): void => {
    action(req, res).catch((error: unknown) => handleError(error, res));
  };
}

export function componentRouter(controller: ComponentController): Router {
  const router = Router();
  router.get("/component-types", wrap(controller.listTypes));
  router.get("/components/:type", wrap(controller.list));
  router.post("/components/:type", wrap(controller.create));
  router.get("/components/:type/*", wrap(controller.getOne));
  router.put("/components/:type/*", wrap(controller.update));
  router.delete("/components/:type/*", wrap(controller.remove));
  return router;
}
