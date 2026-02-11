import { auth, signOut } from '@/auth';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { decodeJwt } from 'jose';

export async function ChatNavigation() {
  const session = await auth();
  const user = session?.id_token ? decodeJwt(session.id_token) : null;

  return (
    <header className="flex h-14 items-center justify-between border-b px-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-primary" />
        <span className="font-semibold">FusionAuth FGA& RAG Example</span>
      </div>
      <div className="flex items-center gap-4">
        {user && (
          <span className="text-sm text-muted-foreground">
            {user.email as string}
          </span>
        )}
        <form
          action={async () => {
            'use server';
            await signOut({ redirectTo: '/api/logout' });
          }}
        >
          <Button variant="outline" size="sm" type="submit">
            Sign Out
          </Button>
        </form>
      </div>
    </header>
  );
}
