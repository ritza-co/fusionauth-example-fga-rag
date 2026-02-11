'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Users,
  UserPlus,
  UserMinus,
  Loader2,
  Star,
  StarOff,
} from 'lucide-react';

type TeamMember = {
  id: string;
  email: string;
  name: string;
  isLead: boolean;
};

type Team = {
  id: string;
  name: string;
  members: TeamMember[];
};

type TeamsData = {
  teams: Team[];
  currentUserId: string;
  isAdmin: boolean;
};

export default function TeamsPage() {
  const [data, setData] = useState<TeamsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [addEmails, setAddEmails] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  async function fetchTeams() {
    try {
      const res = await fetch('/api/teams');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch teams', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTeams();
  }, []);

  async function handleAddMember(teamId: string, e: FormEvent) {
    e.preventDefault();
    const email = addEmails[teamId]?.trim();
    if (!email) return;

    setActionLoading(`add-${teamId}`);
    setMessage(null);
    try {
      const res = await fetch('/api/teams/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, email }),
      });
      const json = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: `Added ${email} to team.` });
        setAddEmails((prev) => ({ ...prev, [teamId]: '' }));
        await fetchTeams();
      } else {
        setMessage({ type: 'error', text: json.error || 'Failed to add member' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to connect to server' });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRemoveMember(teamId: string, userId: string) {
    setActionLoading(`remove-${teamId}-${userId}`);
    setMessage(null);
    try {
      const res = await fetch('/api/teams/members', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, userId }),
      });
      const json = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Member removed from team.' });
        await fetchTeams();
      } else {
        setMessage({ type: 'error', text: json.error || 'Failed to remove member' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to connect to server' });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleToggleLead(teamId: string, userId: string, isLead: boolean) {
    const action = isLead ? 'remove-lead' : 'set-lead';
    setActionLoading(`${action}-${teamId}-${userId}`);
    setMessage(null);
    try {
      const res = await fetch('/api/teams/lead', {
        method: isLead ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, userId }),
      });
      const json = await res.json();
      if (res.ok) {
        setMessage({
          type: 'success',
          text: isLead ? 'Lead removed.' : 'Lead set.',
        });
        await fetchTeams();
      } else {
        setMessage({ type: 'error', text: json.error || 'Failed to update lead' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to connect to server' });
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">Failed to load teams.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold">Teams</h1>
          <p className="text-sm text-muted-foreground">
            View teams and their members.
            {data.isAdmin && ' As an admin, you can manage team membership.'}
          </p>
        </div>

        {message && (
          <p
            className={`text-sm ${
              message.type === 'success' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {message.text}
          </p>
        )}

        {data.teams.map((team) => (
          <Card key={team.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" />
                {team.name}
                <Badge variant="secondary" className="ml-2">
                  {team.members.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add member form (admin only) */}
              {data.isAdmin && (
                <form
                  onSubmit={(e) => handleAddMember(team.id, e)}
                  className="flex items-end gap-3"
                >
                  <div className="flex-1 space-y-2">
                    <label
                      htmlFor={`email-${team.id}`}
                      className="text-sm font-medium"
                    >
                      Add Member
                    </label>
                    <Input
                      id={`email-${team.id}`}
                      type="email"
                      value={addEmails[team.id] ?? ''}
                      onChange={(e) =>
                        setAddEmails((prev) => ({
                          ...prev,
                          [team.id]: e.target.value,
                        }))
                      }
                      placeholder="user@example.com"
                      disabled={actionLoading === `add-${team.id}`}
                    />
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={
                      actionLoading === `add-${team.id}` ||
                      !addEmails[team.id]?.trim()
                    }
                  >
                    {actionLoading === `add-${team.id}` ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="mr-1 h-4 w-4" />
                        Add
                      </>
                    )}
                  </Button>
                </form>
              )}

              {/* Member list */}
              {team.members.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No members in this team.
                </p>
              ) : (
                <ScrollArea className="max-h-[300px]">
                  <div className="space-y-2">
                    {team.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                            {member.isLead ? (
                              <Star className="h-4 w-4 text-yellow-500" />
                            ) : (
                              <Users className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {member.name || member.email}
                              {member.id === data.currentUserId && (
                                <span className="ml-2 text-xs text-muted-foreground">
                                  (you)
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {member.email}
                            </p>
                          </div>
                          {member.isLead && (
                            <Badge variant="default" className="text-xs">
                              Lead
                            </Badge>
                          )}
                        </div>

                        {data.isAdmin && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleToggleLead(
                                  team.id,
                                  member.id,
                                  member.isLead
                                )
                              }
                              disabled={
                                actionLoading ===
                                `${member.isLead ? 'remove-lead' : 'set-lead'}-${team.id}-${member.id}`
                              }
                              title={
                                member.isLead
                                  ? 'Remove lead role'
                                  : 'Set as lead'
                              }
                            >
                              {member.isLead ? (
                                <>
                                  <StarOff className="mr-1 h-3 w-3" />
                                  Remove Lead
                                </>
                              ) : (
                                <>
                                  <Star className="mr-1 h-3 w-3" />
                                  Set Lead
                                </>
                              )}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() =>
                                handleRemoveMember(team.id, member.id)
                              }
                              disabled={
                                actionLoading ===
                                `remove-${team.id}-${member.id}`
                              }
                              title="Remove from team"
                            >
                              {actionLoading ===
                              `remove-${team.id}-${member.id}` ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <>
                                  <UserMinus className="mr-1 h-3 w-3" />
                                  Remove
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
