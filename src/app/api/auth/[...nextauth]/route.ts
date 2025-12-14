import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "../../../../../lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const { handlers } = NextAuth({
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

        // bcrypt login (prod-safe)
        const ok = await bcrypt.compare(credentials.password, user.password);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? null,
          role: user.role,
        } as any;
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session?.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
});

// ✅ v5 exports:
export const GET = handlers.GET;
export const POST = handlers.POST;
