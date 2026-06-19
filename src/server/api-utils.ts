import { NextResponse } from "next/server";

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode = 500
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function jsonError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode });
  }

  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export function requireString(value: unknown, field: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ApiError(`${field} is required`, 400);
  }

  return value.trim();
}

export function optionalString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

export function clampNumber(value: unknown, field: string, min: number, max: number) {
  const numberValue = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numberValue)) {
    throw new ApiError(`${field} must be a number`, 400);
  }

  return Math.min(Math.max(numberValue, min), max);
}

export function parseLevel(value: unknown) {
  const level = Number(value);

  if (level !== 1 && level !== 2 && level !== 3) {
    throw new ApiError("level must be 1, 2, or 3", 400);
  }

  return level;
}

export function getQuery(request: Request) {
  return new URL(request.url).searchParams;
}

export async function readJson<T extends Record<string, unknown>>(request: Request): Promise<T> {
  return (await request.json().catch(() => ({}))) as T;
}

export function publicUser<T extends { passwordHash?: string }>(user: T) {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}
