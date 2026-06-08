import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revokeApiKey } from '@/lib/api-keys';

export const dynamic = 'force-dynamic';

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const { id } = await params;
  const revoked = await revokeApiKey(session.user.id, id);
  if (!revoked) {
    return NextResponse.json({ error: 'Не найдено' }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}
