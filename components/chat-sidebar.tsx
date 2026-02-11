'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { MessageSquare, Plus } from 'lucide-react';
import { useChatContext } from '@/components/chat-provider';

export function ChatSidebar() {
  const { conversationId, setConversationId, conversations, refreshHistory } =
    useChatContext();

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  return (
    <div className="flex h-full w-64 flex-col border-r bg-muted/30">
      <div className="flex h-14 items-center justify-between border-b px-4">
        <span className="text-sm font-medium">Conversations</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setConversationId(null)}
          title="New Chat"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {conversations.length === 0 && (
            <p className="px-2 py-4 text-center text-xs text-muted-foreground">
              No conversations yet
            </p>
          )}
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setConversationId(conv.id)}
              className={cn(
                'flex w-full items-start gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent',
                conversationId === conv.id && 'bg-accent'
              )}
            >
              <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{conv.title}</p>
                <p className="text-xs text-muted-foreground">
                  {conv.messageCount} messages
                </p>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
      <Separator />
      <div className="p-3">
        <p className="text-xs text-muted-foreground">
          Powered by FusionAuth
        </p>
      </div>
    </div>
  );
}
