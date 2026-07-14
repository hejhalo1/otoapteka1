import type { Role } from '../generated/prisma/enums';

// Ładunek access-tokenu (w req.user po walidacji).
export interface JwtUser {
  sub: string; // userId
  email: string;
  role: Role;
  pharmacyId: string | null;
}

// Ładunek refresh-tokenu.
export interface RefreshPayload {
  sub: string;
  jti: string;
  family: string;
}
