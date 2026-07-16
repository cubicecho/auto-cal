import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
);

// Issue a magic link token (short-lived, 15 minutes)
export async function signMagicToken(email: string): Promise<string> {
  return new SignJWT({ email })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('15m')
    .setIssuedAt()
    .sign(JWT_SECRET);
}

// Issue a session token (long-lived, 30 days)
export async function signSessionToken(
  userId: string,
  email: string,
): Promise<string> {
  return new SignJWT({ sub: userId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .setIssuedAt()
    .sign(JWT_SECRET);
}

// Verify any token and return payload
export async function verifyToken(
  token: string,
): Promise<{ sub?: string; email?: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { sub?: string; email?: string };
  } catch {
    return null;
  }
}
