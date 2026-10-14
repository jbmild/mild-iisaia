import { Request, Response } from "express";
import { AuthError, AuthService } from "../service/auth-service";
import { clearSessionCookie, sessionTokenFrom, setSessionCookie } from "../session";

export class AuthController {
  constructor(private readonly service: AuthService) {}

  register = async (req: Request, res: Response): Promise<void> => {
    const user = await this.service.register(req.body);
    res.status(201).json({ email: user.email });
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const session = await this.service.login(req.body);
    setSessionCookie(res, session.token, session.expiresAt);
    res.json({ email: session.email });
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    await this.service.logout(sessionTokenFrom(req));
    clearSessionCookie(res);
    res.status(204).end();
  };

  me = async (req: Request, res: Response): Promise<void> => {
    const email = await this.service.emailFor(sessionTokenFrom(req));
    if (!email) {
      throw new AuthError(401, "Hay que iniciar sesión.");
    }
    res.json({ email });
  };
}

export function handleError(error: unknown, res: Response): void {
  if (error instanceof AuthError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  console.error(error);
  res.status(500).json({ error: "No se pudo completar la operación." });
}
