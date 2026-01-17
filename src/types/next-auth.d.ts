import "next-auth";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "BUYER" | "VENDOR" | "ADMIN";
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: "BUYER" | "VENDOR" | "ADMIN";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    role?: "BUYER" | "VENDOR" | "ADMIN";
  }
}
