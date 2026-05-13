'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users, UserPlus, Trash2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { apiFetch } from '@/lib/api-client';

type MemberRole = 'owner' | 'admin' | 'member' | 'viewer';

interface TeamMember {
  id: string;
  invited_email: string;
  role: MemberRole;
  status: 'pending' | 'active' | 'removed';
  created_at: string;
  accepted_at: string | null;
}

interface TeamData {
  org: { id: string; name: string };
  members: TeamMember[];
  maxMembers: number;
}

const ROLE_LABELS: Record<MemberRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
  viewer: 'Viewer',
};

const ROLE_DESCRIPTIONS: Record<MemberRole, string> = {
  owner: 'Full access + billing management',
  admin: 'Full access, can manage team members',
  member: 'Standard access — add providers, create alerts',
  viewer: 'Read-only access to cost data',
};

const ASSIGNABLE_ROLES: MemberRole[] = ['admin', 'member', 'viewer'];

export function TeamSection() {
  const [team, setTeam] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<MemberRole>('member');
  const [inviting, setInviting] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [changingRole, setChangingRole] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchTeam = useCallback(async () => {
    try {
      const res = await fetch('/api/team');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTeam(data);
    } catch {
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const inviteMember = async () => {
    setInviting(true);
    try {
      const res = await apiFetch('/api/team', {
        method: 'POST',
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send invite');
      }
      setInviteEmail('');
      setInviteRole('member');
      setDialogOpen(false);
      await fetchTeam();
      toast.success(`Invite sent to ${inviteEmail}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send invite');
    } finally {
      setInviting(false);
    }
  };

  const changeRole = async (id: string, email: string, role: MemberRole) => {
    setChangingRole(id);
    try {
      const res = await apiFetch(`/api/team/members/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update role');
      }
      setTeam((prev) =>
        prev
          ? {
              ...prev,
              members: prev.members.map((m) => (m.id === id ? { ...m, role } : m)),
            }
          : prev,
      );
      toast.success(`${email} is now ${ROLE_LABELS[role]}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setChangingRole(null);
    }
  };

  const removeMember = async (id: string, email: string) => {
    setRemoving(id);
    try {
      const res = await apiFetch(`/api/team/members/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setTeam((prev) =>
        prev
          ? { ...prev, members: prev.members.filter((m) => m.id !== id) }
          : prev,
      );
      toast.success(`${email} removed from team`);
    } catch {
      toast.error('Failed to remove member');
    } finally {
      setRemoving(null);
    }
  };

  const activeCount = team?.members.filter((m) => m.status !== 'removed').length ?? 0;
  const canInvite = team ? activeCount < team.maxMembers - 1 : false;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Members
            </CardTitle>
            <CardDescription>
              Invite up to {team?.maxMembers ?? 5} members to share your LLMeter workspace
            </CardDescription>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={!canInvite || loading}>
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  They will receive an invite link to join your workspace.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="invite-email">Email address</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="colleague@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !inviting && inviteMember()}
                  />
                </div>
                <div>
                  <Label htmlFor="invite-role">Role</Label>
                  <Select
                    value={inviteRole}
                    onValueChange={(v) => setInviteRole(v as MemberRole)}
                  >
                    <SelectTrigger id="invite-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ASSIGNABLE_ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          <div>
                            <span className="font-medium">{ROLE_LABELS[r]}</span>
                            <span className="ml-2 text-xs text-muted-foreground">
                              — {ROLE_DESCRIPTIONS[r]}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={inviteMember}
                  disabled={inviting || !inviteEmail.trim()}
                >
                  {inviting ? 'Sending…' : 'Send Invite'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading team…</p>
        ) : !team || team.members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Users className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              No team members yet. Invite colleagues to collaborate.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {team.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border p-3 gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {member.status === 'pending' ? (
                    <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <Users className="h-4 w-4 shrink-0 text-cyan-400" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{member.invited_email}</p>
                    <p className="text-xs text-muted-foreground">
                      {member.status === 'active' && member.accepted_at
                        ? `Joined ${format(new Date(member.accepted_at), 'MMM d, yyyy')}`
                        : `Invited ${format(new Date(member.created_at), 'MMM d, yyyy')}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {member.role === 'owner' ? (
                    <Badge variant="default">Owner</Badge>
                  ) : member.status === 'pending' ? (
                    <Badge variant="secondary">Pending — {ROLE_LABELS[member.role]}</Badge>
                  ) : (
                    <Select
                      value={member.role}
                      onValueChange={(v) => changeRole(member.id, member.invited_email, v as MemberRole)}
                      disabled={changingRole === member.id}
                    >
                      <SelectTrigger className="h-7 w-[100px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ASSIGNABLE_ROLES.map((r) => (
                          <SelectItem key={r} value={r} className="text-xs">
                            {ROLE_LABELS[r]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {member.role !== 'owner' && (
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => removeMember(member.id, member.invited_email)}
                      disabled={removing === member.id}
                      title="Remove member"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            <p className="text-xs text-muted-foreground pt-1">
              {activeCount} of {team.maxMembers - 1} member slots used
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
