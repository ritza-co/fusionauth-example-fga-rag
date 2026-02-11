import { auth, signOut } from '@/auth';
import { redirect } from 'next/navigation';
import { decodeJwt } from 'jose';
import { AppNavigation } from '@/components/app-navigation';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.id_token) redirect('/');

  const user = decodeJwt(session.id_token);
  const email = (user.email ?? '') as string;

  return (
    <div className="flex h-screen flex-col">
      <AppNavigation
        userEmail={email}
        signOutAction={async () => {
          'use server';
          await signOut({ redirectTo: '/api/logout' });
        }}
      />
      <div className="flex flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
