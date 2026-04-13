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
import { Users, UserPlus, Trash2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { apiFetch } from '@/lib/api-client';

interface TeamMember {
  id: string;
  invited_email: string;
  role: 'owner' | 'member';
  status: 'pending' | 'active' | 'removed';
  created_at: string;
  accepted_at: string | null;
}

interface TeamData {
  org: { id: string; name: string };
  members: TeamMember[];
  maxMembers: number;
}

export function TeamSection() {
  const [team, setTeam] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
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
        body: JSON.stringify({ email: inviteEmail }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send invite');
      }
      setInviteEmail('');
      setDialogOpen(false);
      await fetchTeam();
      toast.success(`Invite sent to ${inviteEmail}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send invite');
    } finally {
      setInviting(false);
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
              <div className="space-y-3">
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
                className="flex items-center justify-between rounded-lg border p-3"
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
                  <Badge
                    variant={
                      member.role === 'owner'
                        ? 'default'
                        : member.status === 'active'
                          ? 'default'
                          : 'secondary'
                    }
                  >
                    {member.role === 'owner' ? 'Owner' : member.status === 'pending' ? 'Pending' : 'Member'}
                  </Badge>
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
