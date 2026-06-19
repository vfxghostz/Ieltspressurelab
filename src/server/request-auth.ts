import { ApiError } from "@/src/server/api-utils";
import { verifyToken } from "@/src/server/auth";
import { getBackendStore } from "@/src/server/session-store";
import type { BackendUser } from "@/src/types/backend";

export async function requireUser(request: Request): Promise<BackendUser> {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!token) {
    throw new ApiError("No token provided", 401);
  }

  const userId = verifyToken(token);
  const store = await getBackendStore();
  const user = store.users[userId];

  if (!user) {
    throw new ApiError("User not found", 401);
  }

  return user;
}
