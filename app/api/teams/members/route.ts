import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { decodeJwt } from 'jose';
import { permifyClient } from '@/lib/permify';
import { getUserByEmail } from '@/lib/fusionauth';
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

  const { teamId, email } = await req.json();
  if (!teamId || !email) {
    return NextResponse.json(
      { error: 'teamId and email required' },
      { status: 400 }
    );
  }

  if (!TEAMS.some((t) => t.id === teamId)) {
    return NextResponse.json({ error: 'invalid teamId' }, { status: 400 });
  }

  const faUser = await getUserByEmail(email);
  if (!faUser) {
    return NextResponse.json(
      { error: 'user not found in FusionAuth' },
      { status: 404 }
    );
  }

  // Ensure user is an org member
  await permifyClient.writeRelationships([
    {
      entity: { type: 'organization', id: ORG_ID },
      relation: 'member',
      subject: { type: 'user', id: faUser.id },
    },
  ]);

  // Add to team
  await permifyClient.writeRelationships([
    {
      entity: { type: 'team', id: teamId },
      relation: 'member',
      subject: { type: 'user', id: faUser.id },
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

  // Remove member relationship
  await permifyClient.deleteRelationships({
    entityType: 'team',
    entityId: teamId,
    relation: 'member',
    subjectType: 'user',
    subjectId: userId,
  });

  // Also remove lead if they were a lead
  await permifyClient.deleteRelationships({
    entityType: 'team',
    entityId: teamId,
    relation: 'lead',
    subjectType: 'user',
    subjectId: userId,
  });

  return NextResponse.json({ ok: true });
}
