// src/types/next-auth.d.ts
import type { DefaultSession, DefaultUser } from "next-auth";
import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: DefaultSession["user"] & {
      id: string;
      role: Role;
    };
  }

  interface User extends DefaultUser {
    id: string;
    role: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    role?: Role;
  }
}
