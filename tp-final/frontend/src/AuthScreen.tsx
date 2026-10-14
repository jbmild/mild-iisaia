import { FormEvent, useEffect, useRef, useState } from "react";
import { login, register } from "./api";

type Props = {
  onLoggedIn: (email: string) => void;
};

export function AuthScreen({ onLoggedIn }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const emailField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailField.current?.focus();
  }, []);

  useEffect(() => {
    setError(null);
  }, [mode]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = email.trim().toLowerCase();
    setBusy(true);
    setError(null);
    try {
      const user = mode === "login" ? await login(trimmed, password) : await register(trimmed, password);
      onLoggedIn(user.email);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo completar la operación.");
      setBusy(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <p className="panel-title">{mode === "login" ? "Iniciar sesión" : "Crear cuenta"}</p>
        <form onSubmit={onSubmit}>
          {error ? <p className="banner">{error}</p> : null}
          <div className="fields">
            <label htmlFor="auth-email">
              <span>
                Correo<abbr title="obligatorio"> *</abbr>
              </span>
              <input
                id="auth-email"
                ref={emailField}
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
              />
            </label>
            <label htmlFor="auth-password">
              <span>
                Contraseña<abbr title="obligatorio"> *</abbr>
              </span>
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={mode === "register" ? 8 : undefined}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </label>
          </div>
          <div className="form-actions">
            <button type="submit" className="primary" disabled={busy}>
              {busy ? "Un momento…" : mode === "login" ? "Entrar" : "Crear cuenta"}
            </button>
          </div>
          <p className="auth-switch">
            {mode === "login" ? "¿No tenés cuenta?" : "¿Ya tenés cuenta?"}
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              disabled={busy}
            >
              {mode === "login" ? "Crear una" : "Iniciar sesión"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
