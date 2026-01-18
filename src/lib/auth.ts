// src/lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export type AppRole = "BUYER" | "VENDOR" | "ADMIN";
function isAppRole(v: unknown): v is AppRole {
  return v === "BUYER" || v === "VENDOR" || v === "ADMIN";
}

export const authOptions: NextAuthOptions = {
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "E-Mail", type: "email" },
        password: { label: "Passwort", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim() ?? "";
        const password = credentials?.password ?? "";

        console.log("[AUTH] attempt", { email, pwLen: password.length });

        if (!email || !password) {
          console.log("[AUTH] ❌ missing email or password");
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
            role: true,
            isBlocked: true,
          },
        });

        if (!user) {
          console.log("[AUTH] ❌ user not found", email);
          return null;
        }

        console.log("[AUTH] found user", {
          id: user.id,
          email: user.email,
          isBlocked: user.isBlocked,
          hasPassword: Boolean(user.password),
          role: user.role,
        });

        if (user.isBlocked) {
          console.log("[AUTH] ❌ user blocked");
          return null;
        }

        if (!user.password) {
          console.log("[AUTH] ❌ user.password is null/empty (no credentials password set)");
          return null;
        }

        const ok = await bcrypt.compare(password, user.password);
        console.log("[AUTH] bcrypt.compare =", ok);

        if (!ok) {
          console.log("[AUTH] ❌ wrong password");
          return null;
        }

        const role = isAppRole(user.role) ? user.role : "BUYER";

        console.log("[AUTH] ✅ success", { id: user.id, role });

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          role,
        } as any;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = (user as any).id;
        token.email = user.email;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = session.user ?? ({} as any);
      (session.user as any).id = token.uid as string;
      (session.user as any).email = token.email as string;
      (session.user as any).role = token.role as any;
      return session;
    },
  },

  pages: { signIn: "/login" },
};
import { getServerSession } from "next-auth";

/**
 * Server helper used by guards/pages: `const session = await auth()`
 */
export async function auth() {
  return getServerSession(authOptions);
}
