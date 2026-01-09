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
      try {
        // 1) Beim Login übernehmen
        if (user) {
          (token as any).uid = (user as any).id;
          (token as any).role = (user as any).role;
          token.email = (user as any).email ?? token.email;
          (token as any).invalid = false;
          (token as any).dbError = false;
          return token;
        }

        // 2) Wenn wir keine uid haben, versuchen wir sie nachzuziehen
        if (!(token as any).uid && token.email) {
          const dbUser = await prisma.user.findUnique({
            where: { email: String(token.email) },
            select: { id: true, role: true, isBlocked: true },
          });

          if (!dbUser || dbUser.isBlocked) {
            (token as any).invalid = true;
            return token;
          }

          (token as any).uid = dbUser.id;
          (token as any).role = dbUser.role;
          (token as any).invalid = false;
          (token as any).dbError = false;
          return token;
        }

        // 3) Wenn uid vorhanden -> block-status prüfen
        if ((token as any).uid) {
          const dbUser = await prisma.user.findUnique({
            where: { id: String((token as any).uid) },
            select: { isBlocked: true, role: true },
          });

          if (!dbUser || dbUser.isBlocked) {
            (token as any).invalid = true;
            return token;
          }

          // keep role fresh
          (token as any).role = dbUser.role;
          (token as any).invalid = false;
          (token as any).dbError = false;
        }

        return token;
      } catch (e) {
        // ✅ Prisma/DB Problem -> Token nicht zerstören, nur markieren
        console.error("[NEXTAUTH_JWT_DB_ERROR]", e);
        (token as any).dbError = true;
        return token;
      }
    },

    async session({ session, token }) {
      // ✅ niemals "null" zurückgeben
      const invalid = (token as any)?.invalid === true;
      const dbError = (token as any)?.dbError === true;

      if (!session) return { user: null } as any;

      // ✅ wenn Token ungültig ODER DB hängt: saubere "leere" Session zurückgeben
      if (invalid || dbError || !(token as any)?.uid) {
        return { ...session, user: null } as any;
      }

      // user anreichern
      const u = (session.user ?? {}) as any;
      u.id = (token as any).uid || "";
      u.role = (token as any).role;

      return { ...session, user: u } as any;
    },
  },

  pages: {
    signIn: "/login",
  },
};

// Alias
// Export `auth` with optional host-trust configuration for dev LAN/IP usage.
export const auth = {
  ...authOptions,
  // ✅ Allows LAN/IP/preview hosts in dev (prevents client_fetch_error for /api/auth/session)
  // For next-auth/Auth.js setups that support it.
  trustHost: true,
};
