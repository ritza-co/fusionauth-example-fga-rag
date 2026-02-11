import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { decodeJwt } from 'jose';
import { conversations } from '@/lib/conversations';

export async function GET() {
  const session = await auth();
  if (!session?.id_token) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const user = decodeJwt(session.id_token);
  const userId = user.sub as string;

  const userConvs = conversations
    .filter((c) => c.userId === userId)
    .map(({ id, title, createdAt, updatedAt, messages }) => ({
      id,
      title,
      createdAt,
      updatedAt,
      messageCount: messages.length,
    }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return NextResponse.json({ ok: true, conversations: userConvs });
}
