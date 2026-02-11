import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { decodeJwt } from 'jose';
import { permifyClient } from '@/lib/permify';
import { getUserById } from '@/lib/fusionauth';
import { TEAMS } from '@/lib/teams';

const ORG_ID = 'acme';

export async function GET() {
  const session = await auth();
  if (!session?.id_token) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const user = decodeJwt(session.id_token);
  const userId = user.sub as string;

  const isAdmin = await permifyClient.checkPermission({
    entityType: 'organization',
    entityId: ORG_ID,
    permission: 'admin',
    subjectType: 'user',
    subjectId: userId,
  });

  const teams = await Promise.all(
    TEAMS.map(async (team) => {
      const memberIds = await permifyClient.lookupSubject({
        entityType: 'team',
        entityId: team.id,
        permission: 'member',
        subjectType: 'user',
      });

      const leadIds = await permifyClient.lookupSubject({
        entityType: 'team',
        entityId: team.id,
        permission: 'lead',
        subjectType: 'user',
      });

      const allIds = [...new Set([...memberIds, ...leadIds])];
      const members = await Promise.all(
        allIds.map(async (id) => {
          const faUser = await getUserById(id);
          return {
            id,
            email: faUser?.email ?? id,
            name: faUser
              ? [faUser.firstName, faUser.lastName].filter(Boolean).join(' ')
              : id,
            isLead: leadIds.includes(id),
          };
        })
      );

      return {
        id: team.id,
        name: team.name,
        members,
      };
    })
  );

  return NextResponse.json({
    teams,
    currentUserId: userId,
    isAdmin,
  });
}
