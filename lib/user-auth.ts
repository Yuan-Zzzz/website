import { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

export interface UserPayload {
  userId: string;
  githubId: string;
  role: "user";
}

export async function getUserFromRequest(
  request: NextRequest
): Promise<UserPayload | null> {
  const token = request.cookies.get("user-token")?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload || payload.role !== "user" || typeof payload.userId !== "string") {
    return null;
  }

  return {
    userId: payload.userId,
    githubId: String(payload.githubId),
    role: "user",
  };
}

export async function isAdminRequest(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get("admin-token")?.value;
  if (!token) return false;

  const payload = await verifyToken(token);
  return !!payload && payload.role === "admin";
}
