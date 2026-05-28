import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import sql from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Заполни все поля' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Пароль минимум 6 символов' }, { status: 400 });
    }

    const existing = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase()}`;
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email уже зарегистрирован' }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 12);
    const rows = await sql`
      INSERT INTO users (email, password_hash, name)
      VALUES (${email.toLowerCase()}, ${hash}, ${name.trim()})
      RETURNING id, email, name
    `;

    return NextResponse.json({ user: rows[0] }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
