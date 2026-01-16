// src/lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { isRecord, getStringProp } from "@/lib/guards";

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
        } catch (_e) {
          console.error("[NEXTAUTH_AUTHORIZE_ERROR]", _e);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      const invalidate = () => ({}) as typeof token;

      // ✅ 1) Beim Login übernehmen
      if (user && isRecord(user)) {
        const uid = getStringProp(user, "id");
        const role = getStringProp(user, "role");
        const email = getStringProp(user, "email");
        if (uid) token.uid = uid;
        if (role) token.role = role;
        if (email) token.email = email;
      }

      // ✅ 2) uid/role nachziehen wenn nötig
      if (!token.uid && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: String(token.email) },
          select: { id: true, role: true, isBlocked: true },
        });

        if (!dbUser) return invalidate();
        if (dbUser.isBlocked) return invalidate();

        token.uid = dbUser.id;
        token.role = dbUser.role;
        return token;
      }

      // ✅ 3) wenn uid vorhanden → block-status prüfen
      if (token.uid) {
        const dbUser = await prisma.user.findUnique({
          where: { id: String(token.uid) },
          select: { isBlocked: true, role: true },
        });

        if (!dbUser) return invalidate();
        if (dbUser.isBlocked) return invalidate();

        token.role = dbUser.role;
      }

      return token;
    },

    async session({ session, token }) {
      // ✅ Wenn Token invalidiert wurde -> keine Session
      if (!token?.uid) return null;

      session.user.id = token.uid;
      session.user.role = token.role ?? session.user.role;

      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
};

// Alias
export const auth = authOptions;
