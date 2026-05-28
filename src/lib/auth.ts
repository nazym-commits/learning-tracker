import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { getDb } from './db';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',   type: 'email'    },
        password: { label: 'Пароль', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const sql = getDb();
        const rows = await sql`
          SELECT id, email, name, password_hash
          FROM users
          WHERE email = ${credentials.email.toLowerCase()}
        `;
        if (rows.length === 0) return null;

        const user = rows[0];
        const match = await bcrypt.compare(credentials.password, user.password_hash as string);
        if (!match) return null;

        return { id: user.id as string, email: user.email as string, name: user.name as string };
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages:   { signIn: '/login' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id as string;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.id;
      return session;
    },
  },
};
