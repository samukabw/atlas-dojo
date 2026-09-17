import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { loginSchema } from "@/lib/validators";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, senha: {} },
      authorize: async (creds) => {
        const parsed = loginSchema.safeParse(creds);
        if (!parsed.success) return null;
        const { email, senha } = parsed.data;
        const [u] = await db.select().from(users).where(eq(users.email, email));
        if (!u) return null;
        if (!(await bcrypt.compare(senha, u.senhaHash))) return null;
        return { id: String(u.id), name: u.nome, email: u.email, perfil: u.perfil };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = (user as { id: string }).id;
        token.perfil = (user as { perfil: string }).perfil;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as unknown as { id: number }).id = Number(token.id);
        (session.user as { perfil?: string }).perfil = token.perfil as string;
      }
      return session;
    },
  },
});
