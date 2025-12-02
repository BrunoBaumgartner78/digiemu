
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "../../../../../lib/prisma";
// bcrypt kann für DEV vorübergehend deaktiviert werden (Klartext-Login)
// import bcrypt from "bcryptjs";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";

export const authOptions = {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // 🔐 DEV-Login (Klartext) – nutzt die "password"-Spalte aus dem Prisma-Model
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          return null;
        }

        // Nur für lokale Entwicklung – später wieder auf bcrypt.compare umstellen!
        if (credentials.password !== user.password) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name ?? null,
        };
      },
    }),

  ],
  session: { strategy: "jwt" as const },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: { id?: string; role?: string } }) {
      if (user) {
        if (typeof user.id === "string") {
          token.id = user.id;
        }
        // Rolle sicher auf gültige Literal-Typen einschränken
        if (
          user.role === "BUYER" ||
          user.role === "VENDOR" ||
          user.role === "ADMIN"
        ) {
          token.role = user.role;
        }
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user && token) {
        if (typeof token.id === "string") {
          session.user.id = token.id;
        }
        if (typeof token.role === "string") {
          session.user.role = token.role;
        }
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
