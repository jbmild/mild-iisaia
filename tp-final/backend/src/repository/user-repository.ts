import { Pool } from "pg";
import { Session, User } from "../entity/user";

export class UserRepository {
  constructor(private readonly pool: Pool) {}

  async insertUser(user: User): Promise<void> {
    await this.pool.query("INSERT INTO app.users (email, password_hash) VALUES ($1, $2)", [
      user.email,
      user.passwordHash,
    ]);
  }

  async findUser(email: string): Promise<User | null> {
    const result = await this.pool.query("SELECT email, password_hash FROM app.users WHERE email = $1", [
      email,
    ]);
    return result.rowCount
      ? { email: result.rows[0].email, passwordHash: result.rows[0].password_hash }
      : null;
  }

  async insertSession(session: Session): Promise<void> {
    await this.pool.query(
      "INSERT INTO app.sessions (token, email, expires_at) VALUES ($1, $2, $3)",
      [session.token, session.email, session.expiresAt],
    );
  }

  async findSession(token: string): Promise<Session | null> {
    const result = await this.pool.query(
      "SELECT token, email, expires_at FROM app.sessions WHERE token = $1 AND expires_at > now()",
      [token],
    );
    return result.rowCount
      ? {
          token: result.rows[0].token,
          email: result.rows[0].email,
          expiresAt: new Date(result.rows[0].expires_at),
        }
      : null;
  }

  async deleteSession(token: string): Promise<void> {
    await this.pool.query("DELETE FROM app.sessions WHERE token = $1", [token]);
  }
}
