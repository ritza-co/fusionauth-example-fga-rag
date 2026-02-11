import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { decodeJwt } from 'jose';
import { permifyClient } from '@/lib/permify';
import { getUserByEmail } from '@/lib/fusionauth';

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

  const { email } = await req.json();
  if (!email) {
    return NextResponse.json({ error: 'email required' }, { status: 400 });
  }

  // Look up user by email in FusionAuth
  const faUser = await getUserByEmail(email);
  if (!faUser) {
    return NextResponse.json(
      { error: 'user not found in FusionAuth' },
      { status: 404 }
    );
  }

  // Add as member
  await permifyClient.writeRelationships([
    {
      entity: { type: 'organization', id: ORG_ID },
      relation: 'member',
      subject: { type: 'user', id: faUser.id },
    },
  ]);

  return NextResponse.json({
    ok: true,
    member: {
      id: faUser.id,
      email: faUser.email,
      name: [faUser.firstName, faUser.lastName].filter(Boolean).join(' '),
    },
  });
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

  // Prevent removing yourself
  if (userId === adminId) {
    return NextResponse.json(
      { error: 'cannot remove yourself' },
      { status: 400 }
    );
  }

  // Remove member relationship
  await permifyClient.deleteRelationships({
    entityType: 'organization',
    entityId: ORG_ID,
    relation: 'member',
    subjectType: 'user',
    subjectId: userId,
  });

  return NextResponse.json({ ok: true });
}
