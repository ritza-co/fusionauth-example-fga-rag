import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { decodeJwt } from 'jose';
import { permifyClient } from '@/lib/permify';
import { TEAMS } from '@/lib/teams';

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

  const { teamId, userId } = await req.json();
  if (!teamId || !userId) {
    return NextResponse.json(
      { error: 'teamId and userId required' },
      { status: 400 }
    );
  }

  if (!TEAMS.some((t) => t.id === teamId)) {
    return NextResponse.json({ error: 'invalid teamId' }, { status: 400 });
  }

  await permifyClient.writeRelationships([
    {
      entity: { type: 'team', id: teamId },
      relation: 'lead',
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

  const { teamId, userId } = await req.json();
  if (!teamId || !userId) {
    return NextResponse.json(
      { error: 'teamId and userId required' },
      { status: 400 }
    );
  }

  await permifyClient.deleteRelationships({
    entityType: 'team',
    entityId: teamId,
    relation: 'lead',
    subjectType: 'user',
    subjectId: userId,
  });

  return NextResponse.json({ ok: true });
}
