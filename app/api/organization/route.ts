import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { decodeJwt } from 'jose';
import { permifyClient } from '@/lib/permify';
import { getUserById } from '@/lib/fusionauth';

const ORG_ID = 'acme';
const ORG_NAME = 'Acme Corp';

export async function GET() {
  const session = await auth();
  if (!session?.id_token) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const user = decodeJwt(session.id_token);
  const userId = user.sub as string;

  // Check if user is a member or admin of the org
  const isMember = await permifyClient.checkPermission({
    entityType: 'organization',
    entityId: ORG_ID,
    permission: 'member',
    subjectType: 'user',
    subjectId: userId,
  });

  const isAdmin = await permifyClient.checkPermission({
    entityType: 'organization',
    entityId: ORG_ID,
    permission: 'admin',
    subjectType: 'user',
    subjectId: userId,
  });

  if (!isMember && !isAdmin) {
    return NextResponse.json({ error: 'not a member' }, { status: 403 });
  }

  // Get all admins and members
  const adminIds = await permifyClient.lookupSubject({
    entityType: 'organization',
    entityId: ORG_ID,
    permission: 'admin',
    subjectType: 'user',
  });

  const memberIds = await permifyClient.lookupSubject({
    entityType: 'organization',
    entityId: ORG_ID,
    permission: 'member',
    subjectType: 'user',
  });

  // Resolve user details from FusionAuth
  const allIds = [...new Set([...adminIds, ...memberIds])];
  const members = await Promise.all(
    allIds.map(async (id) => {
      const faUser = await getUserById(id);
      const roles: string[] = [];
      if (adminIds.includes(id)) roles.push('admin');
      if (memberIds.includes(id)) roles.push('member');
      return {
        id,
        email: faUser?.email ?? id,
        name: faUser
          ? [faUser.firstName, faUser.lastName].filter(Boolean).join(' ')
          : id,
        roles,
      };
    })
  );

  return NextResponse.json({
    org: { id: ORG_ID, name: ORG_NAME },
    members,
    currentUserRole: isAdmin ? 'admin' : 'member',
    currentUserId: userId,
  });
}
