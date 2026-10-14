import { NextFunction, Request, Response } from "express";
import { AuthService } from "./service/auth-service";

export const SESSION_COOKIE = "session";

export function sessionTokenFrom(req: Request): string {
  const header = req.header("Cookie");
  if (!header) {
    return "";
  }
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    const name = part.slice(0, separator).trim();
    if (separator >= 0 && name === SESSION_COOKIE) {
      return part.slice(separator + 1).trim();
    }
  }
  return "";
}

export function setSessionCookie(res: Response, token: string, expiresAt: Date): void {
  const maxAge = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge}; Expires=${expiresAt.toUTCString()}`,
  );
}

export function clearSessionCookie(res: Response): void {
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`);
}

export function requireSession(service: AuthService) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const email = await service.emailFor(sessionTokenFrom(req));
      if (!email) {
        res.status(401).json({ error: "Hay que iniciar sesión." });
        return;
      }
      next();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "No se pudo completar la operación." });
    }
  };
}
