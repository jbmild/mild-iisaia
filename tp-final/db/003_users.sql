-- Usuarios y sesiones del gestor. Nada de esto lo lee Altium:
-- el DbLib solo habilita las tablas de componentes del schema public.
-- La contraseña nunca se guarda: se guarda su hash scrypt.

CREATE TABLE app.users (
    email text PRIMARY KEY,
    password_hash text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app.sessions (
    token text PRIMARY KEY,
    email text NOT NULL REFERENCES app.users (email) ON DELETE CASCADE,
    expires_at timestamptz NOT NULL
);

CREATE INDEX app_sessions_expires_at_idx ON app.sessions (expires_at);
