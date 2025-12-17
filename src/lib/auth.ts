// src/lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  // wichtig für App Router
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
              password: true, // ✅ MUSS selektiert sein, sonst immer 401
              role: true,
              isBlocked: true,
            },
          });

          if (!user) return null;
          if (user.isBlocked) return null;

          // DEV/MVP: Klartext-Vergleich (passt zu deinem /api/auth/register)
          if ((user.password ?? "") !== password) return null;

          // NextAuth User-Objekt
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
      // beim Login user -> token
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

};

// Alias for newer imports (no behavior change)
export const auth = authOptions;
