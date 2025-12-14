import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "../../../../../lib/prisma";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const authOptions = {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user?.password) return null;

        const ok = await bcrypt.compare(credentials.password, user.password);
        if (!ok) return null;

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
        if (typeof user.id === "string") token.id = user.id;
        if (user.role === "BUYER" || user.role === "VENDOR" || user.role === "ADMIN") {
          token.role = user.role;
        }
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user && token) {
        // @ts-ignore
        if (typeof token.id === "string") session.user.id = token.id;
        // @ts-ignore
        if (typeof token.role === "string") session.user.role = token.role;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
