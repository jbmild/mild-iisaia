import { Router } from "express";
import { AuthController, handleError } from "../controller/auth-controller";

function wrap(action: (req: Parameters<AuthController["register"]>[0], res: Parameters<AuthController["register"]>[1]) => Promise<void>) {
  return (req: Parameters<typeof action>[0], res: Parameters<typeof action>[1]): void => {
    action(req, res).catch((error: unknown) => handleError(error, res));
  };
}

export function authRouter(controller: AuthController): Router {
  const router = Router();
  router.post("/auth/register", wrap(controller.register));
  router.post("/auth/login", wrap(controller.login));
  router.post("/auth/logout", wrap(controller.logout));
  router.get("/auth/me", wrap(controller.me));
  return router;
}
