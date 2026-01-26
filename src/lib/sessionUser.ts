export type SessionUser = {
  id: string;
  email?: string | null;
  role?: "BUYER" | "VENDOR" | "ADMIN";
};

export function requireUser(u: unknown): SessionUser {
  if (!u || typeof u !== "object") throw new Error("Not authenticated");
  const obj = u as Record<string, unknown>;
  const id = typeof obj.id === "string" ? obj.id : "";
  if (!id) throw new Error("Not authenticated");

  const role =
    obj.role === "BUYER" || obj.role === "VENDOR" || obj.role === "ADMIN"
      ? (obj.role as SessionUser["role"])
      : undefined;

  const email = typeof obj.email === "string" ? obj.email : undefined;

  return { id, email, role };
}
