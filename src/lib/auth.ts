// src/lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";

function formatAuthError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

// ✅ Einmalig exportieren
export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase()?.trim();
        const password = credentials?.password ?? "";

        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true, email: true, password: true, role: true, name: true, isBlocked: true, sessionVersion: true },
        });

        // If no user found, don't reveal details — return null for auth failure
        if (!user) return null;

        // Reject blocked users silently (no detailed error to caller)
        if (user.isBlocked === true) return null;

        if (!user.password) return null;

        const ok = await compare(password, user.password);
        if (!ok) return null;

        return { id: user.id, email: user.email, name: user.name ?? null, role: user.role, isBlocked: user.isBlocked, sessionVersion: user.sessionVersion };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // bei Login kommt `user` rein
      if (user) {
        token.uid = (user as any).id;
        token.role = (user as any).role;
        token.isBlocked = (user as any).isBlocked;
        token.sessionVersion = (user as any).sessionVersion ?? 0;
      }
      // On subsequent requests, validate token still valid against current sessionVersion
      if (!user && (token as any).uid) {
        try {
          const dbUser = await prisma.user.findUnique({ where: { id: (token as any).uid }, select: { sessionVersion: true } });
          if (dbUser && typeof dbUser.sessionVersion === "number" && dbUser.sessionVersion !== (token as any).sessionVersion) {
            // invalidate token by clearing sensitive claims when sessionVersion no longer matches
            return { ...token, uid: undefined, role: undefined, isBlocked: undefined, sessionVersion: undefined } as any;
          }
        } catch (error: unknown) {
          // Keep auth available on transient lookup failures, but log a compact diagnostic.
          console.warn("jwt sessionVersion check failed:", formatAuthError(error));
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = (token as any).uid;
        (session.user as any).role = (token as any).role;
        (session.user as any).isBlocked = (token as any).isBlocked;
        (session.user as any).sessionVersion = (token as any).sessionVersion;
      }
      return session;
    },
  },
};

// ✅ Backwards-compatible export (nur 1x!)
export const auth = authOptions;
