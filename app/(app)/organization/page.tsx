'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Users,
  Shield,
  UserPlus,
  UserMinus,
  Loader2,
  ShieldPlus,
  ShieldMinus,
} from 'lucide-react';

type Member = {
  id: string;
  email: string;
  name: string;
  roles: string[];
};

type OrgData = {
  org: { id: string; name: string };
  members: Member[];
  currentUserRole: string;
  currentUserId: string;
};

export default function OrganizationPage() {
  const [orgData, setOrgData] = useState<OrgData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [addEmail, setAddEmail] = useState('');
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  async function fetchOrg() {
    try {
      const res = await fetch('/api/organization');
      if (res.ok) {
        const data = await res.json();
        setOrgData(data);
      }
    } catch (err) {
      console.error('Failed to fetch org', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrg();
  }, []);

  const isAdmin = orgData?.currentUserRole === 'admin';

  async function handleAddMember(e: FormEvent) {
    e.preventDefault();
    if (!addEmail.trim()) return;

    setActionLoading('add');
    setMessage(null);
    try {
      const res = await fetch('/api/organization/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: addEmail.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: `Added ${addEmail} as member.` });
        setAddEmail('');
        await fetchOrg();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to add member' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to connect to server' });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRemoveMember(userId: string) {
    setActionLoading(`remove-${userId}`);
    setMessage(null);
    try {
      const res = await fetch('/api/organization/members', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Member removed.' });
        await fetchOrg();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to remove member' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to connect to server' });
    } finally {
      setActionLoading(null);
    }
  }

  async function handlePromoteAdmin(userId: string) {
    setActionLoading(`promote-${userId}`);
    setMessage(null);
    try {
      const res = await fetch('/api/organization/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'User promoted to admin.' });
        await fetchOrg();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to promote' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to connect to server' });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDemoteAdmin(userId: string) {
    setActionLoading(`demote-${userId}`);
    setMessage(null);
    try {
      const res = await fetch('/api/organization/admins', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Admin demoted to member.' });
        await fetchOrg();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to demote' });
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

  if (!orgData) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">
          You are not a member of any organization.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold">{orgData.org.name}</h1>
          <span className="text-sm text-muted-foreground">
            Organization ID: {orgData.org.id} &middot; Your role:{' '}
            <Badge variant={isAdmin ? 'default' : 'secondary'}>
              {orgData.currentUserRole}
            </Badge>
          </span>
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

        {/* Add member form (admin only) */}
        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserPlus className="h-5 w-5" />
                Add Member
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleAddMember}
                className="flex items-end gap-3"
              >
                <div className="flex-1 space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    User Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    placeholder="user@example.com"
                    disabled={actionLoading === 'add'}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={actionLoading === 'add' || !addEmail.trim()}
                >
                  {actionLoading === 'add' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Add Member'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Members list */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              Members
              <Badge variant="secondary" className="ml-2">
                {orgData.members.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-2">
                {orgData.members.map((member) => {
                  const memberIsAdmin = member.roles.includes('admin');
                  const isSelf = member.id === orgData.currentUserId;
                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                          {memberIsAdmin ? (
                            <Shield className="h-4 w-4 text-primary" />
                          ) : (
                            <Users className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {member.name || member.email}
                            {isSelf && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                (you)
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {member.email}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          {member.roles.map((role) => (
                            <Badge
                              key={role}
                              variant={
                                role === 'admin' ? 'default' : 'secondary'
                              }
                              className="text-xs"
                            >
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {isAdmin && !isSelf && (
                        <div className="flex items-center gap-2">
                          {memberIsAdmin ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDemoteAdmin(member.id)}
                              disabled={actionLoading === `demote-${member.id}`}
                              title="Remove admin role"
                            >
                              {actionLoading === `demote-${member.id}` ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <>
                                  <ShieldMinus className="mr-1 h-3 w-3" />
                                  Demote
                                </>
                              )}
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePromoteAdmin(member.id)}
                              disabled={
                                actionLoading === `promote-${member.id}`
                              }
                              title="Make admin"
                            >
                              {actionLoading === `promote-${member.id}` ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <>
                                  <ShieldPlus className="mr-1 h-3 w-3" />
                                  Make Admin
                                </>
                              )}
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveMember(member.id)}
                            disabled={
                              actionLoading === `remove-${member.id}`
                            }
                            title="Remove from organization"
                          >
                            {actionLoading === `remove-${member.id}` ? (
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
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
