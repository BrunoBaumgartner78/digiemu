// src/lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

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
          } as any;
        } catch (e) {
          console.error("[NEXTAUTH_AUTHORIZE_ERROR]", e);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // ✅ 1) Beim Login übernehmen
      if (user) {
        token.uid = (user as any).id;
        token.role = (user as any).role;
        token.email = (user as any).email ?? token.email;
      }

      // ✅ 2) uid/role nachziehen wenn nötig
      if (!token.uid && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: String(token.email) },
          select: { id: true, role: true, isBlocked: true },
        });

        if (!dbUser) {
          // user deleted -> invalidate
          return {} as any;
        }
        if (dbUser.isBlocked) {
          // ✅ invalidate token if blocked later
          return {} as any;
        }

        token.uid = dbUser.id;
        token.role = dbUser.role;
        return token;
      }

      // ✅ 3) WICHTIG: wenn uid vorhanden → block-status prüfen
      if (token.uid) {
        const dbUser = await prisma.user.findUnique({
          where: { id: String(token.uid) },
          select: { isBlocked: true, role: true },
        });

        if (!dbUser) return {} as any;
        if (dbUser.isBlocked) return {} as any;

        // keep role fresh
        token.role = dbUser.role;
      }

      return token;
    },

    async session({ session, token }) {
      // ✅ Wenn Token invalidiert wurde -> keine Session
      if (!(token as any)?.uid) {
        return null as any;
      }

      if (session.user) {
        (session.user as any).id = (token as any).uid || "";
        (session.user as any).role = (token as any).role;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
};

// Alias
export const auth = authOptions;
