// src/lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { isRecord, getStringProp, getErrorMessage } from "@/lib/guards";

// App roles used across the app
type AppRole = "BUYER" | "VENDOR" | "ADMIN";

function isAppRole(v: unknown): v is AppRole {
  return v === "BUYER" || v === "VENDOR" || v === "ADMIN";
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "E-Mail", type: "text" },
        password: { label: "Passwort", type: "password" },
      },
      async authorize(credentials) {
        try {
          const email = credentials?.email?.toLowerCase().trim();
          const password = credentials?.password;

          if (!email || !password) return null;

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

          if (!user) return null;

          // ✅ Blocked users cannot sign in
          if (user.isBlocked) return null;

          // DEV/MVP: Klartext-Vergleich
          if ((user.password ?? "") !== password) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name ?? undefined,
            role: user.role,
          };
        } catch (_e: unknown) {
          console.error("[NEXTAUTH_AUTHORIZE_ERROR]", getErrorMessage(_e));
          return null;
        }
      },
    }),
  ],

  callbacks: {
  async jwt({ token, user }) {
    // If a user becomes invalid/blocked, we keep the token but strip auth fields.
    const invalidate = () => {
      delete (token as { uid?: string }).uid;
      delete (token as { role?: AppRole }).role;
      return token;
    };

    // 1) On sign-in, persist id/role/email from authorize() result.
    if (user && isRecord(user)) {
      const uid = getStringProp(user, "id");
      const email = getStringProp(user, "email");

      // role must be validated into the union
      const rawRole = (user as unknown as { role?: unknown }).role;
      const role = isAppRole(rawRole) ? rawRole : undefined;

      if (uid) token.uid = uid;
      if (role) token.role = role;
      if (email) token.email = email;
    }

    // Mirror `sub` to `uid` for resilience
    if (!token.uid && typeof token.sub === "string") {
      token.uid = token.sub;
    }

    // 2) If we still lack uid but have email, re-hydrate from DB
    if (!token.uid && token.email) {
      const dbUser = await prisma.user.findUnique({
        where: { email: String(token.email) },
        select: { id: true, role: true, isBlocked: true },
      });

      if (!dbUser || dbUser.isBlocked) return invalidate();

      token.uid = dbUser.id;
      if (isAppRole(dbUser.role)) token.role = dbUser.role;

      return token;
    }

    // 3) If uid exists, validate user is not blocked + keep role fresh
    if (token.uid) {
      const dbUser = await prisma.user.findUnique({
        where: { id: String(token.uid) },
        select: { isBlocked: true, role: true },
      });

      if (!dbUser || dbUser.isBlocked) return invalidate();

      if (isAppRole(dbUser.role)) token.role = dbUser.role;
    }

    return token;
  },

  async session({ session, token }) {
    // Mirror sub -> uid if needed
    const uid =
      typeof token.uid === "string"
        ? token.uid
        : typeof token.sub === "string"
          ? token.sub
          : "";

    // With non-optional augmentation, session.user exists.
    // Still keep it defensive in case of partial sessions.
    session.user = session.user ?? { name: null, email: null, image: null, id: "", role: "BUYER" };

    session.user.id = uid || session.user.id || "";
    session.user.role = isAppRole(token.role) ? token.role : (session.user.role ?? "BUYER");

    // Optional: keep email in sync from token if present
    if (typeof token.email === "string") session.user.email = token.email;

    return session;
  },
},


  pages: {
    signIn: "/login",
  },
};

// Alias
export const auth = authOptions;
