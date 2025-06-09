'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { GardenMembershipWithUser } from '@/types';

interface InviteFormData {
  email: string;
  role: 'admin' | 'member' | 'viewer';
  message: string;
}

export default function GardenMembersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const gardenId = params.id as string;

  const [members, setMembers] = useState<GardenMembershipWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteForm, setInviteForm] = useState<InviteFormData>({
    email: '',
    role: 'member',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/garden-members?gardenLocationId=${gardenId}`);
      const data = await response.json();

      if (data.success) {
        setMembers(data.members);
      } else {
        setError(data.error || 'Failed to load members');
      }
    } catch (error) {
      console.error('Error fetching members:', error);
      setError('Failed to load members');
    } finally {
      setLoading(false);
    }
  }, [gardenId]);

  useEffect(() => {
    if (session?.user?.id && gardenId) {
      fetchMembers();
    }
  }, [session, gardenId, fetchMembers]);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/garden-invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gardenLocationId: gardenId,
          email: inviteForm.email,
          role: inviteForm.role,
          message: inviteForm.message || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Invitation sent successfully!');
        setInviteForm({ email: '', role: 'member', message: '' });
        setShowInviteForm(false);
        // Refresh members list
        fetchMembers();
      } else {
        setError(data.error || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      setError('Failed to send invitation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleChange = async (membershipId: string, newRole: 'admin' | 'member' | 'viewer') => {
    try {
      const response = await fetch(`/api/garden-members/${membershipId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Member role updated successfully');
        fetchMembers();
      } else {
        setError(data.error || 'Failed to update member role');
      }
    } catch (error) {
      console.error('Error updating member role:', error);
      setError('Failed to update member role');
    }
  };

  const handleRemoveMember = async (membershipId: string) => {
    if (!confirm('Are you sure you want to remove this member from the garden?')) {
      return;
    }

    try {
      const response = await fetch(`/api/garden-members/${membershipId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Member removed successfully');
        fetchMembers();
      } else {
        setError(data.error || 'Failed to remove member');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      setError('Failed to remove member');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'member':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'viewer':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading garden members...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ← Back
            </button>
            <h1 className="text-3xl font-bold">Garden Members</h1>
          </div>
          <button
            onClick={() => setShowInviteForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Invite Member
          </button>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-900/50 border border-green-500 text-green-200 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        {/* Invite Form Modal */}
        {showInviteForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Invite New Member</h2>
              <form onSubmit={handleInviteSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-green-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Role</label>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as 'admin' | 'member' | 'viewer' })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-green-500"
                  >
                    <option value="viewer">Viewer - Can view garden only</option>
                    <option value="member">Member - Can add and edit plants</option>
                    <option value="admin">Admin - Full access except ownership</option>
                  </select>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Message (Optional)</label>
                  <textarea
                    value={inviteForm.message}
                    onChange={(e) => setInviteForm({ ...inviteForm, message: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-green-500"
                    rows={3}
                    placeholder="Add a personal message to the invitation..."
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowInviteForm(false)}
                    className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg transition-colors"
                  >
                    {submitting ? 'Sending...' : 'Send Invitation'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Members List */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Current Members ({members.length})</h2>
          
          {members.length === 0 ? (
            <p className="text-gray-400">No members found.</p>
          ) : (
            <div className="space-y-4">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium">
                        {member.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium">{member.username}</h3>
                      {member.email && (
                        <p className="text-sm text-gray-400">{member.email}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        Joined {new Date(member.joined_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRoleBadgeColor(member.role)}`}>
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </span>
                    
                    {member.role !== 'owner' && (
                      <div className="flex space-x-2">
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value as 'admin' | 'member' | 'viewer')}
                          className="px-2 py-1 bg-gray-600 border border-gray-500 rounded text-sm"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 