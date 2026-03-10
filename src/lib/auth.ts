import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import type { Role } from "@/types";

export interface JWTPayload {
  sub: string;
  email: string;
  role: Role;
  name: string;
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: "8h",
  });
}

export async function getCurrentUser(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies(); // ✅ await is required in Next.js 15
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return null;
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    return decoded as JWTPayload;
  } catch {
    return null;
  }
}

export function requireRole(user: JWTPayload | null, roles: Role[]) {
  if (!user) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!roles.includes(user.role)) {
    return Response.json({ message: "Forbidden" }, { status: 403 });
  }
  return null;
}
