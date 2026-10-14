export type User = {
  email: string;
  passwordHash: string;
};

export type Session = {
  token: string;
  email: string;
  expiresAt: Date;
};
