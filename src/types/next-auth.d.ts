import type { DefaultSession, DefaultUser } from "next-auth";
import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: DefaultSession["user"] & {
      id: string;
      role?: Role | string | null;
      isBlocked?: boolean;
      sessionVersion?: number;
    };
  }

  interface User extends DefaultUser {
    id: string;
    role?: Role | string | null;
    isBlocked?: boolean;
    sessionVersion?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    role?: Role | string | null;
    isBlocked?: boolean;
    sessionVersion?: number;
  }
}

export {};
