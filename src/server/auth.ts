import { createHmac, pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";
import { ApiError } from "@/src/server/api-utils";

const tokenSecret = process.env.JWT_SECRET ?? "dev-secret-change-me-minimum-32-chars";
const tokenExpiresMs = 7 * 24 * 60 * 60 * 1000;

function base64Url(input: string | Buffer) {
  return Buffer.from(input).toString("base64url");
}

function sign(input: string) {
  return createHmac("sha256", tokenSecret).update(input).digest("base64url");
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const hash = pbkdf2Sync(password, salt, 120_000, 32, "sha256").toString("base64url");
  return `pbkdf2$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [algorithm, salt, hash] = storedHash.split("$");

  if (algorithm !== "pbkdf2" || !salt || !hash) {
    return false;
  }

  const candidate = pbkdf2Sync(password, salt, 120_000, 32, "sha256").toString("base64url");
  return timingSafeEqual(Buffer.from(hash), Buffer.from(candidate));
}

export function createToken(userId: string) {
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64Url(
    JSON.stringify({
      userId,
      exp: Date.now() + tokenExpiresMs
    })
  );
  const signature = sign(`${header}.${payload}`);
  return `${header}.${payload}.${signature}`;
}

export function verifyToken(token: string) {
  const [header, payload, signature] = token.split(".");

  if (!header || !payload || !signature || signature !== sign(`${header}.${payload}`)) {
    throw new ApiError("Invalid token", 401);
  }

  const decoded = JSON.parse(Buffer.from(payload, "base64url").toString()) as {
    userId?: string;
    exp?: number;
  };

  if (!decoded.userId || !decoded.exp || decoded.exp < Date.now()) {
    throw new ApiError("Invalid token", 401);
  }

  return decoded.userId;
}
