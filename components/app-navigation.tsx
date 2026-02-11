'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { MessageSquare, FileText, Users, UsersRound } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/teams', label: 'Teams', icon: UsersRound },
  { href: '/organization', label: 'Organization', icon: Users },
];

export function AppNavigation({
  userEmail,
  signOutAction,
}: {
  userEmail: string;
  signOutAction: () => Promise<void>;
}) {
  const pathname = usePathname();

  return (
    <header className="flex h-14 items-center justify-between border-b px-4">
      <nav className="flex items-center gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent',
                isActive && 'bg-accent text-accent-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">{userEmail}</span>
        <form action={signOutAction}>
          <Button variant="outline" size="sm" type="submit">
            Sign Out
          </Button>
        </form>
      </div>
    </header>
  );
}
