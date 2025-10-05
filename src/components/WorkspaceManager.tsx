import { useState, useEffect } from 'react';
import { Users, Plus, UserPlus, Shield, Trash2, Crown } from 'lucide-react';
import { api } from '../lib/api';
import { USE_NODE_API } from '../config/api';

export function WorkspaceManager() {
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'editor' | 'viewer'>('editor');

  useEffect(() => {
    if (USE_NODE_API) {
      loadWorkspaces();
    }
  }, []);

  const loadWorkspaces = async () => {
    try {
      const workspaceList = await api.getWorkspaces();
      setWorkspaces(workspaceList);
      if (workspaceList.length > 0) {
        setCurrentWorkspace(workspaceList[0]);
        loadMembers(workspaceList[0].id);
      }
    } catch (error) {
      console.error('Failed to load workspaces:', error);
    }
  };

  const loadMembers = async (workspaceId: string) => {
    try {
      const memberList = await api.getWorkspaceMembers(workspaceId);
      setMembers(memberList);
    } catch (error) {
      console.error('Failed to load members:', error);
    }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    setLoading(true);
    try {
      await api.createWorkspace(newWorkspaceName);
      setNewWorkspaceName('');
      setShowCreateModal(false);
      await loadWorkspaces();
    } catch (error: any) {
      alert(error.message || 'Failed to create workspace');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !currentWorkspace) return;

    setLoading(true);
    try {
      await api.inviteMember(currentWorkspace.id, inviteEmail, inviteRole);
      setInviteEmail('');
      setShowInviteModal(false);
      await loadMembers(currentWorkspace.id);
      alert('Member invited successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to invite member');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    if (!currentWorkspace) return;

    try {
      await api.updateMemberRole(currentWorkspace.id, memberId, newRole);
      await loadMembers(currentWorkspace.id);
      alert('Role updated successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to update role');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!currentWorkspace || !confirm('Remove this member?')) return;

    try {
      await api.removeMember(currentWorkspace.id, memberId);
      await loadMembers(currentWorkspace.id);
    } catch (error: any) {
      alert(error.message || 'Failed to remove member');
    }
  };

  if (!USE_NODE_API) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Workspace collaboration is only available with Node.js + MySQL backend.</p>
        <p className="text-sm mt-2">Enable it in <code>src/config/api.ts</code></p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Workspace Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Workspaces & Team</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Collaborate with your team on budgets
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
        >
          <Plus className="w-4 h-4" />
          New Workspace
        </button>
      </div>

      {/* Current Workspace */}
      {currentWorkspace && (
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">{currentWorkspace.name}</h3>
              <p className="text-sm text-muted-foreground">
                {members.length} member{members.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-accent text-accent-foreground rounded-md hover:opacity-90"
            >
              <UserPlus className="w-4 h-4" />
              Invite
            </button>
          </div>

          {/* Members List */}
          <div className="space-y-3">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {member.role === 'owner' ? (
                      <Crown className="w-5 h-5 text-primary" />
                    ) : (
                      <Users className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{member.display_name}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {member.role !== 'owner' ? (
                    <>
                      <select
                        value={member.role}
                        onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                        className="px-3 py-1 bg-background border rounded-md text-sm"
                      >
                        <option value="admin">Admin</option>
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="p-2 text-destructive hover:bg-destructive/10 rounded-md"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-md flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Owner
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New Workspace</h3>
            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <input
                type="text"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                placeholder="Workspace name"
                className="w-full px-4 py-2 bg-background border rounded-lg"
                required
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Invite Team Member</h3>
            <form onSubmit={handleInviteMember} className="space-y-4">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Email address"
                className="w-full px-4 py-2 bg-background border rounded-lg"
                required
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
                className="w-full px-4 py-2 bg-background border rounded-lg"
              >
                <option value="admin">Admin - Manage members & full access</option>
                <option value="editor">Editor - Create & edit data</option>
                <option value="viewer">Viewer - Read-only access</option>
              </select>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? 'Inviting...' : 'Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
