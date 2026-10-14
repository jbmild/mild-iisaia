import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { Session, User } from "../entity/user";
import { UserRepository } from "../repository/user-repository";

const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 };
const KEY_LENGTH = 64;
const SALT_BYTES = 16;
const SESSION_DAYS = 7;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class AuthError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code === "23505";
}

function scryptKey(password: string, salt: Buffer, params: { N: number; r: number; p: number }): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, params, (error, key) => (error ? reject(error) : resolve(key)));
  });
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const key = await scryptKey(password, salt, SCRYPT_PARAMS);
  return ["scrypt", SCRYPT_PARAMS.N, SCRYPT_PARAMS.r, SCRYPT_PARAMS.p, salt.toString("hex"), key.toString("hex")].join(
    ":",
  );
}

async function passwordMatches(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(":");
  if (parts.length !== 6 || parts[0] !== "scrypt") {
    return false;
  }
  const params = { N: Number(parts[1]), r: Number(parts[2]), p: Number(parts[3]) };
  const salt = Buffer.from(parts[4], "hex");
  const expected = Buffer.from(parts[5], "hex");
  const actual = await scryptKey(password, salt, params);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function sessionExpiry(): Date {
  return new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
}

let dummyHash: string | null = null;

export class AuthService {
  constructor(private readonly repository: UserRepository) {}

  async register(body: unknown): Promise<User> {
    const credentials = this.credentials(body);
    const user: User = { email: credentials.email, passwordHash: await hashPassword(credentials.password) };
    try {
      await this.repository.insertUser(user);
      return user;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new AuthError(409, "Ese correo ya está registrado.");
      }
      throw error;
    }
  }

  async login(body: unknown): Promise<Session> {
    const credentials = this.credentials(body);
    const user = await this.repository.findUser(credentials.email);
    if (!user) {
      dummyHash ??= await hashPassword(credentials.password);
      await passwordMatches(credentials.password, dummyHash);
      throw new AuthError(401, "Correo o contraseña incorrectos.");
    }
    if (!(await passwordMatches(credentials.password, user.passwordHash))) {
      throw new AuthError(401, "Correo o contraseña incorrectos.");
    }
    const session: Session = {
      token: randomBytes(32).toString("hex"),
      email: user.email,
      expiresAt: sessionExpiry(),
    };
    await this.repository.insertSession(session);
    return session;
  }

  async logout(token: string): Promise<void> {
    await this.repository.deleteSession(token);
  }

  async emailFor(token: string): Promise<string | null> {
    const session = await this.repository.findSession(token);
    return session?.email ?? null;
  }

  private credentials(body: unknown): { email: string; password: string } {
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      throw new AuthError(400, "El cuerpo tiene que ser un objeto.");
    }
    const input = body as Record<string, unknown>;
    if (typeof input.email !== "string" || typeof input.password !== "string") {
      throw new AuthError(400, "Falta el correo o la contraseña.");
    }
    const email = input.email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(email)) {
      throw new AuthError(400, "El correo no es válido.");
    }
    if (input.password.length < MIN_PASSWORD_LENGTH || input.password.length > MAX_PASSWORD_LENGTH) {
      throw new AuthError(400, `La contraseña tiene que tener entre ${MIN_PASSWORD_LENGTH} y ${MAX_PASSWORD_LENGTH} caracteres.`);
    }
    return { email, password: input.password };
  }
}
