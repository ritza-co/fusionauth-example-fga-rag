import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { decodeJwt } from 'jose';
import { permifyClient } from '@/lib/permify';

const ORG_ID = 'acme';

async function requireAdmin(session: any): Promise<string | null> {
  if (!session?.id_token) return null;
  const user = decodeJwt(session.id_token);
  const userId = user.sub as string;
  const isAdmin = await permifyClient.checkPermission({
    entityType: 'organization',
    entityId: ORG_ID,
    permission: 'admin',
    subjectType: 'user',
    subjectId: userId,
  });
  return isAdmin ? userId : null;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const adminId = await requireAdmin(session);
  if (!adminId) {
    return NextResponse.json({ error: 'admin required' }, { status: 403 });
  }

  const { userId } = await req.json();
  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  // Promote to admin
  await permifyClient.writeRelationships([
    {
      entity: { type: 'organization', id: ORG_ID },
      relation: 'admin',
      subject: { type: 'user', id: userId },
    },
  ]);

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  const adminId = await requireAdmin(session);
  if (!adminId) {
    return NextResponse.json({ error: 'admin required' }, { status: 403 });
  }

  const { userId } = await req.json();
  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  // Prevent removing yourself as admin
  if (userId === adminId) {
    return NextResponse.json(
      { error: 'cannot demote yourself' },
      { status: 400 }
    );
  }

  // Remove admin relationship
  await permifyClient.deleteRelationships({
    entityType: 'organization',
    entityId: ORG_ID,
    relation: 'admin',
    subjectType: 'user',
    subjectId: userId,
  });

  return NextResponse.json({ ok: true });
}
